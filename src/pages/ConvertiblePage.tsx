import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  analyzeConvertible,
  ConvertibleInputError,
  type ConvertibleResult,
} from '../lib/convertible/convertible';
import { parseNum, won, wonShort, pct, num } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface ConvForm {
  principal: string;
  couponPct: string;
  ytmPct: string;
  termYears: string;
  couponFreq: '1' | '4' | '12';
  valuationCap: string;
  discountPct: string;
  roundValuation: string;
  preRoundFullyDilutedShares: string;
  newMoney: string;
}

const initialForm: ConvForm = {
  principal: '200,000,000',
  couponPct: '2',
  ytmPct: '8',
  termYears: '3',
  couponFreq: '4',
  valuationCap: '8,000,000,000',
  discountPct: '20',
  roundValuation: '10,000,000,000',
  preRoundFullyDilutedShares: '1,000,000',
  newMoney: '2,500,000,000',
};

const basisLabel: Record<string, string> = {
  cap: 'Valuation Cap 기준',
  discount: 'Discount 기준',
  roundPrice: '라운드 주당가격',
};

const freqLabel: Record<string, string> = { '1': '연 1회', '4': '분기', '12': '월' };

export function ConvertiblePage() {
  const [form, setForm] = useState<ConvForm>(initialForm);
  const { isFounder } = usePerspective();
  const setField = <K extends keyof ConvForm>(k: K, v: ConvForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const principal = parseNum(form.principal);
    const roundValuation = parseNum(form.roundValuation);
    const preRoundFullyDilutedShares = parseNum(form.preRoundFullyDilutedShares);
    const termYears = parseNum(form.termYears);
    const ready =
      principal != null &&
      roundValuation != null &&
      preRoundFullyDilutedShares != null &&
      termYears != null;
    if (!ready) return { result: null as ConvertibleResult | null, error: null, isReady: false };
    const discount = parseNum(form.discountPct);
    try {
      const res = analyzeConvertible({
        principal: principal!,
        couponRate: (parseNum(form.couponPct) ?? 0) / 100,
        guaranteedYtm: (parseNum(form.ytmPct) ?? 0) / 100,
        termYears: termYears!,
        couponFreqPerYear: Number(form.couponFreq),
        valuationCap: parseNum(form.valuationCap),
        discountRate: discount != null ? discount / 100 : undefined,
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
        title="전환사채(CB) 분석 · SAFE 비교"
        description="표면이자율·만기보장수익률을 반영해 CB의 전환 경로와 만기 상환 경로를 계산하고, 무이자 SAFE와 비교합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="CB 조건">
            <div className="space-y-4">
              <NumberInput label="투자 원금 (권면총액)" suffix="₩" value={form.principal} onChange={(v) => setField('principal', v)} />
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="표면이자율" suffix="%" comma={false} value={form.couponPct} onChange={(v) => setField('couponPct', v)} />
                <NumberInput label="만기보장수익률" suffix="%" comma={false} value={form.ytmPct} onChange={(v) => setField('ytmPct', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="만기" suffix="년" comma={false} value={form.termYears} onChange={(v) => setField('termYears', v)} />
                <div>
                  <span className="text-sm font-medium text-slate-700">이자 지급</span>
                  <div className="mt-1.5">
                    <SegmentedControl
                      fullWidth
                      size="sm"
                      ariaLabel="이자 지급 주기"
                      value={form.couponFreq}
                      onChange={(v) => setField('couponFreq', v)}
                      segments={[
                        { value: '1', label: '연' },
                        { value: '4', label: '분기' },
                        { value: '12', label: '월' },
                      ]}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                표면이자율 = 주기마다 현금 지급되는 이자 · 만기보장수익률 = 만기까지 보장하는 연복리
                (만기에 복리 총액에서 이미 준 표면이자를 뺀 상환할증금 지급).
              </p>
            </div>
          </Card>
          <Card title="전환 조건">
            <div className="space-y-4">
              <NumberInput label="Valuation Cap" suffix="₩" optional value={form.valuationCap} onChange={(v) => setField('valuationCap', v)} />
              <NumberInput label="Discount Rate" suffix="%" optional comma={false} value={form.discountPct} onChange={(v) => setField('discountPct', v)} />
              <NumberInput label="후속 라운드 pre-money" suffix="₩" value={form.roundValuation} onChange={(v) => setField('roundValuation', v)} />
              <NumberInput label="전환 직전 완전희석 주식수" suffix="주" value={form.preRoundFullyDilutedShares} onChange={(v) => setField('preRoundFullyDilutedShares', v)} />
              <NumberInput label="라운드 신규 투자금" suffix="₩" optional value={form.newMoney} onChange={(v) => setField('newMoney', v)} />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {!isReady && (
            <Card title="결과">
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                CB 조건과 후속 라운드 정보를 입력하면 분석이 표시됩니다.
              </div>
            </Card>
          )}

          {result && isReady && (
            <>
              <Card title="① 전환 경로 (전환권 행사)" subtitle="권면금액(원금)이 전환가로 전환 — SAFE와 동일">
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard label="전환 주당가격" value={won(result.conversionPrice)} sub={basisLabel[result.appliedBasis]} />
                  <StatCard label="전환 주식수" value={num(result.conversionShares)} sub="주 (원금 기준)" highlight={!isFounder} />
                  <StatCard label="전환 지분율" value={pct(result.conversionOwnershipPct)} />
                </div>
                <p className="mt-3 rounded-lg bg-slate-50 px-4 py-2.5 text-xs leading-relaxed text-slate-500">
                  전환을 택하면 표면이자(전환 전까지 받은 현금)는 보유하지만, 만기 보장수익(상환할증금)은
                  포기합니다. 전환 주식수는 이자와 무관하게 <strong>원금 ÷ 전환가</strong>로, 같은 조건의
                  SAFE와 동일합니다.
                </p>
              </Card>

              <Card title="② 만기 상환 경로 (미전환·만기보유)" subtitle="SAFE에는 없는 다운사이드 보호">
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard label="만기 상환금액" value={wonShort(result.redemptionAtMaturity)} sub={won(result.redemptionAtMaturity)} highlight={isFounder} />
                  <StatCard label="상환할증금" value={wonShort(result.redemptionPremium)} sub="원금 초과 보장분" />
                  <StatCard label="만기 보장 MOIC" value={`${result.maturityMoic.toFixed(2)}x`} sub={`보장 ${form.ytmPct}% 복리`} />
                </div>
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">표면이자 (1회 × {freqLabel[form.couponFreq]})</td>
                        <td className="tnum px-4 py-2.5 text-right text-slate-700">
                          {won(result.couponPerPayment)} × {result.couponPaymentsCount}회
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">표면이자 누적 (만기까지 현금)</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.totalCouponOverTerm)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">만기 보장 총가치 (이자+상환)</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.guaranteedTotalAtMaturity)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title="CB vs SAFE">
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium">항목</th>
                        <th className="px-4 py-2.5 text-right font-medium">전환사채(CB)</th>
                        <th className="px-4 py-2.5 text-right font-medium">SAFE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">전환 주식수</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{num(result.conversionShares)}</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{num(result.conversionShares)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">표면이자(현금)</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">있음</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">없음</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">만기 보장 상환</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">있음 ({form.ytmPct}% 복리)</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">없음</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">성격</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">사채(상환의무)</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">지분 전환 권리</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-600">
                  {isFounder ? (
                    <>
                      전환 시 희석은 CB·SAFE가 동일합니다. 다만 CB는 <strong>표면이자 현금 유출</strong>과
                      미전환 시 <strong>만기 보장 상환(원금 {result.maturityMoic.toFixed(2)}배)</strong> 부담이
                      있어, 회사 입장에선 SAFE보다 비용·상환 리스크가 큽니다.
                    </>
                  ) : (
                    <>
                      전환 주식수는 SAFE와 같지만, CB는 <strong>표면이자 + 만기 보장수익</strong>이라는
                      다운사이드 보호가 있습니다. 회사가 잘 안 되면 SAFE(권리만)와 달리 CB는 채권으로
                      상환을 청구할 수 있습니다.
                    </>
                  )}
                </p>
              </Card>

              {result.warnings.length > 0 && (
                <ul className="space-y-1.5">
                  {result.warnings.map((w) => (
                    <li key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{w}</li>
                  ))}
                </ul>
              )}

              <Disclaimer />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
