import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { calculateBep, BepInputError, type BepResult } from '../lib/ops/bep';
import { parseNum, won, wonShort, num, pct } from '../lib/format';

interface BepForm {
  fixedCosts: string;
  pricePerUnit: string;
  variableCostPerUnit: string;
  currentUnits: string;
}

const initialForm: BepForm = {
  fixedCosts: '10,000,000',
  pricePerUnit: '50,000',
  variableCostPerUnit: '30,000',
  currentUnits: '',
};

export function BepPage() {
  const [form, setForm] = useState<BepForm>(initialForm);
  const setField = <K extends keyof BepForm>(k: K, v: BepForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const fixedCosts = parseNum(form.fixedCosts);
    const pricePerUnit = parseNum(form.pricePerUnit);
    const variableCostPerUnit = parseNum(form.variableCostPerUnit);
    if (fixedCosts == null || pricePerUnit == null || variableCostPerUnit == null) {
      return { result: null as BepResult | null, error: null, isReady: false };
    }
    try {
      const res = calculateBep({
        fixedCosts,
        pricePerUnit,
        variableCostPerUnit,
        currentUnits: parseNum(form.currentUnits) ?? undefined,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof BepInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="손익분기점(BEP) 계산기"
        description="고정비를 회수하려면 얼마를 팔아야 하는지(BEP 수량·매출)와 안전마진을 계산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card title="입력">
          <div className="space-y-4">
            <NumberInput label="기간 고정비" suffix="₩" value={form.fixedCosts} onChange={(v) => setField('fixedCosts', v)} hint="임대료·인건비 등 고정비(월 기준 권장)" />
            <NumberInput label="단위 판매가" suffix="₩" value={form.pricePerUnit} onChange={(v) => setField('pricePerUnit', v)} />
            <NumberInput label="단위 변동비" suffix="₩" value={form.variableCostPerUnit} onChange={(v) => setField('variableCostPerUnit', v)} />
            <NumberInput label="현재 판매 수량" optional comma={false} value={form.currentUnits} onChange={(v) => setField('currentUnits', v)} hint="입력 시 안전마진 계산" />
          </div>
        </Card>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              고정비·판매가·변동비를 입력하세요.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {result && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="BEP 수량" value={`${num(Math.ceil(result.bepUnits))}개`} sub={`정확히 ${result.bepUnits.toFixed(1)}`} highlight />
                <StatCard label="BEP 매출" value={wonShort(result.bepRevenue)} sub={won(result.bepRevenue)} />
                <StatCard label="공헌이익률" value={pct(result.contributionMarginRatio)} sub={`단위 ${won(result.contributionMargin)}`} />
              </div>
              {result.marginOfSafety != null && (
                <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  안전마진:{' '}
                  <strong className={`tnum ${result.marginOfSafety < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {pct(result.marginOfSafety)}
                  </strong>{' '}
                  — 현재 매출이 BEP보다 {result.marginOfSafety >= 0 ? '높습니다(흑자 구간)' : '낮습니다(적자 구간)'}.
                </div>
              )}
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
