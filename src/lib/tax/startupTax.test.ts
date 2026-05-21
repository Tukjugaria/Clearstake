import { describe, it, expect } from 'vitest';
import { calculateStartupTaxRelief, StartupTaxInputError } from './startupTax';

describe('calculateStartupTaxRelief', () => {
  it('법인세 산출세액(2억 이하 9%)에 100% 감면 적용', () => {
    const r = calculateStartupTaxRelief({ taxableIncome: 200_000_000, reductionRate: 1, years: 5 });
    expect(r.corporateTaxPerYear).toBe(18_000_000); // 2억 × 9%
    expect(r.reliefPerYear).toBe(18_000_000);
    expect(r.payablePerYear).toBe(0); // 100% 감면 → 법인세 0, 지방세 0
    expect(r.totalRelief).toBe(90_000_000); // 5년
  });

  it('50% 감면 시 절반만 납부 + 지방소득세', () => {
    const r = calculateStartupTaxRelief({ taxableIncome: 200_000_000, reductionRate: 0.5, years: 5 });
    expect(r.reliefPerYear).toBe(9_000_000);
    // 감면 후 법인세 9,000,000 + 지방세 900,000 = 9,900,000
    expect(r.payablePerYear).toBe(9_900_000);
  });

  it('누진 구간(2억 초과 19%)도 반영', () => {
    // 5억 → 5억×0.19 − 2천만 = 7,500만
    const r = calculateStartupTaxRelief({ taxableIncome: 500_000_000, reductionRate: 0.5, years: 1 });
    expect(r.corporateTaxPerYear).toBe(75_000_000);
  });

  it('감면율 범위를 벗어나면 에러', () => {
    expect(() =>
      calculateStartupTaxRelief({ taxableIncome: 1, reductionRate: 1.5, years: 1 }),
    ).toThrow(StartupTaxInputError);
  });
});
