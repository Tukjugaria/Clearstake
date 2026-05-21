import { describe, it, expect } from 'vitest';
import { calculateFundMetrics, xirr, FundMetricsInputError } from './fundMetrics';

describe('calculateFundMetrics — TVPI/DPI/RVPI', () => {
  it('TVPI = DPI + RVPI', () => {
    const r = calculateFundMetrics({
      paidIn: 1_000_000_000,
      distributions: 600_000_000,
      nav: 900_000_000,
    });
    expect(r.dpi).toBeCloseTo(0.6, 6);
    expect(r.rvpi).toBeCloseTo(0.9, 6);
    expect(r.tvpi).toBeCloseTo(1.5, 6);
    expect(r.tvpi).toBeCloseTo(r.dpi + r.rvpi, 10);
  });

  it('납입원금이 0 이하면 에러', () => {
    expect(() => calculateFundMetrics({ paidIn: 0, distributions: 0, nav: 0 })).toThrow(
      FundMetricsInputError,
    );
  });
});

describe('xirr', () => {
  it('단일 납입 → 5년 후 1.5배 회수면 ≈ 8.4%', () => {
    const r = xirr([
      { date: '2020-01-01', amount: -1_000_000_000 },
      { date: '2025-01-01', amount: 1_500_000_000 },
    ]);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(0.084, 2);
  });

  it('원금 회수(1배)면 ≈ 0%', () => {
    const r = xirr([
      { date: '2020-01-01', amount: -1_000_000_000 },
      { date: '2025-01-01', amount: 1_000_000_000 },
    ]);
    expect(r!).toBeCloseTo(0, 3);
  });

  it('부호 변화 없으면 null', () => {
    expect(xirr([{ date: '2020-01-01', amount: -100 }, { date: '2021-01-01', amount: -50 }])).toBeNull();
  });

  it('다중 현금흐름도 푼다(양수 IRR)', () => {
    const r = xirr([
      { date: '2020-01-01', amount: -1_000_000_000 },
      { date: '2022-01-01', amount: 300_000_000 },
      { date: '2025-01-01', amount: 1_200_000_000 },
    ]);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(0);
  });
});

describe('calculateFundMetrics — XIRR 통합 (NAV 포함)', () => {
  it('현금흐름 + 평가일 NAV로 XIRR을 산정한다', () => {
    const r = calculateFundMetrics({
      paidIn: 1_000_000_000,
      distributions: 0,
      nav: 1_500_000_000,
      cashflows: [{ date: '2020-01-01', amount: -1_000_000_000 }],
      valuationDate: '2025-01-01',
    });
    expect(r.xirr).not.toBeNull();
    expect(r.xirr!).toBeCloseTo(0.084, 2);
  });
});
