/**
 * VCEquityNote — 임직원 보상 패키지 시뮬레이터 (메타 도구)
 *
 * 연봉 + 보너스 + 스톡옵션 + RSU 조합의 N년 누적 가치를 양면으로 계산한다.
 *   회사 부담  = 연봉 × 회사 실부담률 (인건비 엔진) + 보너스
 *                 (옵션·RSU는 주식 발행 → 현금부담 0, 희석은 별도 정보)
 *   임직원 실수령 = 월 실수령 × 12 + 보너스 추가소득 한계세후 + 옵션 세후 + RSU 세후
 *
 * 기존 엔진(payroll, salaryTakeHome, stockOptionTax, rsuTax)을 재사용한다.
 * 단순화: 보너스는 한계 추가세금만 차감, 옵션/RSU는 만기 시점 일시 행사·매각 가정.
 */
import { calculatePayrollCost } from '../ops/payroll';
import { calculateSalaryTakeHome } from '../tax/salaryTakeHome';
import { calculateStockOptionTax } from '../tax/stockOptionTax';
import { calculateRsuTax } from '../tax/rsuTax';
import { progressiveIncomeTax } from '../tax/incomeTax';
import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';

export interface StockOptionGrant {
  /** 부여 주식수 */
  shares: number;
  /** 행사가 (1주) */
  exercisePrice: number;
  /** 행사 시점 시가 추정 (1주) */
  expectedMarketPrice: number;
  /** 부여 연도 (비과세 일몰·연한 판정용) */
  grantYear: number;
  /** 행사 연도 */
  exerciseYear: number;
  /** 벤처기업 비과세 적용 가능 여부 */
  isVentureQualified: boolean;
}

export interface RsuGrant {
  /** 베스팅 주식수 (총 N년 누적) */
  totalShares: number;
  /** 베스팅 시점 1주 시가 추정 */
  fmvPerShareAtVest: number;
  /** 매각가(선택) — 입력 시 매각 양도세 추가 */
  salePricePerShare?: number;
}

export interface CompensationPackageInput {
  /** 연봉 */
  annualSalary: number;
  /** 연 보너스 (현금) */
  annualBonus: number;
  /** 부양가족·자녀 (연봉 실수령 계산용) */
  dependents: number;
  children: number;
  /** 비과세 식대 (월) */
  monthlyNontaxableMeal: number;
  /** 분석 기간 (보통 4년 = 베스팅 기간) */
  horizonYears: number;
  /** 스톡옵션 (선택) */
  stockOption?: StockOptionGrant;
  /** RSU (선택) */
  rsu?: RsuGrant;
}

export interface CompPackageResult {
  horizonYears: number;
  /** 회사 부담 (N년 누적, ₩) */
  companyCostTotal: number;
  companyCostBreakdown: { label: string; amount: number }[];
  /** 임직원 세후 실수령 (N년 누적, ₩) */
  employeeNetTotal: number;
  employeeNetBreakdown: { label: string; amount: number }[];
  /** 비율 — 회사가 쓴 돈 중 임직원이 받는 비율 */
  passThroughRate: number;
  warnings: string[];
}

export class CompensationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompensationInputError';
  }
}

export function calculateCompensationPackage(
  input: CompensationPackageInput,
  config: TaxConfig = defaultTaxConfig,
): CompPackageResult {
  if (!(input.annualSalary > 0))
    throw new CompensationInputError('연봉은 0보다 커야 합니다.');
  if (!(input.horizonYears > 0))
    throw new CompensationInputError('분석 기간은 0보다 커야 합니다.');

  const N = input.horizonYears;
  const warnings: string[] = [];

  // ── 회사 부담 ──
  const payroll = calculatePayrollCost({ annualSalary: input.annualSalary });
  const salaryEmployerAnnual = payroll.totalMonthly * 12;
  const bonusEmployerAnnual = input.annualBonus; // 단순화: 보너스에는 4대보험 가산 무시
  const companyCostBreakdown = [
    { label: `연봉·4대보험·퇴직금 (${N}년)`, amount: salaryEmployerAnnual * N },
    { label: `보너스 (${N}년)`, amount: bonusEmployerAnnual * N },
    { label: '스톡옵션·RSU 회사 현금부담', amount: 0 },
  ];
  const companyCostTotal = companyCostBreakdown.reduce((a, c) => a + c.amount, 0);
  if (input.stockOption || input.rsu) {
    warnings.push(
      '스톡옵션·RSU는 회사 현금 부담 0으로 처리됩니다(주식 발행 = 기존 주주 희석). 비용 회계 처리는 별도.',
    );
  }

  // ── 임직원 실수령 ──
  const takeHome = calculateSalaryTakeHome({
    annualSalary: input.annualSalary,
    dependents: input.dependents,
    children: input.children,
    monthlyNontaxableMeal: input.monthlyNontaxableMeal,
  });
  const salaryNetAnnual = takeHome.annualTakeHome;

  // 보너스 한계 추가세금 = 한계세율 추정 (연봉 위에 보너스 얹기)
  const local = 1 + config.incomeTax.localSurtaxRate;
  const baseTaxBase = takeHome.taxBase;
  const taxWithBonus =
    progressiveIncomeTax(baseTaxBase + input.annualBonus, config.incomeTax.brackets) * local;
  const taxBase = progressiveIncomeTax(baseTaxBase, config.incomeTax.brackets) * local;
  const bonusMarginalTax = Math.max(0, taxWithBonus - taxBase);
  const bonusNetAnnual = input.annualBonus - bonusMarginalTax;

  const employeeNetBreakdown = [
    { label: `연봉 실수령 (${N}년)`, amount: salaryNetAnnual * N },
    { label: `보너스 세후 (${N}년)`, amount: bonusNetAnnual * N },
  ];

  if (input.stockOption) {
    const so = input.stockOption;
    const soRes = calculateStockOptionTax({
      shares: so.shares,
      exercisePrice: so.exercisePrice,
      marketPrice: so.expectedMarketPrice,
      grantYear: so.grantYear,
      exerciseYear: so.exerciseYear,
      isVentureQualified: so.isVentureQualified,
    });
    const recScenario = soRes.scenarios.find((s) => s.key === soRes.recommendedKey)!;
    employeeNetBreakdown.push({
      label: `스톡옵션 세후 실수령 (${N}년 후 행사)`,
      amount: recScenario.netAfterTax,
    });
  }

  if (input.rsu) {
    const r = calculateRsuTax({
      vestedShares: input.rsu.totalShares,
      fmvPerShareAtVest: input.rsu.fmvPerShareAtVest,
      salePricePerShare: input.rsu.salePricePerShare,
    });
    employeeNetBreakdown.push({
      label: `RSU 세후 실수령 (${N}년 누적)`,
      amount: r.netAfterTax,
    });
  }

  const employeeNetTotal = employeeNetBreakdown.reduce((a, c) => a + c.amount, 0);

  return {
    horizonYears: N,
    companyCostTotal,
    companyCostBreakdown,
    employeeNetTotal,
    employeeNetBreakdown,
    passThroughRate: companyCostTotal > 0 ? employeeNetTotal / companyCostTotal : 0,
    warnings: warnings.length
      ? warnings
      : [
          '연봉 실수령 보수적 추정(다른 소득공제 미반영). 보너스는 한계세율 적용. 스톡옵션·RSU는 단일 시점 행사·매각 가정.',
        ],
  };
}
