/**
 * ClearStake — 목표 지분 역산 엔진 (순수 함수)
 *
 * "이번 라운드 후 목표 지분율을 지키려면 밸류에이션이 최소 얼마여야 하나?"
 *
 * 모델(보유 주식수 불변, pre-money 기준):
 *   라운드 후 지분 f1 = f0 × pre/post = f0 × (1 − newMoney/post)
 *   신규투자자 지분 newPct = newMoney/post
 *   f1 ≥ target  ⇔  newPct ≤ 1 − target/f0
 *   ⇒ 최소 post = newMoney / (1 − target/f0),  최소 pre = post − newMoney
 *
 * 비율은 fraction, 금액 ₩.
 */

export interface TargetOwnershipInput {
  /** 현재 지분율 (fraction 0~1) */
  currentOwnership: number;
  /** 라운드 후 목표 지분율 (fraction 0~1) */
  targetOwnership: number;
  /** 이번 라운드 신규 투자금 (₩) */
  newMoney: number;
}

export interface TargetOwnershipResult {
  feasible: boolean;
  /** 감내 가능한 희석폭 = 현재 − 목표 (fraction) */
  maxDilution: number;
  /** 신규 투자자가 가져갈 수 있는 최대 지분 (fraction) */
  maxNewInvestorPct: number;
  /** 목표 유지를 위한 최소 pre-money (₩) */
  requiredMinPreMoney: number;
  /** 그때의 post-money (₩) */
  impliedPostMoney: number;
  /** 불가 사유 */
  reason?: string;
}

export class TargetOwnershipInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TargetOwnershipInputError';
  }
}

export function calculateTargetOwnership(input: TargetOwnershipInput): TargetOwnershipResult {
  const { currentOwnership: f0, targetOwnership: target, newMoney } = input;
  if (!(f0 > 0) || f0 > 1) {
    throw new TargetOwnershipInputError('현재 지분율은 0 초과 1 이하여야 합니다.');
  }
  if (!(target > 0) || target > 1) {
    throw new TargetOwnershipInputError('목표 지분율은 0 초과 1 이하여야 합니다.');
  }
  if (!(newMoney > 0)) {
    throw new TargetOwnershipInputError('신규 투자금은 0보다 커야 합니다.');
  }

  const maxDilution = f0 - target;
  const maxNewInvestorPct = 1 - target / f0;

  if (target >= f0) {
    return {
      feasible: false,
      maxDilution,
      maxNewInvestorPct,
      requiredMinPreMoney: Infinity,
      impliedPostMoney: Infinity,
      reason: '목표 지분율이 현재 지분율 이상입니다. 신규 투자를 받으면 지분은 늘 수 없습니다.',
    };
  }

  const impliedPostMoney = newMoney / maxNewInvestorPct;
  const requiredMinPreMoney = impliedPostMoney - newMoney;

  return {
    feasible: true,
    maxDilution,
    maxNewInvestorPct,
    requiredMinPreMoney,
    impliedPostMoney,
  };
}
