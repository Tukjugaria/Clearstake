import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { CashTrendChart } from '../components/charts/CashTrendChart';
import { calculateRunway, RunwayInputError, addMonths, type RunwayResult } from '../lib/runway/runway';
import { parseNum, wonShort } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface RunwayForm {
  cashOnHand: string;
  monthlyRevenue: string;
  monthlyExpense: string;
  monthlyRevenueGrowth: string;
}

const initialForm: RunwayForm = {
  cashOnHand: '2,000,000,000',
  monthlyRevenue: '50,000,000',
  monthlyExpense: '200,000,000',
  monthlyRevenueGrowth: '5',
};

function fmtMonths(m: number): string {
  const years = Math.floor(m / 12);
  const months = Math.round(m % 12);
  if (years === 0) return `${months}개월`;
  return `${years}년 ${months}개월`;
}

export function RunwayPage() {
  const [form, setForm] = useState<RunwayForm>(initialForm);
  const { isFounder } = usePerspective();
  const setField = <K extends keyof RunwayForm>(k: K, v: RunwayForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const cashOnHand = parseNum(form.cashOnHand);
    const monthlyRevenue = parseNum(form.monthlyRevenue);
    const monthlyExpense = parseNum(form.monthlyExpense);
    const ready = cashOnHand != null && monthlyExpense != null;
    if (!ready) return { result: null as RunwayResult | null, error: null, isReady: false };
    try {
      const res = calculateRunway({
        cashOnHand: cashOnHand!,
        monthlyRevenue: monthlyRevenue ?? 0,
        monthlyExpense: monthlyExpense!,
        monthlyRevenueGrowth: (parseNum(form.monthlyRevenueGrowth) ?? 0) / 100,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof RunwayInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  const zeroDate =
    result?.runwayMonths != null ? addMonths(new Date(), result.runwayMonths) : null;

  return (
    <div>
      <PageHeader
        title="런웨이 · 번레이트 계산기"
        description="현금과 월 손익으로 현금 소진 시점(런웨이)과 손익분기 도달 시점을 계산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card title="입력">
          <div className="space-y-4">
            <NumberInput label="보유 현금" suffix="₩" value={form.cashOnHand} onChange={(v) => setField('cashOnHand', v)} />
            <NumberInput label="월 매출" suffix="₩" value={form.monthlyRevenue} onChange={(v) => setField('monthlyRevenue', v)} />
            <NumberInput label="월 비용" suffix="₩" value={form.monthlyExpense} onChange={(v) => setField('monthlyExpense', v)} />
            <NumberInput
              label="월 매출 성장률"
              suffix="%"
              optional
              comma={false}
              value={form.monthlyRevenueGrowth}
              onChange={(v) => setField('monthlyRevenueGrowth', v)}
              hint="매월 매출 증가율. 비우면 0%(고정 매출)."
            />
          </div>
        </Card>

        <Card title="결과" subtitle={isFounder ? '창업자 관점 — 펀딩 데드라인' : '투자자 관점 — 재무 건전성'}>
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              보유 현금과 월 비용을 입력하면 런웨이가 표시됩니다.
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
                <StatCard
                  label="런웨이"
                  value={result.isSustainable ? '흑자 지속' : fmtMonths(result.runwayMonths!)}
                  sub={result.isSustainable ? '현금 소진 없음' : `약 ${result.runwayMonths!.toFixed(1)}개월`}
                  highlight
                />
                <StatCard
                  label={isFounder ? '소진 예상 시점' : '추가 자금 필요 시점'}
                  value={zeroDate ? zeroDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }) : '—'}
                  sub={result.isSustainable ? '해당 없음' : undefined}
                />
                <StatCard
                  label="현재 월 번레이트"
                  value={result.initialNetBurn > 0 ? wonShort(result.initialNetBurn) : '흑자'}
                  sub={result.initialNetBurn > 0 ? '월 순소모' : `월 +${wonShort(-result.initialNetBurn)}`}
                />
              </div>

              <div>
                <h3 className="mb-2.5 text-sm font-semibold text-slate-700">현금 추이</h3>
                <CashTrendChart series={result.series} zeroMonth={result.runwayMonths} />
              </div>

              <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-800">
                {result.isSustainable ? (
                  <>
                    현재 가정에서는 현금이 소진되지 않습니다(흑자 또는 손익분기).{' '}
                    {result.breakevenMonth != null && result.breakevenMonth > 0 && (
                      <>약 <strong>{result.breakevenMonth}개월</strong> 후 손익분기에 도달합니다.</>
                    )}
                  </>
                ) : isFounder ? (
                  <>
                    약 <strong>{fmtMonths(result.runwayMonths!)}</strong> 뒤 현금이 소진됩니다.
                    통상 6~9개월 전부터 펀딩을 시작하므로,{' '}
                    <strong>
                      {addMonths(new Date(), Math.max(0, result.runwayMonths! - 7)).toLocaleDateString(
                        'ko-KR',
                        { year: 'numeric', month: 'long' },
                      )}
                    </strong>{' '}
                    경 라운드 준비를 권장합니다.
                    {result.breakevenMonth != null && (
                      <> 손익분기 도달은 약 {result.breakevenMonth}개월 후입니다.</>
                    )}
                  </>
                ) : (
                  <>
                    이 회사는 현 가정에서 약 <strong>{fmtMonths(result.runwayMonths!)}</strong> 내
                    추가 자금이 필요합니다.
                    {result.breakevenMonth != null
                      ? ` 손익분기까지 약 ${result.breakevenMonth}개월.`
                      : ' 현 성장률로는 손익분기 도달이 어렵습니다.'}
                  </>
                )}
              </div>

              <p className="text-xs text-slate-400">
                ※ 비용·성장률이 일정하다는 가정의 개략 추정입니다. 일회성 지출·계절성은 반영되지
                않습니다. 현재 번레이트 기준 단순 런웨이: {result.initialNetBurn > 0 ? `약 ${(parseNum(form.cashOnHand)! / result.initialNetBurn).toFixed(1)}개월` : '해당 없음'}.
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
