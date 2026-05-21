import { describe, it, expect } from 'vitest';
import { analyzeConvertible, ConvertibleInputError } from './convertible';
import { calculateSafeConversion, type RoundContext } from '../safe';

const round: RoundContext = {
  valuation: 1e10, // pre 100억
  valuationBasis: 'preMoney',
  newMoneyInvestment: 0,
  preRoundFullyDilutedShares: 1_000_000, // 주당 10,000
};

describe('analyzeConvertible — 전환은 원금 기준 (SAFE와 동일)', () => {
  it('전환 주식수는 원금 ÷ 전환가이며 SAFE와 같다', () => {
    const r = analyzeConvertible({
      principal: 200_000_000,
      couponRate: 0.02,
      guaranteedYtm: 0.08,
      termYears: 3,
      couponFreqPerYear: 4,
      valuationCap: 8e9, // cap price 8,000
      round,
    });
    expect(r.conversionPrice).toBe(8000);
    expect(r.conversionShares).toBe(25_000); // 2억 / 8,000 — 이자 무관

    const safe = calculateSafeConversion(
      { investmentAmount: 200_000_000, valuationCap: 8e9 },
      round,
    );
    expect(r.conversionShares).toBe(safe.conversionShares); // 동일
  });
});

describe('analyzeConvertible — 표면이자 / 만기보장수익률', () => {
  const base = {
    principal: 200_000_000,
    couponRate: 0.02, // 표면 2%
    guaranteedYtm: 0.08, // 보장 8% 복리
    termYears: 3,
    couponFreqPerYear: 4, // 분기
    valuationCap: 8e9,
    round,
  };

  it('표면이자: 1회·총액', () => {
    const r = analyzeConvertible(base);
    expect(r.couponPerPayment).toBe(1_000_000); // 2억×2%/4
    expect(r.couponPaymentsCount).toBe(12); // 3년×4
    expect(r.totalCouponOverTerm).toBe(12_000_000); // 2억×2%×3
  });

  it('만기 보장 총가치 = 원금×(1+YTM)^N, 상환금액 = 보장−표면이자', () => {
    const r = analyzeConvertible(base);
    expect(r.guaranteedTotalAtMaturity).toBe(251_942_400); // 2억×1.08^3
    expect(r.redemptionAtMaturity).toBe(251_942_400 - 12_000_000); // 239,942,400
    expect(r.redemptionPremium).toBe(239_942_400 - 200_000_000); // 39,942,400
    expect(r.maturityMoic).toBeCloseTo(Math.pow(1.08, 3), 8);
  });

  it('표면이자가 보장수익률보다 높으면 상환할증금 0 + 경고', () => {
    const r = analyzeConvertible({ ...base, couponRate: 0.1, guaranteedYtm: 0.05 });
    expect(r.redemptionPremium).toBe(0);
    expect(r.redemptionAtMaturity).toBe(200_000_000);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe('analyzeConvertible — 검증', () => {
  it('원금이 0 이하면 에러', () => {
    expect(() =>
      analyzeConvertible({
        principal: 0,
        couponRate: 0.02,
        guaranteedYtm: 0.08,
        termYears: 3,
        couponFreqPerYear: 4,
        round,
      }),
    ).toThrow(ConvertibleInputError);
  });
});
