import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  calculateCompensationPackage,
  CompensationInputError,
  type CompPackageResult,
} from '../lib/comp/compensationPackage';
import { parseNum, won, wonShort, pct } from '../lib/format';

interface CompForm {
  annualSalary: string;
  annualBonus: string;
  dependents: string;
  children: string;
  monthlyNontaxableMeal: string;
  horizonYears: string;
  soShares: string;
  soExercisePrice: string;
  soExpectedMarketPrice: string;
  rsuShares: string;
  rsuFmv: string;
}

const initialForm: CompForm = {
  annualSalary: '60,000,000',
  annualBonus: '5,000,000',
  dependents: '0',
  children: '0',
  monthlyNontaxableMeal: '200,000',
  horizonYears: '4',
  soShares: '10,000',
  soExercisePrice: '1,000',
  soExpectedMarketPrice: '10,000',
  rsuShares: '',
  rsuFmv: '',
};

export function CompensationPackagePage() {
  const [form, setForm] = useState<CompForm>(initialForm);
  const setField = <K extends keyof CompForm>(k: K, v: CompForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const annual = parseNum(form.annualSalary);
    const bonus = parseNum(form.annualBonus) ?? 0;
    const deps = parseNum(form.dependents) ?? 0;
    const kids = parseNum(form.children) ?? 0;
    const meal = parseNum(form.monthlyNontaxableMeal) ?? 0;
    const horizon = parseNum(form.horizonYears);
    if (annual == null || horizon == null) {
      return { result: null as CompPackageResult | null, error: null, isReady: false };
    }
    const soShares = parseNum(form.soShares);
    const soEx = parseNum(form.soExercisePrice);
    const soMp = parseNum(form.soExpectedMarketPrice);
    const stockOption =
      soShares && soEx != null && soMp != null
        ? {
            shares: soShares,
            exercisePrice: soEx,
            expectedMarketPrice: soMp,
            grantYear: new Date().getFullYear(),
            exerciseYear: new Date().getFullYear() + horizon,
            isVentureQualified: true,
          }
        : undefined;
    const rsuShares = parseNum(form.rsuShares);
    const rsuFmv = parseNum(form.rsuFmv);
    const rsu =
      rsuShares && rsuFmv != null
        ? { totalShares: rsuShares, fmvPerShareAtVest: rsuFmv }
        : undefined;
    try {
      const res = calculateCompensationPackage({
        annualSalary: annual,
        annualBonus: bonus,
        dependents: deps,
        children: kids,
        monthlyNontaxableMeal: meal,
        horizonYears: horizon,
        stockOption,
        rsu,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof CompensationInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="임직원 보상 패키지 시뮬레이터 — 양면"
        description="연봉·보너스·스톡옵션·RSU 조합의 N년 누적 가치를 회사 부담 ↔ 임직원 세후 실수령 양면으로 비교합니다."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="기본 입력">
            <div className="space-y-4">
              <NumberInput
                label="연봉"
                suffix="₩"
                value={form.annualSalary}
                onChange={(v) => setField('annualSalary', v)}
              />
              <NumberInput
                label="연 보너스"
                suffix="₩"
                value={form.annualBonus}
                onChange={(v) => setField('annualBonus', v)}
              />
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="부양가족"
                  suffix="명"
                  comma={false}
                  value={form.dependents}
                  onChange={(v) => setField('dependents', v)}
                />
                <NumberInput
                  label="자녀"
                  suffix="명"
                  comma={false}
                  value={form.children}
                  onChange={(v) => setField('children', v)}
                />
              </div>
              <NumberInput
                label="월 비과세 식대"
                suffix="₩"
                value={form.monthlyNontaxableMeal}
                onChange={(v) => setField('monthlyNontaxableMeal', v)}
              />
              <NumberInput
                label="분석 기간"
                suffix="년"
                comma={false}
                value={form.horizonYears}
                onChange={(v) => setField('horizonYears', v)}
                hint="보통 베스팅 기간(4년)"
              />
            </div>
          </Card>

          <Card title="스톡옵션 (선택)">
            <div className="space-y-3">
              <NumberInput
                label="부여 주식수"
                suffix="주"
                optional
                value={form.soShares}
                onChange={(v) => setField('soShares', v)}
              />
              <NumberInput
                label="행사가 (1주)"
                suffix="₩"
                optional
                value={form.soExercisePrice}
                onChange={(v) => setField('soExercisePrice', v)}
              />
              <NumberInput
                label="행사 시점 시가 추정 (1주)"
                suffix="₩"
                optional
                value={form.soExpectedMarketPrice}
                onChange={(v) => setField('soExpectedMarketPrice', v)}
              />
            </div>
          </Card>

          <Card title="RSU (선택)">
            <div className="space-y-3">
              <NumberInput
                label="총 베스팅 주식수"
                suffix="주"
                optional
                value={form.rsuShares}
                onChange={(v) => setField('rsuShares', v)}
              />
              <NumberInput
                label="베스팅 시점 1주 시가 추정"
                suffix="₩"
                optional
                value={form.rsuFmv}
                onChange={(v) => setField('rsuFmv', v)}
              />
            </div>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              연봉과 분석 기간을 입력하면 결과가 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-5" aria-live="polite">
              {/* 핵심: 양면 헤드라인 */}
              <div className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-400">
                      회사 부담 ({result.horizonYears}년 누적)
                    </div>
                    <div className="tnum mt-1 text-xl font-bold tracking-tight text-white">
                      {won(result.companyCostTotal)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400">
                      임직원 세후 실수령 ({result.horizonYears}년)
                    </div>
                    <div className="tnum mt-1 text-xl font-bold tracking-tight text-emerald-300">
                      {won(result.employeeNetTotal)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 border-t border-slate-700 pt-2 text-[11px] text-slate-500">
                  Pass-through: <strong className="text-slate-300">{pct(result.passThroughRate, 1)}</strong> — 회사가 쓴 돈 중 임직원에게 실제로 가는 비율
                </div>
              </div>

              {/* 회사 부담 분해 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">회사 부담 내역</h3>
                  <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    {result.companyCostBreakdown.map((c) => (
                      <div key={c.label} className="flex justify-between">
                        <span className="text-slate-600">{c.label}</span>
                        <span className="tnum font-medium text-slate-900">{won(c.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold">
                      <span className="text-slate-700">합계</span>
                      <span className="tnum text-slate-900">{won(result.companyCostTotal)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">임직원 실수령 내역</h3>
                  <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    {result.employeeNetBreakdown.map((c) => (
                      <div key={c.label} className="flex justify-between">
                        <span className="text-slate-600">{c.label}</span>
                        <span className="tnum font-medium text-slate-900">{won(c.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold">
                      <span className="text-slate-700">합계</span>
                      <span className="tnum text-emerald-700">{won(result.employeeNetTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="회사 부담 / 연"
                  value={wonShort(result.companyCostTotal / result.horizonYears)}
                />
                <StatCard
                  label="임직원 실수령 / 연"
                  value={wonShort(result.employeeNetTotal / result.horizonYears)}
                  highlight
                />
                <StatCard
                  label="Pass-through"
                  value={pct(result.passThroughRate, 1)}
                  sub="회사 지출 → 본인 실수령"
                />
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
