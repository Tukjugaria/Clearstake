import type { SafeType, ValuationBasis } from '../lib/safe';

/** SAFE 계산기 폼 상태 (문자열 보관 후 number 변환 — 빈칸/부분입력 허용) */
export interface SafeFormState {
  investmentAmount: string;
  valuationCap: string; // 빈 문자열이면 미적용
  discountPct: string; // % 단위. 빈 문자열이면 미적용
  safeType: SafeType;
  roundValuation: string;
  valuationBasis: ValuationBasis;
  newMoneyInvestment: string;
  preRoundFullyDilutedShares: string;
}

export const initialSafeForm: SafeFormState = {
  investmentAmount: '',
  valuationCap: '',
  discountPct: '',
  safeType: 'pre',
  roundValuation: '',
  valuationBasis: 'preMoney',
  newMoneyInvestment: '',
  preRoundFullyDilutedShares: '',
};
