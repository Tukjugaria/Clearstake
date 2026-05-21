import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { calculateReturns, ReturnsInputError, type ReturnsResult } from '../lib/returns/returns';
import { parseNum, won, wonShort, pct } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface ReturnsForm {
  investmentAmount: string;
  entryOwnership: string; // %
  exitValuation: string;
  holdingYears: string;
  dilutionToExit: string; // %
  nextRoundNewMoney: string;
}

const initialForm: ReturnsForm = {
  investmentAmount: '500,000,000',
  entryOwnership: '10',
  exitValuation: '50,000,000,000',
  holdingYears: '6',
  dilutionToExit: '40',
  nextRoundNewMoney: '',
};

export function ReturnsPage() {
  const [form, setForm] = useState<ReturnsForm>(initialForm);
  const { isFounder } = usePerspective();
  const setField = <K extends keyof ReturnsForm>(k: K, v: ReturnsForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const investmentAmount = parseNum(form.investmentAmount);
    const entryOwnership = parseNum(form.entryOwnership);
    const exitValuation = parseNum(form.exitValuation);
    const holdingYears = parseNum(form.holdingYears);
    const ready =
      investmentAmount != null && entryOwnership != null && exitValuation != null && holdingYears != null;
    if (!ready) return { result: null as ReturnsResult | null, error: null, isReady: false };
    try {
      const res = calculateReturns({
        investmentAmount: investmentAmount!,
        entryOwnership: entryOwnership! / 100,
        exitValuation: exitValuation!,
        holdingYears: holdingYears!,
        dilutionToExit: (parseNum(form.dilutionToExit) ?? 0) / 100,
        nextRoundNewMoney: parseNum(form.nextRoundNewMoney) ?? undefined,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof ReturnsInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="투자 수익률 계산기 (MOIC · IRR)"
        description="진입가·지분·엑싯 가치로 회수금, 투자배수(MOIC), 연환산 수익률(IRR), 지분 유지 투자금을 계산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card title="입력">
          <div className="space-y-4">
            <NumberInput label="투자금" suffix="₩" value={form.investmentAmount} onChange={(v) => setField('investmentAmount', v)} />
            <NumberInput label="진입 지분율" suffix="%" comma={false} value={form.entryOwnership} onChange={(v) => setField('entryOwnership', v)} />
            <NumberInput label="엑싯 기업가치" suffix="₩" value={form.exitValuation} onChange={(v) => setField('exitValuation', v)} />
            <NumberInput label="보유기간" suffix="년" comma={false} value={form.holdingYears} onChange={(v) => setField('holdingYears', v)} />
            <NumberInput
              label="엑싯까지 누적 희석률"
              suffix="%"
              comma={false}
              optional
              value={form.dilutionToExit}
              onChange={(v) => setField('dilutionToExit', v)}
              hint="후속 라운드로 지분이 줄어드는 비율(추정)."
            />
            <NumberInput
              label="다음 라운드 신규 투자금"
              suffix="₩"
              optional
              value={form.nextRoundNewMoney}
              onChange={(v) => setField('nextRoundNewMoney', v)}
              hint="입력 시 지분 유지(pro-rata) 투자금을 계산합니다."
            />
          </div>
        </Card>

        <Card title="결과" subtitle={isFounder ? '창업자 관점 — 투자자에게 보이는 수익' : '투자자 관점 — 내 수익률'}>
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              투자금·지분율·엑싯 가치·보유기간을 입력하면 수익률이 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard label="MOIC (투자배수)" value={`${result.moic.toFixed(2)}x`} highlight />
                <StatCard label="IRR (연환산)" value={result.irr != null ? pct(result.irr) : '—'} highlight />
                <StatCard label="회수금" value={wonShort(result.exitProceeds)} sub={won(result.exitProceeds)} />
                <StatCard
                  label="순이익"
                  value={wonShort(result.profit)}
                  sub={result.profit >= 0 ? '이익' : '손실'}
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2.5 text-slate-600">엑싯 지분율 (희석 후)</td>
                      <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{pct(result.exitOwnership)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-slate-600">회수금</td>
                      <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.exitProceeds)}</td>
                    </tr>
                    {result.proRataInvestment != null && (
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">지분 유지(pro-rata) 투자금</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.proRataInvestment)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-800">
                {wonShort(parseNum(form.investmentAmount)!)} 투자가 {result.moic.toFixed(2)}배(
                {wonShort(result.exitProceeds)})로 회수되며, 연환산 수익률(IRR)은{' '}
                <strong>{result.irr != null ? pct(result.irr) : '—'}</strong>입니다.
                {result.proRataInvestment != null && (
                  <> 다음 라운드에서 지분을 유지하려면 약 {wonShort(result.proRataInvestment)}의 추가 투자가 필요합니다.</>
                )}
              </div>

              <p className="text-xs text-slate-400">
                ※ 단일 진입·단일 회수, 우선주 청산우선권·수수료(carry)·세금 미반영의 개략 추정입니다.
              </p>
            </div>
          )}

          <div className="mt-5">
            <Disclaimer compact />
          </div>
        </Card>
      </div>
    </div>
  );
}
