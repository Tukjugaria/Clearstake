/**
 * ClearStake — 베스팅 스케줄 계산 엔진 (순수 함수)
 *
 * 클리프(cliff) + 주기적 베스팅 모델. 경과 개월 기준으로 누적 베스팅 수량을 계산한다.
 *  - 클리프 이전: 0
 *  - 클리프 시점: 클리프에 해당하는 분량 일괄 베스팅
 *  - 이후: 베스팅 주기(월/분기/연)마다 선형 증가, 총 베스팅 기간에 100% 도달
 *
 * 주식수는 정수(내림). 금액 ₩.
 */

export interface VestingInput {
  /** 총 부여 주식수 */
  totalShares: number;
  /** 총 베스팅 기간 (개월) */
  vestingMonths: number;
  /** 클리프 (개월) */
  cliffMonths: number;
  /** 베스팅 주기 (개월): 1=월, 3=분기, 12=연 */
  periodMonths: number;
  /** 경과 개월 (현재 시점) */
  elapsedMonths: number;
  /** (선택) 행사가격 — 가치 계산용 */
  exercisePrice?: number;
  /** (선택) 현재 1주당 가치 — 가치 계산용 */
  currentPricePerShare?: number;
}

export interface VestingPoint {
  month: number;
  vestedShares: number;
  vestedPct: number;
}

export interface VestingResult {
  vestedShares: number;
  vestedPct: number;
  unvestedShares: number;
  /** 다음 베스팅까지 개월 (완전 베스팅 시 null) */
  nextVestInMonths: number | null;
  /** 완전 베스팅까지 남은 개월 (이미 완료면 0) */
  remainingMonths: number;
  /** 차트용 스케줄 */
  schedule: VestingPoint[];
  /** (선택) 현재 베스팅분의 행사이익 = vested × max(0, 현재가 − 행사가) */
  vestedValue: number | null;
}

export class VestingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VestingInputError';
  }
}

function validate(i: VestingInput): void {
  if (!(i.totalShares > 0)) throw new VestingInputError('총 부여 주식수는 0보다 커야 합니다.');
  if (!(i.vestingMonths > 0)) throw new VestingInputError('총 베스팅 기간은 0보다 커야 합니다.');
  if (!(i.cliffMonths >= 0)) throw new VestingInputError('클리프는 0 이상이어야 합니다.');
  if (i.cliffMonths > i.vestingMonths)
    throw new VestingInputError('클리프는 총 베스팅 기간을 넘을 수 없습니다.');
  if (!(i.periodMonths > 0)) throw new VestingInputError('베스팅 주기는 0보다 커야 합니다.');
  if (!(i.elapsedMonths >= 0)) throw new VestingInputError('경과 개월은 0 이상이어야 합니다.');
}

/** 경과 t개월 시점의 누적 베스팅 비율 (fraction) */
export function vestedFractionAt(i: VestingInput, t: number): number {
  if (t < i.cliffMonths) return 0;
  const periodVested = Math.floor(Math.min(t, i.vestingMonths) / i.periodMonths) * i.periodMonths;
  const vestedMonths = Math.min(Math.max(i.cliffMonths, periodVested), i.vestingMonths);
  return vestedMonths / i.vestingMonths;
}

export function calculateVesting(input: VestingInput): VestingResult {
  validate(input);

  const frac = vestedFractionAt(input, input.elapsedMonths);
  const vestedShares = Math.floor(input.totalShares * frac);
  const unvestedShares = input.totalShares - vestedShares;

  // 다음 베스팅 시점
  let nextVestInMonths: number | null = null;
  if (vestedShares < input.totalShares) {
    if (input.elapsedMonths < input.cliffMonths) {
      nextVestInMonths = input.cliffMonths - input.elapsedMonths;
    } else {
      const nextBoundary =
        (Math.floor(input.elapsedMonths / input.periodMonths) + 1) * input.periodMonths;
      nextVestInMonths = Math.min(nextBoundary, input.vestingMonths) - input.elapsedMonths;
    }
  }

  const remainingMonths = Math.max(0, input.vestingMonths - input.elapsedMonths);

  // 스케줄 (주기 경계마다, 최대 ~60 포인트)
  const step = Math.max(input.periodMonths, Math.ceil(input.vestingMonths / 60));
  const schedule: VestingPoint[] = [];
  for (let m = 0; m <= input.vestingMonths; m += step) {
    const f = vestedFractionAt(input, m);
    schedule.push({ month: m, vestedShares: Math.floor(input.totalShares * f), vestedPct: f });
  }
  // 마지막 지점 보장
  if (schedule[schedule.length - 1].month !== input.vestingMonths) {
    schedule.push({ month: input.vestingMonths, vestedShares: input.totalShares, vestedPct: 1 });
  }

  const vestedValue =
    input.currentPricePerShare != null && input.exercisePrice != null
      ? vestedShares * Math.max(0, input.currentPricePerShare - input.exercisePrice)
      : null;

  return {
    vestedShares,
    vestedPct: frac,
    unvestedShares,
    nextVestInMonths,
    remainingMonths,
    schedule,
    vestedValue,
  };
}
