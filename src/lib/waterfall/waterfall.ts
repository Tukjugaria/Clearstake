/**
 * ClearStake — 우선주(RCPS) Exit Waterfall 엔진 (순수 함수)
 *
 * 엑싯 매각대금을 청산우선권(liquidation preference) 규칙에 따라 분배한다.
 *
 * ── 모델 가정 ──────────────────────────────────────────────────────────
 * 1) 우선주는 모두 동순위(pari passu) 가정. (시리즈 간 선후순위 stacking은 미반영)
 * 2) 비참가적(non-participating) 우선주: max(청산우선권, 보통주 전환가치) 중 큰 쪽을 선택.
 *    → 엑싯이 충분히 크면 전환(convert)이 유리해진다.
 * 3) 참가적(participating) 우선주: 청산우선권을 먼저 받고, 잔여재산을 보통주와 함께
 *    지분비율로 추가 참가. 참가상한(cap, invested의 N배)이 있으면 총수령액을 제한하며,
 *    전환이 더 유리하면 전환한다.
 * 4) 매각대금이 우선권 합계보다 작으면 우선주끼리 우선권 비율로 안분, 보통주는 0.
 * ──────────────────────────────────────────────────────────────────────
 *
 * 금액 ₩, 비율 fraction.
 */

export type CommonGroup = 'founder' | 'common' | 'optionPool';

export interface CommonHolder {
  id: string;
  name: string;
  shares: number;
  group?: CommonGroup;
}

export interface PreferredSeries {
  id: string;
  name: string;
  /** 투자원금 (₩) */
  invested: number;
  /** 청산우선권 배수 (예: 1 = 1x) */
  prefMultiple: number;
  /** 참가적 여부 */
  participating: boolean;
  /** 참가상한 배수(총수령 한도 = invested × cap). 참가적일 때만 의미. 미지정 = 무제한 */
  participationCapMultiple?: number;
  /** 보통주 전환 시 주식수 (as-converted) */
  asConvertedShares: number;
}

export interface WaterfallInput {
  /** 엑싯 매각대금 (₩) */
  exitProceeds: number;
  common: CommonHolder[];
  preferred: PreferredSeries[];
}

export type Outcome = 'common' | 'preference' | 'participating' | 'capped' | 'converted';

export interface PayoutRow {
  id: string;
  name: string;
  kind: 'common' | 'preferred';
  group?: CommonGroup;
  payout: number;
  /** 매각대금 대비 비율 (fraction) */
  pct: number;
  outcome: Outcome;
}

export interface WaterfallResult {
  exitProceeds: number;
  totalDistributed: number;
  /** 보통주 1주당 분배액 (₩) */
  perCommonShare: number;
  rows: PayoutRow[];
}

export class WaterfallInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaterfallInputError';
  }
}

const EPS = 1e-6;

function validate(input: WaterfallInput): void {
  if (!(input.exitProceeds >= 0)) {
    throw new WaterfallInputError('엑싯 매각대금은 0 이상이어야 합니다.');
  }
  const commonShares = input.common.reduce((a, c) => a + c.shares, 0);
  if (commonShares <= 0 && input.preferred.length === 0) {
    throw new WaterfallInputError('보통주 또는 우선주를 1개 이상 입력하세요.');
  }
  for (const c of input.common) {
    if (!(c.shares >= 0)) throw new WaterfallInputError(`"${c.name}" 주식수는 0 이상이어야 합니다.`);
  }
  for (const p of input.preferred) {
    if (!(p.invested > 0)) throw new WaterfallInputError(`"${p.name}" 투자원금은 0보다 커야 합니다.`);
    if (!(p.prefMultiple >= 0)) throw new WaterfallInputError(`"${p.name}" 청산우선권 배수는 0 이상이어야 합니다.`);
    if (!(p.asConvertedShares >= 0)) throw new WaterfallInputError(`"${p.name}" 전환 주식수는 0 이상이어야 합니다.`);
  }
}

interface Evaluation {
  perShare: number;
  /** 우선주 id → 수령액 */
  preferredPayout: Map<string, number>;
  /** 우선주 id → outcome */
  preferredOutcome: Map<string, Outcome>;
  insufficient: boolean;
}

/** 주어진 전환집합에 대해 분배를 계산한다(참가상한은 내부 반복으로 해소) */
function evaluate(input: WaterfallInput, converted: Set<string>): Evaluation {
  const pref = (p: PreferredSeries) => p.invested * p.prefMultiple;
  const nonConv = input.preferred.filter((p) => !converted.has(p.id));
  const commonBaseShares = input.common.reduce((a, c) => a + c.shares, 0);
  const convertedShares = input.preferred
    .filter((p) => converted.has(p.id))
    .reduce((a, p) => a + p.asConvertedShares, 0);
  const commonShares = commonBaseShares + convertedShares;

  const prefSum = nonConv.reduce((a, p) => a + pref(p), 0);

  const preferredPayout = new Map<string, number>();
  const preferredOutcome = new Map<string, Outcome>();

  // 매각대금이 우선권 합계 미만 → 우선권 비율로 안분, 보통주 0
  if (input.exitProceeds <= prefSum + EPS) {
    for (const p of nonConv) {
      const share = prefSum > 0 ? input.exitProceeds * (pref(p) / prefSum) : 0;
      preferredPayout.set(p.id, share);
      preferredOutcome.set(p.id, 'preference');
    }
    for (const id of converted) {
      preferredPayout.set(id, 0);
      preferredOutcome.set(id, 'converted');
    }
    return { perShare: 0, preferredPayout, preferredOutcome, insufficient: true };
  }

  // 참가상한 반복 해소
  const capped = new Set<string>();
  let perShare = 0;
  for (let iter = 0; iter < 200; iter++) {
    let cappedExtra = 0;
    for (const p of nonConv) {
      if (capped.has(p.id)) cappedExtra += p.invested * p.participationCapMultiple! - pref(p);
    }
    const residual = Math.max(0, input.exitProceeds - prefSum - cappedExtra);
    let poolShares = commonShares;
    for (const p of nonConv) {
      if (p.participating && !capped.has(p.id)) poolShares += p.asConvertedShares;
    }
    perShare = poolShares > 0 ? residual / poolShares : 0;

    let changed = false;
    for (const p of nonConv) {
      if (!p.participating || capped.has(p.id) || p.participationCapMultiple == null) continue;
      const total = pref(p) + p.asConvertedShares * perShare;
      if (total > p.invested * p.participationCapMultiple + EPS) {
        capped.add(p.id);
        changed = true;
      }
    }
    if (!changed) break;
  }

  for (const p of nonConv) {
    if (!p.participating) {
      preferredPayout.set(p.id, pref(p));
      preferredOutcome.set(p.id, 'preference');
    } else if (capped.has(p.id)) {
      preferredPayout.set(p.id, p.invested * p.participationCapMultiple!);
      preferredOutcome.set(p.id, 'capped');
    } else {
      preferredPayout.set(p.id, pref(p) + p.asConvertedShares * perShare);
      preferredOutcome.set(p.id, 'participating');
    }
  }
  for (const id of converted) {
    const p = input.preferred.find((x) => x.id === id)!;
    preferredPayout.set(id, p.asConvertedShares * perShare);
    preferredOutcome.set(id, 'converted');
  }

  return { perShare, preferredPayout, preferredOutcome, insufficient: false };
}

export function calculateWaterfall(input: WaterfallInput): WaterfallResult {
  validate(input);

  // 전환(비참가/상한 참가가 전환이 유리한 경우) 반복 결정
  const converted = new Set<string>();
  let ev = evaluate(input, converted);
  for (let iter = 0; iter < 200; iter++) {
    let changed = false;
    for (const p of input.preferred) {
      if (converted.has(p.id)) continue;
      const convValue = p.asConvertedShares * ev.perShare;
      const curValue = ev.preferredPayout.get(p.id) ?? 0;
      if (convValue > curValue + EPS) {
        converted.add(p.id);
        changed = true;
      }
    }
    if (!changed) break;
    ev = evaluate(input, converted);
  }

  const rows: PayoutRow[] = [];
  let totalDistributed = 0;

  for (const c of input.common) {
    const payout = c.shares * ev.perShare;
    totalDistributed += payout;
    rows.push({
      id: c.id,
      name: c.name,
      kind: 'common',
      group: c.group,
      payout,
      pct: input.exitProceeds > 0 ? payout / input.exitProceeds : 0,
      outcome: 'common',
    });
  }
  for (const p of input.preferred) {
    const payout = ev.preferredPayout.get(p.id) ?? 0;
    totalDistributed += payout;
    rows.push({
      id: p.id,
      name: p.name,
      kind: 'preferred',
      payout,
      pct: input.exitProceeds > 0 ? payout / input.exitProceeds : 0,
      outcome: ev.preferredOutcome.get(p.id) ?? 'preference',
    });
  }

  return {
    exitProceeds: input.exitProceeds,
    totalDistributed,
    perCommonShare: ev.perShare,
    rows,
  };
}
