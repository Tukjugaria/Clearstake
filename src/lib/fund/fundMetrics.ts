/**
 * VCEquityNote — 펀드/포트폴리오 성과지표 엔진 (순수 함수)
 *
 *   TVPI = (누적 분배 + 현재 NAV) / 납입원금
 *   DPI  = 누적 분배 / 납입원금   (실현)
 *   RVPI = 현재 NAV / 납입원금    (미실현)   →  TVPI = DPI + RVPI
 *   XIRR = 불규칙 날짜 현금흐름의 내부수익률 (납입=음수, 분배/NAV=양수)
 *
 * 금액 ₩, 비율은 배수/연수익률.
 */

export interface DatedCashflow {
  /** ISO 날짜 (YYYY-MM-DD) */
  date: string;
  /** 금액 (₩). 납입(capital call)은 음수, 분배(distribution)는 양수 */
  amount: number;
}

export interface FundMetricsInput {
  /** 누적 납입원금 (paid-in, ₩) */
  paidIn: number;
  /** 누적 분배 (distributions, ₩) */
  distributions: number;
  /** 현재 잔여가치 (NAV, ₩) */
  nav: number;
  /** (선택) XIRR용 날짜별 현금흐름 (납입 음수/분배 양수) */
  cashflows?: DatedCashflow[];
  /** (선택) NAV 평가일 — XIRR에 NAV를 양수 유입으로 포함 */
  valuationDate?: string;
}

export interface FundMetricsResult {
  tvpi: number;
  dpi: number;
  rvpi: number;
  /** 총가치 = 분배 + NAV */
  totalValue: number;
  /** XIRR (입력 부족·해 없음 시 null) */
  xirr: number | null;
  warnings: string[];
}

export class FundMetricsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FundMetricsInputError';
  }
}

const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;

function npv(rate: number, flows: { t: number; amount: number }[]): number {
  return flows.reduce((s, f) => s + f.amount / Math.pow(1 + rate, f.t), 0);
}

/** 불규칙 현금흐름 IRR (이분법). 해가 없으면 null */
export function xirr(cashflows: DatedCashflow[]): number | null {
  if (cashflows.length < 2) return null;
  const sorted = [...cashflows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const t0 = new Date(sorted[0].date).getTime();
  const flows = sorted.map((c) => ({
    t: (new Date(c.date).getTime() - t0) / MS_PER_YEAR,
    amount: c.amount,
  }));
  if (!flows.some((f) => f.amount > 0) || !flows.some((f) => f.amount < 0)) return null;

  let lo = -0.9999;
  let hi = 100;
  let flo = npv(lo, flows);
  let fhi = npv(hi, flows);
  if (flo * fhi > 0) return null; // 부호 변화 없음 → 해 없음
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fm = npv(mid, flows);
    if (Math.abs(fm) < 1e-6 || hi - lo < 1e-9) return mid;
    if (flo * fm < 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  void fhi;
  return (lo + hi) / 2;
}

export function calculateFundMetrics(input: FundMetricsInput): FundMetricsResult {
  if (!(input.paidIn > 0)) throw new FundMetricsInputError('납입원금은 0보다 커야 합니다.');
  if (!(input.distributions >= 0)) throw new FundMetricsInputError('누적 분배는 0 이상이어야 합니다.');
  if (!(input.nav >= 0)) throw new FundMetricsInputError('NAV는 0 이상이어야 합니다.');

  const warnings: string[] = [];
  const totalValue = input.distributions + input.nav;

  let xirrVal: number | null = null;
  if (input.cashflows && input.cashflows.length > 0) {
    const flows = [...input.cashflows];
    if (input.nav > 0 && input.valuationDate) {
      flows.push({ date: input.valuationDate, amount: input.nav });
    }
    xirrVal = xirr(flows);
    if (xirrVal == null) {
      warnings.push('현금흐름이 부족하거나 부호 변화가 없어 XIRR을 산정하지 못했습니다(납입은 음수, 분배는 양수).');
    }
  }

  return {
    tvpi: totalValue / input.paidIn,
    dpi: input.distributions / input.paidIn,
    rvpi: input.nav / input.paidIn,
    totalValue,
    xirr: xirrVal,
    warnings,
  };
}
