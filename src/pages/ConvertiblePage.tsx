import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  compareConvertibleVsSafe,
  ConvertibleInputError,
  type ConvertibleCompareResult,
} from '../lib/convertible/convertible';
import { parseNum, won, wonShort, pct, num } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface ConvForm {
  principal: string;
  valuationCap: string;
  discountPct: string;
  interestPct: string;
  termYears: string;
  compound: 'simple' | 'compound';
  roundValuation: string;
  preRoundFullyDilutedShares: string;
  newMoney: string;
}

const initialForm: ConvForm = {
  principal: '200,000,000',
  valuationCap: '8,000,000,000',
  discountPct: '20',
  interestPct: '8',
  termYears: '2',
  compound: 'simple',
  roundValuation: '10,000,000,000',
  preRoundFullyDilutedShares: '1,000,000',
  newMoney: '2,500,000,000',
};

const basisLabel: Record<string, string> = {
  cap: 'Valuation Cap 기준',
  discount: 'Discount 기준',
  roundPrice: '라운드 주당가격',
};

export function ConvertiblePage() {
  const [form, setForm] = useState<ConvForm>(initialForm);
  const { isFounder } = usePerspective();
  const setField = <K extends keyof ConvForm>(k: K, v: ConvForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const principal = parseNum(form.principal);
    const roundValuation = parseNum(form.roundValuation);
    const preRoundFullyDilutedShares = parseNum(form.preRoundFullyDilutedShares);
    const interest = parseNum(form.interestPct);
    const termYears = parseNum(form.termYears);
    const ready =
      principal != null &&
      roundValuation != null &&
      preRoundFullyDilutedShares != null &&
      interest != null &&
      termYears != null;
    if (!ready) return { result: null as ConvertibleCompareResult | null, error: null, isReady: false };
    const discount = parseNum(form.discountPct);
    try {
      const res = compareConvertibleVsSafe({
        principal: principal!,
        valuationCap: parseNum(form.valuationCap),
        discountRate: discount != null ? discount / 100 : undefined,
        interestRate: interest! / 100,
        termYears: termYears!,
        compound: form.compound === 'compound',
        round: {
          valuation: roundValuation!,
          valuationBasis: 'preMoney',
          newMoneyInvestment: parseNum(form.newMoney) ?? 0,
          preRoundFullyDilutedShares: preRoundFullyDilutedShares!,
        },
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof ConvertibleInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="전환사채(CB) vs SAFE 비교"
        description="동일 조건(cap·discount)에서 이자가 붙는 전환사채와 무이자 SAFE의 전환 주식수·지분율을 비교합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="공통 조건">
            <div className="space-y-4">
              <NumberInput label="투자 원금" suffix="₩" value={form.principal} onChange={(v) => setField('principal', v)} />
              <NumberInput label="Valuation Cap" suffix="₩" optional value={form.valuationCap} onChange={(v) => setField('valuationCap', v)} />
              <NumberInput label="Discount Rate" suffix="%" optional comma={false} value={form.discountPct} onChange={(v) => setField('discountPct', v)} />
            </div>
          </Card>
          <Card title="전환사채(CB) 조건">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="연이자율" suffix="%" comma={false} value={form.interestPct} onChange={(v) => setField('interestPct', v)} />
                <NumberInput label="기간" suffix="년" comma={false} value={form.termYears} onChange={(v) => setField('termYears', v)} />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700">이자 방식</span>
                <div className="mt-1.5">
                  <SegmentedControl
                    fullWidth
                    ariaLabel="이자 방식"
                    value={form.compound}
                    onChange={(v) => setField('compound', v)}
                    segments={[
                      { value: 'simple', label: '단리' },
                      { value: 'compound', label: '복리' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </Card>
          <Card title="후속 라운드">
            <div className="space-y-4">
              <NumberInput label="pre-money 기업가치" suffix="₩" value={form.roundValuation} onChange={(v) => setField('roundValuation', v)} />
              <NumberInput label="전환 직전 완전희석 주식수" suffix="주" value={form.preRoundFullyDilutedShares} onChange={(v) => setField('preRoundFullyDilutedShares', v)} />
              <NumberInput label="라운드 신규 투자금" suffix="₩" optional value={form.newMoney} onChange={(v) => setField('newMoney', v)} />
            </div>
          </Card>
        </div>

        <Card title="비교 결과" subtitle={isFounder ? '창업자 관점 — 희석 부담' : '투자자 관점 — 전환 이득'}>
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              원금·CB 조건·후속 라운드 정보를 입력하면 비교가 표시됩니다.
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
                <StatCard label="전환 주당가격 (공통)" value={won(result.conversionPrice)} sub={basisLabel[result.appliedBasis]} />
                <StatCard label="CB 누적 이자" value={wonShort(result.cbAccruedInterest)} sub={won(result.cbAccruedInterest)} />
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">항목</th>
                      <th className="px-4 py-2.5 text-right font-medium">SAFE</th>
                      <th className="px-4 py-2.5 text-right font-medium">전환사채(CB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2.5 text-slate-600">전환 원금</td>
                      <td className="tnum px-4 py-2.5 text-right text-slate-700">{won(result.safe.convertedAmount)}</td>
                      <td className="tnum px-4 py-2.5 text-right text-slate-700">{won(result.cb.convertedAmount)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-slate-600">전환 주식수</td>
                      <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{num(result.safe.shares)}</td>
                      <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{num(result.cb.shares)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-slate-600">전환 지분율</td>
                      <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{pct(result.safe.ownershipPct)}</td>
                      <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{pct(result.cb.ownershipPct)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-800">
                {isFounder ? (
                  <>
                    전환사채는 이자({wonShort(result.cbAccruedInterest)})만큼 전환 원금이 커져 SAFE보다{' '}
                    <strong>{num(result.extraSharesCb)}주</strong> 더 발행됩니다. 창업자 입장에선 그만큼
                    추가 희석을 의미합니다.
                  </>
                ) : (
                  <>
                    같은 조건이라도 전환사채는 이자가 붙어 SAFE보다{' '}
                    <strong>{num(result.extraSharesCb)}주</strong> 더 전환됩니다(전환가는 동일{' '}
                    {won(result.conversionPrice)}).
                  </>
                )}
              </div>

              <p className="text-xs text-slate-400">
                ※ 전환 메커니즘은 동일 가정(cap·discount 중 유리값). 만기 상환·담보·세무 등 CB 고유
                조항은 반영되지 않은 개략 비교입니다.
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
