/**
 * VCEquityNote — 인건비·4대보험·퇴직금 실부담 계산 엔진 (개략 추정)
 *
 * 연봉을 입력하면 회사가 실제 부담하는 월/연 총비용을 계산한다.
 *   회사 실부담 = 급여 + 4대보험 사용자부담 + 퇴직금 적립
 *
 * ⚠️ 요율은 매년 변동하고 소득상한·업종(산재)에 따라 달라진다. 모든 요율은 taxConfig에서 주입.
 * 금액 ₩.
 */

import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';

export interface PayrollInput {
  /** 연봉 (₩) */
  annualSalary: number;
  /** 산재보험 요율 override (fraction) — 업종별 상이. 미지정 시 config 기본값 */
  industrialAccidentRate?: number;
}

export interface PayrollComponent {
  key: string;
  label: string;
  /** 월 부담액 (₩) */
  monthly: number;
}

export interface PayrollResult {
  /** 월 급여 */
  monthlySalary: number;
  /** 사용자부담 항목별 (월) */
  components: PayrollComponent[];
  /** 월 사용자부담 합계 (급여 제외) */
  employerBurdenMonthly: number;
  /** 월 총비용 (급여 + 부담) */
  totalMonthly: number;
  /** 연 총비용 */
  totalAnnual: number;
  /** 급여 대비 부담률 (fraction) */
  burdenRate: number;
  warnings: string[];
}

export class PayrollInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PayrollInputError';
  }
}

export function calculatePayrollCost(
  input: PayrollInput,
  config: TaxConfig = defaultTaxConfig,
): PayrollResult {
  if (!(input.annualSalary > 0)) {
    throw new PayrollInputError('연봉은 0보다 커야 합니다.');
  }
  const si = config.socialInsurance;
  const monthlySalary = input.annualSalary / 12;
  const accidentRate = input.industrialAccidentRate ?? si.industrialAccidentRate;

  const health = monthlySalary * si.healthRate;
  const components: PayrollComponent[] = [
    { key: 'pension', label: '국민연금', monthly: monthlySalary * si.pensionRate },
    { key: 'health', label: '건강보험', monthly: health },
    { key: 'ltc', label: '장기요양보험', monthly: health * si.longTermCareRate },
    { key: 'employment', label: '고용보험', monthly: monthlySalary * si.employmentRate },
    { key: 'accident', label: '산재보험', monthly: monthlySalary * accidentRate },
    { key: 'severance', label: '퇴직금 적립', monthly: monthlySalary * si.severanceRate },
  ].map((c) => ({ ...c, monthly: Math.round(c.monthly) }));

  const employerBurdenMonthly = components.reduce((a, c) => a + c.monthly, 0);
  const totalMonthly = Math.round(monthlySalary) + employerBurdenMonthly;

  return {
    monthlySalary: Math.round(monthlySalary),
    components,
    employerBurdenMonthly,
    totalMonthly,
    totalAnnual: totalMonthly * 12,
    burdenRate: employerBurdenMonthly / monthlySalary,
    warnings: [
      '4대보험 요율은 연도별 변동·소득상한(국민연금)·업종(산재)에 따라 달라지는 개략 추정입니다.',
    ],
  };
}
