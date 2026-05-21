/**
 * ClearStake — 투자 수익률(MOIC·IRR) 계산 엔진 (순수 함수)
 *
 * 단일 진입·단일 회수 가정의 개략 모델.
 *  - MOIC = 회수금 / 투자금
 *  - IRR  = MOIC^(1/보유연수) − 1  (단일 현금흐름)
 * 엑싯까지의 누적 희석과 다음 라운드 pro-rata(지분 유지) 투자금도 함께 계산한다.
 *
 * 금액 ₩, 비율 fraction.
 */

export interface ReturnsInput {
  /** 투자금 (₩) */
  investmentAmount: number;
  /** 진입 지분율 (fraction 0~1) */
  entryOwnership: number;
  /** 엑싯 기업가치 (₩) */
  exitValuation: number;
  /** 보유기간 (년) */
  holdingYears: number;
  /** 엑싯까지 누적 희석률 (fraction, 예: 0.4 = 지분이 40% 줄어듦). 기본 0 */
  dilutionToExit?: number;
  /** (선택) 다음 라운드 신규 투자금 — pro-rata 유지 투자금 계산용 */
  nextRoundNewMoney?: number;
}

export interface ReturnsResult {
  /** 희석 후 엑싯 지분율 (fraction) */
  exitOwnership: number;
  /** 회수금 = 엑싯 지분 × 엑싯 기업가치 (₩) */
  exitProceeds: number;
  /** 투자배수 MOIC */
  moic: number;
  /** 연환산 수익률 IRR (보유연수 ≤ 0이면 null) */
  irr: number | null;
  /** 순이익 = 회수금 − 투자금 (₩) */
  profit: number;
  /** 지분 유지를 위한 다음 라운드 pro-rata 투자금 (₩). 미입력 시 null */
  proRataInvestment: number | null;
}

export class ReturnsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReturnsInputError';
  }
}

export function calculateReturns(input: ReturnsInput): ReturnsResult {
  if (!(input.investmentAmount > 0)) {
    throw new ReturnsInputError('투자금은 0보다 커야 합니다.');
  }
  if (!(input.entryOwnership > 0) || input.entryOwnership > 1) {
    throw new ReturnsInputError('진입 지분율은 0 초과 1 이하(fraction)여야 합니다.');
  }
  if (!(input.exitValuation >= 0)) {
    throw new ReturnsInputError('엑싯 기업가치는 0 이상이어야 합니다.');
  }
  if (!(input.holdingYears > 0)) {
    throw new ReturnsInputError('보유기간은 0보다 커야 합니다.');
  }
  const dilution = input.dilutionToExit ?? 0;
  if (dilution < 0 || dilution >= 1) {
    throw new ReturnsInputError('누적 희석률은 0 이상 1 미만이어야 합니다.');
  }

  const exitOwnership = input.entryOwnership * (1 - dilution);
  const exitProceeds = exitOwnership * input.exitValuation;
  const moic = exitProceeds / input.investmentAmount;
  const irr = Math.pow(moic, 1 / input.holdingYears) - 1;
  const profit = exitProceeds - input.investmentAmount;

  const proRataInvestment =
    input.nextRoundNewMoney != null && input.nextRoundNewMoney >= 0
      ? input.entryOwnership * input.nextRoundNewMoney
      : null;

  return { exitOwnership, exitProceeds, moic, irr, profit, proRataInvestment };
}
