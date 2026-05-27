import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { RelatedLaws } from '../components/RelatedLaws';
import {
  calculateRndTaxCredit,
  RndTaxCreditInputError,
  type RndTaxCreditResult,
} from '../lib/tax/rndTaxCredit';
import { taxConfig } from '../config/taxConfig';
import { parseNum, won, wonShort, pct } from '../lib/format';

interface RndForm {
  currentRndExpense: string;
  priorRndExpense: string;
  companyTypeKey: string;
  taxableIncome: string;
}

const initialForm: RndForm = {
  currentRndExpense: '100,000,000',
  priorRndExpense: '',
  companyTypeKey: 'smb',
  taxableIncome: '500,000,000',
};

export function RndTaxCreditPage() {
  const [form, setForm] = useState<RndForm>(initialForm);
  const setField = <K extends keyof RndForm>(k: K, v: RndForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const current = parseNum(form.currentRndExpense);
    const income = parseNum(form.taxableIncome);
    const prior = parseNum(form.priorRndExpense);
    if (current == null || income == null) {
      return { result: null as RndTaxCreditResult | null, error: null, isReady: false };
    }
    try {
      const res = calculateRndTaxCredit({
        currentRndExpense: current,
        priorRndExpense: prior ?? undefined,
        companyTypeKey: form.companyTypeKey,
        taxableIncome: income,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof RndTaxCreditInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="R&D 세액공제 계산기 (조특법 §10)"
        description="당기 발생액 방식과 증가분 방식 중 더 큰 공제를 자동 선택하고, 최저한세를 적용한 실제 절세액·납부세액을 계산합니다."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-slate-700">기업 유형</span>
                <div className="mt-1.5">
                  <SegmentedControl
                    fullWidth
                    size="sm"
                    ariaLabel="기업 유형"
                    value={form.companyTypeKey}
                    onChange={(v) => setField('companyTypeKey', v)}
                    segments={taxConfig.rndTaxCredit.rates.map((r) => ({ value: r.key, label: r.label }))}
                  />
                </div>
              </div>
              <NumberInput
                label="당기 R&D 지출"
                suffix="₩"
                value={form.currentRndExpense}
                onChange={(v) => setField('currentRndExpense', v)}
                hint="연구개발비 + 인력개발비 (조특법 별표6)"
              />
              <NumberInput
                label="전기 R&D 지출"
                suffix="₩"
                optional
                value={form.priorRndExpense}
                onChange={(v) => setField('priorRndExpense', v)}
                hint="입력 시 증가분 방식 공제와 자동 비교"
              />
              <NumberInput
                label="연 과세표준 (법인소득)"
                suffix="₩"
                value={form.taxableIncome}
                onChange={(v) => setField('taxableIncome', v)}
                hint="법인세 산출 및 최저한세 계산에 사용"
              />
            </div>
          </Card>

          <Card title="적용 전제" subtitle={`기준일 ${taxConfig.lastUpdated}`}>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li>• 당기 발생액 공제: 중소 25% / 중견 8% / 일반 2%</li>
              <li>• 증가분 공제: 중소 50% / 중견 40% / 일반 25% (전기 입력 시)</li>
              <li>• 최저한세: 중소 7% / 그 외 17% (조특법 §132)</li>
              <li>• 일몰: {taxConfig.rndTaxCredit.sunsetBefore} (개정 가능 → 최신 법령 확인)</li>
              <li>• 신성장·원천기술 가산공제·이월공제·연구원 인원 가산은 미반영</li>
            </ul>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              당기 R&D 지출과 과세표준을 입력하면 결과가 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (() => {
            const selected = result.options.find((o) => o.key === result.selectedKey)!;
            return (
              <div className="space-y-5" aria-live="polite">
                {/* 핵심: 실제 절세액 */}
                <div className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium text-slate-400">
                        실제 절세액 (지방세 포함)
                      </div>
                      <div className="tnum mt-1 text-2xl font-bold tracking-tight text-white">
                        {won(result.effectiveTaxSaving)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{selected.label}</div>
                      <div className="tnum mt-1 text-sm font-medium text-slate-300">
                        공제 산정 {wonShort(result.selectedCredit)} · 차감 {wonShort(result.effectiveSaving)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    공제 전 법인세에서 실제 차감된 금액 + 지방세 감소분의 합.
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard label="공제 전 납부세액" value={wonShort(result.totalPayableBefore)} sub={won(result.totalPayableBefore)} />
                  <StatCard label="공제 후 납부세액" value={wonShort(result.totalPayable)} sub={won(result.totalPayable)} highlight />
                  <StatCard label="최저한세" value={wonShort(result.minimumTax)} sub={`과세표준 × ${pct(result.minimumTax / Math.max(1, result.corporateTaxBefore + result.minimumTax))}`} />
                </div>

                {/* 공제 방식 비교 */}
                <div>
                  <h3 className="mb-2.5 text-sm font-semibold text-slate-700">공제 방식 비교</h3>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium">방식</th>
                          <th className="px-4 py-2.5 text-right font-medium">산정 베이스</th>
                          <th className="px-4 py-2.5 text-right font-medium">공제율</th>
                          <th className="px-4 py-2.5 text-right font-medium">공제액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.options.map((o) => {
                          const isRec = o.key === result.selectedKey;
                          return (
                            <tr key={o.key} className={isRec ? 'bg-emerald-50/60' : !o.available ? 'bg-slate-50/60 text-slate-400' : ''}>
                              <td className="px-4 py-2.5 text-slate-800">
                                {o.label}
                                {isRec && (
                                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                    선택
                                  </span>
                                )}
                                {!o.available && (
                                  <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">
                                    적용 불가
                                  </span>
                                )}
                              </td>
                              <td className="tnum px-4 py-2.5 text-right">{won(o.base)}</td>
                              <td className="tnum px-4 py-2.5 text-right">{pct(o.rate, 0)}</td>
                              <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">
                                {won(o.credit)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 산출 흐름 */}
                <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">공제 전 법인세</span>
                    <span className="tnum font-medium text-slate-900">{won(result.corporateTaxBefore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">− 실제 차감 (최저한세 한도)</span>
                    <span className="tnum text-emerald-700">−{won(result.effectiveSaving)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">+ 지방소득세 10%</span>
                    <span className="tnum text-slate-900">+{won(result.localTax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold">
                    <span className="text-slate-700">총 납부세액</span>
                    <span className="tnum text-slate-900">{won(result.totalPayable)}</span>
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
            );
          })()}

          <div className="mt-5 space-y-4">
            <RelatedLaws toolPath="/rnd-tax-credit" />
            <Disclaimer />
          </div>
        </Card>
      </div>
    </div>
  );
}
