/**
 * VCEquityNote — 모듈 B: 캡테이블 & 희석 시뮬레이션 엔진 (순수 함수)
 *
 * ── 모델 가정 ──────────────────────────────────────────────────────────
 * 1) 라운드 주당가격 = pre-money / (전환 직전 완전희석 주식수).
 *    "전환 직전 완전희석"의 정의는 옵션풀 기준에 따라 달라진다:
 *      - optionPoolBasis='pre'  : 확대된 옵션풀 + SAFE 전환분을 pre-money 파이에 포함
 *                                 → 신규 투자자는 희석에서 보호되고, 기존 주주(창업자)가 부담.
 *      - optionPoolBasis='post' : 옵션풀 확대는 신규 투자 후 발행 → 전원(신규 투자자 포함) 희석.
 * 2) SAFE 전환분(safeShares)은 모듈 A에서 이미 계산된 주식수를 받아 합산만 한다.
 * 3) 모든 주식수는 정수(내림). pct = shares / total 이므로 합계는 항상 정확히 1.
 * ──────────────────────────────────────────────────────────────────────
 */

import type {
  Shareholder,
  RoundInput,
  RoundResult,
  CapTableRow,
  CapTableSimulation,
} from './types';

export class CapTableInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CapTableInputError';
  }
}

function sumShares(holders: { shares: number }[]): number {
  return holders.reduce((acc, h) => acc + h.shares, 0);
}

/** 주주 목록 → pct 포함 캡테이블 행 (합계 정확히 1) */
function toRows(holders: Shareholder[]): { rows: CapTableRow[]; total: number } {
  const total = sumShares(holders);
  const rows = holders.map((h) => ({
    id: h.id,
    name: h.name,
    group: h.group,
    shares: h.shares,
    pct: total > 0 ? h.shares / total : 0,
  }));
  return { rows, total };
}

/**
 * 한 라운드를 적용해 새 주주 목록을 만든다.
 * @returns 새 주주 목록 + 라운드 메트릭
 */
function applyRound(
  current: Shareholder[],
  round: RoundInput,
): { holders: Shareholder[]; result: Omit<RoundResult, 'rows' | 'totalShares'> } {
  const warnings: string[] = [];

  if (!(round.preMoneyValuation > 0)) {
    throw new CapTableInputError(`[${round.name}] pre-money 기업가치는 0보다 커야 합니다.`);
  }
  if (!(round.newMoneyInvestment >= 0)) {
    throw new CapTableInputError(`[${round.name}] 신규 투자금은 0 이상이어야 합니다.`);
  }

  const P = round.preMoneyValuation;
  const M = round.newMoneyInvestment;
  const safeShares = Math.max(0, Math.floor(round.safeShares ?? 0));
  const basis = round.optionPoolBasis ?? 'pre';
  const targetPct = round.optionPoolTargetPct;

  const existingShares = sumShares(current);
  const existingPoolShares = sumShares(current.filter((h) => h.group === 'optionPool'));

  // SAFE 전환분을 먼저 합산한 기준 주식수
  const baseWithSafe = existingShares + safeShares;

  let poolAdded = 0;
  let pricePerShare: number;
  let newInvestorShares: number;

  if (targetPct != null && (targetPct < 0 || targetPct >= 1)) {
    throw new CapTableInputError(`[${round.name}] 옵션풀 목표 비율은 0 이상 1 미만이어야 합니다.`);
  }

  if (basis === 'pre') {
    // 확대된 옵션풀을 pre-money 파이에 포함 → 가격은 (기존+SAFE+신규풀) 기준
    if (targetPct != null && targetPct > 0) {
      // pool_after / T = p,  T = (base + poolAdded) * (P+M)/P
      // poolAdded = (k*base - E) / (1-k),  k = p*(P+M)/P
      const k = (targetPct * (P + M)) / P;
      if (k >= 1) {
        throw new CapTableInputError(
          `[${round.name}] 옵션풀 목표 비율이 너무 큽니다(pre 기준 산출 불가). 비율을 낮추세요.`,
        );
      }
      poolAdded = Math.round((k * baseWithSafe - existingPoolShares) / (1 - k));
      if (poolAdded < 0) {
        poolAdded = 0;
        warnings.push('기존 옵션풀이 이미 목표 비율을 초과하여 추가 발행하지 않았습니다.');
      }
    }
    const preMoneyFD = baseWithSafe + poolAdded;
    pricePerShare = P / preMoneyFD;
    newInvestorShares = Math.floor(M / pricePerShare);
  } else {
    // post 기준: 가격은 (기존+SAFE)만으로 산정, 옵션풀은 신규 투자 후 발행(전원 희석)
    const preMoneyFD = baseWithSafe;
    pricePerShare = P / preMoneyFD;
    newInvestorShares = Math.floor(M / pricePerShare);
    if (targetPct != null && targetPct > 0) {
      const subtotal = baseWithSafe + newInvestorShares;
      // (E + poolAdded) / (subtotal + poolAdded) = p
      poolAdded = Math.round((targetPct * subtotal - existingPoolShares) / (1 - targetPct));
      if (poolAdded < 0) {
        poolAdded = 0;
        warnings.push('기존 옵션풀이 이미 목표 비율을 초과하여 추가 발행하지 않았습니다.');
      }
    }
  }

  // 새 주주 목록 구성
  const holders: Shareholder[] = current.map((h) => ({ ...h }));

  // 옵션풀 추가분 반영 (기존 풀에 합산, 없으면 신설)
  if (poolAdded > 0) {
    const pool = holders.find((h) => h.group === 'optionPool');
    if (pool) {
      pool.shares += poolAdded;
    } else {
      holders.push({
        id: `pool-${round.id}`,
        name: '옵션풀',
        shares: poolAdded,
        group: 'optionPool',
      });
    }
  }

  // SAFE 전환분
  if (safeShares > 0) {
    holders.push({
      id: `safe-${round.id}`,
      name: round.safeLabel ?? 'SAFE 투자자',
      shares: safeShares,
      group: 'safe',
    });
  }

  // 신규 투자자
  if (newInvestorShares > 0) {
    holders.push({
      id: `new-${round.id}`,
      name: `${round.name} 투자자`,
      shares: newInvestorShares,
      group: 'newInvestor',
    });
  }

  return {
    holders,
    result: {
      roundId: round.id,
      roundName: round.name,
      pricePerShare,
      postMoneyValuation: P + M,
      newInvestorShares,
      optionPoolAddedShares: poolAdded,
      safeShares,
      warnings,
    },
  };
}

/**
 * 초기 캡테이블 + 여러 라운드를 순서대로 적용한 누적 시뮬레이션.
 * @throws {CapTableInputError}
 */
export function simulateCapTable(
  initial: Shareholder[],
  rounds: RoundInput[],
): CapTableSimulation {
  if (initial.length === 0) {
    throw new CapTableInputError('초기 주주를 1명 이상 입력하세요.');
  }
  if (!(sumShares(initial) > 0)) {
    throw new CapTableInputError('초기 주식수 합계는 0보다 커야 합니다.');
  }
  for (const h of initial) {
    if (!(h.shares >= 0)) {
      throw new CapTableInputError(`주주 "${h.name}"의 주식수는 0 이상이어야 합니다.`);
    }
  }

  const { rows: initialRows, total: initialTotalShares } = toRows(initial);

  let current = initial.map((h) => ({ ...h }));
  const roundResults: RoundResult[] = [];

  for (const round of rounds) {
    const { holders, result } = applyRound(current, round);
    const { rows, total } = toRows(holders);
    roundResults.push({ ...result, rows, totalShares: total });
    current = holders;
  }

  return { initialRows, initialTotalShares, rounds: roundResults };
}
