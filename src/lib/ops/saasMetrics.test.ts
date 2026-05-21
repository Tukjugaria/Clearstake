import { describe, it, expect } from 'vitest';
import { calculateSaasMetrics, SaasMetricsInputError } from './saasMetrics';

describe('calculateSaasMetrics — 단위경제', () => {
  const base = {
    monthlyArpa: 100_000,
    grossMargin: 0.8,
    monthlyChurn: 0.02, // 수명 50개월
    salesMarketingSpend: 30_000_000,
    newCustomers: 100, // CAC 300,000
  };

  it('수명·LTV·CAC·LTV:CAC·회수기간', () => {
    const r = calculateSaasMetrics(base);
    expect(r.avgLifetimeMonths).toBeCloseTo(50, 6);
    expect(r.ltv).toBeCloseTo(100_000 * 0.8 * 50, 6); // 4,000,000
    expect(r.cac).toBe(300_000);
    expect(r.ltvToCac).toBeCloseTo(4_000_000 / 300_000, 6); // ~13.3
    expect(r.cacPaybackMonths).toBeCloseTo(300_000 / (100_000 * 0.8), 6); // 3.75
  });

  it('이탈률 0이면 LTV null + 경고', () => {
    const r = calculateSaasMetrics({ ...base, monthlyChurn: 0 });
    expect(r.ltv).toBeNull();
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe('calculateSaasMetrics — NRR/GRR', () => {
  it('NRR·GRR을 계산한다', () => {
    const r = calculateSaasMetrics({
      monthlyArpa: 100_000,
      grossMargin: 0.8,
      monthlyChurn: 0.02,
      salesMarketingSpend: 0,
      newCustomers: 0,
      startMrr: 100_000_000,
      expansionMrr: 15_000_000,
      contractionMrr: 3_000_000,
      churnedMrr: 5_000_000,
    });
    expect(r.nrr).toBeCloseTo(1.07, 6); // (100+15-3-5)/100
    expect(r.grr).toBeCloseTo(0.92, 6); // (100-3-5)/100
  });

  it('매출총이익률 범위를 벗어나면 에러', () => {
    expect(() =>
      calculateSaasMetrics({
        monthlyArpa: 1,
        grossMargin: 1.5,
        monthlyChurn: 0.02,
        salesMarketingSpend: 0,
        newCustomers: 0,
      }),
    ).toThrow(SaasMetricsInputError);
  });
});
