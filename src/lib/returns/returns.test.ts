import { describe, it, expect } from 'vitest';
import { calculateReturns, ReturnsInputError } from './returns';

describe('calculateReturns — 기본', () => {
  it('MOIC = 회수금 / 투자금, IRR = MOIC^(1/년)−1', () => {
    const r = calculateReturns({
      investmentAmount: 100_000_000,
      entryOwnership: 0.1,
      exitValuation: 5_000_000_000, // 50억 × 10% = 5억 회수
      holdingYears: 5,
    });
    expect(r.exitProceeds).toBe(500_000_000);
    expect(r.moic).toBe(5);
    expect(r.irr).toBeCloseTo(Math.pow(5, 1 / 5) - 1, 8); // ≈ 0.3797
    expect(r.profit).toBe(400_000_000);
  });

  it('누적 희석이 엑싯 지분을 줄인다', () => {
    const r = calculateReturns({
      investmentAmount: 100_000_000,
      entryOwnership: 0.1,
      exitValuation: 5_000_000_000,
      holdingYears: 5,
      dilutionToExit: 0.4, // 지분 10% → 6%
    });
    expect(r.exitOwnership).toBeCloseTo(0.06, 10);
    expect(r.exitProceeds).toBe(300_000_000);
    expect(r.moic).toBe(3);
  });
});

describe('calculateReturns — pro-rata', () => {
  it('지분 유지 투자금 = 지분율 × 다음 라운드 신규투자금', () => {
    const r = calculateReturns({
      investmentAmount: 100_000_000,
      entryOwnership: 0.1,
      exitValuation: 5_000_000_000,
      holdingYears: 5,
      nextRoundNewMoney: 1_000_000_000,
    });
    expect(r.proRataInvestment).toBe(100_000_000);
  });

  it('다음 라운드 미입력 시 proRata는 null', () => {
    const r = calculateReturns({
      investmentAmount: 100_000_000,
      entryOwnership: 0.1,
      exitValuation: 5_000_000_000,
      holdingYears: 5,
    });
    expect(r.proRataInvestment).toBeNull();
  });
});

describe('calculateReturns — 검증', () => {
  it('지분율이 1을 넘으면 에러', () => {
    expect(() =>
      calculateReturns({
        investmentAmount: 1,
        entryOwnership: 1.5,
        exitValuation: 1,
        holdingYears: 1,
      }),
    ).toThrow(ReturnsInputError);
  });

  it('보유기간이 0이면 에러', () => {
    expect(() =>
      calculateReturns({
        investmentAmount: 1,
        entryOwnership: 0.1,
        exitValuation: 1,
        holdingYears: 0,
      }),
    ).toThrow(ReturnsInputError);
  });
});
