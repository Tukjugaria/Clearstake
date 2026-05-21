import { describe, it, expect } from 'vitest';
import { calculateVesting, VestingInputError } from './vesting';

const base = {
  totalShares: 48_000,
  vestingMonths: 48,
  cliffMonths: 12,
  periodMonths: 1,
};

describe('calculateVesting — 클리프/주기', () => {
  it('클리프 이전에는 0', () => {
    const r = calculateVesting({ ...base, elapsedMonths: 11 });
    expect(r.vestedShares).toBe(0);
    expect(r.nextVestInMonths).toBe(1); // 1개월 뒤 클리프
  });

  it('1년 클리프 시점에 25% 베스팅(4년 월별)', () => {
    const r = calculateVesting({ ...base, elapsedMonths: 12 });
    expect(r.vestedPct).toBeCloseTo(0.25, 6);
    expect(r.vestedShares).toBe(12_000);
  });

  it('월별 베스팅이 선형 증가', () => {
    const r = calculateVesting({ ...base, elapsedMonths: 24 });
    expect(r.vestedShares).toBe(24_000); // 24/48
  });

  it('총 기간 도달 시 100%', () => {
    const r = calculateVesting({ ...base, elapsedMonths: 48 });
    expect(r.vestedShares).toBe(48_000);
    expect(r.nextVestInMonths).toBeNull();
    expect(r.unvestedShares).toBe(0);
  });

  it('분기 베스팅은 분기 경계에서만 증가', () => {
    const q = { ...base, periodMonths: 3 };
    expect(calculateVesting({ ...q, elapsedMonths: 13 }).vestedShares).toBe(12_000); // 12개월분 유지
    expect(calculateVesting({ ...q, elapsedMonths: 15 }).vestedShares).toBe(15_000); // 다음 분기
  });
});

describe('calculateVesting — 가치/검증', () => {
  it('현재가·행사가가 있으면 베스팅 가치 계산', () => {
    const r = calculateVesting({
      ...base,
      elapsedMonths: 24,
      exercisePrice: 1_000,
      currentPricePerShare: 5_000,
    });
    expect(r.vestedValue).toBe(24_000 * 4_000);
  });

  it('클리프가 베스팅 기간보다 길면 에러', () => {
    expect(() => calculateVesting({ ...base, cliffMonths: 60, elapsedMonths: 1 })).toThrow(
      VestingInputError,
    );
  });
});
