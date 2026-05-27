import { describe, it, expect } from 'vitest';
import { calculateSalaryVsDividend, SalaryVsDividendInputError } from './salaryVsDividend';

describe('calculateSalaryVsDividend', () => {
  it('회사 이익 5천만 + 지분 100% — 두 시나리오 모두 본인 세후 실수령 양수', () => {
    const r = calculateSalaryVsDividend({
      companyProfit: 50_000_000,
      ownerOtherIncome: 0,
      ownershipPct: 1,
    });
    expect(r.salary.ownerNet).toBeGreaterThan(0);
    expect(r.dividend.ownerNet).toBeGreaterThan(0);
  });

  it('전액 급여는 법인세 0', () => {
    const r = calculateSalaryVsDividend({
      companyProfit: 100_000_000,
      ownerOtherIncome: 0,
      ownershipPct: 1,
    });
    expect(r.salary.corporateTax).toBe(0);
  });

  it('전액 배당은 법인세 부과 후 잔여만 배당', () => {
    const r = calculateSalaryVsDividend({
      companyProfit: 100_000_000,
      ownerOtherIncome: 0,
      ownershipPct: 1,
    });
    expect(r.dividend.corporateTax).toBeGreaterThan(0);
    expect(r.dividend.afterCorporateTax).toBe(100_000_000 - r.dividend.corporateTax);
    expect(r.dividend.gross).toBe(r.dividend.afterCorporateTax);
  });

  it('지분율 50%면 배당의 절반만 본인 몫', () => {
    const r = calculateSalaryVsDividend({
      companyProfit: 200_000_000,
      ownerOtherIncome: 0,
      ownershipPct: 0.5,
    });
    expect(r.dividend.gross).toBe(Math.round(r.dividend.afterCorporateTax * 0.5));
  });

  it('배당 2천만 이하 → 분리과세 14%', () => {
    // 회사 이익 작게 → 배당 2천만 미만
    const r = calculateSalaryVsDividend({
      companyProfit: 20_000_000,
      ownerOtherIncome: 0,
      ownershipPct: 1,
    });
    expect(r.dividend.dividendTaxMode).toBe('separate');
  });

  it('배당 2천만 초과 → 종합과세', () => {
    const r = calculateSalaryVsDividend({
      companyProfit: 100_000_000,
      ownerOtherIncome: 0,
      ownershipPct: 1,
    });
    expect(r.dividend.dividendTaxMode).toBe('comprehensive');
  });

  it('추천 = 본인 세후가 큰 쪽, difference는 양수', () => {
    const r = calculateSalaryVsDividend({
      companyProfit: 100_000_000,
      ownerOtherIncome: 0,
      ownershipPct: 1,
    });
    const recommendedNet =
      r.recommended === 'salary' ? r.salary.ownerNet : r.dividend.ownerNet;
    const other = r.recommended === 'salary' ? r.dividend.ownerNet : r.salary.ownerNet;
    expect(recommendedNet).toBeGreaterThanOrEqual(other);
    expect(r.difference).toBe(recommendedNet - other);
  });

  it('회사 이익 0 이하면 에러', () => {
    expect(() =>
      calculateSalaryVsDividend({
        companyProfit: 0,
        ownerOtherIncome: 0,
        ownershipPct: 1,
      }),
    ).toThrow(SalaryVsDividendInputError);
  });

  it('지분율 1 초과는 에러', () => {
    expect(() =>
      calculateSalaryVsDividend({
        companyProfit: 1_000,
        ownerOtherIncome: 0,
        ownershipPct: 1.5,
      }),
    ).toThrow(SalaryVsDividendInputError);
  });
});
