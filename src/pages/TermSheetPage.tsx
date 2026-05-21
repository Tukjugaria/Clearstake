import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  evaluateTermSheet,
  TermSheetInputError,
  type TermSheet,
  type TermSheetEval,
} from '../lib/termsheet/termsheet';
import { parseNum, won, wonShort, pct } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface SheetForm {
  name: string;
  preMoney: string;
  newMoney: string;
  optionPoolPct: string;
  prefMultiple: string;
  participating: boolean;
  capMultiple: string;
}

const sheetDefault = (name: string, preMoney: string, participating: boolean): SheetForm => ({
  name,
  preMoney,
  newMoney: '2,500,000,000',
  optionPoolPct: '10',
  prefMultiple: '1',
  participating,
  capMultiple: '',
});

const textInput =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

function SheetInputs({
  form,
  set,
}: {
  form: SheetForm;
  set: <K extends keyof SheetForm>(k: K, v: SheetForm[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <input className={`${textInput} font-semibold`} value={form.name} onChange={(e) => set('name', e.target.value)} />
      <NumberInput label="pre-money" suffix="₩" value={form.preMoney} onChange={(v) => set('preMoney', v)} />
      <NumberInput label="신규 투자금" suffix="₩" value={form.newMoney} onChange={(v) => set('newMoney', v)} />
      <NumberInput label="옵션풀 목표" suffix="%" comma={false} optional value={form.optionPoolPct} onChange={(v) => set('optionPoolPct', v)} />
      <NumberInput label="청산우선권 배수" suffix="x" comma={false} value={form.prefMultiple} onChange={(v) => set('prefMultiple', v)} />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.participating} onChange={(e) => set('participating', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
        참가적(participating)
      </label>
      {form.participating && (
        <NumberInput label="참가 상한 배수" suffix="x" comma={false} optional value={form.capMultiple} onChange={(v) => set('capMultiple', v)} />
      )}
    </div>
  );
}

export function TermSheetPage() {
  const [ctx, setCtx] = useState({ currentShares: '1,000,000', founderShares: '800,000', exitValue: '30,000,000,000' });
  const [a, setA] = useState<SheetForm>(sheetDefault('텀시트 A', '10,000,000,000', false));
  const [b, setB] = useState<SheetForm>(sheetDefault('텀시트 B', '12,000,000,000', true));
  const { isFounder } = usePerspective();

  const setField = <T extends object>(setter: (f: (p: T) => T) => void) =>
    (<K extends keyof T>(k: K, v: T[K]) => setter((p) => ({ ...p, [k]: v })));

  const { evalA, evalB, error, isReady } = useMemo(() => {
    const currentShares = parseNum(ctx.currentShares);
    const founderShares = parseNum(ctx.founderShares);
    const exitValue = parseNum(ctx.exitValue);
    if (currentShares == null || founderShares == null || exitValue == null) {
      return { evalA: null, evalB: null, error: null, isReady: false };
    }
    const toSheet = (f: SheetForm): TermSheet | null => {
      const preMoney = parseNum(f.preMoney);
      const newMoney = parseNum(f.newMoney);
      if (preMoney == null || newMoney == null) return null;
      const cap = parseNum(f.capMultiple);
      const pool = parseNum(f.optionPoolPct);
      return {
        name: f.name,
        preMoney,
        newMoney,
        optionPoolTargetPct: pool != null ? pool / 100 : undefined,
        prefMultiple: parseNum(f.prefMultiple) ?? 1,
        participating: f.participating,
        participationCapMultiple: f.participating && cap != null && cap > 0 ? cap : undefined,
      };
    };
    const sa = toSheet(a);
    const sb = toSheet(b);
    if (!sa || !sb) return { evalA: null, evalB: null, error: null, isReady: false };
    try {
      const context = { currentShares, founderShares, exitValue };
      return { evalA: evaluateTermSheet(context, sa), evalB: evaluateTermSheet(context, sb), error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof TermSheetInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { evalA: null, evalB: null, error: msg, isReady: true };
    }
  }, [ctx, a, b]);

  return (
    <div>
      <PageHeader
        title="텀시트 비교"
        description="두 텀시트(밸류·옵션풀·청산우선권)를 같은 회사 상황에서 비교해 지분 희석과 엑싯 회수금을 나란히 봅니다."
      />
      <PerspectiveBar />

      <Card title="공통 조건">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberInput label="현재 완전희석 주식수" suffix="주" value={ctx.currentShares} onChange={(v) => setCtx((p) => ({ ...p, currentShares: v }))} />
          <NumberInput label="창업자 보유 주식수" suffix="주" value={ctx.founderShares} onChange={(v) => setCtx((p) => ({ ...p, founderShares: v }))} />
          <NumberInput label="엑싯 매각대금" suffix="₩" value={ctx.exitValue} onChange={(v) => setCtx((p) => ({ ...p, exitValue: v }))} />
        </div>
      </Card>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Card title="텀시트 A">
          <SheetInputs form={a} set={setField<SheetForm>(setA)} />
        </Card>
        <Card title="텀시트 B">
          <SheetInputs form={b} set={setField<SheetForm>(setB)} />
        </Card>
      </div>

      <div className="mt-5">
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {isReady && evalA && evalB && (
          <Card title="비교 결과" subtitle={isFounder ? '창업자 관점 강조' : '투자자 관점 강조'}>
            <ComparisonTable a={evalA} b={evalB} nameA={a.name} nameB={b.name} isFounder={isFounder} />
            <div className="mt-4">
              <Disclaimer compact />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function ComparisonTable({
  a,
  b,
  nameA,
  nameB,
  isFounder,
}: {
  a: TermSheetEval;
  b: TermSheetEval;
  nameA: string;
  nameB: string;
  isFounder: boolean;
}) {
  const rows: { label: string; a: string; b: string; better?: 'a' | 'b'; founderRow?: boolean; investorRow?: boolean }[] = [
    { label: '라운드 주당가격', a: won(a.pricePerShare), b: won(b.pricePerShare) },
    { label: 'post-money', a: wonShort(a.postMoney), b: wonShort(b.postMoney) },
    {
      label: '창업자 지분 (라운드 후)',
      a: pct(a.founderPctAfter),
      b: pct(b.founderPctAfter),
      better: a.founderPctAfter >= b.founderPctAfter ? 'a' : 'b',
      founderRow: true,
    },
    {
      label: '신규 투자자 지분',
      a: pct(a.investorPctAfter),
      b: pct(b.investorPctAfter),
      better: a.investorPctAfter >= b.investorPctAfter ? 'a' : 'b',
      investorRow: true,
    },
    { label: '옵션풀 지분', a: pct(a.optionPoolPctAfter), b: pct(b.optionPoolPctAfter) },
    {
      label: '엑싯 시 창업자 회수',
      a: wonShort(a.founderExitProceeds),
      b: wonShort(b.founderExitProceeds),
      better: a.founderExitProceeds >= b.founderExitProceeds ? 'a' : 'b',
      founderRow: true,
    },
    {
      label: '엑싯 시 투자자 회수',
      a: wonShort(a.investorExitProceeds),
      b: wonShort(b.investorExitProceeds),
      better: a.investorExitProceeds >= b.investorExitProceeds ? 'a' : 'b',
      investorRow: true,
    },
    {
      label: '투자자 MOIC',
      a: `${a.investorMoic.toFixed(2)}x`,
      b: `${b.investorMoic.toFixed(2)}x`,
      investorRow: true,
    },
  ];

  const star = (row: (typeof rows)[number], col: 'a' | 'b') => {
    if (!row.better || row.better !== col) return null;
    const relevant = (isFounder && row.founderRow) || (!isFounder && row.investorRow);
    if (!relevant) return null;
    return <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">유리</span>;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">항목</th>
            <th className="px-4 py-2.5 text-right font-medium">{nameA}</th>
            <th className="px-4 py-2.5 text-right font-medium">{nameB}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="px-4 py-2.5 text-slate-600">{row.label}</td>
              <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">
                {row.a}
                {star(row, 'a')}
              </td>
              <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">
                {row.b}
                {star(row, 'b')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
