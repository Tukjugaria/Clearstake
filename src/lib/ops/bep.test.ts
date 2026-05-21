import { describe, it, expect } from 'vitest';
import { calculateBep, BepInputError } from './bep';

describe('calculateBep', () => {
  it('BEP 수량·매출을 계산한다', () => {
    // 고정비 1,000만, 단가 50,000, 변동비 30,000 → 공헌이익 20,000 → BEP 500개
    const r = calculateBep({ fixedCosts: 10_000_000, pricePerUnit: 50_000, variableCostPerUnit: 30_000 });
    expect(r.contributionMargin).toBe(20_000);
    expect(r.contributionMarginRatio).toBeCloseTo(0.4, 6);
    expect(r.bepUnits).toBe(500);
    expect(r.bepRevenue).toBe(25_000_000);
    expect(r.marginOfSafety).toBeNull();
  });

  it('현재 판매량으로 안전마진을 계산한다', () => {
    const r = calculateBep({
      fixedCosts: 10_000_000,
      pricePerUnit: 50_000,
      variableCostPerUnit: 30_000,
      currentUnits: 1000, // 매출 5,000만, BEP 2,500만 → 안전마진 50%
    });
    expect(r.marginOfSafety).toBeCloseTo(0.5, 6);
  });

  it('현재 판매량이 BEP 미만이면 경고', () => {
    const r = calculateBep({
      fixedCosts: 10_000_000,
      pricePerUnit: 50_000,
      variableCostPerUnit: 30_000,
      currentUnits: 100,
    });
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('판매가 ≤ 변동비면 에러', () => {
    expect(() =>
      calculateBep({ fixedCosts: 1, pricePerUnit: 30_000, variableCostPerUnit: 30_000 }),
    ).toThrow(BepInputError);
  });
});
