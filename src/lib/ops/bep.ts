/**
 * ClearStake — 손익분기점(BEP) 계산 엔진 (순수 함수)
 *
 *   공헌이익(단위) = 판매가 − 단위 변동비
 *   BEP 수량 = 고정비 / 공헌이익,  BEP 매출 = BEP 수량 × 판매가
 *   안전마진 = (현재 매출 − BEP 매출) / 현재 매출
 *
 * 금액 ₩.
 */

export interface BepInput {
  /** 월(또는 기간) 고정비 (₩) */
  fixedCosts: number;
  /** 단위 판매가 (₩) */
  pricePerUnit: number;
  /** 단위 변동비 (₩) */
  variableCostPerUnit: number;
  /** (선택) 현재 판매 수량 — 안전마진 계산용 */
  currentUnits?: number;
}

export interface BepResult {
  /** 단위 공헌이익 */
  contributionMargin: number;
  /** 공헌이익률 (fraction) */
  contributionMarginRatio: number;
  /** BEP 수량 */
  bepUnits: number;
  /** BEP 매출 */
  bepRevenue: number;
  /** 안전마진 (fraction). currentUnits 미입력 시 null */
  marginOfSafety: number | null;
  warnings: string[];
}

export class BepInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BepInputError';
  }
}

export function calculateBep(input: BepInput): BepResult {
  if (!(input.fixedCosts >= 0)) throw new BepInputError('고정비는 0 이상이어야 합니다.');
  if (!(input.pricePerUnit > 0)) throw new BepInputError('판매가는 0보다 커야 합니다.');
  if (!(input.variableCostPerUnit >= 0)) throw new BepInputError('변동비는 0 이상이어야 합니다.');

  const contributionMargin = input.pricePerUnit - input.variableCostPerUnit;
  if (contributionMargin <= 0) {
    throw new BepInputError('단위 공헌이익이 0 이하입니다(판매가 ≤ 변동비). 가격·원가를 확인하세요.');
  }

  const bepUnits = input.fixedCosts / contributionMargin;
  const bepRevenue = bepUnits * input.pricePerUnit;

  const warnings: string[] = [];
  let marginOfSafety: number | null = null;
  if (input.currentUnits != null) {
    const currentRevenue = input.currentUnits * input.pricePerUnit;
    marginOfSafety = currentRevenue > 0 ? (currentRevenue - bepRevenue) / currentRevenue : null;
    if (input.currentUnits < bepUnits) warnings.push('현재 판매량이 손익분기점 미만입니다(적자 구간).');
  }

  return {
    contributionMargin,
    contributionMarginRatio: contributionMargin / input.pricePerUnit,
    bepUnits,
    bepRevenue,
    marginOfSafety,
    warnings,
  };
}
