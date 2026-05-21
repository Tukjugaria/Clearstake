import { describe, it, expect } from 'vitest';
import { calculateFundReturner, FundReturnerInputError } from './fundReturner';

describe('calculateFundReturner', () => {
  it('펀드 1배 회수에 필요한 엑싯 가치를 역산한다', () => {
    const r = calculateFundReturner({
      fundSize: 30_000_000_000, // 300억
      targetMultiple: 1,
      ownershipAtExit: 0.1, // 10%
    });
    expect(r.requiredProceeds).toBe(30_000_000_000); // 300억
    expect(r.requiredExitValuation).toBe(300_000_000_000); // 3,000억
    expect(r.dealMoic).toBeNull();
  });

  it('목표 배수가 커지면 필요 엑싯 가치도 비례', () => {
    const r = calculateFundReturner({
      fundSize: 30_000_000_000,
      targetMultiple: 3,
      ownershipAtExit: 0.1,
    });
    expect(r.requiredProceeds).toBe(90_000_000_000);
    expect(r.requiredExitValuation).toBe(900_000_000_000);
  });

  it('이 딜 투자금으로 딜 MOIC를 계산한다', () => {
    const r = calculateFundReturner({
      fundSize: 30_000_000_000,
      targetMultiple: 1,
      ownershipAtExit: 0.1,
      investmentInDeal: 1_000_000_000, // 10억 투자 → 300억 회수 = 30x
    });
    expect(r.dealMoic).toBe(30);
  });

  it('지분율이 0 이하/1 초과면 에러', () => {
    expect(() =>
      calculateFundReturner({ fundSize: 1, targetMultiple: 1, ownershipAtExit: 0 }),
    ).toThrow(FundReturnerInputError);
    expect(() =>
      calculateFundReturner({ fundSize: 1, targetMultiple: 1, ownershipAtExit: 1.2 }),
    ).toThrow(FundReturnerInputError);
  });
});
