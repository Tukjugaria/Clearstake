/**
 * VCEquityNote — 모듈 A: SAFE 전환 계산 엔진
 *
 * 순수 함수만 포함한다(부수효과·UI·상태 없음). 따라서 단위테스트가 쉽고,
 * 어느 레이어(서버리스/클라이언트/CLI)에서든 재사용 가능하다.
 *
 * ── 모델 가정 (반드시 숙지) ───────────────────────────────────────────
 * 1) 전환은 "투자자에게 더 유리한(주식수가 많은)" 기준을 적용한다. 동률이면 cap 우선.
 *      - discount기준가 = 라운드 주당가격 × (1 − discountRate)
 *      - cap 기준 (pre/post에서 정의가 다름):
 *        · pre-money SAFE(기본): cap 기준가 = valuationCap / 전환 직전 완전희석 주식수.
 *        · post-money SAFE: 투자자 지분율 = 투자금 / post-money Cap 으로 서명 시점에 고정.
 *          이 지분(=pct)을 만족하도록 전환주식수를 역산한다(아래 §3). SAFE 희석은 기존 주주가 부담.
 * 2) 라운드 주당가격 = pre-money / 전환 직전 완전희석 주식수.
 *    valuationBasis가 'postMoney'면 pre-money = post − newMoneyInvestment 로 환산.
 * 3) post-money cap 역산(단일 SAFE 기준):
 *      pct = 투자금 / post-money Cap   (pct < 1 이어야 함)
 *      전환직후 총주식수 = preRoundFD / (1 − pct),  safeShares = 전환직후총 − preRoundFD
 *      ⇒ 신규 priced round 투자자 추가 전, SAFE는 정확히 pct 지분을 갖는다.
 *    discount만으로 전환하면 pre/post 차이가 없다(정의상 동일).
 * 4) ⚠️ 단일 SAFE만 정밀 지원. 복수 SAFE 상호 비희석·옵션풀 신설/확대 효과는
 *    본 계산기 범위 밖(모듈 B 캡테이블에서 처리).
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

interface Candidate {
  basis: AppliedBasis;
  shares: number;
  /** 전환 주당가격(역산 시 implied) */
  price: number;
}

function validate(terms: SafeTerms, round: RoundContext): void {
  if (!(terms.investmentAmount > 0)) {
    throw new SafeInputError('투자금액은 0보다 커야 합니다.');
  }
  if (terms.valuationCap != null && !(terms.valuationCap > 0)) {
    throw new SafeInputError('Valuation Cap은 0보다 커야 합니다.');
  }
  if (terms.discountRate != null && (terms.discountRate < 0 || terms.discountRate >= 1)) {
    throw new SafeInputError('할인율은 0% 이상 100% 미만이어야 합니다.');
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
  const preRoundFD = round.preRoundFullyDilutedShares;

  // ── 전환 기준 후보 산출 (투자자 유리 = 주식수 최대) ──
  const candidates: Candidate[] = [];

  let capPrice: number | null = null;
  if (terms.valuationCap != null) {
    if (safeType === 'post') {
      // post-money: 지분율(투자금/Cap) 고정 → 전환주식수 역산
      const pct = terms.investmentAmount / terms.valuationCap;
      if (pct >= 1) {
        throw new SafeInputError(
          '투자금액이 post-money Valuation Cap 이상입니다(지분율 ≥ 100%). 입력을 확인하세요.',
        );
      }
      const shares = Math.round((preRoundFD * pct) / (1 - pct));
      const price = shares > 0 ? terms.investmentAmount / shares : roundPricePerShare;
      capPrice = price;
      candidates.push({ basis: 'cap', shares, price });
    } else {
      // pre-money: cap / 전환 직전 완전희석 주식수
      const price = terms.valuationCap / preRoundFD;
      capPrice = price;
      candidates.push({ basis: 'cap', shares: Math.floor(terms.investmentAmount / price), price });
    }
  }

  let discountPrice: number | null = null;
  if (terms.discountRate != null) {
    const price = roundPricePerShare * (1 - terms.discountRate);
    discountPrice = price;
    candidates.push({
      basis: 'discount',
      shares: Math.floor(terms.investmentAmount / price),
      price,
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      basis: 'roundPrice',
      shares: Math.floor(terms.investmentAmount / roundPricePerShare),
      price: roundPricePerShare,
    });
    warnings.push('Cap·Discount가 모두 없어 라운드 주당가격으로 전환됩니다(MFN 등 별도 조항 미반영).');
  }

  // 주식수가 가장 많은(투자자 유리) 후보 선택. 동률이면 cap 우선.
  candidates.sort((a, b) => b.shares - a.shares || (a.basis === 'cap' ? -1 : 1));
  const chosen = candidates[0];
  const conversionPrice = chosen.price;
  const appliedBasis = chosen.basis;

  const conversionShares = chosen.shares;
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
