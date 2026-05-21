/**
 * ClearStake — 모듈 B: 캡테이블 시뮬레이터 헤드리스 훅
 *
 * 주주/라운드 입력 폼 상태 관리 + 엔진 호출 + 차트 데이터 가공.
 */

import { useMemo, useState } from 'react';
import {
  simulateCapTable,
  CapTableInputError,
} from '../lib/captable/capTable';
import type {
  Shareholder,
  RoundInput,
  ShareholderGroup,
  OptionPoolBasis,
  CapTableRow,
  CapTableSimulation,
} from '../lib/captable/types';
import { parseNum } from '../lib/format';
import type { DilutionDatum } from '../components/charts/DilutionTrendChart';

export interface ShareholderForm {
  id: string;
  name: string;
  shares: string;
  group: ShareholderGroup;
}

export interface RoundForm {
  id: string;
  name: string;
  preMoney: string;
  newMoney: string;
  poolPct: string; // 라운드 후 목표 옵션풀 % (빈칸이면 변경 없음)
  poolBasis: OptionPoolBasis;
  safeShares: string;
}

let idSeq = 0;
const uid = (prefix: string) => `${prefix}-${idSeq++}`;

const defaultShareholders: ShareholderForm[] = [
  { id: uid('sh'), name: '창업자', shares: '800,000', group: 'founder' },
  { id: uid('sh'), name: '기존 투자자', shares: '150,000', group: 'investor' },
  { id: uid('sh'), name: '옵션풀', shares: '50,000', group: 'optionPool' },
];

const defaultRounds: RoundForm[] = [
  {
    id: uid('rd'),
    name: 'Series A',
    preMoney: '10,000,000,000',
    newMoney: '2,500,000,000',
    poolPct: '10',
    poolBasis: 'pre',
    safeShares: '',
  },
];

function aggregate(rows: CapTableRow[]): Omit<DilutionDatum, 'stage'> {
  const acc = { founder: 0, investor: 0, optionPool: 0, safe: 0, newInvestor: 0 };
  for (const r of rows) acc[r.group] += r.pct * 100;
  return acc;
}

export interface UseCapTableReturn {
  shareholders: ShareholderForm[];
  rounds: RoundForm[];
  addShareholder: () => void;
  removeShareholder: (id: string) => void;
  updateShareholder: (id: string, patch: Partial<ShareholderForm>) => void;
  addRound: () => void;
  removeRound: (id: string) => void;
  updateRound: (id: string, patch: Partial<RoundForm>) => void;
  importSafeShares: (roundId: string, shares: number, label?: string) => void;
  simulation: CapTableSimulation | null;
  error: string | null;
  chartData: DilutionDatum[];
}

export function useCapTable(): UseCapTableReturn {
  const [shareholders, setShareholders] = useState<ShareholderForm[]>(defaultShareholders);
  const [rounds, setRounds] = useState<RoundForm[]>(defaultRounds);
  // SAFE import 라벨 보관 (라운드별)
  const [safeLabels, setSafeLabels] = useState<Record<string, string>>({});

  const addShareholder = () =>
    setShareholders((prev) => [
      ...prev,
      { id: uid('sh'), name: '', shares: '', group: 'investor' },
    ]);
  const removeShareholder = (id: string) =>
    setShareholders((prev) => prev.filter((s) => s.id !== id));
  const updateShareholder = (id: string, patch: Partial<ShareholderForm>) =>
    setShareholders((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addRound = () =>
    setRounds((prev) => [
      ...prev,
      {
        id: uid('rd'),
        name: `라운드 ${prev.length + 1}`,
        preMoney: '',
        newMoney: '',
        poolPct: '',
        poolBasis: 'pre',
        safeShares: '',
      },
    ]);
  const removeRound = (id: string) => setRounds((prev) => prev.filter((r) => r.id !== id));
  const updateRound = (id: string, patch: Partial<RoundForm>) =>
    setRounds((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const importSafeShares = (roundId: string, shares: number, label = 'SAFE 투자자') => {
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, safeShares: String(shares) } : r)),
    );
    setSafeLabels((prev) => ({ ...prev, [roundId]: label }));
  };

  const { simulation, error, chartData } = useMemo(() => {
    const parsedShareholders: Shareholder[] = shareholders
      .map((s) => ({
        id: s.id,
        name: s.name.trim() || '(이름 없음)',
        shares: parseNum(s.shares) ?? 0,
        group: s.group,
      }))
      .filter((s) => s.shares > 0);

    const parsedRounds: RoundInput[] = rounds
      .map((r) => {
        const preMoney = parseNum(r.preMoney);
        if (preMoney == null || preMoney <= 0) return null;
        const poolPct = parseNum(r.poolPct);
        const safeShares = parseNum(r.safeShares);
        return {
          id: r.id,
          name: r.name.trim() || '라운드',
          preMoneyValuation: preMoney,
          newMoneyInvestment: parseNum(r.newMoney) ?? 0,
          optionPoolTargetPct: poolPct != null ? poolPct / 100 : undefined,
          optionPoolBasis: r.poolBasis,
          safeShares: safeShares ?? undefined,
          safeLabel: safeLabels[r.id],
        } as RoundInput;
      })
      .filter((r): r is RoundInput => r !== null);

    if (parsedShareholders.length === 0) {
      return { simulation: null, error: '주식수가 입력된 주주를 1명 이상 추가하세요.', chartData: [] };
    }

    try {
      const sim = simulateCapTable(parsedShareholders, parsedRounds);
      const chart: DilutionDatum[] = [
        { stage: '현재', ...aggregate(sim.initialRows) },
        ...sim.rounds.map((rd) => ({ stage: rd.roundName, ...aggregate(rd.rows) })),
      ];
      return { simulation: sim, error: null, chartData: chart };
    } catch (e) {
      const msg = e instanceof CapTableInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { simulation: null, error: msg, chartData: [] };
    }
  }, [shareholders, rounds, safeLabels]);

  return {
    shareholders,
    rounds,
    addShareholder,
    removeShareholder,
    updateShareholder,
    addRound,
    removeRound,
    updateRound,
    importSafeShares,
    simulation,
    error,
    chartData,
  };
}
