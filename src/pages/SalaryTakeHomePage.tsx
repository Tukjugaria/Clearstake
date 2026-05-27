import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  calculateSalaryTakeHome,
  SalaryTakeHomeInputError,
  type SalaryTakeHomeResult,
} from '../lib/tax/salaryTakeHome';
import { calculatePayrollCost } from '../lib/ops/payroll';
import { taxConfig } from '../config/taxConfig';
import { parseNum, won, wonShort, pct } from '../lib/format';

interface SalaryForm {
  annualSalary: string;
  dependents: string;
  children: string;
  monthlyNontaxableMeal: string;
}

const initialForm: SalaryForm = {
  annualSalary: '50,000,000',
  dependents: '0',
  children: '0',
  monthlyNontaxableMeal: '200,000',
};

export function SalaryTakeHomePage() {
  const [form, setForm] = useState<SalaryForm>(initialForm);
  const setField = <K extends keyof SalaryForm>(k: K, v: SalaryForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, employerCost, error, isReady } = useMemo(() => {
    const annual = parseNum(form.annualSalary);
    const dependents = parseNum(form.dependents);
    const children = parseNum(form.children);
    const meal = parseNum(form.monthlyNontaxableMeal) ?? 0;
    if (annual == null || dependents == null || children == null) {
      return {
        result: null as SalaryTakeHomeResult | null,
        employerCost: null as ReturnType<typeof calculatePayrollCost> | null,
        error: null,
        isReady: false,
      };
    }
    try {
      const res = calculateSalaryTakeHome({
        annualSalary: annual,
        dependents,
        children,
        monthlyNontaxableMeal: meal,
      });
      const emp = calculatePayrollCost({ annualSalary: annual });
      return { result: res, employerCost: emp, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof SalaryTakeHomeInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, employerCost: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="연봉 실수령 계산기 — 임직원 ↔ 회사 양면"
        description="연봉을 입력하면 4대보험·소득세를 뺀 월 실수령액과, 회사가 부담하는 인건비를 한 화면에서 비교합니다."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <NumberInput
                label="연봉 (세전)"
                suffix="₩"
                value={form.annualSalary}
                onChange={(v) => setField('annualSalary', v)}
              />
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="부양가족 수"
                  suffix="명"
                  comma={false}
                  value={form.dependents}
                  onChange={(v) => setField('dependents', v)}
                  hint="본인 제외, 배우자 포함"
                />
                <NumberInput
                  label="그중 자녀 수"
                  suffix="명"
                  comma={false}
                  value={form.children}
                  onChange={(v) => setField('children', v)}
                  hint="자녀세액공제 적용"
                />
              </div>
              <NumberInput
                label="월 비과세 식대"
                suffix="₩"
                value={form.monthlyNontaxableMeal}
                onChange={(v) => setField('monthlyNontaxableMeal', v)}
                hint="한도 20만/월 (2023.1~). 초과분은 자동 캡"
              />
            </div>
          </Card>

          <Card title="적용 전제" subtitle={`기준일 ${taxConfig.lastUpdated}`}>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li>• 종합소득공제: 본인·부양가족 1인당 150만 + 국민연금 본인부담만 반영</li>
              <li>• 자녀세액공제: 1명 25만, 2명 55만, 3명+ 추가 1인당 40만 (2024 개정 후)</li>
              <li>• 근로소득세액공제: 산출세액 130만 이하 55%, 초과분 30%, 한도 74만</li>
              <li>• 비과세 식대 한도 월 20만 (2023.1~)</li>
              <li>• 의료비·신용카드·연금저축 등은 미반영한 보수적 추정 (실제는 더 받음)</li>
            </ul>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              연봉을 입력하면 결과가 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && employerCost && (
            <div className="space-y-5" aria-live="polite">
              {/* 핵심: 월 실수령액 */}
              <div className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-400">월 실수령액</div>
                    <div className="tnum mt-1 text-2xl font-bold tracking-tight text-white">
                      {won(result.monthlyTakeHome)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">연 실수령 {wonShort(result.annualTakeHome)}</div>
                    <div className="tnum mt-1 text-sm font-medium text-slate-300">
                      실수령률 {pct(result.takeHomeRate, 1)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  월 세전 {won(result.monthlyGross)}에서 4대보험·세금을 뺀 실수령액입니다.
                </div>
              </div>

              {/* 양면: 회사 부담 vs 임직원 실수령 */}
              <div>
                <h3 className="mb-2.5 text-sm font-semibold text-slate-700">양면 비교 (월 기준)</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard
                    label="회사 실부담"
                    value={wonShort(employerCost.totalMonthly)}
                    sub={`+퇴직금·4대보험 ${pct(employerCost.burdenRate, 1)}`}
                  />
                  <StatCard
                    label="세전 월급"
                    value={wonShort(result.monthlyGross)}
                    sub={won(result.monthlyGross)}
                  />
                  <StatCard
                    label="실수령액"
                    value={wonShort(result.monthlyTakeHome)}
                    sub={won(result.monthlyTakeHome)}
                    highlight
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  같은 인원에 대해 회사는 월 <strong className="text-slate-900">{won(employerCost.totalMonthly)}</strong> 쓰고,
                  임직원은 월 <strong className="text-slate-900">{won(result.monthlyTakeHome)}</strong> 받습니다.
                  차이 <strong className="text-slate-900">{won(employerCost.totalMonthly - result.monthlyTakeHome)}</strong>는
                  세금·4대보험(회사부담+본인부담)·퇴직금 적립으로 빠진 금액.
                </p>
              </div>

              {/* 공제·세금 분해 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    월 4대보험 본인부담
                  </h4>
                  <div className="space-y-1.5">
                    {result.insuranceComponents.map((c) => (
                      <div key={c.key} className="flex justify-between text-sm">
                        <span className="text-slate-600">{c.label}</span>
                        <span className="tnum font-medium text-slate-900">{won(c.monthly)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-100 pt-1.5 text-sm font-semibold">
                      <span className="text-slate-700">합계</span>
                      <span className="tnum text-slate-900">{won(result.monthlyEmployeeInsurance)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    연 소득세·지방세
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">과세표준</span>
                      <span className="tnum text-slate-900">{won(result.taxBase)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">산출세액</span>
                      <span className="tnum text-slate-900">{won(result.computedTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">− 근로소득세액공제</span>
                      <span className="tnum text-emerald-700">−{won(result.earnedIncomeTaxCredit)}</span>
                    </div>
                    {result.childTaxCredit > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">− 자녀세액공제</span>
                        <span className="tnum text-emerald-700">−{won(result.childTaxCredit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">+ 지방소득세</span>
                      <span className="tnum text-slate-900">+{won(result.localTax)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-1.5 font-semibold">
                      <span className="text-slate-700">연 총 세금</span>
                      <span className="tnum text-slate-900">{won(result.annualTax)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {result.warnings.length > 0 && (
                <ul className="space-y-1.5">
                  {result.warnings.map((w) => (
                    <li key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-5">
            <Disclaimer />
          </div>
        </Card>
      </div>
    </div>
  );
}
