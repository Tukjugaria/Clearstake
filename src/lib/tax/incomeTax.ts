/**
 * EquityKit — 종합소득세 누진세율 공용 유틸 (config 주입)
 */

import type { IncomeTaxBracket } from '../../config/taxConfig';

/** 누진세율 적용: 산출세액 = 과세표준 × rate − 누진공제 (음수 방지) */
export function progressiveIncomeTax(
  base: number,
  brackets: readonly IncomeTaxBracket[],
): number {
  if (base <= 0) return 0;
  for (const b of brackets) {
    if (b.upTo == null || base <= b.upTo) {
      return Math.max(0, base * b.rate - b.progressiveDeduction);
    }
  }
  const last = brackets[brackets.length - 1];
  return Math.max(0, base * last.rate - last.progressiveDeduction);
}
