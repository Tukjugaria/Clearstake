/**
 * ClearStake — 엔젤투자 소득공제 계산 엔진 (조특법 제16조, 개략 추정)
 *
 * 투자금 구간별 공제율(marginal)로 공제액을 산출하고, 종합소득금액 한도를 적용한다.
 * 절세액은 종합소득세 누진세율로 (공제 전 세액 − 공제 후 세액)을 추정한다.
 *
 * ⚠️ 다른 소득공제·세액공제를 반영하지 않은 단순화 추정. 정확한 적용은 세무 자문 필요.
 * 모든 수치는 taxConfig에서 주입한다(하드코딩 금지).
 */

import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';
import { progressiveIncomeTax } from './incomeTax';

export interface AngelTaxInput {
  /** 투자금액 (₩) */
  investmentAmount: number;
  /** 해당 과세연도 종합소득금액 (₩) */
  comprehensiveIncome: number;
  /** 투자 연도 (일몰 안내용) — 선택 */
  investYear?: number;
}

export interface AngelTierBreakdown {
  upTo: number | null;
  rate: number;
  /** 이 구간에 배분된 투자금 (₩) */
  portion: number;
  /** 이 구간 공제액 (₩) */
  deduction: number;
}

export interface AngelTaxResult {
  /** 한도 적용 전 공제액 (₩) */
  deductionBeforeCap: number;
  /** 공제 한도 = 종합소득금액 × 한도율 (₩) */
  deductionLimit: number;
  /** 실제 적용 공제액 (₩) */
  deductionApplied: number;
  /** 투자금 대비 실효 공제율 (fraction) */
  effectiveDeductionRate: number;
  /** 구간별 내역 */
  tiers: AngelTierBreakdown[];
  /** 추정 절세액 (지방소득세 포함, ₩) */
  estimatedTaxSaving: number;
  warnings: string[];
}

export class AngelTaxInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AngelTaxInputError';
  }
}

function sunsetYear(dateStr: string): number {
  const y = Number(dateStr.slice(0, 4));
  return Number.isFinite(y) ? y : 9999;
}

export function calculateAngelTax(
  input: AngelTaxInput,
  config: TaxConfig = defaultTaxConfig,
): AngelTaxResult {
  if (!(input.investmentAmount > 0)) {
    throw new AngelTaxInputError('투자금액은 0보다 커야 합니다.');
  }
  if (!(input.comprehensiveIncome >= 0)) {
    throw new AngelTaxInputError('종합소득금액은 0 이상이어야 합니다.');
  }

  const warnings: string[] = [];
  const { angelInvestment, incomeTax } = config;
  const local = 1 + incomeTax.localSurtaxRate;

  // 구간별(marginal) 공제액
  const tiers: AngelTierBreakdown[] = [];
  let remaining = input.investmentAmount;
  let lower = 0;
  let deductionBeforeCap = 0;
  for (const tier of angelInvestment.deductionTiers) {
    if (remaining <= 0) break;
    const cap = tier.upTo ?? Infinity;
    const width = cap - lower;
    const portion = Math.min(remaining, width);
    const deduction = portion * tier.rate;
    deductionBeforeCap += deduction;
    tiers.push({ upTo: tier.upTo, rate: tier.rate, portion, deduction });
    remaining -= portion;
    lower = cap;
  }

  const deductionLimit = input.comprehensiveIncome * angelInvestment.incomeLimitRate;
  const deductionApplied = Math.min(deductionBeforeCap, deductionLimit);

  if (deductionBeforeCap > deductionLimit) {
    warnings.push('공제액이 종합소득금액 한도(50%)를 초과하여 한도까지만 적용되었습니다.');
  }
  if (input.comprehensiveIncome === 0) {
    warnings.push('종합소득금액이 없어 이번 연도 공제가 0입니다(이월 여부는 별도 확인).');
  }
  if (input.investYear != null && input.investYear > sunsetYear(angelInvestment.sunsetInvestBefore)) {
    warnings.push(
      `투자 연도가 일몰 기준(${angelInvestment.sunsetInvestBefore}) 이후입니다. 적용 여부는 최신 법령 확인이 필요합니다.`,
    );
  }

  const taxBefore = progressiveIncomeTax(input.comprehensiveIncome, incomeTax.brackets);
  const taxAfter = progressiveIncomeTax(
    Math.max(0, input.comprehensiveIncome - deductionApplied),
    incomeTax.brackets,
  );
  const estimatedTaxSaving = Math.round((taxBefore - taxAfter) * local);

  return {
    deductionBeforeCap,
    deductionLimit,
    deductionApplied,
    effectiveDeductionRate: deductionApplied / input.investmentAmount,
    tiers,
    estimatedTaxSaving,
    warnings,
  };
}
