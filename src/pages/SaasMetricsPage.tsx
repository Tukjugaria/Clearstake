import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { calculateSaasMetrics, SaasMetricsInputError, type SaasMetricsResult } from '../lib/ops/saasMetrics';
import { parseNum, won, wonShort, pct } from '../lib/format';

interface SaasForm {
  monthlyArpa: string;
  grossMarginPct: string;
  monthlyChurnPct: string;
  smSpend: string;
  newCustomers: string;
  startMrr: string;
  expansionMrr: string;
  contractionMrr: string;
  churnedMrr: string;
}

const initialForm: SaasForm = {
  monthlyArpa: '100,000',
  grossMarginPct: '80',
  monthlyChurnPct: '2',
  smSpend: '30,000,000',
  newCustomers: '100',
  startMrr: '100,000,000',
  expansionMrr: '15,000,000',
  contractionMrr: '3,000,000',
  churnedMrr: '5,000,000',
};

const fmtMonths = (m: number | null) => (m == null ? '—' : `${m.toFixed(1)}개월`);
const fmtX = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}x`);

export function SaasMetricsPage() {
  const [form, setForm] = useState<SaasForm>(initialForm);
  const setField = <K extends keyof SaasForm>(k: K, v: SaasForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const monthlyArpa = parseNum(form.monthlyArpa);
    const grossMargin = parseNum(form.grossMarginPct);
    const monthlyChurn = parseNum(form.monthlyChurnPct);
    if (monthlyArpa == null || grossMargin == null || monthlyChurn == null) {
      return { result: null as SaasMetricsResult | null, error: null, isReady: false };
    }
    try {
      const res = calculateSaasMetrics({
        monthlyArpa,
        grossMargin: grossMargin / 100,
        monthlyChurn: monthlyChurn / 100,
        salesMarketingSpend: parseNum(form.smSpend) ?? 0,
        newCustomers: parseNum(form.newCustomers) ?? 0,
        startMrr: parseNum(form.startMrr) ?? undefined,
        expansionMrr: parseNum(form.expansionMrr) ?? undefined,
        contractionMrr: parseNum(form.contractionMrr) ?? undefined,
        churnedMrr: parseNum(form.churnedMrr) ?? undefined,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof SaasMetricsInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  const ltvCacGood = result?.ltvToCac != null && result.ltvToCac >= 3;

  return (
    <div>
      <PageHeader
        title="SaaS 지표 (LTV · CAC · 회수기간 · NRR)"
        description="단위경제(LTV·CAC·회수기간)와 매출유지율(NRR·GRR)을 계산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="단위경제">
            <div className="space-y-4">
              <NumberInput label="월 ARPA (고객당 매출)" suffix="₩" value={form.monthlyArpa} onChange={(v) => setField('monthlyArpa', v)} />
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="매출총이익률" suffix="%" comma={false} value={form.grossMarginPct} onChange={(v) => setField('grossMarginPct', v)} />
                <NumberInput label="월 이탈률" suffix="%" comma={false} value={form.monthlyChurnPct} onChange={(v) => setField('monthlyChurnPct', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="기간 S&M 지출" suffix="₩" value={form.smSpend} onChange={(v) => setField('smSpend', v)} />
                <NumberInput label="신규 고객 수" comma={false} value={form.newCustomers} onChange={(v) => setField('newCustomers', v)} />
              </div>
            </div>
          </Card>
          <Card title="매출유지율 (NRR/GRR)" subtitle="선택 — MRR 변동">
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="기초 MRR" suffix="₩" optional value={form.startMrr} onChange={(v) => setField('startMrr', v)} />
              <NumberInput label="확장 MRR" suffix="₩" optional value={form.expansionMrr} onChange={(v) => setField('expansionMrr', v)} />
              <NumberInput label="축소 MRR" suffix="₩" optional value={form.contractionMrr} onChange={(v) => setField('contractionMrr', v)} />
              <NumberInput label="이탈 MRR" suffix="₩" optional value={form.churnedMrr} onChange={(v) => setField('churnedMrr', v)} />
            </div>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              ARPA·매출총이익률·이탈률을 입력하세요.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {result && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="LTV" value={result.ltv != null ? wonShort(result.ltv) : '—'} sub={result.ltv != null ? won(result.ltv) : undefined} />
                <StatCard label="CAC" value={result.cac != null ? wonShort(result.cac) : '—'} sub={result.cac != null ? won(result.cac) : undefined} />
                <StatCard label="LTV : CAC" value={fmtX(result.ltvToCac)} sub={ltvCacGood ? '양호 (≥ 3x)' : '3x 미만'} highlight={ltvCacGood} />
                <StatCard label="CAC 회수기간" value={fmtMonths(result.cacPaybackMonths)} />
                <StatCard label="고객 평균 수명" value={fmtMonths(result.avgLifetimeMonths)} />
                {result.nrr != null && <StatCard label="NRR" value={pct(result.nrr)} sub={result.grr != null ? `GRR ${pct(result.grr)}` : undefined} highlight={result.nrr >= 1} />}
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                ※ 통용 벤치마크: LTV:CAC ≥ 3x, CAC 회수 ≤ 12개월, NRR ≥ 100%이면 건강한 편으로 봅니다.
              </p>
              {result.warnings.map((w) => (
                <p key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{w}</p>
              ))}
            </div>
          )}
          <div className="mt-5"><Disclaimer compact /></div>
        </Card>
      </div>
    </div>
  );
}
