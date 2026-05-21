import type { ShareholderGroup } from './captable/types';

/** 주주 그룹별 색상 (캡테이블·차트 공통) */
export const groupColors: Record<ShareholderGroup | 'existing', string> = {
  founder: '#2563eb', // brand blue
  investor: '#0ea5e9', // sky
  optionPool: '#a855f7', // purple
  safe: '#f59e0b', // amber
  newInvestor: '#10b981', // emerald
  existing: '#64748b', // slate (집계 기존 주주)
};

/** 주주 그룹 한글 라벨 */
export const groupLabels: Record<ShareholderGroup, string> = {
  founder: '창업자',
  investor: '기존 투자자',
  optionPool: '옵션풀',
  safe: 'SAFE 투자자',
  newInvestor: '신규 투자자',
};
