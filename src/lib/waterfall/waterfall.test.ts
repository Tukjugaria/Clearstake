import { describe, it, expect } from 'vitest';
import { calculateWaterfall, WaterfallInputError } from './waterfall';
import type { PreferredSeries } from './waterfall';

const common = [{ id: 'f', name: '창업자', shares: 1_000_000, group: 'founder' as const }];
// 1억원 가정 단위가 아니라 ₩. 우선주 A: 10억 투자, as-converted 250,000주 (전환 시 20%)
const seriesA = (over: Partial<PreferredSeries> = {}): PreferredSeries => ({
  id: 'A',
  name: 'Series A',
  invested: 1_000_000_000,
  prefMultiple: 1,
  participating: false,
  asConvertedShares: 250_000,
  ...over,
});

describe('Waterfall — 비참가 1x', () => {
  it('소액 엑싯: 우선권을 택한다(전환 안 함)', () => {
    const r = calculateWaterfall({ exitProceeds: 3_000_000_000, common, preferred: [seriesA()] });
    const a = r.rows.find((x) => x.id === 'A')!;
    const f = r.rows.find((x) => x.id === 'f')!;
    expect(a.outcome).toBe('preference');
    expect(a.payout).toBe(1_000_000_000); // 우선권 10억
    expect(f.payout).toBe(2_000_000_000); // 잔여 20억
    expect(r.totalDistributed).toBeCloseTo(3_000_000_000, 2);
  });

  it('대형 엑싯: 전환이 유리 → 전환', () => {
    const r = calculateWaterfall({ exitProceeds: 10_000_000_000, common, preferred: [seriesA()] });
    const a = r.rows.find((x) => x.id === 'A')!;
    expect(a.outcome).toBe('converted');
    expect(a.payout).toBeCloseTo(2_000_000_000, 2); // 20% of 100억
  });
});

describe('Waterfall — 참가적', () => {
  it('참가적(무제한): 우선권 + 잔여 참가', () => {
    const r = calculateWaterfall({
      exitProceeds: 10_000_000_000,
      common,
      preferred: [seriesA({ participating: true })],
    });
    const a = r.rows.find((x) => x.id === 'A')!;
    const f = r.rows.find((x) => x.id === 'f')!;
    expect(a.outcome).toBe('participating');
    expect(a.payout).toBeCloseTo(2_800_000_000, 2); // 10억 + 20%×90억(1.8e9)
    expect(f.payout).toBeCloseTo(7_200_000_000, 2);
  });

  it('참가 상한(2x): 상한에서 멈춘다', () => {
    const r = calculateWaterfall({
      exitProceeds: 10_000_000_000,
      common,
      preferred: [seriesA({ participating: true, participationCapMultiple: 2 })],
    });
    const a = r.rows.find((x) => x.id === 'A')!;
    expect(a.outcome).toBe('capped');
    expect(a.payout).toBeCloseTo(2_000_000_000, 2); // 상한 2×10억
  });

  it('참가 상한이라도 초대형 엑싯이면 전환이 유리 → 전환', () => {
    const r = calculateWaterfall({
      exitProceeds: 20_000_000_000,
      common,
      preferred: [seriesA({ participating: true, participationCapMultiple: 2 })],
    });
    const a = r.rows.find((x) => x.id === 'A')!;
    expect(a.outcome).toBe('converted');
    expect(a.payout).toBeCloseTo(4_000_000_000, 2); // 20% of 200억
  });
});

describe('Waterfall — 청산우선권 미달', () => {
  it('매각대금이 우선권보다 작으면 우선주 안분, 보통주 0', () => {
    const r = calculateWaterfall({ exitProceeds: 500_000_000, common, preferred: [seriesA()] });
    const a = r.rows.find((x) => x.id === 'A')!;
    const f = r.rows.find((x) => x.id === 'f')!;
    expect(a.payout).toBe(500_000_000);
    expect(f.payout).toBe(0);
  });

  it('두 우선주 동순위 안분(pari passu)', () => {
    const r = calculateWaterfall({
      exitProceeds: 900_000_000,
      common,
      preferred: [
        seriesA({ id: 'A', invested: 1_000_000_000 }),
        seriesA({ id: 'B', invested: 2_000_000_000 }),
      ],
    });
    const a = r.rows.find((x) => x.id === 'A')!;
    const b = r.rows.find((x) => x.id === 'B')!;
    // 우선권 합 30억 > 9억 → 1:2 안분 = 3억 : 6억
    expect(a.payout).toBeCloseTo(300_000_000, 2);
    expect(b.payout).toBeCloseTo(600_000_000, 2);
  });
});

describe('Waterfall — 합계/검증', () => {
  it('분배 합계는 매각대금과 일치한다', () => {
    const r = calculateWaterfall({
      exitProceeds: 12_345_000_000,
      common,
      preferred: [seriesA({ participating: true })],
    });
    expect(r.totalDistributed).toBeCloseTo(12_345_000_000, 1);
  });

  it('매각대금 음수면 에러', () => {
    expect(() =>
      calculateWaterfall({ exitProceeds: -1, common, preferred: [seriesA()] }),
    ).toThrow(WaterfallInputError);
  });
});
