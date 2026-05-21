import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  calculateFundReturner,
  FundReturnerInputError,
  type FundReturnerResult,
} from '../lib/fund/fundReturner';
import { parseNum, won, wonShort, pct } from '../lib/format';

interface ReturnerForm {
  fundSize: string;
  targetMultiple: string;
  ownershipPct: string;
  investmentInDeal: string;
}

const initialForm: ReturnerForm = {
  fundSize: '30,000,000,000',
  targetMultiple: '1',
  ownershipPct: '10',
  investmentInDeal: '1,000,000,000',
};

export function FundReturnerPage() {
  const [form, setForm] = useState<ReturnerForm>(initialForm);
  const setField = <K extends keyof ReturnerForm>(k: K, v: ReturnerForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const fundSize = parseNum(form.fundSize);
    const targetMultiple = parseNum(form.targetMultiple);
    const ownershipPct = parseNum(form.ownershipPct);
    if (fundSize == null || targetMultiple == null || ownershipPct == null) {
      return { result: null as FundReturnerResult | null, error: null, isReady: false };
    }
    try {
      const res = calculateFundReturner({
        fundSize,
        targetMultiple,
        ownershipAtExit: ownershipPct / 100,
        investmentInDeal: parseNum(form.investmentInDeal) ?? undefined,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof FundReturnerInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="목표 수익 역산 (Fund-returner)"
        description="이 딜 하나로 펀드를 N배 돌려주려면 엑싯 기업가치가 얼마여야 하는지 역산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card title="입력">
          <div className="space-y-4">
            <NumberInput label="펀드 규모" suffix="₩" value={form.fundSize} onChange={(v) => setField('fundSize', v)} />
            <NumberInput label="목표 배수 (펀드 대비)" suffix="x" comma={false} value={form.targetMultiple} onChange={(v) => setField('targetMultiple', v)} hint="1 = 펀드 전액 회수, 3 = 3배" />
            <NumberInput label="엑싯 시점 지분율 (희석 후)" suffix="%" comma={false} value={form.ownershipPct} onChange={(v) => setField('ownershipPct', v)} />
            <NumberInput label="이 딜 투자금" suffix="₩" optional value={form.investmentInDeal} onChange={(v) => setField('investmentInDeal', v)} hint="입력 시 이 딜의 회수 배수(MOIC) 표시" />
          </div>
        </Card>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              펀드 규모·목표 배수·지분율을 입력하세요.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {result && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="필요 엑싯 기업가치" value={wonShort(result.requiredExitValuation)} sub={won(result.requiredExitValuation)} highlight />
                <StatCard label="이 딜 필요 회수금" value={wonShort(result.requiredProceeds)} sub={won(result.requiredProceeds)} />
                <StatCard label="이 딜 회수 배수" value={result.dealMoic != null ? `${result.dealMoic.toFixed(1)}x` : '—'} />
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-600">
                펀드 <strong>{wonShort(parseNum(form.fundSize)!)}</strong>를 {form.targetMultiple}배(
                {wonShort(result.requiredProceeds)}) 돌려주려면, 엑싯 시점 지분 {form.ownershipPct}% 기준
                기업가치가 최소 <strong>{wonShort(result.requiredExitValuation)}</strong>이어야 합니다.
                {result.dealMoic != null && (
                  <> 이는 이 딜 투자금 대비 <strong>{result.dealMoic.toFixed(1)}배</strong> 회수에 해당합니다.</>
                )}
              </div>

              {result.warnings.map((w) => (
                <p key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{w}</p>
              ))}
              <p className="text-xs leading-relaxed text-slate-400">
                ※ 청산우선권·후속 희석·세금은 미반영한 단순 역산입니다(엑싯 분배는 우선주 Waterfall 참고). 지분율 {pct((parseNum(form.ownershipPct) ?? 0) / 100)} 기준.
              </p>
            </div>
          )}
          <div className="mt-5"><Disclaimer compact /></div>
        </Card>
      </div>
    </div>
  );
}
