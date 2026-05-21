/**
 * ClearStake — 텀시트 비교 엔진 (순수 함수, 기존 엔진 조합)
 *
 * 두 텀시트의 경제적 효과를 같은 회사 상황(현재 지분·엑싯 가정)에서 비교한다.
 *  - 라운드 효과(지분 희석): 캡테이블 엔진(simulateCapTable) 재사용
 *  - 엑싯 분배(청산우선권): Waterfall 엔진(calculateWaterfall) 재사용
 *
 * 금액 ₩, 비율 fraction.
 */

import { simulateCapTable } from '../captable/capTable';
import { calculateWaterfall, type CommonHolder, type CommonGroup } from '../waterfall/waterfall';
import type { Shareholder, ShareholderGroup } from '../captable/types';

export interface TermSheetContext {
  /** 현재(라운드 전) 완전희석 주식수 */
  currentShares: number;
  /** 창업자 보유 주식수 */
  founderShares: number;
  /** 엑싯 매각대금 (비교용) */
  exitValue: number;
}

export interface TermSheet {
  name: string;
  preMoney: number;
  newMoney: number;
  /** 목표 옵션풀 비율(pre 기준, fraction). 미지정 = 변경 없음 */
  optionPoolTargetPct?: number;
  /** 청산우선권 배수 */
  prefMultiple: number;
  participating: boolean;
  participationCapMultiple?: number;
}

export interface TermSheetEval {
  pricePerShare: number;
  postMoney: number;
  founderPctAfter: number;
  investorPctAfter: number;
  optionPoolPctAfter: number;
  /** 엑싯 시 창업자 회수금 */
  founderExitProceeds: number;
  /** 엑싯 시 신규 투자자 회수금 */
  investorExitProceeds: number;
  /** 신규 투자자 회수 배수 (MOIC) */
  investorMoic: number;
}

export class TermSheetInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TermSheetInputError';
  }
}

const toWaterfallGroup = (g: ShareholderGroup): CommonGroup =>
  g === 'founder' ? 'founder' : g === 'optionPool' ? 'optionPool' : 'common';

export function evaluateTermSheet(context: TermSheetContext, sheet: TermSheet): TermSheetEval {
  if (!(context.currentShares > 0)) {
    throw new TermSheetInputError('현재 완전희석 주식수는 0보다 커야 합니다.');
  }
  if (!(context.founderShares >= 0) || context.founderShares > context.currentShares) {
    throw new TermSheetInputError('창업자 주식수는 0 이상이며 현재 총주식수 이하여야 합니다.');
  }
  if (!(sheet.preMoney > 0)) throw new TermSheetInputError(`[${sheet.name}] pre-money는 0보다 커야 합니다.`);
  if (!(sheet.newMoney > 0)) throw new TermSheetInputError(`[${sheet.name}] 신규 투자금은 0보다 커야 합니다.`);

  const initial: Shareholder[] = [
    { id: 'founder', name: '창업자', shares: context.founderShares, group: 'founder' },
  ];
  const otherShares = context.currentShares - context.founderShares;
  if (otherShares > 0) {
    initial.push({ id: 'existing', name: '기존 주주', shares: otherShares, group: 'investor' });
  }

  const sim = simulateCapTable(initial, [
    {
      id: 'round',
      name: sheet.name || '라운드',
      preMoneyValuation: sheet.preMoney,
      newMoneyInvestment: sheet.newMoney,
      optionPoolTargetPct: sheet.optionPoolTargetPct,
      optionPoolBasis: 'pre',
    },
  ]);
  const round = sim.rounds[0];
  const rows = round.rows;
  const founderPctAfter = rows.find((r) => r.group === 'founder')?.pct ?? 0;
  const newInvestorRow = rows.find((r) => r.group === 'newInvestor');
  const investorPctAfter = newInvestorRow?.pct ?? 0;
  const investorShares = newInvestorRow?.shares ?? 0;
  const optionPoolPctAfter = rows
    .filter((r) => r.group === 'optionPool')
    .reduce((a, r) => a + r.pct, 0);

  // 엑싯 Waterfall: 신규 투자자 = 우선주, 나머지 = 보통주
  const common: CommonHolder[] = rows
    .filter((r) => r.group !== 'newInvestor')
    .map((r) => ({ id: r.id, name: r.name, shares: r.shares, group: toWaterfallGroup(r.group) }));
  const wf = calculateWaterfall({
    exitProceeds: context.exitValue,
    common,
    preferred: [
      {
        id: 'inv',
        name: '신규 투자자',
        invested: sheet.newMoney,
        prefMultiple: sheet.prefMultiple,
        participating: sheet.participating,
        participationCapMultiple: sheet.participationCapMultiple,
        asConvertedShares: investorShares,
      },
    ],
  });
  const founderExitProceeds = wf.rows.find((r) => r.id === 'founder')?.payout ?? 0;
  const investorExitProceeds = wf.rows.find((r) => r.id === 'inv')?.payout ?? 0;

  return {
    pricePerShare: round.pricePerShare,
    postMoney: round.postMoneyValuation,
    founderPctAfter,
    investorPctAfter,
    optionPoolPctAfter,
    founderExitProceeds,
    investorExitProceeds,
    investorMoic: investorExitProceeds / sheet.newMoney,
  };
}
