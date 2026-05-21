/**
 * ClearStake — 창업중소기업 등 세액감면 계산 엔진 (조특법 제6조, 개략 추정)
 *
 * 법인세 산출세액에 감면율을 적용해 감면세액·납부세액을 추정한다.
 * ⚠️ 지역·업종·연령(청년)·매출 요건에 따라 감면율·기간이 달라진다. 본 계산은 단순 추정.
 * 모든 수치는 taxConfig에서 주입한다.
 */

import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';
import { progressiveIncomeTax } from './incomeTax';

export interface StartupTaxInput {
  /** 연 과세표준(법인소득, ₩) */
  taxableIncome: number;
  /** 감면율 (fraction, 예: 1.0 = 100%, 0.5 = 50%) */
  reductionRate: number;
  /** 감면 기간 (년) */
  years: number;
}

export interface StartupTaxResult {
  /** 연 법인세 산출세액 (지방세 전) */
  corporateTaxPerYear: number;
  /** 연 지방소득세 (법인세액의 10%) */
  localTaxPerYear: number;
  /** 연 감면세액 (법인세 기준) */
  reliefPerYear: number;
  /** 연 납부세액 (법인세 − 감면 + 지방세) */
  payablePerYear: number;
  /** 감면 기간 총 감면세액 */
  totalRelief: number;
  /** 감면 기간 총 납부세액 */
  totalPayable: number;
  warnings: string[];
}

export class StartupTaxInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StartupTaxInputError';
  }
}

export function calculateStartupTaxRelief(
  input: StartupTaxInput,
  config: TaxConfig = defaultTaxConfig,
): StartupTaxResult {
  if (!(input.taxableIncome >= 0)) {
    throw new StartupTaxInputError('과세표준은 0 이상이어야 합니다.');
  }
  if (input.reductionRate < 0 || input.reductionRate > 1) {
    throw new StartupTaxInputError('감면율은 0 이상 1 이하여야 합니다.');
  }
  if (!(input.years > 0)) {
    throw new StartupTaxInputError('감면 기간은 0보다 커야 합니다.');
  }

  const { corporateTax } = config;
  const corporateTaxPerYear = progressiveIncomeTax(input.taxableIncome, corporateTax.brackets);
  const reliefPerYear = corporateTaxPerYear * input.reductionRate;
  const reducedCorporate = corporateTaxPerYear - reliefPerYear;
  // 지방소득세는 감면 후 법인세액 기준(개략) — 감면분에는 지방세 비과세 가정
  const localTaxPerYear = reducedCorporate * corporateTax.localSurtaxRate;
  const payablePerYear = reducedCorporate + localTaxPerYear;

  return {
    corporateTaxPerYear,
    localTaxPerYear,
    reliefPerYear,
    payablePerYear,
    totalRelief: reliefPerYear * input.years,
    totalPayable: payablePerYear * input.years,
    warnings: [
      '감면 요건(지역·업종·청년·매출)과 감면율·기간은 단순화 추정입니다. 최소납부세제·농특세 등은 미반영.',
    ],
  };
}
