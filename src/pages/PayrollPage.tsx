import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { calculatePayrollCost, PayrollInputError, type PayrollResult } from '../lib/ops/payroll';
import { taxConfig } from '../config/taxConfig';
import { parseNum, won, wonShort, pct } from '../lib/format';

interface PayrollForm {
  annualSalary: string;
  accidentPct: string;
}

const initialForm: PayrollForm = { annualSalary: '60,000,000', accidentPct: '' };

export function PayrollPage() {
  const [form, setForm] = useState<PayrollForm>(initialForm);
  const setField = <K extends keyof PayrollForm>(k: K, v: PayrollForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const annualSalary = parseNum(form.annualSalary);
    if (annualSalary == null) return { result: null as PayrollResult | null, error: null, isReady: false };
    try {
      const accident = parseNum(form.accidentPct);
      const res = calculatePayrollCost({
        annualSalary,
        industrialAccidentRate: accident != null ? accident / 100 : undefined,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof PayrollInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="인건비 · 4대보험 · 퇴직금 실부담 계산기"
        description="연봉을 입력하면 회사가 실제 부담하는 월/연 총비용(급여 + 4대보험 사용자부담 + 퇴직금 적립)을 계산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <NumberInput label="연봉" suffix="₩" value={form.annualSalary} onChange={(v) => setField('annualSalary', v)} />
              <NumberInput
                label="산재보험 요율"
                suffix="%"
                comma={false}
                optional
                value={form.accidentPct}
                onChange={(v) => setField('accidentPct', v)}
                hint="업종별 상이. 비우면 기본 추정값 적용."
              />
            </div>
          </Card>
          <Card title="적용 요율" subtitle={`기준일 ${taxConfig.lastUpdated}`}>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li>• 국민연금 4.5% · 건강 3.545%(+장기요양 12.95%) · 고용 1.15% (사용자부담)</li>
              <li>• 산재 업종 평균 추정 · 퇴직금 적립 월급의 1/12(약 8.3%)</li>
              <li>• 요율은 매년 변동·소득상한(연금)·업종(산재)에 따라 달라지는 개략 추정입니다.</li>
            </ul>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              연봉을 입력하면 회사 실부담이 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {result && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="월 총비용" value={wonShort(result.totalMonthly)} sub={won(result.totalMonthly)} highlight />
                <StatCard label="연 총비용" value={wonShort(result.totalAnnual)} sub={won(result.totalAnnual)} />
                <StatCard label="급여 대비 추가부담" value={pct(result.burdenRate)} sub={`월 ${won(result.employerBurdenMonthly)}`} />
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">항목</th>
                      <th className="px-4 py-2.5 text-right font-medium">월</th>
                      <th className="px-4 py-2.5 text-right font-medium">연</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2.5 text-slate-700">급여</td>
                      <td className="tnum px-4 py-2.5 text-right text-slate-700">{won(result.monthlySalary)}</td>
                      <td className="tnum px-4 py-2.5 text-right text-slate-700">{won(result.monthlySalary * 12)}</td>
                    </tr>
                    {result.components.map((c) => (
                      <tr key={c.key}>
                        <td className="px-4 py-2.5 text-slate-600">{c.label}</td>
                        <td className="tnum px-4 py-2.5 text-right text-slate-600">{won(c.monthly)}</td>
                        <td className="tnum px-4 py-2.5 text-right text-slate-600">{won(c.monthly * 12)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="px-4 py-2.5 text-slate-900">합계 (실부담)</td>
                      <td className="tnum px-4 py-2.5 text-right text-slate-900">{won(result.totalMonthly)}</td>
                      <td className="tnum px-4 py-2.5 text-right text-slate-900">{won(result.totalAnnual)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

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
