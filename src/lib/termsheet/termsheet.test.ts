import { describe, it, expect } from 'vitest';
import { evaluateTermSheet, TermSheetInputError, type TermSheet, type TermSheetContext } from './termsheet';

const ctx: TermSheetContext = {
  currentShares: 1_000_000,
  founderShares: 800_000,
  exitValue: 30_000_000_000, // 300억
};

const sheetA: TermSheet = {
  name: 'A',
  preMoney: 10_000_000_000, // 100억
  newMoney: 2_500_000_000, // 25억
  prefMultiple: 1,
  participating: false,
};

describe('evaluateTermSheet — 라운드 효과', () => {
  it('신규 투자자 지분 ≈ newMoney / postMoney', () => {
    const r = evaluateTermSheet(ctx, sheetA);
    expect(r.postMoney).toBe(12_500_000_000);
    expect(r.investorPctAfter).toBeCloseTo(2.5e9 / 12.5e9, 3); // 20%
  });

  it('pre-money가 높을수록 창업자 희석이 적다', () => {
    const a = evaluateTermSheet(ctx, sheetA);
    const b = evaluateTermSheet(ctx, { ...sheetA, name: 'B', preMoney: 15_000_000_000 });
    expect(b.founderPctAfter).toBeGreaterThan(a.founderPctAfter);
  });
});

describe('evaluateTermSheet — 엑싯 분배', () => {
  it('참가적 우선주는 비참가보다 투자자 회수가 크다(전환 안 하는 구간)', () => {
    // 엑싯 50억: 비참가는 전환 안 함(우선권 25억 vs 전환 20%×50억=10억), 참가는 우선권+참가
    const lowExitCtx = { ...ctx, exitValue: 5_000_000_000 };
    const nonPart = evaluateTermSheet(lowExitCtx, sheetA);
    const part = evaluateTermSheet(lowExitCtx, { ...sheetA, participating: true });
    expect(part.investorExitProceeds).toBeGreaterThan(nonPart.investorExitProceeds);
    expect(part.founderExitProceeds).toBeLessThan(nonPart.founderExitProceeds);
  });

  it('투자자 MOIC와 회수금이 일관된다', () => {
    const r = evaluateTermSheet(ctx, sheetA);
    expect(r.investorMoic).toBeCloseTo(r.investorExitProceeds / sheetA.newMoney, 8);
  });
});

describe('evaluateTermSheet — 검증', () => {
  it('newMoney가 0이면 에러', () => {
    expect(() => evaluateTermSheet(ctx, { ...sheetA, newMoney: 0 })).toThrow(TermSheetInputError);
  });

  it('창업자 주식수가 총주식수를 넘으면 에러', () => {
    expect(() => evaluateTermSheet({ ...ctx, founderShares: 2_000_000 }, sheetA)).toThrow(
      TermSheetInputError,
    );
  });
});
