/**
 * ClearStake — 모듈 C (스톡옵션 세제 계산기) 도메인 타입
 *
 * 금액 단위 ₩, 비율 fraction. 모든 세제 수치는 taxConfig에서 주입한다(하드코딩 금지).
 */

export interface StockOptionTaxInput {
  /** 부여 연도 */
  grantYear: number;
  /** 행사 연도 */
  exerciseYear: number;
  /** 행사 당시 시가 (1주당, ₩) */
  marketPrice: number;
  /** 행사가격 (1주당, ₩) */
  exercisePrice: number;
  /** 행사 주식수 */
  shares: number;
  /** 과거 누적 비과세 사용액 (₩) — 없으면 0 */
  priorCumulativeExemptionUsed?: number;
  /** 벤처기업 요건 충족 여부 (미충족 시 비과세 특례 미적용) */
  isVentureQualified: boolean;
  /** 양도세 과세선택 시 적용할 양도세 유형 키 (예: 'smbSmall' | 'largeShareholder') */
  capitalGainsType?: string;
}

export interface InstallmentScheduleItem {
  /** 납부 연차 (1~N) */
  installment: number;
  amount: number;
}

export type ScenarioKey = 'laborLumpSum' | 'laborInstallment' | 'capitalGains';

export interface TaxScenario {
  key: ScenarioKey;
  label: string;
  /** 과세 베이스 (₩) */
  taxableBase: number;
  /** 산출세액 (지방소득세 포함, ₩) */
  totalTax: number;
  /** 분할 납부 스케줄 (해당 시나리오만) */
  schedule?: InstallmentScheduleItem[];
  note: string;
}

export interface StockOptionTaxResult {
  /** 행사이익 = (시가 − 행사가) × 주식수 */
  exerciseGain: number;
  /** 행사연도 기준 연간 비과세 한도 (₩) */
  annualExemptionLimit: number;
  /** 누적 비과세 한도 (₩) */
  cumulativeExemptionCap: number;
  /** 실제 적용된 비과세액 (₩) */
  exemptionApplied: number;
  /** 과세대상액 (₩) */
  taxableAmount: number;
  /** 연간 한도 소진율 (fraction) */
  annualUsageRate: number;
  /** 누적 한도 소진율 (이번 행사 포함, fraction) */
  cumulativeUsageRate: number;
  /** 시나리오 비교 (근로소득 일시/분할, 양도세 선택) */
  scenarios: TaxScenario[];
  /** 추천(최저 세액) 시나리오 키 */
  recommendedKey: ScenarioKey;
  warnings: string[];
}
