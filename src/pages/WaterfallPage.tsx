import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { Disclaimer } from '../components/ui/Disclaimer';
import { WaterfallChart } from '../components/charts/WaterfallChart';
import {
  calculateWaterfall,
  WaterfallInputError,
  type CommonHolder,
  type PreferredSeries,
  type Outcome,
  type WaterfallResult,
} from '../lib/waterfall/waterfall';
import { formatWithCommas, parseNum, won, wonShort, pct, num } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface CommonRow {
  id: string;
  name: string;
  shares: string;
}
interface PreferredRow {
  id: string;
  name: string;
  invested: string;
  prefMultiple: string;
  participating: boolean;
  capMultiple: string;
  asConvertedShares: string;
}

let seq = 0;
const uid = (p: string) => `${p}${seq++}`;

const initialCommon: CommonRow[] = [
  { id: uid('c'), name: '창업자', shares: '700,000' },
  { id: uid('c'), name: '옵션풀', shares: '100,000' },
];
const initialPreferred: PreferredRow[] = [
  {
    id: uid('p'),
    name: 'Series A',
    invested: '2,000,000,000',
    prefMultiple: '1',
    participating: false,
    capMultiple: '',
    asConvertedShares: '300,000',
  },
];

const outcomeLabel: Record<Outcome, string> = {
  common: '보통주',
  preference: '우선권',
  participating: '참가',
  capped: '상한',
  converted: '전환',
};
const outcomeColor: Record<Outcome, string> = {
  common: 'bg-slate-100 text-slate-600',
  preference: 'bg-sky-50 text-sky-700',
  participating: 'bg-blue-50 text-blue-700',
  capped: 'bg-amber-50 text-amber-700',
  converted: 'bg-emerald-50 text-emerald-700',
};

const cellInput =
  'tnum w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const textInput =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function WaterfallPage() {
  const [commonRows, setCommonRows] = useState<CommonRow[]>(initialCommon);
  const [preferredRows, setPreferredRows] = useState<PreferredRow[]>(initialPreferred);
  const [exit, setExit] = useState('15,000,000,000');
  const { isFounder } = usePerspective();

  const updateCommon = (id: string, patch: Partial<CommonRow>) =>
    setCommonRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const updatePreferred = (id: string, patch: Partial<PreferredRow>) =>
    setPreferredRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const { result, error, isReady, common, preferred, maxExit } = useMemo(() => {
    const exitProceeds = parseNum(exit);
    const common: CommonHolder[] = commonRows
      .map((r) => ({
        id: r.id,
        name: r.name.trim() || '(이름)',
        shares: parseNum(r.shares) ?? 0,
        group: r.name.includes('옵션') ? ('optionPool' as const) : ('founder' as const),
      }))
      .filter((c) => c.shares > 0);
    const preferred: PreferredSeries[] = preferredRows
      .map((r) => {
        const invested = parseNum(r.invested);
        if (invested == null || invested <= 0) return null;
        const cap = parseNum(r.capMultiple);
        return {
          id: r.id,
          name: r.name.trim() || '우선주',
          invested,
          prefMultiple: parseNum(r.prefMultiple) ?? 1,
          participating: r.participating,
          participationCapMultiple: r.participating && cap != null && cap > 0 ? cap : undefined,
          asConvertedShares: parseNum(r.asConvertedShares) ?? 0,
        } as PreferredSeries;
      })
      .filter((p): p is PreferredSeries => p !== null);

    const totalInvested = preferred.reduce((a, p) => a + p.invested, 0);
    const maxExit = Math.max((exitProceeds ?? 0) * 2, totalInvested * 4, 1_000_000_000);

    if (exitProceeds == null) {
      return { result: null as WaterfallResult | null, error: null, isReady: false, common, preferred, maxExit };
    }
    try {
      const res = calculateWaterfall({ exitProceeds, common, preferred });
      return { result: res, error: null, isReady: true, common, preferred, maxExit };
    } catch (e) {
      const msg = e instanceof WaterfallInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true, common, preferred, maxExit };
    }
  }, [commonRows, preferredRows, exit]);

  return (
    <div>
      <PageHeader
        title="우선주(RCPS) Exit Waterfall"
        description="청산우선권·참가·전환을 반영해 엑싯 매각대금이 보통주(창업자)와 우선주(투자자)에게 어떻게 분배되는지 계산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="보통주"
          actions={
            <button
              type="button"
              onClick={() => setCommonRows((p) => [...p, { id: uid('c'), name: '', shares: '' }])}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              + 추가
            </button>
          }
        >
          <div className="space-y-2">
            {commonRows.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_130px_32px] items-center gap-2">
                <input className={textInput} value={r.name} placeholder="이름" onChange={(e) => updateCommon(r.id, { name: e.target.value })} />
                <input className={cellInput} inputMode="numeric" value={r.shares} placeholder="주식수" onChange={(e) => updateCommon(r.id, { shares: formatWithCommas(e.target.value) })} />
                <button type="button" aria-label="삭제" onClick={() => setCommonRows((p) => p.filter((x) => x.id !== r.id))} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">×</button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="엑싯">
          <NumberInput label="매각대금 (Exit Proceeds)" suffix="₩" value={exit} onChange={setExit} />
          <p className="mt-2 text-xs text-slate-400">아래 차트에서 매각대금 변화에 따른 분배 변화를 볼 수 있습니다.</p>
        </Card>
      </div>

      <div className="mt-5">
        <Card
          title="우선주 (RCPS)"
          actions={
            <button
              type="button"
              onClick={() =>
                setPreferredRows((p) => [
                  ...p,
                  { id: uid('p'), name: `Series ${String.fromCharCode(65 + p.length)}`, invested: '', prefMultiple: '1', participating: false, capMultiple: '', asConvertedShares: '' },
                ])
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              + 우선주 추가
            </button>
          }
        >
          <div className="space-y-3">
            {preferredRows.map((r, idx) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <input className={`${textInput} max-w-[160px] font-semibold`} value={r.name} onChange={(e) => updatePreferred(r.id, { name: e.target.value })} />
                  {preferredRows.length > 1 && (
                    <button type="button" onClick={() => setPreferredRows((p) => p.filter((x) => x.id !== r.id))} className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600">삭제 {idx + 1}</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="text-xs text-slate-500">투자원금 (₩)
                    <input className={`${cellInput} mt-1`} inputMode="numeric" value={r.invested} onChange={(e) => updatePreferred(r.id, { invested: formatWithCommas(e.target.value) })} />
                  </label>
                  <label className="text-xs text-slate-500">전환 주식수
                    <input className={`${cellInput} mt-1`} inputMode="numeric" value={r.asConvertedShares} onChange={(e) => updatePreferred(r.id, { asConvertedShares: formatWithCommas(e.target.value) })} />
                  </label>
                  <label className="text-xs text-slate-500">청산우선권 배수
                    <input className={`${cellInput} mt-1`} inputMode="numeric" value={r.prefMultiple} onChange={(e) => updatePreferred(r.id, { prefMultiple: e.target.value })} />
                  </label>
                  <label className="text-xs text-slate-500">참가 상한 배수 {r.participating ? '' : '(참가 시)'}
                    <input className={`${cellInput} mt-1`} inputMode="numeric" value={r.capMultiple} placeholder="무제한" disabled={!r.participating} onChange={(e) => updatePreferred(r.id, { capMultiple: e.target.value })} />
                  </label>
                </div>
                <label className="mt-2.5 flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={r.participating} onChange={(e) => updatePreferred(r.id, { participating: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  참가적(participating) 우선주
                </label>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 space-y-5">
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {result && isReady && (
          <>
            <Card title="분배 결과" subtitle={`매각대금 ${won(result.exitProceeds)} · ${isFounder ? '창업자 관점' : '투자자 관점'}`}>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">주주</th>
                      <th className="px-4 py-2.5 text-left font-medium">유형</th>
                      <th className="px-4 py-2.5 text-right font-medium">수령액</th>
                      <th className="px-4 py-2.5 text-right font-medium">비중</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.rows.map((row) => {
                      const emphasize =
                        (isFounder && row.kind === 'common') || (!isFounder && row.kind === 'preferred');
                      return (
                        <tr key={row.id} className={emphasize ? 'bg-brand-50/40' : ''}>
                          <td className="px-4 py-2.5 text-slate-800">{row.name}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${outcomeColor[row.outcome]}`}>
                              {outcomeLabel[row.outcome]}
                            </span>
                          </td>
                          <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(row.payout)}</td>
                          <td className="tnum px-4 py-2.5 text-right text-slate-600">{pct(row.pct)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                보통주 1주당 {won(result.perCommonShare)} · 분배 합계 {wonShort(result.totalDistributed)}{' '}
                ({num(result.totalDistributed)}원)
              </p>
            </Card>

            <Card title="엑싯 가치별 분배 추이" subtitle="매각대금이 커질수록 비참가 우선주는 전환을 택합니다">
              <WaterfallChart common={common} preferred={preferred} currentExit={result.exitProceeds} maxExit={maxExit} />
            </Card>
          </>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
