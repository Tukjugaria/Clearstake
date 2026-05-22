/**
 * ClearStake — 모듈 A 단위테스트 (Vitest)
 *
 * 실행: `npm test` (또는 `npx vitest`)
 * 기획서 수용 기준 커버:
 *  - cap만 / discount만 / 둘 다 입력 시 더 유리한(낮은) 가격 적용
 *  - 둘 다 없으면 라운드 주당가격으로 전환
 *  - post→pre 환산
 *  - 입력값 검증(에러)
 *  - 지분율 합계 일관성(=1)
 */

import { describe, it, expect } from 'vitest';
import { calculateSafeConversion, SafeInputError } from './safeCalculator';
import type { RoundContext } from './types';

// 기준 라운드: pre-money 100억, 전환 직전 완전희석 100만주 → 라운드 주당가 10,000원
const baseRound: RoundContext = {
  valuation: 1e10,
  valuationBasis: 'preMoney',
  newMoneyInvestment: 0,
  preRoundFullyDilutedShares: 1_000_000,
};

describe('calculateSafeConversion — 적용 기준 선택', () => {
  it('cap만 있으면 cap 기준가가 적용된다', () => {
    const r = calculateSafeConversion(
      { investmentAmount: 2e8, valuationCap: 8e9 }, // cap 80억 → 8,000원
      baseRound,
    );
    expect(r.appliedBasis).toBe('cap');
    expect(r.capPrice).toBe(8000);
    expect(r.conversionPrice).toBe(8000);
    expect(r.conversionShares).toBe(25000); // 2억 / 8,000
  });

  it('discount만 있으면 discount 기준가가 적용된다', () => {
    const r = calculateSafeConversion(
      { investmentAmount: 2e8, discountRate: 0.15 }, // 10,000 × 0.85 = 8,500원
      baseRound,
    );
    expect(r.appliedBasis).toBe('discount');
    expect(r.discountPrice).toBe(8500);
    expect(r.conversionPrice).toBe(8500);
    expect(r.conversionShares).toBe(23529); // floor(2억 / 8,500)
  });

  it('둘 다 있고 cap이 더 낮으면 cap이 적용된다', () => {
    const r = calculateSafeConversion(
      { investmentAmount: 2e8, valuationCap: 8e9, discountRate: 0.15 }, // cap 8,000 < disc 8,500
      baseRound,
    );
    expect(r.appliedBasis).toBe('cap');
    expect(r.conversionPrice).toBe(8000);
  });

  it('둘 다 있고 discount가 더 낮으면 discount가 적용된다', () => {
    const r = calculateSafeConversion(
      { investmentAmount: 2e8, valuationCap: 9e9, discountRate: 0.2 }, // cap 9,000 > disc 8,000
      baseRound,
    );
    expect(r.appliedBasis).toBe('discount');
    expect(r.conversionPrice).toBe(8000);
  });

  it('cap·discount가 모두 없으면 라운드 주당가격으로 전환된다', () => {
    const r = calculateSafeConversion({ investmentAmount: 2e8 }, baseRound);
    expect(r.appliedBasis).toBe('roundPrice');
    expect(r.conversionPrice).toBe(10000);
    expect(r.conversionShares).toBe(20000);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe('calculateSafeConversion — 환산/지분', () => {
  it('post-money 기업가치를 pre-money로 환산한다', () => {
    const postRound: RoundContext = {
      valuation: 1.1e10, // post 110억
      valuationBasis: 'postMoney',
      newMoneyInvestment: 1e9, // 신규 10억 → pre 100억
      preRoundFullyDilutedShares: 1_000_000,
    };
    const r = calculateSafeConversion({ investmentAmount: 2e8, valuationCap: 8e9 }, postRound);
    expect(r.roundPricePerShare).toBe(10000);
  });

  it('지분율 합계는 1이다', () => {
    const r = calculateSafeConversion(
      { investmentAmount: 2e8, valuationCap: 8e9 },
      { ...baseRound, newMoneyInvestment: 3e9 },
    );
    const sum =
      r.ownership.safeOwnershipPct +
      r.ownership.newInvestorOwnershipPct +
      r.ownership.existingOwnershipPct;
    expect(sum).toBeCloseTo(1, 10);
  });

  it('실효 할인율을 보고한다', () => {
    const r = calculateSafeConversion({ investmentAmount: 2e8, valuationCap: 8e9 }, baseRound);
    expect(r.effectiveDiscountVsRound).toBeCloseTo(0.2, 10); // (10,000-8,000)/10,000
  });
});

describe('calculateSafeConversion — post-money SAFE (정밀)', () => {
  it('cap 기준에서 pre-money와 post-money 결과가 다르다(주식수 더 많음)', () => {
    const pre = calculateSafeConversion({ investmentAmount: 2e8, valuationCap: 8e9, safeType: 'pre' }, baseRound);
    const post = calculateSafeConversion({ investmentAmount: 2e8, valuationCap: 8e9, safeType: 'post' }, baseRound);
    expect(post.appliedBasis).toBe('cap');
    expect(post.conversionShares).not.toBe(pre.conversionShares);
    expect(post.conversionShares).toBeGreaterThan(pre.conversionShares);
    // pct = 2억/80억 = 2.5% → safeShares = 100만 × 0.025/0.975
    expect(post.conversionShares).toBe(Math.round((1_000_000 * 0.025) / 0.975)); // 25,641
  });

  it('post-money 지분율 ≈ 투자금/Cap (신규 투자자 추가 전)', () => {
    const post = calculateSafeConversion({ investmentAmount: 2e8, valuationCap: 8e9, safeType: 'post' }, baseRound);
    // baseRound는 newMoney 0 → 전환 직후 지분이 곧 헤드라인 지분
    expect(post.ownership.safeOwnershipPct).toBeCloseTo(2e8 / 8e9, 6); // 2.5%
    const pre = calculateSafeConversion({ investmentAmount: 2e8, valuationCap: 8e9, safeType: 'pre' }, baseRound);
    expect(pre.ownership.safeOwnershipPct).toBeCloseTo(0.02439, 4); // ≠ 2.5%
  });

  it('discount만 입력 시 pre/post 결과가 동일하다(정의상)', () => {
    const pre = calculateSafeConversion({ investmentAmount: 2e8, discountRate: 0.2, safeType: 'pre' }, baseRound);
    const post = calculateSafeConversion({ investmentAmount: 2e8, discountRate: 0.2, safeType: 'post' }, baseRound);
    expect(post.conversionShares).toBe(pre.conversionShares);
    expect(post.conversionPrice).toBe(pre.conversionPrice);
  });

  it('post-money에서 더 이상 "간이/미구현" 경고를 내지 않는다', () => {
    const post = calculateSafeConversion({ investmentAmount: 2e8, valuationCap: 8e9, safeType: 'post' }, baseRound);
    expect(post.warnings.some((w) => w.includes('간이') || w.includes('미구현'))).toBe(false);
  });

  it('투자금액이 post-money Cap 이상이면 에러', () => {
    expect(() =>
      calculateSafeConversion({ investmentAmount: 9e9, valuationCap: 8e9, safeType: 'post' }, baseRound),
    ).toThrow(SafeInputError);
  });
});

describe('calculateSafeConversion — 입력 검증', () => {
  it('투자금액이 0 이하면 에러', () => {
    expect(() => calculateSafeConversion({ investmentAmount: 0 }, baseRound)).toThrow(
      SafeInputError,
    );
  });

  it('discountRate가 1 이상이면 에러', () => {
    expect(() =>
      calculateSafeConversion({ investmentAmount: 2e8, discountRate: 1 }, baseRound),
    ).toThrow(SafeInputError);
  });

  it('post-money가 신규투자금보다 작으면 에러', () => {
    expect(() =>
      calculateSafeConversion(
        { investmentAmount: 2e8 },
        { valuation: 5e8, valuationBasis: 'postMoney', newMoneyInvestment: 1e9, preRoundFullyDilutedShares: 1e6 },
      ),
    ).toThrow(SafeInputError);
  });
});
