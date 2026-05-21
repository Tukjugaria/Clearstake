/**
 * ClearStake — RSU(양도제한조건부주식) 세제 계산 엔진 (개략 추정)
 *
 * 모델:
 *  - 베스팅(귀속) 시점: 시가 전액이 근로소득으로 과세 (스톡옵션과 달리 행사가·비과세 특례 없음 가정).
 *  - 매각 시점(선택): (매각가 − 베스팅 시가) × 주식수를 양도소득으로 과세.
 *
 * ⚠️ RSU의 한국 과세는 부여·귀속·매각 시점, 비상장 시가 산정, 거주자 여부 등 변수가 많다.
 *    근로소득은 다른 소득과 합산하지 않는 단순화 추정. 모든 세율은 taxConfig에서 주입.
 */

import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';
import { progressiveIncomeTax } from './incomeTax';
import { capitalGainsTaxBeforeLocal } from './capitalGains';

export interface RsuTaxInput {
  /** 베스팅(귀속) 주식수 */
  vestedShares: number;
  /** 베스팅 시점 1주당 시가 (₩) */
  fmvPerShareAtVest: number;
  /** (선택) 매각 1주당 가격 (₩) — 입력 시 양도소득 과세 추정 */
  salePricePerShare?: number;
  /** 양도세 유형 키 (예: 'smbSmall' | 'largeShareholder') */
  capitalGainsType?: string;
}

export interface RsuTaxResult {
  /** 베스팅 시 근로소득 (= 주식수 × 시가) */
  ordinaryIncome: number;
  /** 근로소득세 (지방세 포함, ₩) */
  laborTax: number;
  /** 양도차익 (매각가 입력 시) */
  capitalGain: number;
  /** 양도소득세 (지방세 포함, ₩) */
  capitalGainsTax: number;
  /** 총 세액 */
  totalTax: number;
  warnings: string[];
}

export class RsuTaxInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RsuTaxInputError';
  }
}

export function calculateRsuTax(
  input: RsuTaxInput,
  config: TaxConfig = defaultTaxConfig,
): RsuTaxResult {
  if (!(input.vestedShares > 0)) {
    throw new RsuTaxInputError('베스팅 주식수는 0보다 커야 합니다.');
  }
  if (!(input.fmvPerShareAtVest >= 0)) {
    throw new RsuTaxInputError('베스팅 시점 시가는 0 이상이어야 합니다.');
  }

  const { incomeTax } = config;
  const local = 1 + incomeTax.localSurtaxRate;
  const warnings: string[] = [
    'RSU는 베스팅 시 시가 전액이 근로소득으로 과세된다는 가정입니다(비과세 특례 미적용).',
  ];

  const ordinaryIncome = input.vestedShares * input.fmvPerShareAtVest;
  const laborTax = Math.round(progressiveIncomeTax(ordinaryIncome, incomeTax.brackets) * local);

  let capitalGain = 0;
  let capitalGainsTax = 0;
  if (input.salePricePerShare != null) {
    capitalGain = Math.max(0, (input.salePricePerShare - input.fmvPerShareAtVest) * input.vestedShares);
    capitalGainsTax = Math.round(capitalGainsTaxBeforeLocal(capitalGain, input.capitalGainsType, config) * local);
  }

  return {
    ordinaryIncome,
    laborTax,
    capitalGain,
    capitalGainsTax,
    totalTax: laborTax + capitalGainsTax,
    warnings,
  };
}
