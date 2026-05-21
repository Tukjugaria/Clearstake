/**
 * ClearStake — 모듈 A: SAFE 전환 계산 엔진
 *
 * 순수 함수만 포함한다(부수효과·UI·상태 없음). 따라서 단위테스트가 쉽고,
 * 어느 레이어(서버리스/클라이언트/CLI)에서든 재사용 가능하다.
 *
 * ── 모델 가정 (반드시 숙지) ───────────────────────────────────────────
 * 1) pre-money SAFE(기본): 전환가는 아래 둘 중 "투자자에게 더 유리한(낮은)" 값.
 *      - cap 기준가  = valuationCap / 전환 직전 완전희석 주식수
 *      - discount기준가 = 라운드 주당가격 × (1 − discountRate)
 *    cap·discount 둘 다 없으면 라운드 주당가격으로 전환(roundPrice).
 * 2) 라운드 주당가격 = pre-money / 전환 직전 완전희석 주식수.
 *    valuationBasis가 'postMoney'면 pre-money = post − newMoneyInvestment 로 환산.
 * 3) post-money SAFE는 ⚠️ 간이 모델이다. 정밀 전환(SAFE 상호 순환 계산,
 *    옵션풀 신설 포함)은 미구현(TODO). 현재는 pre-money 로직으로 근사하고
 *    warnings로 고지한다. → 정밀화는 모듈 B(캡테이블) 통합 시 처리 예정.
 * 4) 옵션풀 신설/확대로 인한 추가 희석은 모듈 A 범위 밖(모듈 B에서 처리).
 * ──────────────────────────────────────────────────────────────────────
 */

import type {
  SafeTerms,
  RoundContext,
  SafeConversionResult,
  AppliedBasis,
} from './types';

/** 입력값 검증 실패 시 던지는 에러 (UI에서 사용자 메시지로 노출) */
export class SafeInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeInputError';
  }
}

/** post/pre 기준 기업가치를 pre-money로 환산 */
function derivePreMoney(round: RoundContext): number {
  return round.valuationBasis === 'preMoney'
    ? round.valuation
    : round.valuation - round.newMoneyInvestment;
}

/** 적용 가능한 가격 후보 중 가장 낮은(투자자 유리) 값을 고른다. 동률이면 cap을 우선 표기. */
function pickConversionPrice(
  roundPrice: number,
  capPrice: number | null,
  discountPrice: number | null,
): { conversionPrice: number; appliedBasis: AppliedBasis } {
  const candidates: Array<{ price: number; basis: AppliedBasis }> = [];
  if (capPrice != null) candidates.push({ price: capPrice, basis: 'cap' });
  if (discountPrice != null) candidates.push({ price: discountPrice, basis: 'discount' });

  if (candidates.length === 0) {
    return { conversionPrice: roundPrice, appliedBasis: 'roundPrice' };
  }
  candidates.sort((a, b) => a.price - b.price || (a.basis === 'cap' ? -1 : 1));
  return { conversionPrice: candidates[0].price, appliedBasis: candidates[0].basis };
}

function validate(terms: SafeTerms, round: RoundContext): void {
  if (!(terms.investmentAmount > 0)) {
    throw new SafeInputError('투자금액은 0보다 커야 합니다.');
  }
  if (terms.valuationCap != null && !(terms.valuationCap > 0)) {
    throw new SafeInputError('Valuation Cap은 0보다 커야 합니다.');
  }
  if (terms.discountRate != null && (terms.discountRate < 0 || terms.discountRate >= 1)) {
    throw new SafeInputError('Discount Rate은 0 이상 1 미만(fraction)이어야 합니다.');
  }
  if (!(round.preRoundFullyDilutedShares > 0)) {
    throw new SafeInputError('전환 직전 완전희석 주식수는 0보다 커야 합니다.');
  }
  if (!(round.valuation > 0)) {
    throw new SafeInputError('후속 라운드 기업가치는 0보다 커야 합니다.');
  }
  if (!(round.newMoneyInvestment >= 0)) {
    throw new SafeInputError('라운드 신규 투자금은 0 이상이어야 합니다.');
  }
}

/**
 * SAFE 전환을 계산한다.
 * @throws {SafeInputError} 입력값이 유효하지 않은 경우
 */
export function calculateSafeConversion(
  terms: SafeTerms,
  round: RoundContext,
): SafeConversionResult {
  validate(terms, round);

  const warnings: string[] = [];
  const safeType = terms.safeType ?? 'pre';

  const preMoney = derivePreMoney(round);
  if (preMoney <= 0) {
    throw new SafeInputError(
      'pre-money 기업가치가 0 이하로 환산됩니다(post-money < 신규 투자금). 입력을 확인하세요.',
    );
  }

  const roundPricePerShare = preMoney / round.preRoundFullyDilutedShares;

  const capPrice =
    terms.valuationCap != null ? terms.valuationCap / round.preRoundFullyDilutedShares : null;

  const discountPrice =
    terms.discountRate != null ? roundPricePerShare * (1 - terms.discountRate) : null;

  if (safeType === 'post') {
    warnings.push(
      'post-money SAFE는 간이 모델로 계산되었습니다. 정밀 전환(SAFE 순환 계산·옵션풀 포함)은 미구현(TODO)입니다.',
    );
  }
  if (capPrice == null && discountPrice == null) {
    warnings.push('Cap·Discount가 모두 없어 라운드 주당가격으로 전환됩니다(MFN 등 별도 조항 미반영).');
  }

  const { conversionPrice, appliedBasis } = pickConversionPrice(
    roundPricePerShare,
    capPrice,
    discountPrice,
  );

  const conversionShares = Math.floor(terms.investmentAmount / conversionPrice);
  const effectiveDiscountVsRound = 1 - conversionPrice / roundPricePerShare;

  const newInvestorShares = Math.floor(round.newMoneyInvestment / roundPricePerShare);
  const postRoundTotalShares =
    round.preRoundFullyDilutedShares + conversionShares + newInvestorShares;

  const ownership = {
    postRoundTotalShares,
    safeOwnershipPct: conversionShares / postRoundTotalShares,
    newInvestorOwnershipPct: newInvestorShares / postRoundTotalShares,
    existingOwnershipPct: round.preRoundFullyDilutedShares / postRoundTotalShares,
  };

  return {
    conversionPrice,
    conversionShares,
    appliedBasis,
    capPrice,
    discountPrice,
    roundPricePerShare,
    effectiveDiscountVsRound,
    ownership,
    warnings,
  };
}
