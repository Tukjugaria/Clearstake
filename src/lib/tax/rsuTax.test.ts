import { describe, it, expect } from 'vitest';
import { calculateRsuTax, RsuTaxInputError } from './rsuTax';

describe('calculateRsuTax', () => {
  it('베스팅 시 근로소득 = 주식수 × 시가', () => {
    const r = calculateRsuTax({ vestedShares: 10_000, fmvPerShareAtVest: 50_000 });
    expect(r.ordinaryIncome).toBe(500_000_000);
    expect(r.laborTax).toBeGreaterThan(0);
    expect(r.capitalGain).toBe(0);
  });

  it('매각가 입력 시 양도차익·양도세를 추가 계산', () => {
    const r = calculateRsuTax({
      vestedShares: 10_000,
      fmvPerShareAtVest: 50_000,
      salePricePerShare: 80_000,
    });
    expect(r.capitalGain).toBe(300_000_000); // (8만−5만)×1만
    expect(r.capitalGainsTax).toBeGreaterThan(0);
    expect(r.totalTax).toBe(r.laborTax + r.capitalGainsTax);
  });

  it('미매각 시 세후 실수령 = 베스팅 평가액 − 근로소득세', () => {
    const r = calculateRsuTax({ vestedShares: 10_000, fmvPerShareAtVest: 50_000 });
    expect(r.sold).toBe(false);
    expect(r.grossValue).toBe(500_000_000);
    expect(r.netAfterTax).toBe(r.grossValue - r.totalTax);
    expect(r.effectiveTaxRate).toBeCloseTo(r.totalTax / r.grossValue, 10);
  });

  it('매각 시 세후 실수령 = 매각대금 − 총세액', () => {
    const r = calculateRsuTax({
      vestedShares: 10_000,
      fmvPerShareAtVest: 50_000,
      salePricePerShare: 80_000,
    });
    expect(r.sold).toBe(true);
    expect(r.grossValue).toBe(800_000_000); // 8만 × 1만
    expect(r.netAfterTax).toBe(800_000_000 - r.totalTax);
  });

  it('매각가가 베스팅 시가보다 낮으면 양도차익 0', () => {
    const r = calculateRsuTax({
      vestedShares: 1_000,
      fmvPerShareAtVest: 50_000,
      salePricePerShare: 40_000,
    });
    expect(r.capitalGain).toBe(0);
    expect(r.capitalGainsTax).toBe(0);
  });

  it('주식수가 0 이하면 에러', () => {
    expect(() => calculateRsuTax({ vestedShares: 0, fmvPerShareAtVest: 1 })).toThrow(
      RsuTaxInputError,
    );
  });
});
