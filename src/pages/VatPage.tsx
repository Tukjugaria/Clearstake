import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { calculateVat, VatInputError, type VatResult } from '../lib/tax/vat';
import { taxConfig } from '../config/taxConfig';
import { parseNum, won, wonShort, pct } from '../lib/format';

interface VatForm {
  annualSales: string;
  annualPurchases: string;
  salesIncludesVat: 'yes' | 'no';
  simplifiedSectorKey: string;
}

const initialForm: VatForm = {
  annualSales: '50,000,000',
  annualPurchases: '20,000,000',
  salesIncludesVat: 'no',
  simplifiedSectorKey: 'retail',
};

export function VatPage() {
  const [form, setForm] = useState<VatForm>(initialForm);
  const setField = <K extends keyof VatForm>(k: K, v: VatForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const sales = parseNum(form.annualSales);
    const purchases = parseNum(form.annualPurchases);
    if (sales == null || purchases == null) {
      return { result: null as VatResult | null, error: null, isReady: false };
    }
    try {
      const res = calculateVat({
        annualSales: sales,
        annualPurchases: purchases,
        salesIncludesVat: form.salesIncludesVat === 'yes',
        simplifiedSectorKey: form.simplifiedSectorKey,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof VatInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="부가가치세(VAT) 계산기 — 일반 vs 간이 비교"
        description="매출·매입을 입력하면 일반과세와 간이과세 납부세액을 동시 계산해 어느 방식이 유리한지 보여줍니다."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <NumberInput
                label="연 매출"
                suffix="₩"
                value={form.annualSales}
                onChange={(v) => setField('annualSales', v)}
              />
              <div>
                <span className="text-sm font-medium text-slate-700">매출이 VAT 포함 금액인가요?</span>
                <div className="mt-1.5">
                  <SegmentedControl
                    fullWidth
                    size="sm"
                    ariaLabel="VAT 포함 여부"
                    value={form.salesIncludesVat}
                    onChange={(v) => setField('salesIncludesVat', v as VatForm['salesIncludesVat'])}
                    segments={[
                      { value: 'no', label: 'VAT 별도' },
                      { value: 'yes', label: 'VAT 포함' },
                    ]}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  VAT 포함이면 1.1로 나눠 공급가액으로 환산해 계산합니다.
                </p>
              </div>
              <NumberInput
                label="연 매입 (공급가액)"
                suffix="₩"
                value={form.annualPurchases}
                onChange={(v) => setField('annualPurchases', v)}
                hint="세금계산서상 공급가액 합계 (매입세액 = 이 금액 × 10%)"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">간이과세 업종 (부가율)</span>
                <div className="mt-1.5 space-y-1.5">
                  {taxConfig.vat.simplifiedSectors.map((s) => (
                    <label
                      key={s.key}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        form.simplifiedSectorKey === s.key
                          ? 'border-brand-500 bg-brand-50/50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="sector"
                          checked={form.simplifiedSectorKey === s.key}
                          onChange={() => setField('simplifiedSectorKey', s.key)}
                          className="h-4 w-4 text-brand-600"
                        />
                        <span className="text-slate-700">{s.label}</span>
                      </span>
                      <span className="tnum text-xs font-medium text-slate-500">
                        {(s.rate * 100).toFixed(0)}%
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="적용 전제" subtitle={`기준일 ${taxConfig.lastUpdated}`}>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li>• 일반과세 세율: 10% (부가가치세법)</li>
              <li>
                • 간이과세: 연 매출 {(taxConfig.vat.simplifiedThreshold / 1_0000_0000).toFixed(2)}억
                미만만 적용. 환급 불가
              </li>
              <li>• 간이과세 매입공제율: 매입가 × 0.5%</li>
              <li>• 면세·영세율·의제매입세액·신용카드 매출세액공제는 미반영</li>
            </ul>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              연 매출·매입을 입력하면 결과가 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (() => {
            const rec = result.scenarios.find((s) => s.key === result.recommendedKey)!;
            return (
              <div className="space-y-5" aria-live="polite">
                {/* 핵심: 추천 방식의 납부세액 */}
                <div className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium text-slate-400">
                        납부세액 (추천: {rec.label})
                      </div>
                      <div className="tnum mt-1 text-2xl font-bold tracking-tight text-white">
                        {rec.netPayable < 0 ? `환급 ${won(-rec.netPayable)}` : won(rec.netPayable)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">공급가액 매출 {wonShort(result.netSales)}</div>
                      <div className="tnum mt-1 text-sm font-medium text-slate-300">
                        실효 부담률 {pct(result.effectiveRate, 2)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    매출세액에서 매입세액을 차감한 실제 납부할 부가세입니다.
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard label="공급가액 매출" value={wonShort(result.netSales)} sub={won(result.netSales)} />
                  <StatCard label="매입 공급가액" value={wonShort(result.netPurchases)} sub={won(result.netPurchases)} />
                  <StatCard label="추천 방식" value={rec.label.replace(/\s*\(.*\)/, '')} sub={`납부 ${won(Math.max(0, rec.netPayable))}`} highlight />
                </div>

                {/* 일반 vs 간이 비교 */}
                <div>
                  <h3 className="mb-2.5 text-sm font-semibold text-slate-700">일반 · 간이 비교</h3>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium">시나리오</th>
                          <th className="px-4 py-2.5 text-right font-medium">매출세액</th>
                          <th className="px-4 py-2.5 text-right font-medium">매입공제</th>
                          <th className="px-4 py-2.5 text-right font-medium">납부세액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.scenarios.map((s) => {
                          const isRec = s.key === result.recommendedKey;
                          return (
                            <tr key={s.key} className={isRec ? 'bg-emerald-50/60' : !s.eligible ? 'bg-slate-50/60 text-slate-400' : ''}>
                              <td className="px-4 py-2.5 text-slate-800">
                                {s.label}
                                {isRec && (
                                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                    유리
                                  </span>
                                )}
                                {!s.eligible && (
                                  <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">
                                    적용 불가
                                  </span>
                                )}
                              </td>
                              <td className="tnum px-4 py-2.5 text-right">{won(s.outputTax)}</td>
                              <td className="tnum px-4 py-2.5 text-right">{won(s.inputCredit)}</td>
                              <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">
                                {s.netPayable < 0 ? `환급 ${won(-s.netPayable)}` : won(s.netPayable)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-400">
                    {result.scenarios.map((s) => (
                      <li key={s.key}>
                        <strong className="text-slate-500">{s.label}:</strong> {s.note}
                      </li>
                    ))}
                  </ul>
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

          <div className="mt-5">
            <Disclaimer />
          </div>
        </Card>
      </div>
    </div>
  );
}
