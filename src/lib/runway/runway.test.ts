import { describe, it, expect } from 'vitest';
import { calculateRunway, RunwayInputError, addMonths } from './runway';

describe('calculateRunway — 기본', () => {
  it('매출 0, 고정 번레이트면 런웨이 = 현금 / 번레이트', () => {
    const r = calculateRunway({
      cashOnHand: 1_000_000_000,
      monthlyRevenue: 0,
      monthlyExpense: 100_000_000,
    });
    expect(r.initialNetBurn).toBe(100_000_000);
    expect(r.runwayMonths).toBeCloseTo(10, 6);
    expect(r.isSustainable).toBe(false);
  });

  it('매출이 번레이트를 줄인다', () => {
    const r = calculateRunway({
      cashOnHand: 600_000_000,
      monthlyRevenue: 50_000_000,
      monthlyExpense: 100_000_000,
    });
    expect(r.initialNetBurn).toBe(50_000_000);
    expect(r.runwayMonths).toBeCloseTo(12, 6);
  });

  it('흑자면 소진되지 않는다(sustainable)', () => {
    const r = calculateRunway({
      cashOnHand: 100_000_000,
      monthlyRevenue: 100_000_000,
      monthlyExpense: 80_000_000,
    });
    expect(r.isSustainable).toBe(true);
    expect(r.runwayMonths).toBeNull();
    expect(r.breakevenMonth).toBe(0);
  });
});

describe('calculateRunway — 성장/손익분기', () => {
  it('매출 성장으로 손익분기에 도달한다', () => {
    const r = calculateRunway({
      cashOnHand: 1_000_000_000,
      monthlyRevenue: 50_000_000,
      monthlyExpense: 100_000_000,
      monthlyRevenueGrowth: 0.1, // 50*(1.1)^m >= 100 → m ≈ 7.27 → 8개월
    });
    expect(r.breakevenMonth).toBe(8);
  });
});

describe('calculateRunway — 검증/유틸', () => {
  it('현금이 음수면 에러', () => {
    expect(() =>
      calculateRunway({ cashOnHand: -1, monthlyRevenue: 0, monthlyExpense: 1 }),
    ).toThrow(RunwayInputError);
  });

  it('addMonths는 정수 개월을 더한다', () => {
    const base = new Date('2026-01-15T00:00:00Z');
    const d = addMonths(base, 10);
    expect(d.getMonth()).toBe(10); // 1월(0) + 10 = 11월(10)
  });
});
