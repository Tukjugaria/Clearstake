import { describe, it, expect } from 'vitest';
import { calculateValuation, ValuationInputError } from './valuation';

describe('calculateValuation', () => {
  it('매출 멀티플로 EV와 범위를 계산한다', () => {
    const r = calculateValuation({
      method: 'revenue',
      annualMetric: 5_000_000_000, // 50억
      baseMultiple: 5,
      rangePct: 0.2,
    });
    expect(r.enterpriseValue).toBe(25_000_000_000); // 250억
    expect(r.evLow).toBe(20_000_000_000); // 200억
    expect(r.evHigh).toBe(30_000_000_000); // 300억
  });

  it('순현금으로 Equity Value를 보정한다', () => {
    const r = calculateValuation({
      method: 'revenue',
      annualMetric: 5_000_000_000,
      baseMultiple: 5,
      netCash: 1_000_000_000,
    });
    expect(r.equityValue).toBe(26_000_000_000); // 250억 + 10억
  });

  it('순이익이 0 이하면 PER 경고', () => {
    const r = calculateValuation({ method: 'earnings', annualMetric: -1, baseMultiple: 10 });
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('멀티플이 0 이하면 에러', () => {
    expect(() =>
      calculateValuation({ method: 'revenue', annualMetric: 1, baseMultiple: 0 }),
    ).toThrow(ValuationInputError);
  });
});
