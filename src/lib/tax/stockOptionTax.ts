/**
 * EquityKit — 모듈 C: 벤처기업 스톡옵션 세제 계산 엔진 (순수 함수)
 *
 * ⚠️ 개략 추정 계산이다. 정밀 세액은 다른 소득·대주주 여부·보유기간 등 변수가 많아
 *    면책을 강조하고 세무 자문으로 연결한다. (기획서 §9 미해결 결정 로그 참조)
 *
 * 모든 세제 수치(연간/누적 비과세 한도, 일몰, 세율 등)는 taxConfig에서 주입한다.
 * 코드에 법령 수치를 하드코딩하지 않는다. (기획서 수용 기준)
 *
 * ── 모델 가정 ──────────────────────────────────────────────────────────
 * 1) 행사이익 = (시가 − 행사가) × 주식수.  음수면 0.
 * 2) 비과세(조특법 16조의2): 행사연도 기준 연간 한도 + 벤처기업별 누적 한도(5억)를 동시 적용.
 *      비과세액 = min(행사이익, 연간한도, 누적잔여한도).  벤처기업 미충족이면 0.
 * 3) 근로소득 과세: 과세대상액(=행사이익−비과세)에 종합소득세율(누진) 적용 + 지방소득세 10%.
 *      ⚠️ 다른 소득과 합산하지 않는 단순화(과세대상액만을 과세표준으로 가정).
 * 4) 분할납부(16조의3): 산출 소득세를 N년 균등 분할(무이자 가정, 개략).
 * 5) 양도소득 과세선택(16조의4): 행사이익 전액을 양도소득으로 과세(비과세 미사용),
 *      (행사이익 − 양도 기본공제) × 양도세율 + 지방소득세.  ⚠️ 세율은 추정값(config).
 * ──────────────────────────────────────────────────────────────────────
 */

import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';
import { progressiveIncomeTax } from './incomeTax';
import type {
  StockOptionTaxInput,
  StockOptionTaxResult,
  TaxScenario,
  InstallmentScheduleItem,
} from './types';

export class StockOptionTaxInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StockOptionTaxInputError';
  }
}

/** 행사연도 기준 연간 비과세 한도 선택 (fromYear 내림차순으로 첫 매칭) */
function annualExemptionLimitFor(
  exerciseYear: number,
  table: TaxConfig['stockOption']['annualExemptionByExerciseYear'],
): number {
  const sorted = [...table].sort((a, b) => b.fromYear - a.fromYear);
  for (const t of sorted) {
    if (exerciseYear >= t.fromYear) return t.limit;
  }
  return sorted[sorted.length - 1].limit;
}

function buildInstallmentSchedule(total: number, years: number): InstallmentScheduleItem[] {
  if (years <= 0) return [{ installment: 1, amount: total }];
  const per = Math.floor(total / years);
  const items: InstallmentScheduleItem[] = [];
  let allocated = 0;
  for (let i = 1; i <= years; i++) {
    // 마지막 연차에 잔여(반올림 오차) 몰아주기
    const amount = i === years ? total - allocated : per;
    allocated += amount;
    items.push({ installment: i, amount });
  }
  return items;
}

function validate(input: StockOptionTaxInput): void {
  if (!(input.shares > 0)) {
    throw new StockOptionTaxInputError('행사 주식수는 0보다 커야 합니다.');
  }
  if (!(input.marketPrice >= 0) || !(input.exercisePrice >= 0)) {
    throw new StockOptionTaxInputError('시가·행사가격은 0 이상이어야 합니다.');
  }
  if (!Number.isInteger(input.grantYear) || !Number.isInteger(input.exerciseYear)) {
    throw new StockOptionTaxInputError('부여/행사 연도는 정수여야 합니다.');
  }
  if (input.exerciseYear < input.grantYear) {
    throw new StockOptionTaxInputError('행사 연도는 부여 연도 이후여야 합니다.');
  }
  if (input.priorCumulativeExemptionUsed != null && input.priorCumulativeExemptionUsed < 0) {
    throw new StockOptionTaxInputError('과거 누적 비과세 사용액은 0 이상이어야 합니다.');
  }
}

/**
 * 스톡옵션 행사 세제를 계산한다.
 * @param input 사용자 입력
 * @param config 세제 config (기본: taxConfig). 테스트/시뮬레이션 시 주입 가능.
 * @throws {StockOptionTaxInputError}
 */
export function calculateStockOptionTax(
  input: StockOptionTaxInput,
  config: TaxConfig = defaultTaxConfig,
): StockOptionTaxResult {
  validate(input);

  const warnings: string[] = [];
  const { stockOption, incomeTax, capitalGains } = config;
  const local = 1 + incomeTax.localSurtaxRate;

  const exerciseGain = Math.max(0, (input.marketPrice - input.exercisePrice) * input.shares);

  const annualExemptionLimit = annualExemptionLimitFor(
    input.exerciseYear,
    stockOption.annualExemptionByExerciseYear,
  );
  const cumulativeExemptionCap = stockOption.cumulativeExemptionCap;
  const priorUsed = Math.max(0, input.priorCumulativeExemptionUsed ?? 0);
  const remainingCumulative = Math.max(0, cumulativeExemptionCap - priorUsed);

  // 비과세 적용액
  let exemptionApplied = 0;
  if (!input.isVentureQualified) {
    warnings.push('벤처기업 요건 미충족으로 비과세 특례를 적용하지 않았습니다(전액 과세대상).');
  } else {
    exemptionApplied = Math.min(exerciseGain, annualExemptionLimit, remainingCumulative);
    if (exerciseGain > annualExemptionLimit) {
      warnings.push('행사이익이 연간 비과세 한도를 초과하여 초과분은 과세대상입니다.');
    }
    if (priorUsed + exemptionApplied >= cumulativeExemptionCap) {
      warnings.push('벤처기업별 누적 비과세 한도(5억원)에 도달했습니다.');
    }
  }

  // 일몰 안내
  if (input.grantYear > sunsetYear(stockOption.sunsetGrantBefore)) {
    warnings.push(
      `부여 연도가 일몰 기준(${stockOption.sunsetGrantBefore}) 이후입니다. 비과세 특례 적용 여부는 최신 법령 확인이 필요합니다.`,
    );
  }

  const taxableAmount = Math.max(0, exerciseGain - exemptionApplied);

  const annualUsageRate = annualExemptionLimit > 0 ? exemptionApplied / annualExemptionLimit : 0;
  const cumulativeUsageRate =
    cumulativeExemptionCap > 0 ? (priorUsed + exemptionApplied) / cumulativeExemptionCap : 0;

  // ── 시나리오 세액 계산 ──
  const laborTax = Math.round(progressiveIncomeTax(taxableAmount, incomeTax.brackets) * local);

  const lumpSum: TaxScenario = {
    key: 'laborLumpSum',
    label: '근로소득 과세 · 일시납부',
    taxableBase: taxableAmount,
    totalTax: laborTax,
    note: '비과세 적용 후 과세대상액에 종합소득세율(+지방소득세 10%)을 적용한 개략 추정.',
  };

  const installment: TaxScenario = {
    key: 'laborInstallment',
    label: `근로소득 과세 · ${stockOption.installmentYears}년 분할납부`,
    taxableBase: taxableAmount,
    totalTax: laborTax,
    schedule: buildInstallmentSchedule(laborTax, stockOption.installmentYears),
    note: '총 세액은 일시납부와 동일하나 납부특례(제16조의3)로 균등 분할(무이자 가정, 개략).',
  };

  const cgBase = Math.max(0, exerciseGain - capitalGains.annualDeduction);
  const cgTax = Math.round(cgBase * capitalGains.rate * local);
  const capitalGainsScenario: TaxScenario = {
    key: 'capitalGains',
    label: '양도소득 과세 선택',
    taxableBase: cgBase,
    totalTax: cgTax,
    note: '적격주식매수선택권 양도세 과세선택(제16조의4). 행사이익 전액을 양도소득으로 과세(비과세 미사용). ⚠️ 세율은 추정값으로 정밀 검증 필요.',
  };

  const scenarios = [lumpSum, installment, capitalGainsScenario];

  // 추천: 최저 총세액 (분할/일시는 총액 동일하므로 일시납부를 대표로)
  const comparable: TaxScenario[] = [lumpSum, capitalGainsScenario];
  const recommendedKey = comparable.reduce((best, s) => (s.totalTax < best.totalTax ? s : best))
    .key;

  return {
    exerciseGain,
    annualExemptionLimit,
    cumulativeExemptionCap,
    exemptionApplied,
    taxableAmount,
    annualUsageRate,
    cumulativeUsageRate,
    scenarios,
    recommendedKey,
    warnings,
  };
}

/** "2027-12-31" → 2027 */
function sunsetYear(dateStr: string): number {
  const y = Number(dateStr.slice(0, 4));
  return Number.isFinite(y) ? y : 9999;
}
