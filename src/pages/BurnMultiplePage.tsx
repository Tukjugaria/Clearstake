import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  calculateBurnMultiple,
  type BurnMultipleResult,
} from '../lib/ops/burnMultiple';
import { parseNum, wonShort, won } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface BurnForm {
  netBurn: string;
  netNewArr: string;
}

const initialForm: BurnForm = { netBurn: '1,000,000,000', netNewArr: '800,000,000' };

export function BurnMultiplePage() {
  const [form, setForm] = useState<BurnForm>(initialForm);
  const { isFounder } = usePerspective();
  const setField = <K extends keyof BurnForm>(k: K, v: BurnForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, isReady } = useMemo(() => {
    const netBurn = parseNum(form.netBurn);
    const netNewArr = parseNum(form.netNewArr);
    if (netBurn == null || netNewArr == null) {
      return { result: null as BurnMultipleResult | null, isReady: false };
    }
    return { result: calculateBurnMultiple({ netBurn, netNewArr }), isReady: true };
  }, [form]);

  return (
    <div>
      <PageHeader
        title="번 멀티플 (자본효율)"
        description="순현금소모 ÷ 순신규 ARR. 같은 성장에 현금을 얼마나 효율적으로 쓰는지 보여주는 지표입니다(낮을수록 좋음)."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card title="입력 (동일 기간 기준)">
          <div className="space-y-4">
            <NumberInput label="순현금소모 (Net Burn)" suffix="₩" value={form.netBurn} onChange={(v) => setField('netBurn', v)} hint="기간 중 태운 순현금(보통 연간)" />
            <NumberInput label="순신규 ARR (Net New ARR)" suffix="₩" value={form.netNewArr} onChange={(v) => setField('netNewArr', v)} hint="같은 기간 늘어난 순 ARR" />
          </div>
        </Card>

        <Card title="결과" subtitle={isFounder ? '창업자 관점 — 자본 효율' : '투자자 관점 — 투입 대비 성장'}>
          {!isReady && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              순현금소모와 순신규 ARR을 입력하세요.
            </div>
          )}
          {result && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard
                  label="번 멀티플"
                  value={result.multiple != null ? `${result.multiple.toFixed(2)}x` : '—'}
                  highlight
                />
                <StatCard label="평가" value={<span className="text-base">{result.ratingLabel}</span>} />
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['< 1x', '최상 — 매우 효율적'],
                      ['1 ~ 1.5x', '우수'],
                      ['1.5 ~ 2x', '양호'],
                      ['2 ~ 3x', '주의'],
                      ['> 3x', '위험 — 비효율'],
                    ].map(([range, label]) => (
                      <tr key={range} className={result.ratingLabel.startsWith(range.split(' ')[0]) ? '' : ''}>
                        <td className="tnum px-4 py-2 text-slate-600">{range}</td>
                        <td className="px-4 py-2 text-slate-500">{label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-600">
                {result.multiple != null ? (
                  <>
                    ARR을 1원 늘리는 데 현금 <strong>{result.multiple.toFixed(2)}원</strong>을 태웠습니다
                    ({wonShort(parseNum(form.netBurn)!)} 소모 / {wonShort(parseNum(form.netNewArr)!)} 신규 ARR).
                  </>
                ) : (
                  <>성장(순신규 ARR) 없이 현금만 소모해 번 멀티플을 산정할 수 없습니다.</>
                )}
              </p>

              {result.warnings.map((w) => (
                <p key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{w}</p>
              ))}
              <p className="text-xs text-slate-400">※ 순소모 {won(parseNum(form.netBurn) ?? 0)} 기준. 통용 휴리스틱(Bessemer) 등급입니다.</p>
            </div>
          )}
          <div className="mt-5"><Disclaimer compact /></div>
        </Card>
      </div>
    </div>
  );
}
