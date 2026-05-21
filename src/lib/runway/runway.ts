/**
 * EquityKit — 런웨이·번레이트 계산 엔진 (순수 함수)
 *
 * 월 단위로 현금 흐름을 시뮬레이션해 현금 소진 시점(런웨이)을 구한다.
 * 매출 성장률을 반영하면 번레이트가 줄며 손익분기(breakeven) 도달도 계산한다.
 *
 * 금액 단위 ₩, 성장률은 fraction(월 기준).
 */

const MAX_MONTHS = 600; // 50년 — 흑자(소진 안 됨) 판정 상한

export interface RunwayInput {
  /** 보유 현금 (₩) */
  cashOnHand: number;
  /** 현재 월 매출 (₩) */
  monthlyRevenue: number;
  /** 월 비용 (₩) */
  monthlyExpense: number;
  /** 월 매출 성장률 (fraction, 예: 0.1 = +10%/월). 기본 0 */
  monthlyRevenueGrowth?: number;
}

export interface RunwayPoint {
  /** 경과 개월 (0 = 현재) */
  month: number;
  cash: number;
  revenue: number;
  expense: number;
  /** 월 순소모 = 비용 − 매출 (음수면 흑자) */
  netBurn: number;
}

export interface RunwayResult {
  /** 현재(0개월) 순 번레이트 = 비용 − 매출 */
  initialNetBurn: number;
  /** 현금 소진까지 개월 (보간된 소수). 소진되지 않으면 null */
  runwayMonths: number | null;
  /** 현금이 소진되지 않음(흑자 전환 등) */
  isSustainable: boolean;
  /** 매출 ≥ 비용이 되는 첫 개월. 도달 못 하면 null */
  breakevenMonth: number | null;
  /** 차트용 월별 현금 추이 */
  series: RunwayPoint[];
}

export class RunwayInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RunwayInputError';
  }
}

function validate(input: RunwayInput): void {
  if (!(input.cashOnHand >= 0)) throw new RunwayInputError('보유 현금은 0 이상이어야 합니다.');
  if (!(input.monthlyRevenue >= 0)) throw new RunwayInputError('월 매출은 0 이상이어야 합니다.');
  if (!(input.monthlyExpense >= 0)) throw new RunwayInputError('월 비용은 0 이상이어야 합니다.');
  const g = input.monthlyRevenueGrowth ?? 0;
  if (!(g > -1) || !Number.isFinite(g)) {
    throw new RunwayInputError('월 매출 성장률이 올바르지 않습니다.');
  }
}

export function calculateRunway(input: RunwayInput): RunwayResult {
  validate(input);
  const g = input.monthlyRevenueGrowth ?? 0;
  const expense = input.monthlyExpense;
  const initialNetBurn = expense - input.monthlyRevenue;

  const series: RunwayPoint[] = [
    {
      month: 0,
      cash: input.cashOnHand,
      revenue: input.monthlyRevenue,
      expense,
      netBurn: initialNetBurn,
    },
  ];

  let cash = input.cashOnHand;
  let runwayMonths: number | null = null;
  let breakevenMonth: number | null = input.monthlyRevenue >= expense ? 0 : null;

  for (let m = 1; m <= MAX_MONTHS; m++) {
    const revenue = input.monthlyRevenue * Math.pow(1 + g, m);
    const netBurn = expense - revenue;
    const prevCash = cash;
    cash = cash - netBurn;

    if (breakevenMonth === null && revenue >= expense) breakevenMonth = m;

    // 소진 시점 보간 (prevCash > 0 >= cash)
    if (runwayMonths === null && prevCash > 0 && cash <= 0) {
      const drop = prevCash - cash; // 이 달의 순소모(양수)
      const frac = drop > 0 ? prevCash / drop : 0;
      runwayMonths = m - 1 + frac;
    }

    if (series.length <= 60) {
      series.push({ month: m, cash, revenue, expense, netBurn });
    }

    // 소진됐고 더 그릴 필요 없으면 종료
    if (runwayMonths !== null && m >= Math.ceil(runwayMonths) + 1) break;
    // 흑자로 현금이 계속 늘어 상한 도달 시 종료
    if (runwayMonths === null && netBurn <= 0 && m >= 36) break;
  }

  const isSustainable = runwayMonths === null;

  return { initialNetBurn, runwayMonths, isSustainable, breakevenMonth, series };
}

/** 경과 개월(소수) → 미래 날짜 (기준일로부터) */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  const whole = Math.floor(months);
  const fracDays = Math.round((months - whole) * 30);
  d.setMonth(d.getMonth() + whole);
  d.setDate(d.getDate() + fracDays);
  return d;
}
