import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { CashTrendChart } from '../components/charts/CashTrendChart';
import { calculateRunway, RunwayInputError, type RunwayResult } from '../lib/runway/runway';
import { parseNum, won, wonShort } from '../lib/format';
import { Link } from 'react-router-dom';

interface HiringForm {
  cashOnHand: string;
  monthlyRevenue: string;
  monthlyExpense: string;
  newHireMonthlyCost: string;
  monthlyRevenueGrowth: string;
}

const initialForm: HiringForm = {
  cashOnHand: '2,000,000,000',
  monthlyRevenue: '50,000,000',
  monthlyExpense: '200,000,000',
  newHireMonthlyCost: '7,250,000',
  monthlyRevenueGrowth: '5',
};

function fmtRunway(r: RunwayResult): string {
  if (r.isSustainable) return '흑자 지속';
  const m = r.runwayMonths!;
  const y = Math.floor(m / 12);
  const mo = Math.round(m % 12);
  return y === 0 ? `${mo}개월` : `${y}년 ${mo}개월`;
}

export function HiringRunwayPage() {
  const [form, setForm] = useState<HiringForm>(initialForm);
  const setField = <K extends keyof HiringForm>(k: K, v: HiringForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { before, after, error, isReady } = useMemo(() => {
    const cashOnHand = parseNum(form.cashOnHand);
    const monthlyExpense = parseNum(form.monthlyExpense);
    const newHireMonthlyCost = parseNum(form.newHireMonthlyCost);
    if (cashOnHand == null || monthlyExpense == null || newHireMonthlyCost == null) {
      return { before: null as RunwayResult | null, after: null as RunwayResult | null, error: null, isReady: false };
    }
    const revenue = parseNum(form.monthlyRevenue) ?? 0;
    const growth = (parseNum(form.monthlyRevenueGrowth) ?? 0) / 100;
    try {
      const before = calculateRunway({ cashOnHand, monthlyRevenue: revenue, monthlyExpense, monthlyRevenueGrowth: growth });
      const after = calculateRunway({ cashOnHand, monthlyRevenue: revenue, monthlyExpense: monthlyExpense + newHireMonthlyCost, monthlyRevenueGrowth: growth });
      return { before, after, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof RunwayInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { before: null, after: null, error: msg, isReady: true };
    }
  }, [form]);

  const deltaMonths =
    before && after && !before.isSustainable && !after.isSustainable
      ? before.runwayMonths! - after.runwayMonths!
      : null;

  return (
    <div>
      <PageHeader
        title="채용 → 런웨이 영향 시뮬레이터"
        description="신규 채용의 월 비용을 더했을 때 런웨이가 얼마나 줄어드는지 before/after로 비교합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card title="입력">
          <div className="space-y-4">
            <NumberInput label="보유 현금" suffix="₩" value={form.cashOnHand} onChange={(v) => setField('cashOnHand', v)} />
            <NumberInput label="월 매출" suffix="₩" value={form.monthlyRevenue} onChange={(v) => setField('monthlyRevenue', v)} />
            <NumberInput label="현재 월 비용" suffix="₩" value={form.monthlyExpense} onChange={(v) => setField('monthlyExpense', v)} />
            <NumberInput
              label="신규 채용 월 비용"
              suffix="₩"
              value={form.newHireMonthlyCost}
              onChange={(v) => setField('newHireMonthlyCost', v)}
              hint="4대보험·퇴직금 포함 실부담 권장 (인건비 계산기 참고)"
            />
            <NumberInput label="월 매출 성장률" suffix="%" comma={false} optional value={form.monthlyRevenueGrowth} onChange={(v) => setField('monthlyRevenueGrowth', v)} />
            <p className="text-xs text-slate-400">
              월 실부담 금액은{' '}
              <Link to="/payroll" className="font-medium text-slate-600 underline-offset-2 hover:underline">
                인건비 계산기
              </Link>
              에서 확인해 입력하세요.
            </p>
          </div>
        </Card>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              현금·비용·신규 채용 비용을 입력하세요.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {before && after && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="채용 전 런웨이" value={fmtRunway(before)} />
                <StatCard label="채용 후 런웨이" value={fmtRunway(after)} highlight />
                <StatCard
                  label="런웨이 변화"
                  value={deltaMonths != null ? `−${deltaMonths.toFixed(1)}개월` : '—'}
                  sub={deltaMonths == null ? '한쪽이 흑자 지속' : '단축'}
                />
              </div>

              <div>
                <h3 className="mb-2.5 text-sm font-semibold text-slate-700">채용 후 현금 추이</h3>
                <CashTrendChart series={after.series} zeroMonth={after.runwayMonths} />
              </div>

              <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-600">
                신규 채용으로 월 비용이 <strong>{won(parseNum(form.newHireMonthlyCost)!)}</strong> 늘어,
                번레이트가 {wonShort(after.initialNetBurn)}로 증가합니다.
                {deltaMonths != null ? (
                  <> 런웨이는 약 <strong>{deltaMonths.toFixed(1)}개월</strong> 짧아집니다.</>
                ) : (
                  <> 런웨이 비교는 한쪽이 흑자 지속이라 단순화됩니다.</>
                )}
              </p>
            </div>
          )}
          <div className="mt-5"><Disclaimer compact /></div>
        </Card>
      </div>
    </div>
  );
}
