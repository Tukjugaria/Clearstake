/**
 * EquityKit — 세제 config (법령 의존 값 단일 출처)
 *
 * 법 개정 시 이 파일만 수정한다. 모든 수치에 출처·기준일 주석을 단다.
 * 불확실한 값은 코드에 박지 말고 여기서 `TODO(검증)` 주석과 함께 분리 관리한다.
 *
 * 근거:
 *  - 조세특례제한법 제16조의2~4 (벤처기업 주식매수선택권 비과세·납부특례·양도세 과세특례)
 *  - 소득세법 제55조 (종합소득 과세표준 세율)
 *  - 국세청 안내 / 중소기업 조세지원 안내(2025)
 */

/** 종합소득세 누진세율 구간 (소득세법 제55조). 산출세액 = 과세표준 × rate − progressiveDeduction */
export interface IncomeTaxBracket {
  /** 과세표준 상한 (₩). 마지막 구간은 null(상한 없음) */
  upTo: number | null;
  /** 세율 (fraction) */
  rate: number;
  /** 누진공제액 (₩) */
  progressiveDeduction: number;
}

export const taxConfig = {
  lastUpdated: '2026-05',

  stockOption: {
    // 조특법 제16조의2 — 벤처기업 임직원 주식매수선택권 행사이익 비과세
    /**
     * 행사연도별 연간 비과세 한도.
     * 2023년 개정으로 5천만원 → 2억원 상향. 그 이전 행사분은 5천만원 적용.
     * fromYear 기준 내림차순으로 정렬해 두고, 행사연도 이하의 첫 항목을 적용한다.
     */
    annualExemptionByExerciseYear: [
      { fromYear: 2023, limit: 200_000_000 }, // 2023년 상향: 연 2억
      { fromYear: 0, limit: 50_000_000 }, // 2023년 이전: 5천만
    ],
    /** 벤처기업별 비과세 누적 한도: 총 5억원 초과 불가 */
    cumulativeExemptionCap: 500_000_000,
    /** 일몰: 부여분 기준일 (개정 가능 → 배포 전 재확인) TODO(검증): 최신 법령 확인 필요 */
    sunsetGrantBefore: '2027-12-31',
    /** 제16조의3 — 비과세 초과분 소득세 분할납부 기간(년) */
    installmentYears: 5,
    // TODO(검증): 적격 요건 세부·비상장 시가 산정 방식은 단순화 추정. 세무자문 안내로 연결.
  },

  incomeTax: {
    /** 소득세법 제55조 종합소득세율 (2023.1.1 이후 귀속분 기준) */
    brackets: [
      { upTo: 14_000_000, rate: 0.06, progressiveDeduction: 0 },
      { upTo: 50_000_000, rate: 0.15, progressiveDeduction: 1_260_000 },
      { upTo: 88_000_000, rate: 0.24, progressiveDeduction: 5_760_000 },
      { upTo: 150_000_000, rate: 0.35, progressiveDeduction: 15_440_000 },
      { upTo: 300_000_000, rate: 0.38, progressiveDeduction: 19_940_000 },
      { upTo: 500_000_000, rate: 0.4, progressiveDeduction: 25_940_000 },
      { upTo: 1_000_000_000, rate: 0.42, progressiveDeduction: 35_940_000 },
      { upTo: null, rate: 0.45, progressiveDeduction: 65_940_000 },
    ] as IncomeTaxBracket[],
    /** 지방소득세: 소득세액의 10% 부가 (지방세법) */
    localSurtaxRate: 0.1,
  },

  angelInvestment: {
    // 조특법 제16조 — 벤처기업 등 개인투자(직접투자·개인투자조합) 소득공제
    /**
     * 투자금 구간별 공제율 (구간 누적 적용 = marginal).
     * 현행: 3천만원 이하 100%, 3천만~5천만 70%, 5천만 초과 30%.
     */
    deductionTiers: [
      { upTo: 30_000_000, rate: 1.0 },
      { upTo: 50_000_000, rate: 0.7 },
      { upTo: null, rate: 0.3 },
    ] as { upTo: number | null; rate: number }[],
    /** 공제 한도: 해당 과세연도 종합소득금액의 비율 */
    incomeLimitRate: 0.5,
    /** 일몰: 투자 기준일 TODO(검증): 일몰 연장 여부 최신 법령 확인 필요 */
    sunsetInvestBefore: '2025-12-31',
  },

  capitalGains: {
    /**
     * 조특법 제16조의4 — 적격주식매수선택권 양도소득 과세특례(과세 선택) 비교용 '개략 추정' 파라미터.
     * 정밀 세액은 대주주 여부·보유기간·주식 종류 등 변수가 많아 면책을 강조한다.
     */
    // TODO(검증): 적격주식매수선택권 양도소득 적용세율·요건은 단순화 추정. 최신 법령·세무자문 확인 필요.
    /** 중소·벤처기업 주식 양도소득세율(대주주 아닌 일반 가정, 추정) */
    rate: 0.1,
    /** 양도소득 기본공제 (소득세법 제103조, 연 250만원) */
    annualDeduction: 2_500_000,
  },

  sources: [
    '조세특례제한법 제16조의2~4 (국세청 안내)',
    '소득세법 제55조 (종합소득 과세표준 세율, 2023.1.1 이후)',
    '벤처투자 촉진에 관한 법률 시행규칙 제3조 (2020.8 시행)',
    '중소기업 조세지원 안내(2025)',
  ],
} as const;

export type TaxConfig = typeof taxConfig;
