import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { useStockOptionTax } from '../hooks/useStockOptionTax';
import { taxConfig } from '../config/taxConfig';
import { won, wonShort, pct, num } from '../lib/format';

function UsageBar({ label, rate, detail }: { label: string; rate: number; detail: string }) {
  const clamped = Math.min(1, Math.max(0, rate));
  const over = rate >= 1;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="tnum text-slate-500">{detail}</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-brand-500'}`}
          style={{ width: `${clamped * 100}%` }}
        />
      </div>
    </div>
  );
}

export function TaxPage() {
  const { form, setField, reset, result, error, isReady } = useStockOptionTax();

  return (
    <div>
      <PageHeader
        title="스톡옵션 세제 계산기"
        description="벤처기업 임직원·창업자의 주식매수선택권 행사이익에 대한 비과세(조특법 16조의2)·분할납부·양도세 선택을 개략 추정으로 비교합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        {/* 입력 */}
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="부여 연도"
                  suffix="년"
                  comma={false}
                  value={form.grantYear}
                  onChange={(v) => setField('grantYear', v)}
                />
                <NumberInput
                  label="행사 연도"
                  suffix="년"
                  comma={false}
                  value={form.exerciseYear}
                  onChange={(v) => setField('exerciseYear', v)}
                />
              </div>
              <NumberInput
                label="행사 당시 시가 (1주당)"
                suffix="₩"
                value={form.marketPrice}
                onChange={(v) => setField('marketPrice', v)}
              />
              <NumberInput
                label="행사가격 (1주당)"
                suffix="₩"
                value={form.exercisePrice}
                onChange={(v) => setField('exercisePrice', v)}
              />
              <NumberInput
                label="행사 주식수"
                suffix="주"
                value={form.shares}
                onChange={(v) => setField('shares', v)}
              />
              <NumberInput
                label="과거 누적 비과세 사용액"
                suffix="₩"
                optional
                value={form.priorCumulativeExemptionUsed}
                onChange={(v) => setField('priorCumulativeExemptionUsed', v)}
                hint="이전 행사에서 사용한 벤처기업별 누적 비과세액"
              />

              <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.isVentureQualified}
                  onChange={(e) => setField('isVentureQualified', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700">벤처기업 요건 충족</span>
              </label>

              <div>
                <span className="text-sm font-medium text-slate-700">양도세 선택 시 세율 유형</span>
                <div className="mt-1.5">
                  <SegmentedControl
                    fullWidth
                    size="sm"
                    ariaLabel="양도세 세율 유형"
                    value={form.capitalGainsType}
                    onChange={(v) => setField('capitalGainsType', v)}
                    segments={taxConfig.capitalGains.types.map((t) => ({ value: t.key, label: t.label }))}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  대주주: 양도차익 3억 이하 20% / 초과 25% · 소액주주(중소기업) 10%
                </p>
              </div>

              <button
                type="button"
                onClick={reset}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                초기화
              </button>
            </div>
          </Card>

          <Card title="적용 전제" subtitle={`기준일 ${taxConfig.lastUpdated}`}>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li>• 연간 비과세 한도: 2023년 이후 행사분 2억원, 이전 5천만원 (조특법 16조의2)</li>
              <li>• 벤처기업별 누적 비과세 한도: 5억원</li>
              <li>
                • 일몰: {taxConfig.stockOption.sunsetGrantBefore} 이전 부여분 (개정 가능 → 최신
                법령 확인)
              </li>
              <li>• 세액은 다른 소득과 합산하지 않은 단순화 추정입니다.</li>
            </ul>
          </Card>
        </div>

        {/* 결과 */}
        <div className="space-y-5">
          <Card title="결과">
            {!isReady && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                부여/행사 연도, 시가·행사가격·주식수를 입력하면 결과가 표시됩니다.
              </div>
            )}
            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {result && (() => {
              const rec =
                result.scenarios.find((s) => s.key === result.recommendedKey) ?? result.scenarios[0];
              return (
              <div className="space-y-5" aria-live="polite">
                {/* 핵심: 결국 내 손에 떨어지는 돈 */}
                <div className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium text-slate-400">
                        세후 실수령액 (추천 시나리오 기준)
                      </div>
                      <div className="tnum mt-1 text-2xl font-bold tracking-tight text-white">
                        {won(rec.netAfterTax)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{rec.label}</div>
                      <div className="tnum mt-1 text-sm font-medium text-slate-300">
                        세금 {wonShort(rec.totalTax)} · 실효세율 {pct(rec.effectiveTaxRate, 1)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    행사이익 {wonShort(result.exerciseGain)}에서 세금을 뺀 실제 수령액입니다.
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard label="행사이익" value={wonShort(result.exerciseGain)} sub={won(result.exerciseGain)} />
                  <StatCard
                    label="비과세액"
                    value={wonShort(result.exemptionApplied)}
                    sub={won(result.exemptionApplied)}
                    highlight
                  />
                  <StatCard
                    label="과세대상액"
                    value={wonShort(result.taxableAmount)}
                    sub={won(result.taxableAmount)}
                  />
                </div>

                <div className="space-y-3 rounded-xl bg-slate-50 px-4 py-4">
                  <UsageBar
                    label="연간 비과세 한도 소진율"
                    rate={result.annualUsageRate}
                    detail={`${won(result.exemptionApplied)} / ${won(result.annualExemptionLimit)}`}
                  />
                  <UsageBar
                    label="누적 비과세 한도 소진율"
                    rate={result.cumulativeUsageRate}
                    detail={`${pct(result.cumulativeUsageRate)} / 5억원`}
                  />
                </div>

                {/* 시나리오 비교 */}
                <div>
                  <h3 className="mb-2.5 text-sm font-semibold text-slate-700">
                    납부 시나리오 비교 <span className="font-normal text-slate-400">(개략 추정)</span>
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium">시나리오</th>
                          <th className="px-4 py-2.5 text-right font-medium">총 세액</th>
                          <th className="px-4 py-2.5 text-right font-medium">세후 실수령</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.scenarios.map((s) => {
                          const isRec =
                            s.key === result.recommendedKey && s.key !== 'laborInstallment';
                          return (
                            <tr key={s.key} className={isRec ? 'bg-emerald-50/60' : ''}>
                              <td className="px-4 py-2.5 text-slate-800">
                                {s.label}
                                {isRec && (
                                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                    최대 실수령
                                  </span>
                                )}
                              </td>
                              <td className="tnum px-4 py-2.5 text-right text-slate-600">
                                {won(s.totalTax)}
                              </td>
                              <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">
                                {won(s.netAfterTax)}
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

                {/* 분할납부 스케줄 */}
                {(() => {
                  const inst = result.scenarios.find((s) => s.key === 'laborInstallment');
                  if (!inst?.schedule) return null;
                  return (
                    <div>
                      <h3 className="mb-2.5 text-sm font-semibold text-slate-700">
                        분할납부 스케줄 ({taxConfig.stockOption.installmentYears}년, 무이자 가정)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {inst.schedule.map((item) => (
                          <div
                            key={item.installment}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center"
                          >
                            <div className="text-xs text-slate-400">{item.installment}년차</div>
                            <div className="tnum text-sm font-semibold text-slate-800">
                              {won(item.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {result.warnings.length > 0 && (
                  <ul className="space-y-1.5">
                    {result.warnings.map((w) => (
                      <li
                        key={w}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                      >
                        {w}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-xs text-slate-400">
                  ※ 행사이익 {num(result.exerciseGain)}원 기준. 양도세 선택 세율은 추정값이며 대주주
                  여부·보유기간 등에 따라 달라집니다.
                </p>
              </div>
              );
            })()}

            <div className="mt-5">
              <Disclaimer />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
