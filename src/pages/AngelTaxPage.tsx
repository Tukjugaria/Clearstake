import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { calculateAngelTax, AngelTaxInputError, type AngelTaxResult } from '../lib/tax/angelTax';
import { taxConfig } from '../config/taxConfig';
import { parseNum, won, wonShort, pct } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface AngelForm {
  investmentAmount: string;
  comprehensiveIncome: string;
  investYear: string;
}

const initialForm: AngelForm = {
  investmentAmount: '50,000,000',
  comprehensiveIncome: '200,000,000',
  investYear: '2025',
};

function tierLabel(upTo: number | null, idx: number): string {
  if (idx === 0) return '3천만원 이하';
  if (upTo == null) return '5천만원 초과';
  return '3천만~5천만원';
}

export function AngelTaxPage() {
  const [form, setForm] = useState<AngelForm>(initialForm);
  const { isFounder } = usePerspective();
  const setField = <K extends keyof AngelForm>(k: K, v: AngelForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const investmentAmount = parseNum(form.investmentAmount);
    const comprehensiveIncome = parseNum(form.comprehensiveIncome);
    const ready = investmentAmount != null && comprehensiveIncome != null;
    if (!ready) return { result: null as AngelTaxResult | null, error: null, isReady: false };
    try {
      const res = calculateAngelTax({
        investmentAmount: investmentAmount!,
        comprehensiveIncome: comprehensiveIncome!,
        investYear: parseNum(form.investYear) ?? undefined,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof AngelTaxInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="엔젤투자 소득공제 계산기"
        description="조특법 제16조 개인 벤처투자 소득공제(구간별 공제율·종합소득금액 50% 한도)를 개략 추정합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <NumberInput label="투자금액" suffix="₩" value={form.investmentAmount} onChange={(v) => setField('investmentAmount', v)} />
              <NumberInput
                label="종합소득금액"
                suffix="₩"
                value={form.comprehensiveIncome}
                onChange={(v) => setField('comprehensiveIncome', v)}
                hint="공제 한도(소득의 50%) 계산에 사용됩니다."
              />
              <NumberInput label="투자 연도" suffix="년" comma={false} optional value={form.investYear} onChange={(v) => setField('investYear', v)} />
            </div>
          </Card>

          <Card title="공제율 구간" subtitle={`조특법 제16조 · 기준일 ${taxConfig.lastUpdated}`}>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li>• 3천만원 이하: <strong className="text-slate-700">100%</strong> 공제</li>
              <li>• 3천만~5천만원: <strong className="text-slate-700">70%</strong> 공제</li>
              <li>• 5천만원 초과: <strong className="text-slate-700">30%</strong> 공제</li>
              <li>• 한도: 종합소득금액의 50%</li>
              <li>• 일몰: {taxConfig.angelInvestment.sunsetInvestBefore} (개정 가능 → 최신 법령 확인)</li>
            </ul>
          </Card>
        </div>

        <Card title="결과" subtitle={isFounder ? '창업자 관점 — 엔젤 유치 시 투자자 혜택' : '투자자 관점 — 내 절세'}>
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              투자금액과 종합소득금액을 입력하면 공제액이 표시됩니다.
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
                <StatCard label="적용 공제액" value={wonShort(result.deductionApplied)} sub={won(result.deductionApplied)} highlight />
                <StatCard label="추정 절세액" value={wonShort(result.estimatedTaxSaving)} sub={won(result.estimatedTaxSaving)} />
                <StatCard label="실효 공제율" value={pct(result.effectiveDeductionRate)} sub="공제액 / 투자금" />
              </div>

              {/* 핵심: 세금 떼고 실제로 들어오는 돈 */}
              <div className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-400">
                      세후 실수령액 (엔젤투자 반영)
                    </div>
                    <div className="tnum mt-1 text-2xl font-bold tracking-tight text-white">
                      {won(result.netAfterDeduction)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">납부세액 {wonShort(result.taxAfterDeduction)}</div>
                    <div className="tnum mt-1 text-sm font-medium text-slate-300">
                      실효세율 {pct(result.effectiveTaxRate, 1)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  종합소득금액에서 종합소득세(+지방소득세 10%)를 뺀 금액입니다. 기본공제·연금 등 다른
                  공제는 미반영한 보수적 추정이라 실제 실수령은 이보다 클 수 있습니다.
                </div>
              </div>

              {/* 엔젤투자 전/후 비교 */}
              <div>
                <h3 className="mb-2.5 text-sm font-semibold text-slate-700">
                  엔젤투자 반영 전 · 후 비교
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium"> </th>
                        <th className="px-4 py-2.5 text-right font-medium">투자 전</th>
                        <th className="px-4 py-2.5 text-right font-medium">투자 후</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">납부세액</td>
                        <td className="tnum px-4 py-2.5 text-right text-slate-600">{won(result.taxBeforeDeduction)}</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.taxAfterDeduction)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">세후 실수령</td>
                        <td className="tnum px-4 py-2.5 text-right text-slate-600">{won(result.netBeforeDeduction)}</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-emerald-700">{won(result.netAfterDeduction)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">구간</th>
                      <th className="px-4 py-2.5 text-right font-medium">공제율</th>
                      <th className="px-4 py-2.5 text-right font-medium">투자 배분</th>
                      <th className="px-4 py-2.5 text-right font-medium">공제액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.tiers.map((t, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-slate-700">{tierLabel(t.upTo, i)}</td>
                        <td className="tnum px-4 py-2.5 text-right text-slate-600">{pct(t.rate, 0)}</td>
                        <td className="tnum px-4 py-2.5 text-right text-slate-600">{won(t.portion)}</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(t.deduction)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-700" colSpan={3}>한도 적용 전 합계</td>
                      <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.deductionBeforeCap)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                공제 한도(종합소득금액의 50%): <strong className="tnum text-slate-900">{won(result.deductionLimit)}</strong>
                {result.deductionBeforeCap > result.deductionLimit && (
                  <span className="text-amber-700"> → 한도까지만 적용</span>
                )}
              </div>

              {result.warnings.length > 0 && (
                <ul className="space-y-1.5">
                  {result.warnings.map((w) => (
                    <li key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{w}</li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-slate-400">
                ※ 다른 소득공제·세액공제를 반영하지 않은 개략 추정입니다. 적격 투자대상·보유요건(3년 등) 충족 여부는 별도 확인이 필요합니다.
              </p>
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
