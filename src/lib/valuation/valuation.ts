/**
 * VCEquityNote — 밸류에이션 추정 엔진 (멀티플 기반, 개략 추정)
 *
 * 매출 멀티플 또는 순이익(PER) 멀티플로 기업가치를 추정하고 범위를 제공한다.
 *  - Enterprise Value = 지표 × 멀티플
 *  - Equity Value = EV + 순현금(현금 − 부채)
 *
 * ⚠️ 실제 밸류에이션은 성장성·시장·딜 구조에 크게 좌우된다. 본 추정은 참고용.
 * 금액 ₩, 비율 fraction.
 */

export type ValuationMethod = 'revenue' | 'earnings';

export interface ValuationInput {
  method: ValuationMethod;
  /** 연매출(ARR) 또는 순이익 (₩) */
  annualMetric: number;
  /** 적용 멀티플 (배수) */
  baseMultiple: number;
  /** 범위 ± (fraction, 예: 0.2 = ±20%) */
  rangePct?: number;
  /** 순현금 = 현금 − 부채 (₩). Equity Value 보정용 */
  netCash?: number;
}

export interface ValuationResult {
  enterpriseValue: number;
  evLow: number;
  evHigh: number;
  equityValue: number;
  equityLow: number;
  equityHigh: number;
  warnings: string[];
}

export class ValuationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValuationInputError';
  }
}

export function calculateValuation(input: ValuationInput): ValuationResult {
  if (!Number.isFinite(input.annualMetric)) {
    throw new ValuationInputError('지표(매출/순이익)가 올바르지 않습니다.');
  }
  if (!(input.baseMultiple > 0)) {
    throw new ValuationInputError('멀티플은 0보다 커야 합니다.');
  }
  const range = input.rangePct ?? 0;
  if (range < 0 || range >= 1) {
    throw new ValuationInputError('범위는 0 이상 1 미만이어야 합니다.');
  }

  const warnings: string[] = [];
  if (input.method === 'earnings' && input.annualMetric <= 0) {
    warnings.push('순이익이 0 이하라 PER(순이익 멀티플) 방식은 적절하지 않을 수 있습니다.');
  }

  const netCash = input.netCash ?? 0;
  const enterpriseValue = input.annualMetric * input.baseMultiple;
  const evLow = enterpriseValue * (1 - range);
  const evHigh = enterpriseValue * (1 + range);

  return {
    enterpriseValue,
    evLow,
    evHigh,
    equityValue: enterpriseValue + netCash,
    equityLow: evLow + netCash,
    equityHigh: evHigh + netCash,
    warnings,
  };
}
