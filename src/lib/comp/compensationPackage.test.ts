import { describe, it, expect } from 'vitest';
import { calculateCompensationPackage, CompensationInputError } from './compensationPackage';

describe('calculateCompensationPackage', () => {
  it('연봉만 — 4년 누적 회사 부담 > 임직원 세후 실수령', () => {
    const r = calculateCompensationPackage({
      annualSalary: 60_000_000,
      annualBonus: 0,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 0,
      horizonYears: 4,
    });
    expect(r.companyCostTotal).toBeGreaterThan(r.employeeNetTotal);
    expect(r.passThroughRate).toBeLessThan(1);
    expect(r.passThroughRate).toBeGreaterThan(0.5);
  });

  it('보너스를 더하면 회사 부담·임직원 실수령 모두 증가', () => {
    const noBonus = calculateCompensationPackage({
      annualSalary: 60_000_000,
      annualBonus: 0,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 0,
      horizonYears: 4,
    });
    const bonus = calculateCompensationPackage({
      annualSalary: 60_000_000,
      annualBonus: 10_000_000,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 0,
      horizonYears: 4,
    });
    expect(bonus.companyCostTotal).toBeGreaterThan(noBonus.companyCostTotal);
    expect(bonus.employeeNetTotal).toBeGreaterThan(noBonus.employeeNetTotal);
  });

  it('스톡옵션 추가 시 회사 현금부담은 변동 없고, 임직원 실수령에 추가', () => {
    const noOption = calculateCompensationPackage({
      annualSalary: 60_000_000,
      annualBonus: 0,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 0,
      horizonYears: 4,
    });
    const withOption = calculateCompensationPackage({
      annualSalary: 60_000_000,
      annualBonus: 0,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 0,
      horizonYears: 4,
      stockOption: {
        shares: 10_000,
        exercisePrice: 1_000,
        expectedMarketPrice: 10_000,
        grantYear: 2024,
        exerciseYear: 2028,
        isVentureQualified: true,
      },
    });
    expect(withOption.companyCostTotal).toBe(noOption.companyCostTotal);
    expect(withOption.employeeNetTotal).toBeGreaterThan(noOption.employeeNetTotal);
  });

  it('연봉 0 이하면 에러', () => {
    expect(() =>
      calculateCompensationPackage({
        annualSalary: 0,
        annualBonus: 0,
        dependents: 0,
        children: 0,
        monthlyNontaxableMeal: 0,
        horizonYears: 4,
      }),
    ).toThrow(CompensationInputError);
  });
});
