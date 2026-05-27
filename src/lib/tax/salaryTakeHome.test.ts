import { describe, it, expect } from 'vitest';
import { calculateSalaryTakeHome, SalaryTakeHomeInputError } from './salaryTakeHome';

describe('calculateSalaryTakeHome', () => {
  it('연봉 5천만 단신 → 월 실수령이 월 세전(약 416만)보다 작고 0보다 큼', () => {
    const r = calculateSalaryTakeHome({
      annualSalary: 50_000_000,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 0,
    });
    expect(r.monthlyGross).toBe(Math.round(50_000_000 / 12));
    expect(r.monthlyTakeHome).toBeGreaterThan(0);
    expect(r.monthlyTakeHome).toBeLessThan(r.monthlyGross);
    expect(r.takeHomeRate).toBeGreaterThan(0.75);
    expect(r.takeHomeRate).toBeLessThan(1);
  });

  it('연봉 1억 단신 → 5천만보다 실수령 비율이 낮다 (누진세)', () => {
    const r50 = calculateSalaryTakeHome({
      annualSalary: 50_000_000,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 0,
    });
    const r100 = calculateSalaryTakeHome({
      annualSalary: 100_000_000,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 0,
    });
    expect(r100.takeHomeRate).toBeLessThan(r50.takeHomeRate);
  });

  it('자녀 2명이면 세액공제 55만원 적용', () => {
    const r = calculateSalaryTakeHome({
      annualSalary: 60_000_000,
      dependents: 3,
      children: 2,
      monthlyNontaxableMeal: 0,
    });
    expect(r.childTaxCredit).toBe(550_000);
  });

  it('자녀 3명 → 55만 + (1×40만) = 95만 공제', () => {
    const r = calculateSalaryTakeHome({
      annualSalary: 60_000_000,
      dependents: 3,
      children: 3,
      monthlyNontaxableMeal: 0,
    });
    expect(r.childTaxCredit).toBe(950_000);
  });

  it('비과세 식대(20만 한도) 적용 시 과세대상이 줄어 실수령 증가', () => {
    const base = calculateSalaryTakeHome({
      annualSalary: 60_000_000,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 0,
    });
    const meal = calculateSalaryTakeHome({
      annualSalary: 60_000_000,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 200_000,
    });
    expect(meal.taxableSalary).toBe(60_000_000 - 2_400_000);
    expect(meal.monthlyTakeHome).toBeGreaterThan(base.monthlyTakeHome);
  });

  it('식대 한도 초과 입력은 20만으로 캡', () => {
    const r = calculateSalaryTakeHome({
      annualSalary: 50_000_000,
      dependents: 0,
      children: 0,
      monthlyNontaxableMeal: 500_000,
    });
    expect(r.annualNontaxableMeal).toBe(200_000 * 12);
  });

  it('자녀 수가 부양가족보다 크면 에러', () => {
    expect(() =>
      calculateSalaryTakeHome({
        annualSalary: 50_000_000,
        dependents: 1,
        children: 2,
        monthlyNontaxableMeal: 0,
      }),
    ).toThrow(SalaryTakeHomeInputError);
  });

  it('연봉 0 이하면 에러', () => {
    expect(() =>
      calculateSalaryTakeHome({
        annualSalary: 0,
        dependents: 0,
        children: 0,
        monthlyNontaxableMeal: 0,
      }),
    ).toThrow(SalaryTakeHomeInputError);
  });
});
