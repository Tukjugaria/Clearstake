/**
 * ClearStake — 모듈 B (캡테이블 & 희석 시뮬레이터) 도메인 타입
 *
 * 금액 단위 ₩, 비율 fraction(0~1). 주식수는 정수.
 */

export type ShareholderGroup =
  | 'founder' // 창업자
  | 'investor' // 기존 투자자
  | 'optionPool' // 옵션풀
  | 'safe' // SAFE 전환분
  | 'newInvestor'; // 신규 라운드 투자자

/** 옵션풀 신설/확대 기준 */
export type OptionPoolBasis = 'pre' | 'post';

/** 현재(또는 직전 라운드 후) 주주 1행 */
export interface Shareholder {
  id: string;
  name: string;
  shares: number;
  group: ShareholderGroup;
}

/** 한 라운드의 입력 */
export interface RoundInput {
  id: string;
  name: string;
  /** pre-money 기업가치 (₩) */
  preMoneyValuation: number;
  /** 신규 투자금 (₩) */
  newMoneyInvestment: number;
  /** 목표 옵션풀: 라운드 후 완전희석 기준 총 옵션풀 비율(fraction). undefined면 변경 없음 */
  optionPoolTargetPct?: number;
  /** 옵션풀 기준: 'pre'(창업자 희석) | 'post'(전원 희석). 기본 'pre' */
  optionPoolBasis?: OptionPoolBasis;
  /** SAFE 전환 주식수(모듈 A 연동). 라운드 가격 결정 전 전환분으로 합산 */
  safeShares?: number;
  /** SAFE 전환분 표시 라벨 */
  safeLabel?: string;
}

/** 캡테이블 1행 (지분율 포함) */
export interface CapTableRow {
  id: string;
  name: string;
  group: ShareholderGroup;
  shares: number;
  /** 지분율 (fraction) */
  pct: number;
}

/** 한 라운드 계산 결과 */
export interface RoundResult {
  roundId: string;
  roundName: string;
  /** 라운드 주당가격 (₩) */
  pricePerShare: number;
  /** post-money 기업가치 (₩) */
  postMoneyValuation: number;
  /** 신규 투자자 발행 주식수 */
  newInvestorShares: number;
  /** 옵션풀 추가 발행 주식수 */
  optionPoolAddedShares: number;
  /** SAFE 전환 주식수 */
  safeShares: number;
  /** 라운드 후 총 주식수 */
  totalShares: number;
  /** 라운드 후 캡테이블 */
  rows: CapTableRow[];
  /** 비차단 경고 */
  warnings: string[];
}

/** 전체 시뮬레이션 결과 */
export interface CapTableSimulation {
  /** 초기 캡테이블 (라운드 적용 전) */
  initialRows: CapTableRow[];
  initialTotalShares: number;
  /** 라운드별 결과 (누적) */
  rounds: RoundResult[];
}
