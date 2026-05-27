/**
 * VCEquityNote — 연봉 실수령(월급 실수령) 계산 엔진 (개략 추정)
 *
 * 연봉을 입력하면 4대보험 본인부담·종합소득세를 빼고 매월 실제로 받는 금액을 계산한다.
 * 회사 부담(인건비)과 함께 보면 "회사가 쓰는 돈 ↔ 임직원이 받는 돈"을 양면으로 비교할 수 있다.
 *
 * 단순화/한계:
 *  - 종합소득공제는 본인·부양가족 기본공제 + 국민연금 본인부담만 반영 (의료비·신용카드·연금저축 등 미반영)
 *  - 자녀세액공제·근로소득세액공제는 적용 (자녀공제 2024 개정 후 1명 25만)
 *  - 4대보험 본인부담은 월급(연봉/12) 기준 단순화 (소득상한·보수월액 차이 미반영)
 */
import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';
import { progressiveIncomeTax } from './incomeTax';

export interface SalaryTakeHomeInput {
  /** 연봉 (₩) — 세전, 4대보험 본인부담 제외 전 */
  annualSalary: number;
  /** 부양가족 수 (본인 제외, 배우자 포함) */
  dependents: number;
  /** 자녀 수 (위 부양가족에 포함된 자녀 수) */
  children: number;
  /** 월 비과세 식대 (한도 20만) */
  monthlyNontaxableMeal: number;
}

export interface DeductionBreakdown {
  earnedIncomeDeduction: number; // 근로소득공제
  personal: number; // 본인 기본공제
  dependent: number; // 부양가족 기본공제
  pensionContribution: number; // 국민연금 본인부담 (소득공제)
  total: number;
}

export interface SalaryTakeHomeResult {
  /** 월 세전 급여 */
  monthlyGross: number;
  /** 연 비과세 식대 (한도 적용 후) */
  annualNontaxableMeal: number;
  /** 과세대상 총급여 (= 연봉 − 비과세) */
  taxableSalary: number;
  /** 종합소득공제 내역 */
  deductions: DeductionBreakdown;
  /** 과세표준 (= 근로소득금액 − 종합소득공제) */
  taxBase: number;
  /** 산출세액 (지방세 전) */
  computedTax: number;
  /** 근로소득세액공제 */
  earnedIncomeTaxCredit: number;
  /** 자녀세액공제 */
  childTaxCredit: number;
  /** 결정세액 (소득세, 지방세 전) */
  determinedTax: number;
  /** 지방소득세 */
  localTax: number;
  /** 연 총 세금 = 결정세액 + 지방세 */
  annualTax: number;
  /** 월 4대보험 본인부담 합계 */
  monthlyEmployeeInsurance: number;
  /** 월 4대보험 항목별 */
  insuranceComponents: { key: string; label: string; monthly: number }[];
  /** 월 실수령액 */
  monthlyTakeHome: number;
  /** 연 실수령액 */
  annualTakeHome: number;
  /** 연봉 대비 실수령 비율 (fraction) */
  takeHomeRate: number;
  warnings: string[];
}

export class SalaryTakeHomeInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalaryTakeHomeInputError';
  }
}

/** 근로소득공제 (구간별 marginal 누적 + 한도) */
function earnedIncomeDeduction(salary: number, config: TaxConfig): number {
  if (salary <= 0) return 0;
  const tiers = config.earnedIncomeDeduction.tiers;
  let remaining = salary;
  let lower = 0;
  let total = 0;
  for (const t of tiers) {
    if (remaining <= 0) break;
    const upper = t.upTo ?? Infinity;
    const portion = Math.min(remaining, upper - lower);
    total += portion * t.rate;
    remaining -= portion;
    lower = upper;
  }
  return Math.min(total, config.earnedIncomeDeduction.cap);
}

function childCredit(children: number, config: TaxConfig): number {
  if (children <= 0) return 0;
  const c = config.personalDeductions.childCredit;
  if (children === 1) return c.first;
  if (children === 2) return c.second;
  return c.second + (children - 2) * c.additionalPerThirdPlus;
}

function earnedIncomeTaxCredit(computedTax: number, config: TaxConfig): number {
  const c = config.personalDeductions.earnedIncomeTaxCredit;
  let credit: number;
  if (computedTax <= c.thresholdTax) {
    credit = computedTax * c.lowRate;
  } else {
    credit = c.thresholdTax * c.lowRate + (computedTax - c.thresholdTax) * c.highRate;
  }
  return Math.min(credit, c.maxCredit);
}

export function calculateSalaryTakeHome(
  input: SalaryTakeHomeInput,
  config: TaxConfig = defaultTaxConfig,
): SalaryTakeHomeResult {
  if (!(input.annualSalary > 0))
    throw new SalaryTakeHomeInputError('연봉은 0보다 커야 합니다.');
  if (input.dependents < 0 || input.children < 0)
    throw new SalaryTakeHomeInputError('부양가족·자녀 수는 0 이상이어야 합니다.');
  if (input.children > input.dependents)
    throw new SalaryTakeHomeInputError('자녀 수는 부양가족 수보다 클 수 없습니다.');

  const { incomeTax, personalDeductions, socialInsurance } = config;
  const monthlyGross = input.annualSalary / 12;

  // 비과세 식대 (한도)
  const mealMonthly = Math.min(
    Math.max(0, input.monthlyNontaxableMeal),
    personalDeductions.nontaxableMealMaxMonthly,
  );
  const annualNontaxableMeal = mealMonthly * 12;
  const taxableSalary = Math.max(0, input.annualSalary - annualNontaxableMeal);

  // 근로소득공제 → 근로소득금액
  const eid = earnedIncomeDeduction(taxableSalary, config);
  const earnedIncome = Math.max(0, taxableSalary - eid);

  // 종합소득공제 (단순화: 본인 + 부양가족 + 국민연금 본인부담)
  const pensionAnnual = input.annualSalary * socialInsurance.employee.pensionRate;
  const personal = personalDeductions.perPerson;
  const dependentDeduction = input.dependents * personalDeductions.perPerson;
  const totalDeductions = personal + dependentDeduction + pensionAnnual;

  const taxBase = Math.max(0, earnedIncome - totalDeductions);

  // 산출세액 (소득세)
  const computedTax = progressiveIncomeTax(taxBase, incomeTax.brackets);

  // 세액공제
  const eitcCredit = earnedIncomeTaxCredit(computedTax, config);
  const ctc = childCredit(input.children, config);
  const determinedTax = Math.max(0, Math.round(computedTax - eitcCredit - ctc));
  const localTax = Math.round(determinedTax * incomeTax.localSurtaxRate);
  const annualTax = determinedTax + localTax;

  // 4대보험 본인부담 (월)
  const emp = socialInsurance.employee;
  const healthMonthly = monthlyGross * emp.healthRate;
  const insuranceComponents = [
    { key: 'pension', label: '국민연금', monthly: monthlyGross * emp.pensionRate },
    { key: 'health', label: '건강보험', monthly: healthMonthly },
    { key: 'ltc', label: '장기요양보험', monthly: healthMonthly * emp.longTermCareRate },
    { key: 'employment', label: '고용보험', monthly: monthlyGross * emp.employmentRate },
  ].map((c) => ({ ...c, monthly: Math.round(c.monthly) }));
  const monthlyEmployeeInsurance = insuranceComponents.reduce((a, c) => a + c.monthly, 0);

  // 월 실수령
  const monthlyTax = Math.round(annualTax / 12);
  const monthlyTakeHome = Math.round(monthlyGross) - monthlyEmployeeInsurance - monthlyTax;
  const annualTakeHome = monthlyTakeHome * 12;

  return {
    monthlyGross: Math.round(monthlyGross),
    annualNontaxableMeal,
    taxableSalary,
    deductions: {
      earnedIncomeDeduction: Math.round(eid),
      personal,
      dependent: dependentDeduction,
      pensionContribution: Math.round(pensionAnnual),
      total: Math.round(totalDeductions),
    },
    taxBase: Math.round(taxBase),
    computedTax: Math.round(computedTax),
    earnedIncomeTaxCredit: Math.round(eitcCredit),
    childTaxCredit: ctc,
    determinedTax,
    localTax,
    annualTax,
    monthlyEmployeeInsurance,
    insuranceComponents,
    monthlyTakeHome,
    annualTakeHome,
    takeHomeRate: annualTakeHome / input.annualSalary,
    warnings: [
      '의료비·신용카드·연금저축 등 추가 소득공제와 비과세 항목(출퇴근비·연구활동비 등)은 미반영한 보수적 추정입니다. 실제 실수령은 이보다 클 수 있습니다.',
      '4대보험은 월급(연봉/12) 기준 단순 계산이며, 소득상한(국민연금)·보수월액 차이는 미반영.',
    ],
  };
}
