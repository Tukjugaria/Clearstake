import { describe, it, expect } from 'vitest';
import { calculateRndTaxCredit, RndTaxCreditInputError } from './rndTaxCredit';

describe('calculateRndTaxCredit', () => {
  it('중소기업 R&D 1억 → 당기방식 공제 25%(2,500만)', () => {
    const r = calculateRndTaxCredit({
      currentRndExpense: 100_000_000,
      companyTypeKey: 'smb',
      taxableIncome: 500_000_000,
    });
    const current = r.options.find((o) => o.key === 'current')!;
    expect(current.credit).toBe(25_000_000);
  });

  it('전기 R&D 미입력 시 증가분 방식 비활성', () => {
    const r = calculateRndTaxCredit({
      currentRndExpense: 100_000_000,
      companyTypeKey: 'smb',
      taxableIncome: 500_000_000,
    });
    const inc = r.options.find((o) => o.key === 'increase')!;
    expect(inc.available).toBe(false);
    expect(r.selectedKey).toBe('current');
  });

  it('전기 R&D 입력 시 증가분 방식 산출 — 더 큰 쪽 선택', () => {
    // 당기 2억(중소 50% = 5천만), 전기 1억 → 증가 1억 × 50% = 5천만. 동률.
    // 당기 3억이면: 당기 7,500만, 증가 (3−1억)×50% = 1억. 증가가 큼.
    const r = calculateRndTaxCredit({
      currentRndExpense: 300_000_000,
      priorRndExpense: 100_000_000,
      companyTypeKey: 'smb',
      taxableIncome: 1_000_000_000,
    });
    const inc = r.options.find((o) => o.key === 'increase')!;
    expect(inc.credit).toBe(100_000_000);
    expect(r.selectedKey).toBe('increase');
  });

  it('대기업은 공제율이 낮다 (당기 2%)', () => {
    const r = calculateRndTaxCredit({
      currentRndExpense: 1_000_000_000,
      companyTypeKey: 'large',
      taxableIncome: 5_000_000_000,
    });
    const cur = r.options.find((o) => o.key === 'current')!;
    expect(cur.credit).toBe(20_000_000); // 1억의 2%
  });

  it('최저한세 적용 시 공제액 일부만 차감', () => {
    // 과세표준 2억 → 법인세 9% × 2억 = 1,800만 (1구간)
    // 최저한세(중소 7%) = 1,400만
    // 최대 공제: 1,800만 − 1,400만 = 400만
    // R&D 5천만(중소 25%) = 1,250만 공제 산정 → 실제 400만만 차감, 850만 이월 경고
    const r = calculateRndTaxCredit({
      currentRndExpense: 50_000_000,
      companyTypeKey: 'smb',
      taxableIncome: 200_000_000,
    });
    expect(r.selectedCredit).toBe(12_500_000);
    expect(r.effectiveSaving).toBe(4_000_000);
    expect(r.warnings.some((w) => w.includes('최저한세'))).toBe(true);
  });

  it('절세액 = 공제 전 총납부 − 공제 후 총납부 (지방세 포함)', () => {
    const r = calculateRndTaxCredit({
      currentRndExpense: 100_000_000,
      companyTypeKey: 'smb',
      taxableIncome: 1_000_000_000,
    });
    expect(r.effectiveTaxSaving).toBe(r.totalPayableBefore - r.totalPayable);
    expect(r.effectiveTaxSaving).toBeGreaterThan(0);
  });

  it('당기 R&D 음수면 에러', () => {
    expect(() =>
      calculateRndTaxCredit({
        currentRndExpense: -1,
        companyTypeKey: 'smb',
        taxableIncome: 100_000_000,
      }),
    ).toThrow(RndTaxCreditInputError);
  });
});
