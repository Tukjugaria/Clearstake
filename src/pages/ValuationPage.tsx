import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  calculateValuation,
  ValuationInputError,
  type ValuationMethod,
  type ValuationResult,
} from '../lib/valuation/valuation';
import { parseNum, won, wonShort } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface ValForm {
  method: ValuationMethod;
  annualMetric: string;
  baseMultiple: string;
  rangePct: string;
  netCash: string;
}

const initialForm: ValForm = {
  method: 'revenue',
  annualMetric: '5,000,000,000',
  baseMultiple: '5',
  rangePct: '20',
  netCash: '',
};

export function ValuationPage() {
  const [form, setForm] = useState<ValForm>(initialForm);
  const { isFounder } = usePerspective();
  const setField = <K extends keyof ValForm>(k: K, v: ValForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const annualMetric = parseNum(form.annualMetric);
    const baseMultiple = parseNum(form.baseMultiple);
    const ready = annualMetric != null && baseMultiple != null;
    if (!ready) return { result: null as ValuationResult | null, error: null, isReady: false };
    try {
      const res = calculateValuation({
        method: form.method,
        annualMetric: annualMetric!,
        baseMultiple: baseMultiple!,
        rangePct: (parseNum(form.rangePct) ?? 0) / 100,
        netCash: parseNum(form.netCash) ?? 0,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof ValuationInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  const metricLabel = form.method === 'revenue' ? '연매출 (ARR)' : '연 순이익';

  return (
    <div>
      <PageHeader
        title="밸류에이션 추정 계산기"
        description="매출 또는 순이익 멀티플로 기업가치를 개략 추정하고 범위를 제시합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card title="입력">
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-slate-700">평가 방식</span>
              <div className="mt-1.5">
                <SegmentedControl
                  fullWidth
                  ariaLabel="평가 방식"
                  value={form.method}
                  onChange={(v) => setField('method', v)}
                  segments={[
                    { value: 'revenue', label: '매출 멀티플' },
                    { value: 'earnings', label: '순이익(PER)' },
                  ]}
                />
              </div>
            </div>
            <NumberInput label={metricLabel} suffix="₩" value={form.annualMetric} onChange={(v) => setField('annualMetric', v)} />
            <NumberInput label="적용 멀티플" suffix="x" comma={false} value={form.baseMultiple} onChange={(v) => setField('baseMultiple', v)} />
            <NumberInput label="범위 ±" suffix="%" comma={false} optional value={form.rangePct} onChange={(v) => setField('rangePct', v)} />
            <NumberInput
              label="순현금 (현금 − 부채)"
              suffix="₩"
              optional
              value={form.netCash}
              onChange={(v) => setField('netCash', v)}
              hint="Equity Value 보정용. 비우면 0."
            />
          </div>
        </Card>

        <Card title="결과" subtitle={isFounder ? '창업자 관점 — 협상 레인지' : '투자자 관점 — 진입 밸류'}>
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              지표와 멀티플을 입력하면 추정 기업가치가 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Enterprise Value (기준)" value={wonShort(result.enterpriseValue)} sub={won(result.enterpriseValue)} highlight />
                <StatCard label="EV 범위 (하단)" value={wonShort(result.evLow)} />
                <StatCard label="EV 범위 (상단)" value={wonShort(result.evHigh)} />
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2.5 text-slate-600">Equity Value (기준)</td>
                      <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.equityValue)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-slate-600">Equity 범위</td>
                      <td className="tnum px-4 py-2.5 text-right text-slate-700">
                        {wonShort(result.equityLow)} ~ {wonShort(result.equityHigh)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {result.warnings.length > 0 && (
                <ul className="space-y-1.5">
                  {result.warnings.map((w) => (
                    <li key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{w}</li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-slate-400">
                ※ 멀티플은 산업·성장성·시점에 따라 크게 달라지는 가정값입니다. 실제 밸류에이션은 비교
                기업(comps)·딜 협상으로 결정됩니다.
              </p>
            </div>
          )}

          <div className="mt-5">
            <Disclaimer compact />
          </div>
        </Card>
      </div>
    </div>
  );
}
