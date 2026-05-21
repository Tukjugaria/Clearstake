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
