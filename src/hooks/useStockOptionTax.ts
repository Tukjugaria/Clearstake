/**
 * EquityKit — 모듈 C: 스톡옵션 세제 계산기 헤드리스 훅
 */

import { useMemo, useState } from 'react';
import {
  calculateStockOptionTax,
  StockOptionTaxInputError,
} from '../lib/tax/stockOptionTax';
import type { StockOptionTaxResult } from '../lib/tax/types';
import { parseNum } from '../lib/format';

export interface TaxFormState {
  grantYear: string;
  exerciseYear: string;
  marketPrice: string;
  exercisePrice: string;
  shares: string;
  priorCumulativeExemptionUsed: string;
  isVentureQualified: boolean;
}

export const initialTaxForm: TaxFormState = {
  grantYear: '2022',
  exerciseYear: '2024',
  marketPrice: '50,000',
  exercisePrice: '10,000',
  shares: '10,000',
  priorCumulativeExemptionUsed: '',
  isVentureQualified: true,
};

export interface UseStockOptionTaxReturn {
  form: TaxFormState;
  setField: <K extends keyof TaxFormState>(key: K, value: TaxFormState[K]) => void;
  reset: () => void;
  result: StockOptionTaxResult | null;
  error: string | null;
  isReady: boolean;
}

export function useStockOptionTax(): UseStockOptionTaxReturn {
  const [form, setForm] = useState<TaxFormState>(initialTaxForm);

  const setField: UseStockOptionTaxReturn['setField'] = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const reset = () => setForm(initialTaxForm);

  const { result, error, isReady } = useMemo(() => {
    const grantYear = parseNum(form.grantYear);
    const exerciseYear = parseNum(form.exerciseYear);
    const marketPrice = parseNum(form.marketPrice);
    const exercisePrice = parseNum(form.exercisePrice);
    const shares = parseNum(form.shares);

    const ready =
      grantYear != null &&
      exerciseYear != null &&
      marketPrice != null &&
      exercisePrice != null &&
      shares != null;
    if (!ready) return { result: null, error: null, isReady: false };

    try {
      const res = calculateStockOptionTax({
        grantYear: grantYear!,
        exerciseYear: exerciseYear!,
        marketPrice: marketPrice!,
        exercisePrice: exercisePrice!,
        shares: shares!,
        priorCumulativeExemptionUsed: parseNum(form.priorCumulativeExemptionUsed) ?? 0,
        isVentureQualified: form.isVentureQualified,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg =
        e instanceof StockOptionTaxInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [form]);

  return { form, setField, reset, result, error, isReady };
}
