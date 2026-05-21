import { describe, it, expect } from 'vitest';
import { compareConvertibleVsSafe, ConvertibleInputError } from './convertible';
import type { RoundContext } from '../safe';

const round: RoundContext = {
  valuation: 1e10, // pre 100억
  valuationBasis: 'preMoney',
  newMoneyInvestment: 0,
  preRoundFullyDilutedShares: 1_000_000, // 주당 10,000
};

describe('compareConvertibleVsSafe', () => {
  it('cap 기준 전환가는 동일하고, CB는 이자만큼 더 전환된다', () => {
    const r = compareConvertibleVsSafe({
      principal: 200_000_000,
      valuationCap: 8e9, // cap price 8,000
      interestRate: 0.08,
      termYears: 2,
      compound: false, // 단리 8% × 2년 = 16% → 232,000,000
      round,
    });
    expect(r.conversionPrice).toBe(8000);
    expect(r.safe.shares).toBe(25_000); // 2억 / 8,000
    expect(r.cbAccruedInterest).toBeCloseTo(32_000_000, 0);
    expect(r.cb.shares).toBe(29_000); // 2.32억 / 8,000
    expect(r.extraSharesCb).toBe(4_000);
  });

  it('복리 계산을 지원한다', () => {
    const r = compareConvertibleVsSafe({
      principal: 100_000_000,
      valuationCap: 1e10, // cap price 10,000 = round price
      interestRate: 0.1,
      termYears: 2,
      compound: true, // 100,000,000 × 1.21 = 121,000,000
      round,
    });
    expect(r.cbAccruedInterest).toBeCloseTo(21_000_000, 0);
    expect(r.cb.shares).toBe(12_100); // 1.21억 / 10,000
  });

  it('원금이 0 이하면 에러', () => {
    expect(() =>
      compareConvertibleVsSafe({
        principal: 0,
        interestRate: 0.08,
        termYears: 2,
        round,
      }),
    ).toThrow(ConvertibleInputError);
  });
});
