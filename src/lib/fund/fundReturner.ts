/**
 * ClearStake — 목표 수익 역산(Fund-returner) 엔진 (순수 함수)
 *
 * "이 딜이 펀드를 N배 돌려주려면 엑싯 가치가 얼마여야 하나?"
 *   필요 회수금 = 펀드 규모 × 목표 배수
 *   필요 엑싯 가치 = 필요 회수금 / (희석 후) 내 지분율
 *
 * 금액 ₩, 비율 fraction.
 */

export interface FundReturnerInput {
  /** 펀드 규모 (₩) */
  fundSize: number;
  /** 목표 배수 (예: 1 = 펀드 전액 회수, 3 = 3배) */
  targetMultiple: number;
  /** 엑싯 시점 내(펀드) 지분율 — 희석 후 (fraction 0~1) */
  ownershipAtExit: number;
  /** (선택) 이 딜 투자금 (₩) — 이 딜 자체 MOIC 계산용 */
  investmentInDeal?: number;
}

export interface FundReturnerResult {
  /** 이 딜에서 회수해야 하는 금액 */
  requiredProceeds: number;
  /** 필요한 엑싯 기업가치 */
  requiredExitValuation: number;
  /** 이 딜의 회수 배수 (투자금 입력 시) */
  dealMoic: number | null;
  warnings: string[];
}

export class FundReturnerInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FundReturnerInputError';
  }
}

export function calculateFundReturner(input: FundReturnerInput): FundReturnerResult {
  if (!(input.fundSize > 0)) throw new FundReturnerInputError('펀드 규모는 0보다 커야 합니다.');
  if (!(input.targetMultiple > 0)) throw new FundReturnerInputError('목표 배수는 0보다 커야 합니다.');
  if (!(input.ownershipAtExit > 0) || input.ownershipAtExit > 1) {
    throw new FundReturnerInputError('엑싯 시점 지분율은 0 초과 1 이하여야 합니다.');
  }

  const requiredProceeds = input.fundSize * input.targetMultiple;
  const requiredExitValuation = requiredProceeds / input.ownershipAtExit;
  const dealMoic =
    input.investmentInDeal != null && input.investmentInDeal > 0
      ? requiredProceeds / input.investmentInDeal
      : null;

  const warnings: string[] = [];
  if (dealMoic != null && dealMoic > 50) {
    warnings.push('이 딜에 요구되는 회수 배수가 매우 큽니다(현실성 검토 필요).');
  }

  return { requiredProceeds, requiredExitValuation, dealMoic, warnings };
}
