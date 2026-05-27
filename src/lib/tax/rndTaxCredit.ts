/**
 * VCEquityNote — 연구·인력개발비 세액공제 계산 엔진 (조특법 §10, 개략 추정)
 *
 * 당기 발생액 방식과 증가분 방식 중 더 큰 공제액을 선택하고,
 * 최저한세(조특법 §132)를 적용한 실제 차감세액·납부세액을 산출한다.
 *
 *   당기방식  = 당기 R&D × 기업유형별 공제율 (중소 25% / 중견 8% / 일반 2%)
 *   증가방식  = max(0, 당기 − 전기) × 증가분 공제율 (중소 50% / 중견 40% / 일반 25%)
 *   선택공제  = max(당기, 증가)
 *   납부세액  = max(법인세 산출 − 공제, 최저한세)
 *
 * 단순화/한계: 신성장·원천기술 가산공제, 이월공제, 연구원 인원 가산 미반영.
 */
import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';
import { progressiveIncomeTax } from './incomeTax';

export interface RndTaxCreditInput {
  /** 당기 연구·인력개발비 (₩) */
  currentRndExpense: number;
  /** 전기 연구·인력개발비 (₩) — 증가분 방식 사용 시 필요 */
  priorRndExpense?: number;
  /** 기업 유형 키 (smb/middleStanding/large) */
  companyTypeKey: string;
  /** 연 과세표준 (₩) — 법인세 산출용 */
  taxableIncome: number;
}

export interface RndCreditOption {
  key: 'current' | 'increase';
  label: string;
  /** 산출 공제액 (₩) */
  credit: number;
  /** 적용된 공제율 (fraction) */
  rate: number;
  /** 산정 베이스 (당기액 또는 증가액) */
  base: number;
  /** 이 방식 사용 가능 여부 */
  available: boolean;
  note: string;
}

export interface RndTaxCreditResult {
  /** 선택된 공제 방식 */
  selectedKey: 'current' | 'increase';
  /** 선택된 공제액 */
  selectedCredit: number;
  /** 양쪽 방식 비교 */
  options: RndCreditOption[];
  /** 공제 전 법인세 (산출세액, 지방세 전) */
  corporateTaxBefore: number;
  /** 최저한세 (지방세 전) */
  minimumTax: number;
  /** 실제 차감된 세액 (= min(선택공제, 산출세액 − 최저한세)) */
  effectiveSaving: number;
  /** 공제 후 법인세 (지방세 전) */
  corporateTaxAfter: number;
  /** 공제 후 지방소득세 */
  localTax: number;
  /** 총 납부세액 (법인세 + 지방세) */
  totalPayable: number;
  /** 공제 전 총 납부세액 (비교용) */
  totalPayableBefore: number;
  /** 실효 절세액 (= 공제 전 − 공제 후 총납부) */
  effectiveTaxSaving: number;
  warnings: string[];
}

export class RndTaxCreditInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RndTaxCreditInputError';
  }
}

export function calculateRndTaxCredit(
  input: RndTaxCreditInput,
  config: TaxConfig = defaultTaxConfig,
): RndTaxCreditResult {
  if (!(input.currentRndExpense >= 0))
    throw new RndTaxCreditInputError('당기 연구개발비는 0 이상이어야 합니다.');
  if (!(input.taxableIncome >= 0))
    throw new RndTaxCreditInputError('과세표준은 0 이상이어야 합니다.');

  const { rndTaxCredit, corporateTax } = config;
  const type = rndTaxCredit.rates.find((r) => r.key === input.companyTypeKey) ?? rndTaxCredit.rates[0];

  // 당기 발생액 방식
  const currentCredit = Math.round(input.currentRndExpense * type.currentRate);
  const currentOption: RndCreditOption = {
    key: 'current',
    label: `당기 발생액 (${type.label}, ${(type.currentRate * 100).toFixed(0)}%)`,
    credit: currentCredit,
    rate: type.currentRate,
    base: input.currentRndExpense,
    available: true,
    note: '당기 연구개발비 전액에 공제율을 곱한 금액.',
  };

  // 증가분 방식
  const priorAvailable = input.priorRndExpense != null && input.priorRndExpense >= 0;
  const increaseBase = priorAvailable
    ? Math.max(0, input.currentRndExpense - (input.priorRndExpense ?? 0))
    : 0;
  const increaseCredit = Math.round(increaseBase * type.increaseRate);
  const increaseOption: RndCreditOption = {
    key: 'increase',
    label: `증가분 (${(type.increaseRate * 100).toFixed(0)}%)`,
    credit: increaseCredit,
    rate: type.increaseRate,
    base: increaseBase,
    available: priorAvailable && increaseBase > 0,
    note: priorAvailable
      ? '(당기 − 전기) 양수분에 증가분 공제율을 곱한 금액.'
      : '전기 R&D 지출 입력 시 활성화됩니다.',
  };

  // 선택: 더 큰 공제
  const candidates = [currentOption, increaseOption].filter((o) => o.available);
  const selected = candidates.reduce((best, o) => (o.credit > best.credit ? o : best));

  // 법인세 산출 + 최저한세
  const corporateTaxBefore = Math.round(
    progressiveIncomeTax(input.taxableIncome, corporateTax.brackets),
  );
  const minRate =
    input.companyTypeKey === 'smb' ? rndTaxCredit.minimumTaxRates.smb : rndTaxCredit.minimumTaxRates.general;
  const minimumTax = Math.round(input.taxableIncome * minRate);

  // 공제 적용 (최저한세 한도)
  const maxAllowedCredit = Math.max(0, corporateTaxBefore - minimumTax);
  const effectiveSaving = Math.min(selected.credit, maxAllowedCredit);
  const corporateTaxAfter = corporateTaxBefore - effectiveSaving;

  const localBefore = Math.round(corporateTaxBefore * corporateTax.localSurtaxRate);
  const localTax = Math.round(corporateTaxAfter * corporateTax.localSurtaxRate);
  const totalPayable = corporateTaxAfter + localTax;
  const totalPayableBefore = corporateTaxBefore + localBefore;

  const warnings: string[] = [];
  if (selected.credit > maxAllowedCredit) {
    warnings.push(
      `최저한세(${(minRate * 100).toFixed(0)}%) 적용으로 공제액 ${selected.credit.toLocaleString('ko-KR')}원 중 ${(selected.credit - maxAllowedCredit).toLocaleString('ko-KR')}원이 이월 가능 (당기 미차감).`,
    );
  }
  if (!priorAvailable) {
    warnings.push('전기 R&D 지출을 입력하면 증가분 방식 공제와 비교할 수 있습니다.');
  }

  return {
    selectedKey: selected.key,
    selectedCredit: selected.credit,
    options: [currentOption, increaseOption],
    corporateTaxBefore,
    minimumTax,
    effectiveSaving,
    corporateTaxAfter,
    localTax,
    totalPayable,
    totalPayableBefore,
    effectiveTaxSaving: totalPayableBefore - totalPayable,
    warnings,
  };
}
