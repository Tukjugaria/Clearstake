import { describe, it, expect } from 'vitest';
import { calculatePayrollCost, PayrollInputError } from './payroll';

describe('calculatePayrollCost', () => {
  it('월 급여 = 연봉 / 12', () => {
    const r = calculatePayrollCost({ annualSalary: 60_000_000 });
    expect(r.monthlySalary).toBe(5_000_000);
  });

  it('퇴직금 적립은 월급의 1/12', () => {
    const r = calculatePayrollCost({ annualSalary: 60_000_000 });
    const sev = r.components.find((c) => c.key === 'severance')!;
    expect(sev.monthly).toBe(Math.round(5_000_000 / 12)); // 416,667
  });

  it('총 월비용 = 급여 + 사용자부담 합계', () => {
    const r = calculatePayrollCost({ annualSalary: 60_000_000 });
    expect(r.totalMonthly).toBe(r.monthlySalary + r.employerBurdenMonthly);
    expect(r.totalAnnual).toBe(r.totalMonthly * 12);
    // 부담률은 대략 18~22% 수준(퇴직금 8.3% 포함)
    expect(r.burdenRate).toBeGreaterThan(0.15);
    expect(r.burdenRate).toBeLessThan(0.25);
  });

  it('산재 요율 override가 반영된다', () => {
    const base = calculatePayrollCost({ annualSalary: 60_000_000 });
    const high = calculatePayrollCost({ annualSalary: 60_000_000, industrialAccidentRate: 0.03 });
    expect(high.totalMonthly).toBeGreaterThan(base.totalMonthly);
  });

  it('연봉이 0 이하면 에러', () => {
    expect(() => calculatePayrollCost({ annualSalary: 0 })).toThrow(PayrollInputError);
  });
});
