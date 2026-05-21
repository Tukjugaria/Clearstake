/**
 * ClearStake — 전환사채(CB) vs SAFE 전환 비교 엔진
 *
 * 전환 메커니즘(cap·discount로 전환가 결정)은 SAFE와 동일하므로 SAFE 엔진을 재사용한다.
 * 차이는 단 하나: CB는 원금에 이자가 붙어 전환 원금이 커진다(→ 더 많은 주식으로 전환).
 *
 *   CB 전환원금 = 원금 × (단리: 1 + r×t | 복리: (1+r)^t)
 *   SAFE 전환원금 = 원금 (무이자)
 *
 * 금액 ₩, 비율 fraction.
 */

import { calculateSafeConversion, type RoundContext, type SafeTerms, type AppliedBasis } from '../safe';

export interface ConvertibleCompareInput {
  /** 투자 원금 (₩) */
  principal: number;
  /** Valuation Cap (₩) — 선택 */
  valuationCap?: number;
  /** 할인율 (fraction) — 선택 */
  discountRate?: number;
  /** CB 연이자율 (fraction) */
  interestRate: number;
  /** 기간 (년) */
  termYears: number;
  /** 복리 여부 (기본 단리) */
  compound?: boolean;
  /** 후속 라운드 맥락 (SAFE 엔진과 공유) */
  round: RoundContext;
}

export interface InstrumentOutcome {
  /** 전환에 사용된 금액 (원금[+이자]) */
  convertedAmount: number;
  /** 전환 주식수 */
  shares: number;
  /** 전환 후 지분율 (fraction) */
  ownershipPct: number;
}

export interface ConvertibleCompareResult {
  /** 전환 주당가격 (두 상품 동일) */
  conversionPrice: number;
  appliedBasis: AppliedBasis;
  /** CB 누적 이자 (₩) */
  cbAccruedInterest: number;
  safe: InstrumentOutcome;
  cb: InstrumentOutcome;
  /** CB가 SAFE 대비 더 받는 주식수 */
  extraSharesCb: number;
}

export class ConvertibleInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConvertibleInputError';
  }
}

export function compareConvertibleVsSafe(
  input: ConvertibleCompareInput,
): ConvertibleCompareResult {
  if (!(input.principal > 0)) {
    throw new ConvertibleInputError('투자 원금은 0보다 커야 합니다.');
  }
  if (!(input.interestRate >= 0)) {
    throw new ConvertibleInputError('이자율은 0 이상이어야 합니다.');
  }
  if (!(input.termYears >= 0)) {
    throw new ConvertibleInputError('기간은 0 이상이어야 합니다.');
  }

  const terms = (amount: number): SafeTerms => ({
    investmentAmount: amount,
    valuationCap: input.valuationCap,
    discountRate: input.discountRate,
  });

  // 원 단위로 반올림(KRW는 정수 원) — 부동소수 오차로 인한 주식수 off-by-one 방지
  const cbAmount = Math.round(
    input.compound
      ? input.principal * Math.pow(1 + input.interestRate, input.termYears)
      : input.principal * (1 + input.interestRate * input.termYears),
  );
  const cbAccruedInterest = cbAmount - input.principal;

  const safeRes = calculateSafeConversion(terms(input.principal), input.round);
  const cbRes = calculateSafeConversion(terms(cbAmount), input.round);

  return {
    conversionPrice: safeRes.conversionPrice,
    appliedBasis: safeRes.appliedBasis,
    cbAccruedInterest,
    safe: {
      convertedAmount: input.principal,
      shares: safeRes.conversionShares,
      ownershipPct: safeRes.ownership.safeOwnershipPct,
    },
    cb: {
      convertedAmount: cbAmount,
      shares: cbRes.conversionShares,
      ownershipPct: cbRes.ownership.safeOwnershipPct,
    },
    extraSharesCb: cbRes.conversionShares - safeRes.conversionShares,
  };
}
