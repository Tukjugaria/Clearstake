import type { ShareholderGroup } from './captable/types';

/** 주주 그룹별 색상 (캡테이블·차트 공통) — 잉크·뮤트 톤 */
export const groupColors: Record<ShareholderGroup | 'existing', string> = {
  founder: '#272c33', // ink
  investor: '#6e7a8a', // slate
  optionPool: '#a8967f', // taupe
  safe: '#b07d3f', // muted ochre
  newInvestor: '#5d8a76', // muted teal
  existing: '#c2c6cc', // light gray
};

/** 주주 그룹 한글 라벨 */
export const groupLabels: Record<ShareholderGroup, string> = {
  founder: '창업자',
  investor: '기존 투자자',
  optionPool: '옵션풀',
  safe: 'SAFE 투자자',
  newInvestor: '신규 투자자',
};
