import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  calculateRetirementTax,
  RetirementTaxInputError,
  type RetirementTaxResult,
} from '../lib/tax/retirementTax';
import { taxConfig } from '../config/taxConfig';
import { parseNum, won, wonShort, pct } from '../lib/format';

interface RetirementForm {
  monthlyAverageSalary: string;
  serviceYears: string;
}

const initialForm: RetirementForm = {
  monthlyAverageSalary: '5,000,000',
  serviceYears: '10',
};

export function RetirementTaxPage() {
  const [form, setForm] = useState<RetirementForm>(initialForm);
  const setField = <K extends keyof RetirementForm>(k: K, v: RetirementForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const salary = parseNum(form.monthlyAverageSalary);
    const years = parseNum(form.serviceYears);
    if (salary == null || years == null) {
      return { result: null as RetirementTaxResult | null, error: null, isReady: false };
    }
    try {
      const res = calculateRetirementTax({
        monthlyAverageSalary: salary,
        serviceYears: years,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof RetirementTaxInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="퇴직금·퇴직소득세 계산기 — 세후 실수령"
        description="평균임금과 근속연수로 퇴직금을 산출하고, 환산급여 방식 퇴직소득세를 계산해 실수령액을 보여줍니다."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <NumberInput
                label="평균 월급 (퇴직 전 3개월 평균임금)"
                suffix="₩"
                value={form.monthlyAverageSalary}
                onChange={(v) => setField('monthlyAverageSalary', v)}
                hint="기본급 + 정기상여 + 정기수당 평균"
              />
              <NumberInput
                label="근속연수"
                suffix="년"
                comma={false}
                value={form.serviceYears}
                onChange={(v) => setField('serviceYears', v)}
                hint="소수 가능 (예: 3.5년)"
              />
            </div>
          </Card>

          <Card title="적용 전제" subtitle={`기준일 ${taxConfig.lastUpdated}`}>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li>• 퇴직금 = 평균임금 × 근속연수 (근로기준법 §34 단순화)</li>
              <li>• 환산급여 = (퇴직금 − 근속연수공제) × 12 ÷ 근속연수</li>
              <li>• 근속연수공제: 5년/10년/20년 구간별 누적 (소득세법 §48)</li>
              <li>• 환산급여공제: 800만/7천만/1억/3억 구간별 누적</li>
              <li>• 임원퇴직금 한도(법인세법 §44)·DC형 운용수익 미반영</li>
            </ul>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              평균월급과 근속연수를 입력하면 결과가 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-5" aria-live="polite">
              {/* 핵심: 세후 실수령 */}
              <div className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-400">퇴직금 세후 실수령액</div>
                    <div className="tnum mt-1 text-2xl font-bold tracking-tight text-white">
                      {won(result.netAfterTax)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">세전 {wonShort(result.severancePay)}</div>
                    <div className="tnum mt-1 text-sm font-medium text-slate-300">
                      퇴직소득세 {wonShort(result.totalTax)} · 실효세율 {pct(result.effectiveTaxRate, 1)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  퇴직금에서 퇴직소득세(+지방세 10%)를 뺀 금액입니다.
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="퇴직금 (세전)" value={wonShort(result.severancePay)} sub={won(result.severancePay)} />
                <StatCard label="퇴직소득세" value={wonShort(result.totalTax)} sub={won(result.totalTax)} highlight />
                <StatCard label="환산급여" value={wonShort(result.convertedSalary)} sub={won(result.convertedSalary)} />
              </div>

              {/* 산출 흐름 */}
              <div>
                <h3 className="mb-2.5 text-sm font-semibold text-slate-700">산출 흐름</h3>
                <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">퇴직금</span>
                    <span className="tnum font-medium text-slate-900">{won(result.severancePay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">− 근속연수공제</span>
                    <span className="tnum text-emerald-700">−{won(result.serviceYearDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">× 12 ÷ 근속연수 = 환산급여</span>
                    <span className="tnum text-slate-900">{won(result.convertedSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">− 환산급여공제</span>
                    <span className="tnum text-emerald-700">−{won(result.convertedSalaryDeduction)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-700">과세표준 (환산)</span>
                    <span className="tnum font-medium text-slate-900">{won(result.taxBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">× 누진세율 × 근속/12 = 산출세액</span>
                    <span className="tnum text-slate-900">{won(result.computedTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">+ 지방소득세 10%</span>
                    <span className="tnum text-slate-900">+{won(result.localTax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold">
                    <span className="text-slate-700">총 세액</span>
                    <span className="tnum text-slate-900">{won(result.totalTax)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">세후 실수령</span>
                    <span className="tnum text-emerald-700">{won(result.netAfterTax)}</span>
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
