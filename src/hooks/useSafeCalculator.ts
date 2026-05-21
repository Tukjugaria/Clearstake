/**
 * EquityKit — 모듈 A: SAFE 계산기 헤드리스 훅
 *
 * 입력 상태 관리 + 엔진 호출 + 에러 처리만 담당한다(스타일 없음).
 * 화면(프레젠테이션)은 이 훅이 돌려주는 값을 그리기만 하면 된다.
 *
 * UI는 % 단위로 받고, 엔진에는 fraction으로 넘긴다(여기서 변환).
 * 초기값을 URL 쿼리(시나리오 공유)로부터 주입할 수 있다.
 */

import { useMemo, useState } from 'react';
import {
  calculateSafeConversion,
  SafeInputError,
  type SafeConversionResult,
} from '../lib/safe';
import { parseNum, formatWithCommas } from '../lib/format';
import { type SafeFormState, initialSafeForm } from './safeFormTypes';

export type { SafeFormState } from './safeFormTypes';
export { initialSafeForm } from './safeFormTypes';

/** 부분 초기값을 기본 폼에 병합 (URL 공유 복원 등). 숫자 필드는 콤마 포맷 적용. */
function mergeInitial(partial?: Partial<SafeFormState>): SafeFormState {
  if (!partial) return initialSafeForm;
  const merged = { ...initialSafeForm, ...partial };
  const commaFields: (keyof SafeFormState)[] = [
    'investmentAmount',
    'valuationCap',
    'roundValuation',
    'newMoneyInvestment',
    'preRoundFullyDilutedShares',
  ];
  for (const f of commaFields) {
    if (merged[f]) merged[f] = formatWithCommas(String(merged[f])) as never;
  }
  return merged;
}

export interface UseSafeCalculatorReturn {
  form: SafeFormState;
  setField: <K extends keyof SafeFormState>(key: K, value: SafeFormState[K]) => void;
  reset: () => void;
  result: SafeConversionResult | null;
  error: string | null;
  /** 필수 입력이 충분히 채워졌는지 */
  isReady: boolean;
}

export function useSafeCalculator(initial?: Partial<SafeFormState>): UseSafeCalculatorReturn {
  const [form, setForm] = useState<SafeFormState>(() => mergeInitial(initial));

  const setField: UseSafeCalculatorReturn['setField'] = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const reset = () => setForm(initialSafeForm);

  const { result, error, isReady } = useMemo(() => {
    const investmentAmount = parseNum(form.investmentAmount);
    const roundValuation = parseNum(form.roundValuation);
    const preRoundFullyDilutedShares = parseNum(form.preRoundFullyDilutedShares);
    const newMoneyInvestment = parseNum(form.newMoneyInvestment) ?? 0;

    // 필수: 투자금액 + 라운드 기업가치 + 전환 직전 주식수
    const ready =
      investmentAmount != null && roundValuation != null && preRoundFullyDilutedShares != null;
    if (!ready) {
      return { result: null, error: null, isReady: false };
    }

    const discount = parseNum(form.discountPct);
    try {
      const res = calculateSafeConversion(
        {
          investmentAmount: investmentAmount!,
          valuationCap: parseNum(form.valuationCap),
          discountRate: discount != null ? discount / 100 : undefined,
          safeType: form.safeType,
        },
        {
          valuation: roundValuation!,
          valuationBasis: form.valuationBasis,
          newMoneyInvestment,
          preRoundFullyDilutedShares: preRoundFullyDilutedShares!,
        },
      );
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof SafeInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return { form, setField, reset, result, error, isReady };
}
