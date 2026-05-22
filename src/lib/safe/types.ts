/**
 * VCEquityNote — 모듈 A (SAFE 전환 계산기) 도메인 타입
 *
 * 모든 금액 단위는 ₩(원), 비율은 fraction(0~1)을 기본으로 한다.
 * UI 레이어에서 % ↔ fraction 변환을 담당하고, 엔진은 fraction만 받는다.
 */

export type SafeType = 'pre' | 'post';
export type ValuationBasis = 'preMoney' | 'postMoney';
export type AppliedBasis = 'cap' | 'discount' | 'roundPrice';

/** SAFE 계약 조건 (투자자가 가진 권리) */
export interface SafeTerms {
  /** SAFE 투자금액 (₩) */
  investmentAmount: number;
  /** 평가상한 Valuation Cap (₩) — 선택 */
  valuationCap?: number;
  /** 할인율 — fraction 0~1 (예: 0.2 = 20%) — 선택 */
  discountRate?: number;
  /** SAFE 유형. 기본 'pre'(pre-money SAFE). 'post'는 간이 모델(아래 주의 참조) */
  safeType?: SafeType;
}

/** 전환을 유발하는 후속 라운드의 맥락 */
export interface RoundContext {
  /** 후속 라운드 기업가치 (₩) */
  valuation: number;
  /** 위 기업가치가 pre/post 중 무엇 기준인지 */
  valuationBasis: ValuationBasis;
  /** 라운드 신규 투자금 (₩) — post→pre 환산 및 신규투자자 지분 계산에 사용 */
  newMoneyInvestment: number;
  /** 전환 직전 완전희석 주식수 (기존 주주 전체, SAFE 전환·신규발행 이전) */
  preRoundFullyDilutedShares: number;
}

/** 라운드 후 지분 구성(맥락이 충분할 때 산출) */
export interface OwnershipBreakdown {
  /** 라운드 후 총 주식수(기존 + SAFE 전환 + 신규투자자) */
  postRoundTotalShares: number;
  /** SAFE 투자자 지분율 (fraction) */
  safeOwnershipPct: number;
  /** 신규 라운드 투자자 지분율 (fraction) */
  newInvestorOwnershipPct: number;
  /** 기존 주주(창업자+기존투자자+옵션풀) 합계 지분율 (fraction) */
  existingOwnershipPct: number;
}

/** 전환 계산 결과 */
export interface SafeConversionResult {
  /** SAFE 전환 주당가격 (₩) */
  conversionPrice: number;
  /** 전환 주식수 (정수, 내림) */
  conversionShares: number;
  /** 실제 적용된 기준: cap / discount / roundPrice */
  appliedBasis: AppliedBasis;
  /** cap 기준 가격 (cap 미입력 시 null) */
  capPrice: number | null;
  /** discount 기준 가격 (discount 미입력 시 null) */
  discountPrice: number | null;
  /** 라운드 주당가격 (₩) */
  roundPricePerShare: number;
  /** 라운드 대비 실효 할인율 (fraction) */
  effectiveDiscountVsRound: number;
  /** 지분 구성 */
  ownership: OwnershipBreakdown;
  /** 비차단 경고(간이 모델 안내 등) */
  warnings: string[];
}
