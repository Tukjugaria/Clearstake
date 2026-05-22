/**
 * VCEquityNote — 숫자/통화/비율 포맷팅 유틸 (UI 전용, 도메인 로직과 분리)
 */

/** ₩ 통화 표기 (천단위 구분, 반올림) */
export function won(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `₩${Math.round(n).toLocaleString('ko-KR')}`;
}

/** 천단위 구분 정수 표기 */
export function num(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('ko-KR');
}

/** fraction(0~1) → % 문자열 (기본 소수 2자리) */
export function pct(fraction: number, digits = 2): string {
  if (!Number.isFinite(fraction)) return '—';
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** 큰 금액을 한국식 억/조 단위로 요약 (예: 12_300_000_000 → "123억") */
export function wonShort(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const jo = 1_0000_0000_0000;
  const eok = 1_0000_0000;
  const man = 1_0000;
  if (abs >= jo) return `${sign}${trimZero(abs / jo)}조`;
  if (abs >= eok) return `${sign}${trimZero(abs / eok)}억`;
  if (abs >= man) return `${sign}${trimZero(abs / man)}만`;
  return won(n);
}

function trimZero(v: number): string {
  return v
    .toFixed(2)
    .replace(/\.?0+$/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 입력 문자열 → number | undefined.
 * 빈칸/부분입력 허용, 천단위 콤마 제거. 유한수가 아니면 undefined.
 */
export function parseNum(v: string): number | undefined {
  if (v == null) return undefined;
  if (v.trim() === '') return undefined;
  const n = Number(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/** 입력값을 천단위 콤마가 들어간 표시용 문자열로 변환 (정수부만 콤마). 빈칸은 그대로. */
export function formatWithCommas(v: string): string {
  if (v.trim() === '') return '';
  const cleaned = v.replace(/,/g, '');
  // 숫자/소수점/선행 마이너스 외 문자 제거
  const match = cleaned.match(/^-?\d*\.?\d*$/);
  if (!match) return v;
  const [intPart, decPart] = cleaned.split('.');
  const sign = intPart.startsWith('-') ? '-' : '';
  const digits = intPart.replace('-', '');
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart != null ? `${sign}${grouped}.${decPart}` : `${sign}${grouped}`;
}
