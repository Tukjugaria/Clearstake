/**
 * VCEquityNote — 양도소득세 공용 유틸 (주주 유형별 법정 세율, config 주입)
 */

import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';
import { progressiveIncomeTax } from './incomeTax';

type CapitalGainsType = TaxConfig['capitalGains']['types'][number];

/** 유형 키로 양도세 구간을 찾는다(없으면 기본 유형) */
export function resolveCapitalGainsType(
  typeKey: string | undefined,
  config: TaxConfig = defaultTaxConfig,
): CapitalGainsType {
  const { types, defaultType } = config.capitalGains;
  return (
    types.find((t) => t.key === typeKey) ??
    types.find((t) => t.key === defaultType) ??
    types[0]
  );
}

/** 양도차익 → 양도소득세(지방소득세 전). 기본공제 적용 후 누진세율. */
export function capitalGainsTaxBeforeLocal(
  gain: number,
  typeKey: string | undefined,
  config: TaxConfig = defaultTaxConfig,
): number {
  const type = resolveCapitalGainsType(typeKey, config);
  const base = Math.max(0, gain - config.capitalGains.annualDeduction);
  return progressiveIncomeTax(base, type.brackets);
}
