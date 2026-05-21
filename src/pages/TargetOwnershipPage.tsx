import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  calculateTargetOwnership,
  TargetOwnershipInputError,
  type TargetOwnershipResult,
} from '../lib/target/targetOwnership';
import { parseNum, won, wonShort, pct } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface TargetForm {
  currentOwnership: string; // %
  targetOwnership: string; // %
  newMoney: string;
}

const initialForm: TargetForm = {
  currentOwnership: '70',
  targetOwnership: '50',
  newMoney: '2,000,000,000',
};

export function TargetOwnershipPage() {
  const [form, setForm] = useState<TargetForm>(initialForm);
  const { isFounder } = usePerspective();
  const setField = <K extends keyof TargetForm>(k: K, v: TargetForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const currentOwnership = parseNum(form.currentOwnership);
    const targetOwnership = parseNum(form.targetOwnership);
    const newMoney = parseNum(form.newMoney);
    const ready = currentOwnership != null && targetOwnership != null && newMoney != null;
    if (!ready) return { result: null as TargetOwnershipResult | null, error: null, isReady: false };
    try {
      const res = calculateTargetOwnership({
        currentOwnership: currentOwnership! / 100,
        targetOwnership: targetOwnership! / 100,
        newMoney: newMoney!,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg =
        e instanceof TargetOwnershipInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="목표 지분 역산 계산기"
        description="이번 라운드 후 목표 지분율을 지키려면 밸류에이션(pre-money)이 최소 얼마여야 하는지 역산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card title="입력">
          <div className="space-y-4">
            <NumberInput label="현재 지분율" suffix="%" comma={false} value={form.currentOwnership} onChange={(v) => setField('currentOwnership', v)} />
            <NumberInput label="라운드 후 목표 지분율" suffix="%" comma={false} value={form.targetOwnership} onChange={(v) => setField('targetOwnership', v)} />
            <NumberInput label="이번 라운드 신규 투자금" suffix="₩" value={form.newMoney} onChange={(v) => setField('newMoney', v)} />
          </div>
        </Card>

        <Card title="결과" subtitle={isFounder ? '창업자 관점 — 밸류 협상 목표' : '투자자 관점 — 가능한 지분 상한'}>
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              현재·목표 지분율과 신규 투자금을 입력하면 필요한 밸류에이션이 표시됩니다.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && !result.feasible && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {result.reason}
            </div>
          )}

          {result && result.feasible && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="필요 최소 pre-money" value={wonShort(result.requiredMinPreMoney)} sub={won(result.requiredMinPreMoney)} highlight />
                <StatCard label="그때 post-money" value={wonShort(result.impliedPostMoney)} sub={won(result.impliedPostMoney)} />
                <StatCard
                  label={isFounder ? '감내 희석폭' : '신규 투자자 지분(상한)'}
                  value={isFounder ? pct(result.maxDilution) : pct(result.maxNewInvestorPct)}
                  sub={isFounder ? `${form.currentOwnership}% → ${form.targetOwnership}%` : '이 이상이면 목표 미달'}
                />
              </div>

              <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-800">
                {isFounder ? (
                  <>
                    {wonShort(parseNum(form.newMoney)!)}을 유치하면서 지분을 {form.targetOwnership}%
                    이상으로 지키려면, pre-money가 최소{' '}
                    <strong>{wonShort(result.requiredMinPreMoney)}</strong> 이상이어야 합니다
                    (post-money {wonShort(result.impliedPostMoney)}). 이보다 낮은 밸류로 같은 금액을
                    받으면 목표 지분이 깨집니다.
                  </>
                ) : (
                  <>
                    이 라운드에서 신규 투자자가 가져갈 수 있는 최대 지분은{' '}
                    <strong>{pct(result.maxNewInvestorPct)}</strong>입니다(창업자 {form.targetOwnership}%
                    유지 조건). 더 큰 지분을 원하면 창업자의 목표 지분과 충돌합니다.
                  </>
                )}
              </div>

              <p className="text-xs text-slate-400">
                ※ 보유 주식수 불변·옵션풀 변동 없음 가정의 단순 모델입니다. 옵션풀 확대·SAFE 전환이
                있으면 더 큰 밸류가 필요합니다(캡테이블 시뮬레이터 참고).
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
