import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  calculateStartupTaxRelief,
  StartupTaxInputError,
  type StartupTaxResult,
} from '../lib/tax/startupTax';
import { taxConfig } from '../config/taxConfig';
import { parseNum, won, wonShort, pct } from '../lib/format';

const presets = taxConfig.startupTaxRelief.presets;

interface StartupForm {
  taxableIncome: string;
  presetKey: string;
  years: string;
}

const initialForm: StartupForm = {
  taxableIncome: '500,000,000',
  presetKey: presets[0].key,
  years: '5',
};

export function StartupTaxPage() {
  const [form, setForm] = useState<StartupForm>(initialForm);
  const setField = <K extends keyof StartupForm>(k: K, v: StartupForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));
  const preset = presets.find((p) => p.key === form.presetKey) ?? presets[0];

  const { result, error, isReady } = useMemo(() => {
    const taxableIncome = parseNum(form.taxableIncome);
    const years = parseNum(form.years);
    if (taxableIncome == null || years == null) {
      return { result: null as StartupTaxResult | null, error: null, isReady: false };
    }
    try {
      const res = calculateStartupTaxRelief({ taxableIncome, reductionRate: preset.rate, years });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof StartupTaxInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form, preset.rate]);

  return (
    <div>
      <PageHeader
        title="창업·벤처기업 세액감면 계산기"
        description="조특법 제6조 창업중소기업 등 세액감면을 개략 추정합니다(법인세 기준)."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <NumberInput label="연 과세표준 (법인소득)" suffix="₩" value={form.taxableIncome} onChange={(v) => setField('taxableIncome', v)} />
              <div>
                <span className="text-sm font-medium text-slate-700">감면 유형</span>
                <div className="mt-1.5 space-y-2">
                  {presets.map((p) => (
                    <label key={p.key} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${form.presetKey === p.key ? 'border-brand-300 bg-brand-50' : 'border-slate-200'}`}>
                      <input type="radio" name="preset" checked={form.presetKey === p.key} onChange={() => setField('presetKey', p.key)} className="h-4 w-4 text-brand-600 focus:ring-brand-500" />
                      <span className="flex-1 text-slate-700">{p.label}</span>
                      <span className="tnum font-semibold text-brand-700">{pct(p.rate, 0)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <NumberInput label="감면 기간" suffix="년" comma={false} value={form.years} onChange={(v) => setField('years', v)} />
            </div>
          </Card>

          <Card title="법인세율 / 적용 전제" subtitle={`기준일 ${taxConfig.lastUpdated}`}>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li>• 법인세율: 2억 이하 9% · ~200억 19% · ~3000억 21% · 초과 24%</li>
              <li>• 감면율·기간은 지역·업종·청년 여부 등 요건에 따른 단순화 프리셋입니다.</li>
              <li>• 일몰: {taxConfig.startupTaxRelief.sunsetEstablishBefore} (개정 가능 → 최신 법령 확인)</li>
              <li>• 최저한세·농어촌특별세 등은 미반영한 개략 추정입니다.</li>
            </ul>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              과세표준과 감면 기간을 입력하면 감면세액이 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {result && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="연 법인세 산출세액" value={wonShort(result.corporateTaxPerYear)} sub={won(result.corporateTaxPerYear)} />
                <StatCard label="연 감면세액" value={wonShort(result.reliefPerYear)} sub={`감면율 ${pct(preset.rate, 0)}`} highlight />
                <StatCard label="연 납부세액" value={wonShort(result.payablePerYear)} sub="법인세+지방세" />
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2.5 text-slate-600">감면 기간 총 감면세액</td>
                      <td className="tnum px-4 py-2.5 text-right font-semibold text-emerald-700">{won(result.totalRelief)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-slate-600">감면 기간 총 납부세액</td>
                      <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.totalPayable)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ul className="space-y-1.5">
                {result.warnings.map((w) => (
                  <li key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{w}</li>
                ))}
              </ul>
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
