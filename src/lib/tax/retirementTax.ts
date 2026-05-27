/**
 * VCEquityNote — 퇴직금·퇴직소득세 계산 엔진 (개략 추정)
 *
 * 평균임금 × 근속연수로 퇴직금을 계산하고, 소득세법 제48조 환산급여 방식으로
 * 퇴직소득세를 산출한 뒤 세후 실수령을 보여준다.
 *
 *   환산급여     = (퇴직금 − 근속연수공제) × 12 ÷ 근속연수
 *   환산급여공제 = 구간별 누적 공제 (config)
 *   과세표준    = 환산급여 − 환산급여공제
 *   산출세액    = 종합소득세율(과세표준) × 근속연수 ÷ 12
 *   납부세액    = 산출세액 + 지방소득세 10%
 *
 * 단순화/한계:
 *  - 임원퇴직금 한도(법인세법 §44)·중간정산·DC형 운용수익은 미반영.
 *  - 평균임금은 입력값 사용 (퇴직 전 3개월 평균임금 직접 입력).
 *  - 근속연수는 소수 허용(연 단위, 1년 미만은 절상 처리 옵션 미제공).
 */
import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';
import { progressiveIncomeTax } from './incomeTax';

export interface RetirementTaxInput {
  /** 평균 월급 (퇴직 전 3개월 평균임금, ₩) */
  monthlyAverageSalary: number;
  /** 근속연수 (소수 허용, 예: 3.5년) */
  serviceYears: number;
}

export interface RetirementTaxResult {
  /** 퇴직금 = 평균월급 × 근속연수 (₩) */
  severancePay: number;
  /** 근속연수공제 */
  serviceYearDeduction: number;
  /** 환산급여 */
  convertedSalary: number;
  /** 환산급여공제 */
  convertedSalaryDeduction: number;
  /** 과세표준 */
  taxBase: number;
  /** 산출세액 (지방세 전) */
  computedTax: number;
  /** 지방소득세 */
  localTax: number;
  /** 총 세액 */
  totalTax: number;
  /** 세후 실수령 */
  netAfterTax: number;
  /** 퇴직금 대비 실효세율 */
  effectiveTaxRate: number;
  warnings: string[];
}

export class RetirementTaxInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetirementTaxInputError';
  }
}

/** 근속연수공제: 구간 marginal 누적 */
function serviceYearDeduction(years: number, config: TaxConfig): number {
  if (years <= 0) return 0;
  const tiers = config.retirement.serviceYearDeduction;
  let total = 0;
  let lower = 0;
  for (const t of tiers) {
    const upper = t.upToYears ?? Infinity;
    const portion = Math.min(years, upper) - lower;
    if (portion > 0) total += portion * t.perYear;
    if (years <= upper) return total;
    lower = upper;
  }
  return total;
}

/** 환산급여공제: 구간 base + (해당 구간 초과분 × rate) */
function convertedSalaryDeduction(convertedSalary: number, config: TaxConfig): number {
  if (convertedSalary <= 0) return 0;
  const tiers = config.retirement.convertedSalaryDeduction;
  let prev = 0;
  for (const t of tiers) {
    const upper = t.upTo ?? Infinity;
    if (convertedSalary <= upper) {
      return t.base + (convertedSalary - prev) * t.rate;
    }
    prev = upper;
  }
  const last = tiers[tiers.length - 1];
  return last.base + (convertedSalary - prev) * last.rate;
}

export function calculateRetirementTax(
  input: RetirementTaxInput,
  config: TaxConfig = defaultTaxConfig,
): RetirementTaxResult {
  if (!(input.monthlyAverageSalary > 0))
    throw new RetirementTaxInputError('평균 월급은 0보다 커야 합니다.');
  if (!(input.serviceYears > 0))
    throw new RetirementTaxInputError('근속연수는 0보다 커야 합니다.');

  const severancePay = Math.round(input.monthlyAverageSalary * input.serviceYears);
  const syd = Math.round(serviceYearDeduction(input.serviceYears, config));
  const afterServiceDeduction = Math.max(0, severancePay - syd);

  // 환산급여 = (퇴직금 − 근속연수공제) × 12 ÷ 근속연수
  const convertedSalary = Math.round((afterServiceDeduction * 12) / input.serviceYears);
  const csd = Math.round(convertedSalaryDeduction(convertedSalary, config));
  const taxBase = Math.max(0, convertedSalary - csd);

  // 산출세액 = 환산과세표준에 누진세율 → 근속연수/12 환원
  const annualTax = progressiveIncomeTax(taxBase, config.incomeTax.brackets);
  const computedTax = Math.round((annualTax * input.serviceYears) / 12);
  const localTax = Math.round(computedTax * config.incomeTax.localSurtaxRate);
  const totalTax = computedTax + localTax;
  const netAfterTax = severancePay - totalTax;

  return {
    severancePay,
    serviceYearDeduction: syd,
    convertedSalary,
    convertedSalaryDeduction: csd,
    taxBase: Math.round(taxBase),
    computedTax,
    localTax,
    totalTax,
    netAfterTax,
    effectiveTaxRate: severancePay > 0 ? totalTax / severancePay : 0,
    warnings: [
      '임원퇴직금 한도(법인세법 §44)·중간정산·DC형 운용수익은 미반영한 개략 추정입니다.',
      '평균임금은 입력값을 그대로 사용 — 퇴직 전 3개월 평균임금을 정확히 산정해 입력하세요.',
    ],
  };
}
