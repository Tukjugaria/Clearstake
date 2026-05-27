import { describe, it, expect } from 'vitest';
import { calculateVat, VatInputError } from './vat';

describe('calculateVat — 일반과세', () => {
  it('매출 1억 매입 5천만 → 매출세액 1천만 − 매입세액 5백만 = 5백만', () => {
    const r = calculateVat({
      annualSales: 100_000_000,
      annualPurchases: 50_000_000,
      salesIncludesVat: false,
      simplifiedSectorKey: 'retail',
    });
    const g = r.scenarios.find((s) => s.key === 'general')!;
    expect(g.outputTax).toBe(10_000_000);
    expect(g.inputCredit).toBe(5_000_000);
    expect(g.netPayable).toBe(5_000_000);
  });

  it('매출이 VAT 포함이면 공급가액으로 환산', () => {
    // 110,000,000 (VAT 포함) → 공급가액 100,000,000
    const r = calculateVat({
      annualSales: 110_000_000,
      annualPurchases: 0,
      salesIncludesVat: true,
      simplifiedSectorKey: 'retail',
    });
    expect(Math.round(r.netSales)).toBe(100_000_000);
  });

  it('매입세액이 매출세액보다 크면 일반과세는 환급(음수)', () => {
    const r = calculateVat({
      annualSales: 10_000_000,
      annualPurchases: 30_000_000,
      salesIncludesVat: false,
      simplifiedSectorKey: 'retail',
    });
    const g = r.scenarios.find((s) => s.key === 'general')!;
    expect(g.netPayable).toBeLessThan(0);
  });
});

describe('calculateVat — 간이과세', () => {
  it('매출 5천만 소매업(부가율 15%) → 5천만×15%×10% = 75만', () => {
    const r = calculateVat({
      annualSales: 50_000_000,
      annualPurchases: 0,
      salesIncludesVat: false,
      simplifiedSectorKey: 'retail',
    });
    const s = r.scenarios.find((s) => s.key === 'simplified')!;
    expect(s.outputTax).toBe(750_000);
    expect(s.eligible).toBe(true);
  });

  it('연 매출 8천만 이상이면 간이과세 적용 불가', () => {
    const r = calculateVat({
      annualSales: 100_000_000,
      annualPurchases: 0,
      salesIncludesVat: false,
      simplifiedSectorKey: 'retail',
    });
    const s = r.scenarios.find((s) => s.key === 'simplified')!;
    expect(s.eligible).toBe(false);
    expect(r.warnings.some((w) => w.includes('간이'))).toBe(true);
  });

  it('간이과세는 환급 불가 — 매입공제가 매출보다 커도 0', () => {
    const r = calculateVat({
      annualSales: 1_000_000,
      annualPurchases: 50_000_000,
      salesIncludesVat: false,
      simplifiedSectorKey: 'retail',
    });
    const s = r.scenarios.find((s) => s.key === 'simplified')!;
    expect(s.netPayable).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateVat — 추천', () => {
  it('매입 비중 큰 사업자(고부가율 업종)는 일반과세가 유리', () => {
    // 건설업(부가율 30%) + 매출 7천만/매입 6천만:
    //   일반: 7M − 6M = 1M
    //   간이: 7M×30%×10% − 6M×0.5% = 2.1M − 0.3M = 1.8M
    const r = calculateVat({
      annualSales: 70_000_000,
      annualPurchases: 60_000_000,
      salesIncludesVat: false,
      simplifiedSectorKey: 'construction',
    });
    expect(r.recommendedKey).toBe('general');
  });

  it('매출 0 미만이면 에러', () => {
    expect(() =>
      calculateVat({
        annualSales: -1,
        annualPurchases: 0,
        salesIncludesVat: false,
        simplifiedSectorKey: 'retail',
      }),
    ).toThrow(VatInputError);
  });
});
