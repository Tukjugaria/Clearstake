/**
 * VCEquityNote — 시나리오 URL 공유 (쿼리스트링 인코딩, 서버 저장 없음)
 *
 * 입력값을 URL 쿼리에 담아 공유한다. 모든 데이터는 URL에만 존재하며 서버로 전송되지 않는다.
 */

import type { SafeFormState } from '../hooks/safeFormTypes';

/** SafeFormState 키 ↔ 짧은 쿼리 파라미터 매핑 */
const SAFE_PARAM_MAP: Record<keyof SafeFormState, string> = {
  investmentAmount: 'inv',
  valuationCap: 'cap',
  discountPct: 'disc',
  safeType: 'st',
  roundValuation: 'val',
  valuationBasis: 'vb',
  newMoneyInvestment: 'nm',
  preRoundFullyDilutedShares: 'sh',
};

/** 콤마/공백 제거한 원시 문자열 */
function raw(v: string): string {
  return v.replace(/,/g, '').trim();
}

/** SafeFormState → URLSearchParams (빈 값은 생략) */
export function safeFormToParams(form: SafeFormState): URLSearchParams {
  const params = new URLSearchParams();
  (Object.keys(SAFE_PARAM_MAP) as (keyof SafeFormState)[]).forEach((key) => {
    const value = String(form[key] ?? '');
    const cleaned = key === 'safeType' || key === 'valuationBasis' ? value : raw(value);
    if (cleaned !== '') params.set(SAFE_PARAM_MAP[key], cleaned);
  });
  return params;
}

/** URLSearchParams(또는 search 문자열) → Partial<SafeFormState> */
export function paramsToSafeForm(input: URLSearchParams | string): Partial<SafeFormState> {
  const params = typeof input === 'string' ? new URLSearchParams(input) : input;
  const out: Partial<SafeFormState> = {};
  (Object.keys(SAFE_PARAM_MAP) as (keyof SafeFormState)[]).forEach((key) => {
    const value = params.get(SAFE_PARAM_MAP[key]);
    if (value == null) return;
    if (key === 'safeType') {
      if (value === 'pre' || value === 'post') out.safeType = value;
    } else if (key === 'valuationBasis') {
      if (value === 'preMoney' || value === 'postMoney') out.valuationBasis = value;
    } else {
      out[key] = value;
    }
  });
  return out;
}

/** 현재 SAFE 폼을 공유 가능한 절대 URL로 만든다 (BrowserRouter 경로+쿼리) */
export function buildSafeShareUrl(form: SafeFormState): string {
  const params = safeFormToParams(form);
  const { origin } = window.location;
  const query = params.toString();
  return `${origin}/safe${query ? `?${query}` : ''}`;
}
