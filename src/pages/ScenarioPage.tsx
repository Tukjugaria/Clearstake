import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { StackedBar } from '../components/ui/StackedBar';
import { Disclaimer } from '../components/ui/Disclaimer';
import { calculateStockOptionTax, StockOptionTaxInputError } from '../lib/tax/stockOptionTax';
import type { StockOptionTaxResult } from '../lib/tax/types';
import { parseNum, won, wonShort, pct, num } from '../lib/format';
import { groupColors } from '../lib/groups';
import { usePerspective } from '../context/PerspectiveContext';

interface ScenarioForm {
  preMoney: string;
  newMoney: string;
  currentShares: string;
  founderShares: string;
  exerciseShares: string;
  exercisePrice: string;
  grantYear: string;
  exerciseYear: string;
  isVentureQualified: boolean;
}

const initialForm: ScenarioForm = {
  preMoney: '20,000,000,000',
  newMoney: '5,000,000,000',
  currentShares: '1,000,000',
  founderShares: '700,000',
  exerciseShares: '20,000',
  exercisePrice: '2,000',
  grantYear: '2021',
  exerciseYear: '2025',
  isVentureQualified: true,
};

interface Computed {
  pricePerShare: number;
  postMoney: number;
  newInvestorShares: number;
  postTotalShares: number;
  founderPctBefore: number;
  founderPctAfter: number;
  newInvestorPct: number;
  tax: StockOptionTaxResult;
}

export function ScenarioPage() {
  const [form, setForm] = useState<ScenarioForm>(initialForm);
  const { isFounder } = usePerspective();

  const setField = <K extends keyof ScenarioForm>(key: K, value: ScenarioForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const { computed, error, isReady } = useMemo(() => {
    const preMoney = parseNum(form.preMoney);
    const newMoney = parseNum(form.newMoney) ?? 0;
    const currentShares = parseNum(form.currentShares);
    const founderShares = parseNum(form.founderShares) ?? 0;
    const exerciseShares = parseNum(form.exerciseShares);
    const exercisePrice = parseNum(form.exercisePrice);
    const grantYear = parseNum(form.grantYear);
    const exerciseYear = parseNum(form.exerciseYear);

    const ready =
      preMoney != null &&
      currentShares != null &&
      currentShares > 0 &&
      exerciseShares != null &&
      exercisePrice != null &&
      grantYear != null &&
      exerciseYear != null;
    if (!ready) return { computed: null, error: null, isReady: false };

    if (preMoney! <= 0) {
      return { computed: null, error: 'pre-money 기업가치는 0보다 커야 합니다.', isReady: true };
    }

    const pricePerShare = preMoney! / currentShares!;
    const newInvestorShares = Math.floor(newMoney / pricePerShare);
    const postTotalShares = currentShares! + newInvestorShares;

    try {
      const tax = calculateStockOptionTax({
        grantYear: grantYear!,
        exerciseYear: exerciseYear!,
        marketPrice: pricePerShare, // 라운드가 시가를 정한다 (핵심 연결)
        exercisePrice: exercisePrice!,
        shares: exerciseShares!,
        isVentureQualified: form.isVentureQualified,
      });
      const computed: Computed = {
        pricePerShare,
        postMoney: preMoney! + newMoney,
        newInvestorShares,
        postTotalShares,
        founderPctBefore: founderShares / currentShares!,
        founderPctAfter: founderShares / postTotalShares,
        newInvestorPct: newInvestorShares / postTotalShares,
        tax,
      };
      return { computed, error: null, isReady: true };
    } catch (e) {
      const msg =
        e instanceof StockOptionTaxInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { computed: null, error: msg, isReady: true };
    }
  }, [form]);

  const recommended = computed?.tax.scenarios.find((s) => s.key === computed.tax.recommendedKey);

  return (
    <div>
      <PageHeader
        title="통합 시나리오"
        description="“이 라운드 후 옵션을 행사하면 세금은?” — 라운드가 정하는 주당가치를 행사 시 시가로 연결해 희석과 세금을 한 흐름으로 봅니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        {/* 입력 */}
        <div className="space-y-5">
          <Card title="① 후속 라운드">
            <div className="space-y-4">
              <NumberInput
                label="pre-money 기업가치"
                suffix="₩"
                value={form.preMoney}
                onChange={(v) => setField('preMoney', v)}
              />
              <NumberInput
                label="신규 투자금"
                suffix="₩"
                value={form.newMoney}
                onChange={(v) => setField('newMoney', v)}
              />
              <NumberInput
                label="현재 완전희석 주식수"
                suffix="주"
                value={form.currentShares}
                onChange={(v) => setField('currentShares', v)}
              />
              <NumberInput
                label="창업자 보유 주식수"
                suffix="주"
                value={form.founderShares}
                onChange={(v) => setField('founderShares', v)}
              />
            </div>
          </Card>

          <Card title="② 옵션 행사" subtitle="시가는 위 라운드 주당가격으로 자동 연결됩니다">
            <div className="space-y-4">
              <NumberInput
                label="행사 주식수"
                suffix="주"
                value={form.exerciseShares}
                onChange={(v) => setField('exerciseShares', v)}
              />
              <NumberInput
                label="행사가격 (1주당)"
                suffix="₩"
                value={form.exercisePrice}
                onChange={(v) => setField('exercisePrice', v)}
              />
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
              <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.isVentureQualified}
                  onChange={(e) => setField('isVentureQualified', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700">벤처기업 요건 충족</span>
              </label>
            </div>
          </Card>
        </div>

        {/* 결과 */}
        <div className="space-y-5">
          <Card title="결과" subtitle={isFounder ? '창업자 관점' : '투자자 관점'}>
            {!isReady && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                라운드와 옵션 행사 정보를 입력하면 통합 결과가 표시됩니다.
              </div>
            )}
            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {computed && (
              <div className="space-y-5" aria-live="polite">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCard
                    label="라운드 주당가격 (= 행사 시 시가)"
                    value={won(computed.pricePerShare)}
                    sub={`post-money ${wonShort(computed.postMoney)}`}
                  />
                  {isFounder ? (
                    <StatCard
                      label="라운드 후 창업자 지분"
                      value={pct(computed.founderPctAfter)}
                      sub={`라운드 전 ${pct(computed.founderPctBefore)}`}
                      highlight
                    />
                  ) : (
                    <StatCard
                      label="신규 투자자 지분"
                      value={pct(computed.newInvestorPct)}
                      sub={`${num(computed.newInvestorShares)}주`}
                      highlight
                    />
                  )}
                  <StatCard label="행사이익" value={wonShort(computed.tax.exerciseGain)} sub={won(computed.tax.exerciseGain)} />
                  <StatCard
                    label="예상 세액 (최저 시나리오)"
                    value={won(recommended?.totalTax ?? 0)}
                    sub={recommended?.label}
                  />
                </div>

                {/* 라운드 후 지분 구성 */}
                <div>
                  <h3 className="mb-2.5 text-sm font-semibold text-slate-700">라운드 후 지분 구성</h3>
                  <StackedBar
                    segments={[
                      {
                        label: '창업자',
                        value: computed.founderPctAfter,
                        color: groupColors.founder,
                      },
                      {
                        label: '기타 기존 주주',
                        value: Math.max(
                          0,
                          1 - computed.founderPctAfter - computed.newInvestorPct,
                        ),
                        color: groupColors.existing,
                      },
                      {
                        label: '신규 투자자',
                        value: computed.newInvestorPct,
                        color: groupColors.newInvestor,
                      },
                    ]}
                  />
                </div>

                {/* 세금 시나리오 */}
                <div>
                  <h3 className="mb-2.5 text-sm font-semibold text-slate-700">
                    행사 시 세금 <span className="font-normal text-slate-400">(개략 추정)</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatCard
                      label="비과세액"
                      value={wonShort(computed.tax.exemptionApplied)}
                      sub={`연 한도 ${wonShort(computed.tax.annualExemptionLimit)}`}
                    />
                    <StatCard label="과세대상액" value={wonShort(computed.tax.taxableAmount)} />
                    <StatCard
                      label="누적 한도 소진"
                      value={pct(computed.tax.cumulativeUsageRate)}
                      sub="/ 5억원"
                    />
                  </div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium">시나리오</th>
                          <th className="px-4 py-2.5 text-right font-medium">총 세액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {computed.tax.scenarios.map((s) => (
                          <tr
                            key={s.key}
                            className={
                              s.key === computed.tax.recommendedKey && s.key !== 'laborInstallment'
                                ? 'bg-emerald-50/60'
                                : ''
                            }
                          >
                            <td className="px-4 py-2.5 text-slate-800">{s.label}</td>
                            <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">
                              {won(s.totalTax)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 관점 요약 */}
                <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-800">
                  {isFounder ? (
                    <>
                      이 라운드로 창업자 지분은 {pct(computed.founderPctBefore)} →{' '}
                      <strong>{pct(computed.founderPctAfter)}</strong>로 희석되고, 같은 주당가치(
                      {won(computed.pricePerShare)})를 시가로 옵션을 행사하면 행사이익{' '}
                      <strong>{wonShort(computed.tax.exerciseGain)}</strong> 중 과세대상은{' '}
                      <strong>{wonShort(computed.tax.taxableAmount)}</strong>입니다.
                    </>
                  ) : (
                    <>
                      신규 투자자는 주당 <strong>{won(computed.pricePerShare)}</strong>에 진입해 라운드
                      후 <strong>{pct(computed.newInvestorPct)}</strong> 지분을 확보합니다. 동일
                      주당가치가 임직원 옵션 행사 시 시가가 됩니다.
                    </>
                  )}
                </div>

                {computed.tax.warnings.length > 0 && (
                  <ul className="space-y-1.5">
                    {computed.tax.warnings.map((w) => (
                      <li
                        key={w}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                      >
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
    </div>
  );
}
