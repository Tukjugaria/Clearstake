/**
 * ClearStake — 전환사채(CB) 분석 엔진 (KVCA 표준계약 기준)
 *
 * ── 개념 (인터넷·KVCA 표준계약서 확인) ─────────────────────────────────
 * - 표면이자율(coupon): 만기 전 주기적으로 현금 지급되는 이자.
 * - 만기보장수익률(YTM): 발행일~만기일까지 보장하는 "연복리" 수익률.
 *     만기 시 [원금×((1+YTM)^N − 1)]에서 이미 지급한 표면이자를 뺀 금액을
 *     상환할증금으로 일시 지급 → 미전환 시 투자자 총수령 = 원금×(1+YTM)^N.
 * - 전환(전환권 행사): "권면금액(원금)"이 전환가로 전환된다.
 *     ⇒ 전환 주식수는 원금 기준이며, SAFE와 동일하다(이자만큼 더 받지 않는다).
 *       만기 상환 시 받을 보장수익(상환할증금)은 전환을 택하면 포기.
 *
 * 따라서 CB와 SAFE의 차이는 "더 많은 전환 주식수"가 아니라,
 * 전환하지 않을 때의 다운사이드 보호(표면이자 + 만기보장 상환)에 있다.
 * ──────────────────────────────────────────────────────────────────────
 *
 * 전환 메커니즘(cap·discount)은 SAFE 엔진을 재사용한다. 금액 ₩, 비율 fraction.
 */

import { calculateSafeConversion, type RoundContext, type AppliedBasis } from '../safe';

export interface ConvertibleInput {
  /** 투자 원금(권면총액, ₩) */
  principal: number;
  /** 표면이자율 (연, fraction) */
  couponRate: number;
  /** 만기보장수익률 YTM (연복리, fraction) */
  guaranteedYtm: number;
  /** 만기 (년) */
  termYears: number;
  /** 이자 지급 주기(연 횟수): 1=연, 4=분기, 12=월 */
  couponFreqPerYear: number;
  /** Valuation Cap (₩) — 선택 */
  valuationCap?: number;
  /** 할인율 (fraction) — 선택 */
  discountRate?: number;
  /** 후속 라운드 맥락 (SAFE 엔진과 공유) */
  round: RoundContext;
}

export interface ConvertibleResult {
  // ── 전환 경로 ──
  conversionPrice: number;
  appliedBasis: AppliedBasis;
  /** 전환 주식수 (원금 ÷ 전환가) — SAFE와 동일 */
  conversionShares: number;
  conversionOwnershipPct: number;

  // ── 이자/상환 경로(미전환) ──
  /** 1회 표면이자 */
  couponPerPayment: number;
  /** 총 이자 지급 횟수 */
  couponPaymentsCount: number;
  /** 만기까지 표면이자 누적 (현금) */
  totalCouponOverTerm: number;
  /** 만기 보장 총가치 = 원금 × (1+YTM)^N */
  guaranteedTotalAtMaturity: number;
  /** 만기 상환금액 = 보장 총가치 − 표면이자 누적 (원금 이상으로 클램프) */
  redemptionAtMaturity: number;
  /** 상환할증금 = 상환금액 − 원금 */
  redemptionPremium: number;
  /** 미전환·만기보유 시 투자배수 = (1+YTM)^N */
  maturityMoic: number;

  warnings: string[];
}

export class ConvertibleInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConvertibleInputError';
  }
}

export function analyzeConvertible(input: ConvertibleInput): ConvertibleResult {
  if (!(input.principal > 0)) throw new ConvertibleInputError('투자 원금은 0보다 커야 합니다.');
  if (!(input.couponRate >= 0)) throw new ConvertibleInputError('표면이자율은 0 이상이어야 합니다.');
  if (!(input.guaranteedYtm >= 0)) throw new ConvertibleInputError('만기보장수익률은 0 이상이어야 합니다.');
  if (!(input.termYears >= 0)) throw new ConvertibleInputError('만기(년)는 0 이상이어야 합니다.');
  if (!(input.couponFreqPerYear > 0)) throw new ConvertibleInputError('이자 지급 주기가 올바르지 않습니다.');

  const warnings: string[] = [];

  // ── 전환: 원금이 전환가로 전환 (SAFE 엔진 재사용) ──
  const conv = calculateSafeConversion(
    {
      investmentAmount: input.principal,
      valuationCap: input.valuationCap,
      discountRate: input.discountRate,
    },
    input.round,
  );

  // ── 표면이자(현금) ──
  const couponPerPayment = (input.principal * input.couponRate) / input.couponFreqPerYear;
  const couponPaymentsCount = Math.round(input.termYears * input.couponFreqPerYear);
  const totalCouponOverTerm = Math.round(input.principal * input.couponRate * input.termYears);

  // ── 만기 보장(연복리) ──
  const guaranteedTotalAtMaturity = Math.round(
    input.principal * Math.pow(1 + input.guaranteedYtm, input.termYears),
  );
  let redemptionAtMaturity = guaranteedTotalAtMaturity - totalCouponOverTerm;
  if (redemptionAtMaturity < input.principal) {
    redemptionAtMaturity = input.principal;
    warnings.push(
      '표면이자율이 만기보장수익률에 가깝거나 높아 상환할증금이 0으로 처리되었습니다(상환금액 = 원금).',
    );
  }
  const redemptionPremium = redemptionAtMaturity - input.principal;
  const maturityMoic = Math.pow(1 + input.guaranteedYtm, input.termYears);

  if (input.guaranteedYtm < input.couponRate) {
    warnings.push('만기보장수익률이 표면이자율보다 낮습니다. 일반적으로 보장수익률 ≥ 표면이자율입니다.');
  }
  if (conv.appliedBasis === 'roundPrice') {
    warnings.push('Cap·Discount가 모두 없어 라운드 주당가격으로 전환됩니다.');
  }

  return {
    conversionPrice: conv.conversionPrice,
    appliedBasis: conv.appliedBasis,
    conversionShares: conv.conversionShares,
    conversionOwnershipPct: conv.ownership.safeOwnershipPct,
    couponPerPayment,
    couponPaymentsCount,
    totalCouponOverTerm,
    guaranteedTotalAtMaturity,
    redemptionAtMaturity,
    redemptionPremium,
    maturityMoic,
    warnings,
  };
}
