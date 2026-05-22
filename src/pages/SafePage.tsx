import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatCard } from '../components/ui/StatCard';
import { StackedBar } from '../components/ui/StackedBar';
import { Disclaimer } from '../components/ui/Disclaimer';
import { useSafeCalculator } from '../hooks/useSafeCalculator';
import { paramsToSafeForm, buildSafeShareUrl } from '../lib/scenarioUrl';
import { safeConfig } from '../config/safeConfig';
import { won, pct, num } from '../lib/format';
import { groupColors } from '../lib/groups';
import { usePerspective } from '../context/PerspectiveContext';

const basisLabel: Record<string, string> = {
  cap: 'Valuation Cap 기준',
  discount: 'Discount 기준',
  roundPrice: '라운드 주당가격',
};

export function SafePage() {
  const [searchParams] = useSearchParams();
  const initial = useMemo(() => paramsToSafeForm(searchParams), [searchParams]);
  const { form, setField, reset, result, error, isReady } = useSafeCalculator(initial);
  const { isFounder } = usePerspective();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = buildSafeShareUrl(form);
    try {
      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, '', url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('아래 URL을 복사하세요 (서버 저장 없음):', url);
    }
  };

  return (
    <div>
      <PageHeader
        title="SAFE 전환 계산기"
        description="cap·discount 기반으로 SAFE 투자가 후속 라운드에서 몇 주·몇 %로 전환되는지 계산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        {/* ── 입력 패널 ── */}
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <NumberInput
                label="투자금액"
                suffix="₩"
                value={form.investmentAmount}
                onChange={(v) => setField('investmentAmount', v)}
                placeholder="예: 200,000,000"
              />
              <NumberInput
                label="Valuation Cap"
                suffix="₩"
                optional
                value={form.valuationCap}
                onChange={(v) => setField('valuationCap', v)}
                placeholder="예: 8,000,000,000"
              />
              <NumberInput
                label="Discount Rate"
                suffix="%"
                optional
                value={form.discountPct}
                onChange={(v) => setField('discountPct', v)}
                placeholder="예: 20"
              />

              <div>
                <span className="text-sm font-medium text-slate-700">SAFE 유형</span>
                <div className="mt-1.5">
                  <SegmentedControl
                    fullWidth
                    ariaLabel="SAFE 유형"
                    value={form.safeType}
                    onChange={(v) => setField('safeType', v)}
                    segments={[
                      { value: 'pre', label: 'pre-money' },
                      { value: 'post', label: 'post-money' },
                    ]}
                  />
                </div>
                {form.safeType === 'post' && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    post-money SAFE는 지분율(투자금÷post-money Cap)이 서명 시점에 고정되며, 그 희석은
                    기존 주주가 부담합니다. 단일 SAFE 기준이며, 복수 SAFE·옵션풀 효과는 캡테이블
                    시뮬레이터에서 확인하세요.
                  </p>
                )}
              </div>

              <div>
                <NumberInput
                  label="후속 라운드 기업가치"
                  suffix="₩"
                  value={form.roundValuation}
                  onChange={(v) => setField('roundValuation', v)}
                  placeholder="예: 10,000,000,000"
                />
                <div className="mt-2">
                  <SegmentedControl
                    size="sm"
                    ariaLabel="기업가치 기준"
                    value={form.valuationBasis}
                    onChange={(v) => setField('valuationBasis', v)}
                    segments={[
                      { value: 'preMoney', label: 'pre-money' },
                      { value: 'postMoney', label: 'post-money' },
                    ]}
                  />
                </div>
              </div>

              <NumberInput
                label="라운드 신규 투자금"
                suffix="₩"
                optional
                value={form.newMoneyInvestment}
                onChange={(v) => setField('newMoneyInvestment', v)}
                placeholder="신규 투자자 지분 계산용"
                hint="post-money 환산 및 신규 투자자 지분 계산에 사용됩니다."
              />
              <NumberInput
                label="전환 직전 완전희석 주식수"
                suffix="주"
                value={form.preRoundFullyDilutedShares}
                onChange={(v) => setField('preRoundFullyDilutedShares', v)}
                placeholder="예: 1,000,000"
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={share}
                  disabled={!isReady}
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copied ? '복사됨 ✓' : 'URL로 시나리오 공유'}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  초기화
                </button>
              </div>
            </div>
          </Card>

          {/* SAFE 요건 안내 */}
          <Card title="SAFE 요건 안내" subtitle="벤처투자법 시행규칙 제3조">
            <ul className="space-y-2.5">
              {safeConfig.requirements.map((req) => (
                <li key={req} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400">
              ※ 안내(체크리스트)용이며 법적 효력 판단은 하지 않습니다.
            </p>
          </Card>
        </div>

        {/* ── 결과 패널 ── */}
        <div className="space-y-5">
          <Card
            title="결과"
            subtitle={isFounder ? '창업자 관점 — 희석 강조' : '투자자 관점 — 전환 지분 강조'}
          >
            {!isReady && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                필수 입력(투자금액 · 후속 라운드 기업가치 · 전환 직전 주식수)을 채우면 결과가
                실시간으로 표시됩니다.
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
                  <StatCard
                    label="전환 주식수"
                    value={`${num(result.conversionShares)}`}
                    sub="주"
                    highlight={!isFounder}
                  />
                  <StatCard
                    label={isFounder ? 'SAFE 투자자에게 줄 지분' : '내 전환 지분율'}
                    value={pct(result.ownership.safeOwnershipPct)}
                    highlight={!isFounder}
                  />
                  <StatCard
                    label="적용 기준"
                    value={
                      <span className="text-base">{basisLabel[result.appliedBasis]}</span>
                    }
                    sub="cap vs discount 중 유리한 값"
                  />
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <span>
                      전환 주당가격{' '}
                      <strong className="tnum text-slate-900">{won(result.conversionPrice)}</strong>
                    </span>
                    <span>
                      라운드 주당가격{' '}
                      <strong className="tnum text-slate-900">{won(result.roundPricePerShare)}</strong>
                    </span>
                    <span>
                      실효 할인율{' '}
                      <strong className="tnum text-slate-900">
                        {pct(result.effectiveDiscountVsRound)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* 지분 구성 */}
                <div>
                  <h3 className="mb-2.5 text-sm font-semibold text-slate-700">
                    라운드 후 지분 구성
                  </h3>
                  <StackedBar
                    segments={[
                      {
                        label: '기존 주주',
                        value: result.ownership.existingOwnershipPct,
                        color: groupColors.existing,
                      },
                      {
                        label: 'SAFE 투자자',
                        value: result.ownership.safeOwnershipPct,
                        color: groupColors.safe,
                      },
                      {
                        label: '신규 투자자',
                        value: result.ownership.newInvestorOwnershipPct,
                        color: groupColors.newInvestor,
                      },
                    ]}
                  />
                </div>

                {/* Before / After 표 */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium">구분</th>
                        <th className="px-4 py-2.5 text-right font-medium">Before</th>
                        <th className="px-4 py-2.5 text-right font-medium">After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className={isFounder ? 'bg-brand-50/40' : ''}>
                        <td className="px-4 py-2.5 text-slate-700">기존 주주</td>
                        <td className="tnum px-4 py-2.5 text-right text-slate-500">100.00%</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">
                          {pct(result.ownership.existingOwnershipPct)}
                        </td>
                      </tr>
                      <tr className={!isFounder ? 'bg-brand-50/40' : ''}>
                        <td className="px-4 py-2.5 text-slate-700">SAFE 투자자</td>
                        <td className="tnum px-4 py-2.5 text-right text-slate-400">—</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">
                          {pct(result.ownership.safeOwnershipPct)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-700">신규 투자자</td>
                        <td className="tnum px-4 py-2.5 text-right text-slate-400">—</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">
                          {pct(result.ownership.newInvestorOwnershipPct)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 관점별 한 줄 요약 */}
                <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
                  {isFounder ? (
                    <>
                      이 SAFE 전환으로 기존 주주 지분은{' '}
                      <strong>{pct(result.ownership.existingOwnershipPct)}</strong>로 희석되며, SAFE
                      투자자에게 라운드 대비 <strong>{pct(result.effectiveDiscountVsRound)}</strong>{' '}
                      유리한 가격에 <strong>{num(result.conversionShares)}주</strong>를 부여합니다.
                    </>
                  ) : (
                    <>
                      내 SAFE는 <strong>{won(result.conversionPrice)}</strong>에 전환되어{' '}
                      <strong>{num(result.conversionShares)}주</strong>, 라운드 후{' '}
                      <strong>{pct(result.ownership.safeOwnershipPct)}</strong> 지분이 됩니다 (라운드
                      대비 {pct(result.effectiveDiscountVsRound)} 유리).
                    </>
                  )}
                </div>

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
