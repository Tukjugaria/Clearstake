/**
 * VCEquityNote — 모듈 B 단위테스트
 *
 * 기획서 수용 기준:
 *  - 옵션풀 pre/post 기준 차이가 지분율에 정확히 반영된다
 *  - 다수 라운드를 누적했을 때 합계 지분율이 100%로 일관된다
 */

import { describe, it, expect } from 'vitest';
import { simulateCapTable, CapTableInputError } from './capTable';
import type { Shareholder, RoundInput } from './types';

const founders = (): Shareholder[] => [
  { id: 'f1', name: '창업자', shares: 800_000, group: 'founder' },
  { id: 'i1', name: '기존 투자자', shares: 200_000, group: 'investor' },
];

function pctSum(rows: { pct: number }[]): number {
  return rows.reduce((acc, r) => acc + r.pct, 0);
}

describe('simulateCapTable — 기본 라운드', () => {
  it('신규 투자자 지분율 = M / post-money 에 근접한다', () => {
    const sim = simulateCapTable(founders(), [
      {
        id: 'A',
        name: 'Series A',
        preMoneyValuation: 1e10, // pre 100억, 100만주 → 주당 10,000
        newMoneyInvestment: 2.5e9, // 25억 → post 125억
      },
    ]);
    const round = sim.rounds[0];
    const newInv = round.rows.find((r) => r.group === 'newInvestor')!;
    expect(round.pricePerShare).toBe(10000);
    expect(newInv.pct).toBeCloseTo(2.5e9 / 1.25e10, 4); // 20%
  });
});

describe('simulateCapTable — 옵션풀 pre/post 기준 차이', () => {
  const round = (basis: 'pre' | 'post'): RoundInput => ({
    id: 'A',
    name: 'Series A',
    preMoneyValuation: 1e10,
    newMoneyInvestment: 2.5e9,
    optionPoolTargetPct: 0.1, // 라운드 후 10% 풀
    optionPoolBasis: basis,
  });

  it('pre 기준: 신규 투자자는 보호되고 창업자가 더 희석된다', () => {
    const pre = simulateCapTable(founders(), [round('pre')]).rounds[0];
    const post = simulateCapTable(founders(), [round('post')]).rounds[0];

    const founderPre = pre.rows.find((r) => r.group === 'founder')!.pct;
    const founderPost = post.rows.find((r) => r.group === 'founder')!.pct;
    const newPre = pre.rows.find((r) => r.group === 'newInvestor')!.pct;
    const newPost = post.rows.find((r) => r.group === 'newInvestor')!.pct;

    // 창업자: pre 기준이 더 많이 희석(낮은 지분)
    expect(founderPre).toBeLessThan(founderPost);
    // 신규 투자자: pre 기준에서 더 보호(높은 지분)
    expect(newPre).toBeGreaterThan(newPost);
  });

  it('pre 기준: 라운드 후 옵션풀이 목표 비율(10%)에 도달한다', () => {
    const pre = simulateCapTable(founders(), [round('pre')]).rounds[0];
    const pool = pre.rows.find((r) => r.group === 'optionPool')!;
    expect(pool.pct).toBeCloseTo(0.1, 3);
  });

  it('post 기준: 라운드 후 옵션풀이 목표 비율(10%)에 도달한다', () => {
    const post = simulateCapTable(founders(), [round('post')]).rounds[0];
    const pool = post.rows.find((r) => r.group === 'optionPool')!;
    expect(pool.pct).toBeCloseTo(0.1, 3);
  });
});

describe('simulateCapTable — 누적 합계 일관성', () => {
  it('단일 라운드 후 합계 지분율은 정확히 1', () => {
    const sim = simulateCapTable(founders(), [
      {
        id: 'A',
        name: 'Series A',
        preMoneyValuation: 1e10,
        newMoneyInvestment: 2.5e9,
        optionPoolTargetPct: 0.1,
        safeShares: 30_000,
        safeLabel: 'SAFE 투자자',
      },
    ]);
    expect(pctSum(sim.rounds[0].rows)).toBeCloseTo(1, 10);
  });

  it('다수 라운드를 누적해도 매 라운드 합계 지분율이 1', () => {
    const rounds: RoundInput[] = [
      { id: 'S', name: 'Seed', preMoneyValuation: 3e9, newMoneyInvestment: 5e8, optionPoolTargetPct: 0.1 },
      { id: 'A', name: 'Series A', preMoneyValuation: 1.5e10, newMoneyInvestment: 3e9 },
      { id: 'B', name: 'Series B', preMoneyValuation: 5e10, newMoneyInvestment: 1e10, optionPoolTargetPct: 0.15 },
    ];
    const sim = simulateCapTable(founders(), rounds);
    expect(sim.rounds).toHaveLength(3);
    for (const r of sim.rounds) {
      expect(pctSum(r.rows)).toBeCloseTo(1, 10);
    }
    // 후속 라운드일수록 창업자 지분은 단조 감소
    const founderPct = sim.rounds.map((r) => r.rows.find((x) => x.group === 'founder')!.pct);
    expect(founderPct[0]).toBeGreaterThan(founderPct[1]);
    expect(founderPct[1]).toBeGreaterThan(founderPct[2]);
  });
});

describe('simulateCapTable — 입력 검증', () => {
  it('초기 주주가 없으면 에러', () => {
    expect(() => simulateCapTable([], [])).toThrow(CapTableInputError);
  });

  it('pre-money가 0 이하면 에러', () => {
    expect(() =>
      simulateCapTable(founders(), [
        { id: 'A', name: 'A', preMoneyValuation: 0, newMoneyInvestment: 1e9 },
      ]),
    ).toThrow(CapTableInputError);
  });
});
