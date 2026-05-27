/**
 * VCEquityNote — 부가가치세(VAT) 계산기 (개략 추정)
 *
 * 일반과세(10%)와 간이과세(업종별 부가율) 납부세액을 동시 계산하고
 * 어느 방식이 유리한지 비교한다.
 *
 * ⚠️ 모든 수치(부가율·임계점·매입공제율)는 taxConfig에서 주입. 업종 세부분류·
 *    최신 고시는 별도 확인 필요. 면세·영세율·의제매입세액 등은 미반영.
 */
import { taxConfig as defaultTaxConfig, type TaxConfig } from '../../config/taxConfig';

export interface VatInput {
  /** 연 매출 (₩) — VAT 포함 여부는 별도 플래그 */
  annualSales: number;
  /** 연 매입 (₩) */
  annualPurchases: number;
  /** 입력 매출이 VAT 포함 금액인지(true=포함) — 일반과세는 공급가액으로 환산 */
  salesIncludesVat: boolean;
  /** 간이과세 업종 키 (config.vat.simplifiedSectors) */
  simplifiedSectorKey: string;
}

export interface VatScenario {
  key: 'general' | 'simplified';
  label: string;
  /** 매출세액 (₩) */
  outputTax: number;
  /** 매입세액공제 (₩) */
  inputCredit: number;
  /** 납부세액 (음수=환급, 단 간이는 환급 불가) */
  netPayable: number;
  /** 적용 가능 여부 (간이과세는 매출 8천만 미만) */
  eligible: boolean;
  note: string;
}

export interface VatResult {
  /** 공급가액 기준 매출 (입력이 VAT 포함이면 1.1로 나눈 값) */
  netSales: number;
  /** 공급가액 기준 매입 */
  netPurchases: number;
  /** 시나리오 비교 */
  scenarios: VatScenario[];
  /** 더 유리한 방식 (적용 가능한 것 중 납부세액 적은 쪽) */
  recommendedKey: 'general' | 'simplified';
  /** 매출 대비 실효 부담률 (납부세액/매출) */
  effectiveRate: number;
  warnings: string[];
}

export class VatInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VatInputError';
  }
}

export function calculateVat(input: VatInput, config: TaxConfig = defaultTaxConfig): VatResult {
  if (!(input.annualSales >= 0)) throw new VatInputError('연 매출은 0 이상이어야 합니다.');
  if (!(input.annualPurchases >= 0)) throw new VatInputError('연 매입은 0 이상이어야 합니다.');

  const { vat } = config;
  const r = vat.standardRate;

  // 입력이 VAT 포함이면 공급가액으로 환산 (1 + 10%로 나누기)
  const netSales = input.salesIncludesVat ? input.annualSales / (1 + r) : input.annualSales;
  // 매입은 일반적으로 세금계산서상 공급가액 입력 가정 (포함/제외 차이는 본 단순화에서 제외)
  const netPurchases = input.annualPurchases;

  // 일반과세
  const generalOutput = Math.round(netSales * r);
  const generalInput = Math.round(netPurchases * r);
  const generalNet = generalOutput - generalInput;
  const general: VatScenario = {
    key: 'general',
    label: '일반과세',
    outputTax: generalOutput,
    inputCredit: generalInput,
    netPayable: generalNet,
    eligible: true,
    note: '매출세액(매출×10%)에서 매입세액(매입×10%)을 차감. 음수면 환급.',
  };

  // 간이과세
  const sector =
    vat.simplifiedSectors.find((s) => s.key === input.simplifiedSectorKey) ?? vat.simplifiedSectors[0];
  const simplifiedOutput = Math.round(netSales * sector.rate * r);
  const simplifiedInput = Math.round(netPurchases * vat.simplifiedPurchaseCreditRate);
  // 간이과세는 환급 불가 — 음수는 0
  const simplifiedNet = Math.max(0, simplifiedOutput - simplifiedInput);
  const eligible = netSales < vat.simplifiedThreshold;
  const simplified: VatScenario = {
    key: 'simplified',
    label: `간이과세 (${sector.label})`,
    outputTax: simplifiedOutput,
    inputCredit: simplifiedInput,
    netPayable: simplifiedNet,
    eligible,
    note: `매출 × 부가율(${(sector.rate * 100).toFixed(0)}%) × 10% − 매입 × 0.5%. 환급 불가. 연 매출 ${(vat.simplifiedThreshold / 1_0000_0000).toFixed(2)}억 미만만 적용 가능.`,
  };

  const scenarios = [general, simplified];
  // 추천: 적용 가능한 것 중 납부세액 작은 쪽
  const candidates = scenarios.filter((s) => s.eligible);
  const recommended = candidates.reduce((best, s) => (s.netPayable < best.netPayable ? s : best));

  const warnings: string[] = [];
  if (!eligible) {
    warnings.push(
      `연 매출이 ${(vat.simplifiedThreshold / 1_0000_0000).toFixed(2)}억 이상이라 간이과세 적용 불가. 일반과세 기준으로 보세요.`,
    );
  }
  warnings.push('면세·영세율·의제매입세액·신용카드 매출세액공제는 미반영한 개략 추정입니다.');

  return {
    netSales,
    netPurchases,
    scenarios,
    recommendedKey: recommended.key,
    effectiveRate: netSales > 0 ? recommended.netPayable / netSales : 0,
    warnings,
  };
}
