import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import { VestingChart } from '../components/charts/VestingChart';
import { calculateVesting, VestingInputError, type VestingResult } from '../lib/vesting/vesting';
import { parseNum, num, pct, won, wonShort } from '../lib/format';
import { usePerspective } from '../context/PerspectiveContext';

interface VestingForm {
  totalShares: string;
  vestingMonths: string;
  cliffMonths: string;
  periodMonths: '1' | '3' | '12';
  elapsedMonths: string;
  exercisePrice: string;
  currentPricePerShare: string;
}

const initialForm: VestingForm = {
  totalShares: '48,000',
  vestingMonths: '48',
  cliffMonths: '12',
  periodMonths: '1',
  elapsedMonths: '18',
  exercisePrice: '',
  currentPricePerShare: '',
};

export function VestingPage() {
  const [form, setForm] = useState<VestingForm>(initialForm);
  const { isFounder } = usePerspective();
  const setField = <K extends keyof VestingForm>(k: K, v: VestingForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const { result, error, isReady } = useMemo(() => {
    const totalShares = parseNum(form.totalShares);
    const vestingMonths = parseNum(form.vestingMonths);
    const cliffMonths = parseNum(form.cliffMonths);
    const elapsedMonths = parseNum(form.elapsedMonths);
    const ready =
      totalShares != null && vestingMonths != null && cliffMonths != null && elapsedMonths != null;
    if (!ready) return { result: null as VestingResult | null, error: null, isReady: false };
    try {
      const res = calculateVesting({
        totalShares: totalShares!,
        vestingMonths: vestingMonths!,
        cliffMonths: cliffMonths!,
        periodMonths: Number(form.periodMonths),
        elapsedMonths: elapsedMonths!,
        exercisePrice: parseNum(form.exercisePrice),
        currentPricePerShare: parseNum(form.currentPricePerShare),
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof VestingInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return (
    <div>
      <PageHeader
        title="베스팅 스케줄 계산기"
        description="클리프 + 주기적 베스팅 기준으로 현재 베스팅된 수량·비율과 향후 일정을 계산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card title="입력">
          <div className="space-y-4">
            <NumberInput label="총 부여 주식수" suffix="주" value={form.totalShares} onChange={(v) => setField('totalShares', v)} />
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="총 베스팅 기간" suffix="개월" comma={false} value={form.vestingMonths} onChange={(v) => setField('vestingMonths', v)} />
              <NumberInput label="클리프" suffix="개월" comma={false} value={form.cliffMonths} onChange={(v) => setField('cliffMonths', v)} />
            </div>
            <div>
              <span className="text-sm font-medium text-slate-700">베스팅 주기</span>
              <div className="mt-1.5">
                <SegmentedControl
                  fullWidth
                  ariaLabel="베스팅 주기"
                  value={form.periodMonths}
                  onChange={(v) => setField('periodMonths', v)}
                  segments={[
                    { value: '1', label: '월별' },
                    { value: '3', label: '분기' },
                    { value: '12', label: '연별' },
                  ]}
                />
              </div>
            </div>
            <NumberInput label="경과 개월" suffix="개월" comma={false} value={form.elapsedMonths} onChange={(v) => setField('elapsedMonths', v)} />
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="행사가격" suffix="₩" optional value={form.exercisePrice} onChange={(v) => setField('exercisePrice', v)} />
              <NumberInput label="현재 1주 가치" suffix="₩" optional value={form.currentPricePerShare} onChange={(v) => setField('currentPricePerShare', v)} />
            </div>
          </div>
        </Card>

        <Card title="결과" subtitle={isFounder ? '창업자/임직원 관점' : '투자자 관점 — 핵심인력 리텐션'}>
          {!isReady && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              부여 수량·베스팅 기간·클리프·경과 개월을 입력하면 결과가 표시됩니다.
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
                <StatCard label="베스팅 완료" value={`${num(result.vestedShares)}주`} sub={pct(result.vestedPct)} highlight />
                <StatCard label="미베스팅" value={`${num(result.unvestedShares)}주`} sub={pct(1 - result.vestedPct)} />
                <StatCard
                  label="다음 베스팅"
                  value={result.nextVestInMonths != null ? `${result.nextVestInMonths}개월 후` : '완료'}
                  sub={result.remainingMonths > 0 ? `완전 베스팅까지 ${result.remainingMonths}개월` : '전량 베스팅'}
                />
              </div>

              {result.vestedValue != null && (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  현재 베스팅분 행사이익 추정:{' '}
                  <strong className="tnum text-slate-900">{won(result.vestedValue)}</strong>{' '}
                  <span className="text-slate-400">({wonShort(result.vestedValue)})</span>
                </div>
              )}

              <div>
                <h3 className="mb-2.5 text-sm font-semibold text-slate-700">베스팅 추이</h3>
                <VestingChart
                  schedule={result.schedule}
                  elapsedMonths={parseNum(form.elapsedMonths)!}
                  cliffMonths={parseNum(form.cliffMonths)!}
                />
              </div>

              <p className="text-xs text-slate-400">
                ※ 단순 클리프+선형 베스팅 모델입니다. 가속조항(acceleration)·실효일·세금은 반영되지
                않습니다.
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
