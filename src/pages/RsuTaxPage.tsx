import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { RelatedLaws } from '../components/RelatedLaws';
import { calculateRsuTax, RsuTaxInputError, type RsuTaxResult } from '../lib/tax/rsuTax';
import { taxConfig } from '../config/taxConfig';
import { parseNum, won, wonShort, pct } from '../lib/format';

interface RsuForm {
  vestedShares: string;
  fmvPerShareAtVest: string;
  salePricePerShare: string;
  capitalGainsType: string;
}

const initialForm: RsuForm = {
  vestedShares: '10,000',
  fmvPerShareAtVest: '50,000',
  salePricePerShare: '',
  capitalGainsType: 'smbSmall',
};

export function RsuTaxPage() {
  const [form, setForm] = useState<RsuForm>(initialForm);
  const setField = <K extends keyof RsuForm>(k: K, v: RsuForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const vestedShares = parseNum(form.vestedShares);
    const fmv = parseNum(form.fmvPerShareAtVest);
    if (vestedShares == null || fmv == null) {
      return { result: null as RsuTaxResult | null, error: null, isReady: false };
    }
    try {
      const res = calculateRsuTax({
        vestedShares,
        fmvPerShareAtVest: fmv,
        salePricePerShare: parseNum(form.salePricePerShare),
        capitalGainsType: form.capitalGainsType,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof RsuTaxInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  const hasSale = parseNum(form.salePricePerShare) != null;

  return (
    <div>
      <PageHeader
        title="RSU 세제 계산기"
        description="양도제한조건부주식(RSU)의 베스팅 시 근로소득 과세와 매각 시 양도소득 과세를 개략 추정합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <NumberInput label="베스팅(귀속) 주식수" suffix="주" value={form.vestedShares} onChange={(v) => setField('vestedShares', v)} />
              <NumberInput label="베스팅 시점 1주 시가" suffix="₩" value={form.fmvPerShareAtVest} onChange={(v) => setField('fmvPerShareAtVest', v)} />
              <NumberInput
                label="매각 1주 가격"
                suffix="₩"
                optional
                value={form.salePricePerShare}
                onChange={(v) => setField('salePricePerShare', v)}
                hint="입력 시 매각 양도소득세를 추가 계산합니다."
              />
              {hasSale && (
                <div>
                  <span className="text-sm font-medium text-slate-700">양도세 세율 유형</span>
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
                </div>
              )}
            </div>
          </Card>
          <Card title="적용 전제" subtitle={`기준일 ${taxConfig.lastUpdated}`}>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li>• 베스팅 시 시가 전액이 근로소득으로 과세된다는 가정(비과세 특례 미적용).</li>
              <li>• 근로소득세는 다른 소득과 합산하지 않은 단순화 추정입니다.</li>
              <li>• 매각 시 (매각가 − 베스팅 시가) 차익을 양도소득으로 과세(추정 세율).</li>
            </ul>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              베스팅 주식수와 시가를 입력하면 세액이 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {result && (
            <div className="space-y-5" aria-live="polite">
              {/* 핵심: 결국 내 손에 떨어지는 돈 */}
              <div className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-400">
                      세후 실수령액 {result.sold ? '(매각 기준)' : '(베스팅 평가 기준)'}
                    </div>
                    <div className="tnum mt-1 text-2xl font-bold tracking-tight text-white">
                      {won(result.netAfterTax)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">세전 {wonShort(result.grossValue)}</div>
                    <div className="tnum mt-1 text-sm font-medium text-slate-300">
                      세금 {wonShort(result.totalTax)} · 실효세율 {pct(result.effectiveTaxRate, 1)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  {result.sold
                    ? '매각대금에서 근로소득세·양도소득세를 뺀 실제 수령액입니다.'
                    : '베스팅 평가액에서 근로소득세를 뺀 금액입니다. 세금은 현금으로 부담하고 주식은 보유합니다.'}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="베스팅 근로소득" value={wonShort(result.ordinaryIncome)} sub={won(result.ordinaryIncome)} />
                <StatCard label="근로소득세" value={wonShort(result.laborTax)} sub={won(result.laborTax)} highlight />
                <StatCard label="총 세액" value={wonShort(result.totalTax)} sub={won(result.totalTax)} />
              </div>

              {hasSale && (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">매각 양도차익</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.capitalGain)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600">양도소득세 (추정)</td>
                        <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.capitalGainsTax)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <ul className="space-y-1.5">
                {result.warnings.map((w) => (
                  <li key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <RelatedLaws toolPath="/rsu-tax" />
            <Disclaimer />
          </div>
        </Card>
      </div>
    </div>
  );
}
