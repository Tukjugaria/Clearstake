import { describe, it, expect } from 'vitest';
import { calculateTargetOwnership, TargetOwnershipInputError } from './targetOwnership';

describe('calculateTargetOwnership', () => {
  it('목표 유지를 위한 최소 pre/post를 역산한다', () => {
    const r = calculateTargetOwnership({
      currentOwnership: 0.7,
      targetOwnership: 0.5,
      newMoney: 2_000_000_000,
    });
    expect(r.feasible).toBe(true);
    expect(r.maxNewInvestorPct).toBeCloseTo(1 - 0.5 / 0.7, 10); // ≈ 0.2857
    expect(r.impliedPostMoney).toBeCloseTo(7_000_000_000, 2); // 70억
    expect(r.requiredMinPreMoney).toBeCloseTo(5_000_000_000, 2); // 50억
  });

  it('역산된 pre-money에서 실제로 목표 지분이 유지된다', () => {
    const r = calculateTargetOwnership({
      currentOwnership: 0.7,
      targetOwnership: 0.5,
      newMoney: 2_000_000_000,
    });
    const f1 = 0.7 * (r.requiredMinPreMoney / r.impliedPostMoney);
    expect(f1).toBeCloseTo(0.5, 8);
  });

  it('목표가 현재 이상이면 불가', () => {
    const r = calculateTargetOwnership({
      currentOwnership: 0.5,
      targetOwnership: 0.5,
      newMoney: 1_000_000_000,
    });
    expect(r.feasible).toBe(false);
    expect(r.reason).toBeTruthy();
  });

  it('신규 투자금이 0 이하면 에러', () => {
    expect(() =>
      calculateTargetOwnership({ currentOwnership: 0.7, targetOwnership: 0.5, newMoney: 0 }),
    ).toThrow(TargetOwnershipInputError);
  });
});
