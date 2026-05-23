import { describe, it, expect } from 'vitest';
import { calculateAngelTax, AngelTaxInputError } from './angelTax';

describe('calculateAngelTax — 구간별 공제율', () => {
  it('3천만원 투자 → 전액 100% 공제', () => {
    const r = calculateAngelTax({ investmentAmount: 30_000_000, comprehensiveIncome: 200_000_000 });
    expect(r.deductionBeforeCap).toBe(30_000_000);
  });

  it('5천만원 투자 → 3천만(100%) + 2천만(70%) = 4,400만원', () => {
    const r = calculateAngelTax({ investmentAmount: 50_000_000, comprehensiveIncome: 200_000_000 });
    expect(r.deductionBeforeCap).toBe(30_000_000 + 20_000_000 * 0.7);
    expect(r.deductionBeforeCap).toBe(44_000_000);
  });

  it('1억원 투자 → 3천만(100%)+2천만(70%)+5천만(30%) = 5,900만원', () => {
    const r = calculateAngelTax({ investmentAmount: 100_000_000, comprehensiveIncome: 300_000_000 });
    expect(r.deductionBeforeCap).toBe(30_000_000 + 14_000_000 + 15_000_000);
    expect(r.deductionBeforeCap).toBe(59_000_000);
  });
});

describe('calculateAngelTax — 종합소득 한도(50%)', () => {
  it('한도를 초과하면 한도까지만 적용', () => {
    // 투자 1억 → 공제 전 5,900만. 소득 1억 → 한도 5,000만. 적용 5,000만.
    const r = calculateAngelTax({ investmentAmount: 100_000_000, comprehensiveIncome: 100_000_000 });
    expect(r.deductionLimit).toBe(50_000_000);
    expect(r.deductionApplied).toBe(50_000_000);
    expect(r.warnings.some((w) => w.includes('한도'))).toBe(true);
  });

  it('절세액은 공제 전후 세액 차이로 추정된다(양수)', () => {
    const r = calculateAngelTax({ investmentAmount: 50_000_000, comprehensiveIncome: 200_000_000 });
    expect(r.estimatedTaxSaving).toBeGreaterThan(0);
  });

  it('세후 실수령 = 종합소득금액 − 납부세액, 절세액=실수령 차이', () => {
    const income = 200_000_000;
    const r = calculateAngelTax({ investmentAmount: 50_000_000, comprehensiveIncome: income });
    expect(r.netBeforeDeduction).toBe(income - r.taxBeforeDeduction);
    expect(r.netAfterDeduction).toBe(income - r.taxAfterDeduction);
    // 공제로 세금이 줄어 실수령이 늘어난다
    expect(r.netAfterDeduction).toBeGreaterThan(r.netBeforeDeduction);
    expect(r.netAfterDeduction - r.netBeforeDeduction).toBe(r.estimatedTaxSaving);
    expect(r.effectiveTaxRate).toBeCloseTo(r.taxAfterDeduction / income, 10);
  });
});

describe('calculateAngelTax — 검증/일몰', () => {
  it('투자금이 0 이하면 에러', () => {
    expect(() => calculateAngelTax({ investmentAmount: 0, comprehensiveIncome: 1 })).toThrow(
      AngelTaxInputError,
    );
  });

  it('일몰 이후 투자면 경고', () => {
    const r = calculateAngelTax({
      investmentAmount: 10_000_000,
      comprehensiveIncome: 100_000_000,
      investYear: 2030,
    });
    expect(r.warnings.some((w) => w.includes('일몰'))).toBe(true);
  });
});
