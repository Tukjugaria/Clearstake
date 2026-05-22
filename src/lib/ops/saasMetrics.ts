/**
 * VCEquityNote — SaaS 핵심 지표 계산 엔진 (순수 함수)
 *
 * 단위경제(LTV·CAC·회수기간) + 매출유지율(NRR·GRR)을 계산한다.
 *   - 고객 수명(개월) = 1 / 월 이탈률
 *   - LTV = 월 ARPA × 매출총이익률 × 고객 수명
 *   - CAC = S&M 지출 / 신규 고객 수
 *   - CAC 회수기간(개월) = CAC / (월 ARPA × 매출총이익률)
 *   - NRR = (기초MRR + 확장 − 축소 − 이탈) / 기초MRR,  GRR = (기초 − 축소 − 이탈) / 기초
 *
 * 비율 fraction, 금액 ₩.
 */

export interface SaasMetricsInput {
  /** 월 고객당 평균매출 ARPA (₩) */
  monthlyArpa: number;
  /** 매출총이익률 (fraction) */
  grossMargin: number;
  /** 월 이탈률 (fraction) */
  monthlyChurn: number;
  /** 기간 S&M 지출 (₩) */
  salesMarketingSpend: number;
  /** 기간 신규 고객 수 */
  newCustomers: number;
  /** (선택) NRR/GRR — 기초 MRR */
  startMrr?: number;
  expansionMrr?: number;
  contractionMrr?: number;
  churnedMrr?: number;
}

export interface SaasMetricsResult {
  avgLifetimeMonths: number | null;
  ltv: number | null;
  cac: number | null;
  ltvToCac: number | null;
  cacPaybackMonths: number | null;
  nrr: number | null;
  grr: number | null;
  warnings: string[];
}

export class SaasMetricsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaasMetricsInputError';
  }
}

export function calculateSaasMetrics(input: SaasMetricsInput): SaasMetricsResult {
  if (!(input.monthlyArpa >= 0)) throw new SaasMetricsInputError('ARPA는 0 이상이어야 합니다.');
  if (input.grossMargin < 0 || input.grossMargin > 1) {
    throw new SaasMetricsInputError('매출총이익률은 0~1(fraction)이어야 합니다.');
  }
  if (input.monthlyChurn < 0 || input.monthlyChurn >= 1) {
    throw new SaasMetricsInputError('월 이탈률은 0 이상 1 미만이어야 합니다.');
  }

  const warnings: string[] = [];
  const marginPerCustomer = input.monthlyArpa * input.grossMargin;

  const avgLifetimeMonths = input.monthlyChurn > 0 ? 1 / input.monthlyChurn : null;
  if (avgLifetimeMonths == null) warnings.push('이탈률이 0이라 고객 수명·LTV는 산정하지 않았습니다.');

  const ltv = avgLifetimeMonths != null ? marginPerCustomer * avgLifetimeMonths : null;
  const cac = input.newCustomers > 0 ? input.salesMarketingSpend / input.newCustomers : null;
  if (cac == null) warnings.push('신규 고객 수가 0이라 CAC를 산정하지 않았습니다.');

  const ltvToCac = ltv != null && cac != null && cac > 0 ? ltv / cac : null;
  const cacPaybackMonths =
    cac != null && marginPerCustomer > 0 ? cac / marginPerCustomer : null;

  // NRR / GRR
  let nrr: number | null = null;
  let grr: number | null = null;
  if (input.startMrr != null && input.startMrr > 0) {
    const exp = input.expansionMrr ?? 0;
    const con = input.contractionMrr ?? 0;
    const chu = input.churnedMrr ?? 0;
    nrr = (input.startMrr + exp - con - chu) / input.startMrr;
    grr = (input.startMrr - con - chu) / input.startMrr;
  }

  return { avgLifetimeMonths, ltv, cac, ltvToCac, cacPaybackMonths, nrr, grr, warnings };
}
