/**
 * ClearStake — 번 멀티플(자본효율) 계산 엔진 (순수 함수)
 *
 * Burn Multiple = 순현금소모(Net Burn) / 순신규 ARR(Net New ARR)
 * 낮을수록 자본효율이 좋다(같은 성장에 현금을 덜 태움). 동일 기간 기준으로 입력.
 *
 * 등급 기준은 통용되는 휴리스틱(Bessemer)을 사용.
 * 금액 ₩.
 */

export interface BurnMultipleInput {
  /** 기간 순현금소모 (₩, 양수=소모) */
  netBurn: number;
  /** 기간 순신규 ARR (₩) */
  netNewArr: number;
}

export type BurnRating = 'amazing' | 'great' | 'good' | 'suspect' | 'bad' | 'na';

export interface BurnMultipleResult {
  /** 번 멀티플 (netNewArr ≤ 0이면 null) */
  multiple: number | null;
  rating: BurnRating;
  ratingLabel: string;
  warnings: string[];
}

export class BurnMultipleInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BurnMultipleInputError';
  }
}

const RATING_LABEL: Record<BurnRating, string> = {
  amazing: '최상 (< 1x)',
  great: '우수 (1~1.5x)',
  good: '양호 (1.5~2x)',
  suspect: '주의 (2~3x)',
  bad: '위험 (> 3x)',
  na: '성장 없음 — 산정 불가',
};

function rate(multiple: number): BurnRating {
  if (multiple < 1) return 'amazing';
  if (multiple < 1.5) return 'great';
  if (multiple < 2) return 'good';
  if (multiple <= 3) return 'suspect';
  return 'bad';
}

export function calculateBurnMultiple(input: BurnMultipleInput): BurnMultipleResult {
  if (!Number.isFinite(input.netBurn) || !Number.isFinite(input.netNewArr)) {
    throw new BurnMultipleInputError('입력값이 올바르지 않습니다.');
  }
  const warnings: string[] = [];

  if (input.netBurn <= 0) {
    warnings.push('순현금소모가 0 이하입니다(흑자). 번 멀티플은 현금을 태우는 회사에 의미가 있습니다.');
    return { multiple: 0, rating: 'amazing', ratingLabel: RATING_LABEL.amazing, warnings };
  }
  if (input.netNewArr <= 0) {
    warnings.push('순신규 ARR이 0 이하라 번 멀티플을 산정할 수 없습니다(성장 없이 현금만 소모).');
    return { multiple: null, rating: 'na', ratingLabel: RATING_LABEL.na, warnings };
  }

  const multiple = input.netBurn / input.netNewArr;
  const r = rate(multiple);
  return { multiple, rating: r, ratingLabel: RATING_LABEL[r], warnings };
}
