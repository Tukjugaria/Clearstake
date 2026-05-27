import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  calculateSalaryVsDividend,
  SalaryVsDividendInputError,
  type SalaryVsDividendResult,
} from '../lib/tax/salaryVsDividend';
import { taxConfig } from '../config/taxConfig';
import { parseNum, won, wonShort } from '../lib/format';

interface SvdForm {
  companyProfit: string;
  ownerOtherIncome: string;
  ownershipPct: string;
}

const initialForm: SvdForm = {
  companyProfit: '100,000,000',
  ownerOtherIncome: '0',
  ownershipPct: '100',
};

export function SalaryVsDividendPage() {
  const [form, setForm] = useState<SvdForm>(initialForm);
  const setField = <K extends keyof SvdForm>(k: K, v: SvdForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const profit = parseNum(form.companyProfit);
    const other = parseNum(form.ownerOtherIncome);
    const pctRaw = parseNum(form.ownershipPct);
    if (profit == null || other == null || pctRaw == null) {
      return { result: null as SalaryVsDividendResult | null, error: null, isReady: false };
    }
    try {
      const res = calculateSalaryVsDividend({
        companyProfit: profit,
        ownerOtherIncome: other,
        ownershipPct: pctRaw / 100,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof SalaryVsDividendInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="대표 급여 vs 배당 비교 — 양면 관점"
        description="같은 회사 이익을 급여로 받을 때와 배당으로 받을 때 본인 세후 실수령액을 비교하고, 법인 입장의 법인세까지 한 화면에서 보여줍니다."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card title="입력">
            <div className="space-y-4">
              <NumberInput
                label="회사 영업이익 (법인세 전)"
                suffix="₩"
                value={form.companyProfit}
                onChange={(v) => setField('companyProfit', v)}
                hint="이 금액 전체를 대표가 가져갈 때를 가정"
              />
              <NumberInput
                label="대표 본인의 다른 종합소득"
                suffix="₩"
                value={form.ownerOtherIncome}
                onChange={(v) => setField('ownerOtherIncome', v)}
                hint="이미 받는 근로·사업소득. 누진세 영향에 반영"
              />
              <NumberInput
                label="대표 지분율"
                suffix="%"
                comma={false}
                value={form.ownershipPct}
                onChange={(v) => setField('ownershipPct', v)}
                hint="배당 시 본인이 받는 비율. 100%면 단독지분"
              />
            </div>
          </Card>

          <Card title="모델 가정" subtitle={`기준일 ${taxConfig.lastUpdated}`}>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li>• <strong className="text-slate-700">전액 급여:</strong> 회사 이익 전부를 급여로 → 회사 손금, 법인세 0</li>
              <li>• <strong className="text-slate-700">전액 배당:</strong> 회사 이익에 법인세 부과 후 잔여를 배당</li>
              <li>• 배당소득: 2천만 초과 시 종합과세, 미만 시 분리과세 14%(+지방)</li>
              <li>• 4대보험 회사·본인 부담은 미반영 (급여 시나리오는 실제로 추가 부담 발생)</li>
              <li>• 임원보수 한도, Gross-up은 미반영</li>
            </ul>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              회사 이익과 지분율을 입력하면 결과가 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-5" aria-live="polite">
              {/* 핵심: 추천 시나리오 + 차이 */}
              <div className="rounded-xl border border-slate-900 bg-slate-900 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-400">
                      추천: {result.recommended === 'salary' ? '전액 급여' : '전액 배당'}
                    </div>
                    <div className="tnum mt-1 text-2xl font-bold tracking-tight text-white">
                      {won(
                        result.recommended === 'salary' ? result.salary.ownerNet : result.dividend.ownerNet,
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">차이</div>
                    <div className="tnum mt-1 text-sm font-medium text-emerald-300">
                      +{won(result.difference)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  본인 세후 실수령액이 더 큰 방식입니다.
                </div>
              </div>

              {/* 두 시나리오 카드 비교 */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* 급여 */}
                <div className={`rounded-xl border p-4 ${result.recommended === 'salary' ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
                  <h3 className="text-sm font-semibold text-slate-900">전액 급여</h3>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">세전 급여</span>
                      <span className="tnum text-slate-900">{won(result.salary.gross)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">회사 법인세</span>
                      <span className="tnum text-slate-900">{won(result.salary.corporateTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">본인 추가 세금</span>
                      <span className="tnum text-rose-700">−{won(result.salary.ownerAddedTax)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold">
                      <span className="text-slate-700">본인 세후 실수령</span>
                      <span className="tnum text-emerald-700">{won(result.salary.ownerNet)}</span>
                    </div>
                  </div>
                </div>

                {/* 배당 */}
                <div className={`rounded-xl border p-4 ${result.recommended === 'dividend' ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
                  <h3 className="text-sm font-semibold text-slate-900">전액 배당</h3>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">회사 법인세</span>
                      <span className="tnum text-rose-700">−{won(result.dividend.corporateTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">법인세 후 잔여</span>
                      <span className="tnum text-slate-900">{won(result.dividend.afterCorporateTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">배당 (본인 지분)</span>
                      <span className="tnum text-slate-900">{won(result.dividend.gross)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        배당소득세 ({result.dividend.dividendTaxMode === 'separate' ? '분리 14%' : '종합과세'})
                      </span>
                      <span className="tnum text-rose-700">−{won(result.dividend.ownerAddedTax)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold">
                      <span className="text-slate-700">본인 세후 실수령</span>
                      <span className="tnum text-emerald-700">{won(result.dividend.ownerNet)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 양면 요약 */}
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard
                  label="법인 관점 — 회사 부담 세금"
                  value={wonShort(result.salary.corporateTax)}
                  sub={`vs 배당 시 ${wonShort(result.dividend.corporateTax)}`}
                />
                <StatCard
                  label="개인 관점 — 본인 세금"
                  value={wonShort(result.salary.ownerAddedTax)}
                  sub={`vs 배당 시 ${wonShort(result.dividend.ownerAddedTax)}`}
                  highlight
                />
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                💡 회사 이익이 작을 때는 법인세(누진) + 배당소득세 이중과세 영향으로 보통 <strong className="text-slate-700">급여</strong>가 유리하고,
                회사 이익이 크면 <strong className="text-slate-700">배당</strong>이 유리한 구간이 생깁니다. 본인 다른 종합소득이 클수록 급여 한계세율이 올라 배당이 더 유리해질 수 있어요.
              </p>

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
          )}

          <div className="mt-5">
            <Disclaimer />
          </div>
        </Card>
      </div>
    </div>
  );
}
