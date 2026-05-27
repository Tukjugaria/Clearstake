import { describe, it, expect } from 'vitest';
import { calculateRetirementTax, RetirementTaxInputError } from './retirementTax';

describe('calculateRetirementTax', () => {
  it('월 500만 × 10년 → 퇴직금 5천만, 근속공제 1,500만', () => {
    const r = calculateRetirementTax({ monthlyAverageSalary: 5_000_000, serviceYears: 10 });
    expect(r.severancePay).toBe(50_000_000);
    // 근속 10년: 5년까지 100만/년 = 500만 + 다음 5년 × 200만 = 1,000만 → 합 1,500만
    expect(r.serviceYearDeduction).toBe(15_000_000);
  });

  it('환산급여 = (퇴직금 − 근속공제) × 12 ÷ 근속연수', () => {
    const r = calculateRetirementTax({ monthlyAverageSalary: 5_000_000, serviceYears: 10 });
    // (5천만 − 1,500만) × 12 ÷ 10 = 4,200만
    expect(r.convertedSalary).toBe(42_000_000);
  });

  it('세후 실수령 = 퇴직금 − 총세액', () => {
    const r = calculateRetirementTax({ monthlyAverageSalary: 5_000_000, serviceYears: 10 });
    expect(r.netAfterTax).toBe(r.severancePay - r.totalTax);
    expect(r.totalTax).toBeGreaterThan(0);
    expect(r.effectiveTaxRate).toBeCloseTo(r.totalTax / r.severancePay, 10);
  });

  it('근속연수가 길수록 근속공제가 커진다', () => {
    const r5 = calculateRetirementTax({ monthlyAverageSalary: 5_000_000, serviceYears: 5 });
    const r15 = calculateRetirementTax({ monthlyAverageSalary: 5_000_000, serviceYears: 15 });
    expect(r15.serviceYearDeduction).toBeGreaterThan(r5.serviceYearDeduction);
  });

  it('근속 20년 초과 구간 → 3백만/년 적용', () => {
    // 25년: 20년까지 = 4천만, 추가 5년 × 300만 = 1,500만 → 합 5,500만
    const r = calculateRetirementTax({ monthlyAverageSalary: 10_000_000, serviceYears: 25 });
    expect(r.serviceYearDeduction).toBe(55_000_000);
  });

  it('월급 0 이하면 에러', () => {
    expect(() =>
      calculateRetirementTax({ monthlyAverageSalary: 0, serviceYears: 5 }),
    ).toThrow(RetirementTaxInputError);
  });
});
