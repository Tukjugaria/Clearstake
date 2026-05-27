/**
 * VCEquityNote — 창업자 급여 vs 배당 비교 엔진 (개략 추정)
 *
 * 같은 회사 이익(법인세 전 영업이익)을 대표가 가져갈 때
 *   ① 전액 급여   → 회사 손금 인정, 법인세 0, 본인 근로소득세
 *   ② 전액 배당   → 회사 법인세 부과, 잔여 × 지분율을 배당, 배당소득세
 * 두 시나리오의 본인 세후 실수령액을 비교한다.
 *
 * 단순화/한계:
 *  - 본인 외 종합소득(X)에 추가소득(E)을 합산한 한계 추가 세금을 사용 (다른 공제 미반영).
 *  - 배당소득은 금융소득 2천만 초과 시 종합과세, 미만 시 분리 14% 가정 (Gross-up 미반영).
 *  - 4대보험 회사·본인 부담은 미반영 (별도 안내).
 *  - 임원보수 한도 등 정관·세무조정 사항 미반영.
 */
import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';
import { progressiveIncomeTax } from './incomeTax';

export interface SalaryVsDividendInput {
  /** 회사 영업이익 (법인세 전, ₩) */
  companyProfit: number;
  /** 대표 본인의 다른 종합소득 (근로·사업 등, ₩) */
  ownerOtherIncome: number;
  /** 대표 지분율 (배당 시 본인이 받는 비율, fraction 0~1) */
  ownershipPct: number;
}

export interface ScenarioSalary {
  key: 'salary';
  label: string;
  /** 대표가 받는 세전 금액 */
  gross: number;
  /** 회사 법인세 (지방세 포함) */
  corporateTax: number;
  /** 본인 추가 세금 (한계 — 다른 소득 합산 시 증가분) */
  ownerAddedTax: number;
  /** 본인 세후 실수령 */
  ownerNet: number;
  /** 회사 잔여이익 */
  companyRetained: number;
}

export interface ScenarioDividend {
  key: 'dividend';
  label: string;
  /** 회사 잔여이익 (법인세 후) */
  afterCorporateTax: number;
  /** 본인 배당 (세전) */
  gross: number;
  /** 회사 법인세 (지방세 포함) */
  corporateTax: number;
  /** 본인 배당소득세 (지방세 포함) */
  ownerAddedTax: number;
  /** 분리과세 vs 종합과세 선택 */
  dividendTaxMode: 'separate' | 'comprehensive';
  /** 본인 세후 실수령 */
  ownerNet: number;
  /** 회사 잔여이익 (배당 후 남은 것 — 보통 0, 본 모델에서 전액 배당 가정) */
  companyRetained: number;
}

export interface SalaryVsDividendResult {
  salary: ScenarioSalary;
  dividend: ScenarioDividend;
  /** 본인 세후 실수령이 큰 쪽 */
  recommended: 'salary' | 'dividend';
  /** 본인 실수령 차이 (양수 = 추천 쪽이 추가로 받는 금액) */
  difference: number;
  warnings: string[];
}

export class SalaryVsDividendInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalaryVsDividendInputError';
  }
}

/** 종합소득세 + 지방세 (한계 추가 세금) */
function comprehensiveTaxOnAddition(
  baseIncome: number,
  added: number,
  config: TaxConfig,
): number {
  const local = 1 + config.incomeTax.localSurtaxRate;
  const taxWith = progressiveIncomeTax(baseIncome + added, config.incomeTax.brackets) * local;
  const taxWithout = progressiveIncomeTax(baseIncome, config.incomeTax.brackets) * local;
  return Math.max(0, taxWith - taxWithout);
}

export function calculateSalaryVsDividend(
  input: SalaryVsDividendInput,
  config: TaxConfig = defaultTaxConfig,
): SalaryVsDividendResult {
  if (!(input.companyProfit > 0))
    throw new SalaryVsDividendInputError('회사 영업이익은 0보다 커야 합니다.');
  if (input.ownerOtherIncome < 0)
    throw new SalaryVsDividendInputError('다른 종합소득은 0 이상이어야 합니다.');
  if (input.ownershipPct < 0 || input.ownershipPct > 1)
    throw new SalaryVsDividendInputError('지분율은 0~1 사이여야 합니다.');

  const { corporateTax, dividend } = config;

  // ── 시나리오 A: 전액 급여 ──
  // 회사이익 E 전체를 급여 지급 → 회사 손금 → 법인세 0
  // 본인은 (다른 소득 + E)에 종합소득세, 한계 추가 세금만 계산
  const salaryAddedTax = Math.round(
    comprehensiveTaxOnAddition(input.ownerOtherIncome, input.companyProfit, config),
  );
  const salary: ScenarioSalary = {
    key: 'salary',
    label: '전액 급여',
    gross: input.companyProfit,
    corporateTax: 0,
    ownerAddedTax: salaryAddedTax,
    ownerNet: input.companyProfit - salaryAddedTax,
    companyRetained: 0,
  };

  // ── 시나리오 B: 전액 배당 ──
  // 회사이익 E에 법인세 부과
  const corpRaw = progressiveIncomeTax(input.companyProfit, corporateTax.brackets);
  const corpLocal = corpRaw * corporateTax.localSurtaxRate;
  const corpTotal = Math.round(corpRaw + corpLocal);
  const afterCorp = input.companyProfit - corpTotal;
  const grossDividend = Math.round(afterCorp * input.ownershipPct);

  // 분리과세 vs 종합과세 — 금융소득(여기서는 grossDividend만 가정) 2천만 초과 시 종합
  const dividendLocal = 1 + dividend.localSurtaxRate;
  const separateTax = Math.round(grossDividend * dividend.withholdingRate * dividendLocal);
  const comprehensiveTax = Math.round(
    comprehensiveTaxOnAddition(input.ownerOtherIncome, grossDividend, config),
  );

  // 종합과세 적용 여부
  const useComprehensive = grossDividend > dividend.separateTaxationLimit;
  const dividendTaxMode: 'separate' | 'comprehensive' = useComprehensive ? 'comprehensive' : 'separate';
  const dividendTax = useComprehensive ? comprehensiveTax : separateTax;

  const dividendScenario: ScenarioDividend = {
    key: 'dividend',
    label: '전액 배당',
    afterCorporateTax: afterCorp,
    gross: grossDividend,
    corporateTax: corpTotal,
    ownerAddedTax: dividendTax,
    dividendTaxMode,
    ownerNet: grossDividend - dividendTax,
    companyRetained: afterCorp - grossDividend, // 본인 외 주주 몫
  };

  const recommended: 'salary' | 'dividend' =
    salary.ownerNet >= dividendScenario.ownerNet ? 'salary' : 'dividend';
  const difference = Math.abs(salary.ownerNet - dividendScenario.ownerNet);

  const warnings: string[] = [
    '4대보험 회사·본인 부담은 미반영. 급여 시나리오는 실제로 회사·본인 모두 추가 부담이 발생합니다.',
    '본인 외 종합소득(X)에 추가소득(급여 or 배당)을 합산한 한계 추가 세금 모델로, 다른 공제·세액공제는 미반영한 보수적 추정.',
  ];
  if (input.ownershipPct < 1) {
    warnings.push(
      `지분율 ${(input.ownershipPct * 100).toFixed(0)}% 적용 — 다른 주주에게 가는 배당분은 본인 실수령에서 제외됩니다.`,
    );
  }
  if (dividendTaxMode === 'comprehensive') {
    warnings.push(
      `배당 ${grossDividend.toLocaleString('ko-KR')}원이 금융소득 종합과세 임계점(2,000만)을 초과 → 종합과세 적용.`,
    );
  }

  return { salary, dividend: dividendScenario, recommended, difference, warnings };
}
