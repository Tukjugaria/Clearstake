/**
 * VCEquityNote — 세제 config (법령 의존 값 단일 출처)
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
    // 소득세법 제104조 — 주식 양도소득세율. 산출세액 = (양도차익 − 기본공제) 누진 적용.
    /** 양도소득 기본공제 (소득세법 제103조, 연 250만원) */
    annualDeduction: 2_500_000,
    /**
     * 주주 유형별 세율(법정 구간). 보유기간·대기업 상장 장내 비과세 등 일부 변수는 미반영.
     * TODO(검증): 적용 대상(중소기업·상장 여부)·대주주 요건은 사용자 선택에 의존. 최신 법령 확인 권장.
     */
    types: [
      {
        key: 'smbSmall',
        label: '중소기업 소액주주',
        brackets: [{ upTo: null, rate: 0.1, progressiveDeduction: 0 }],
      },
      {
        key: 'largeShareholder',
        label: '대주주',
        // 과세표준 3억 이하 20%, 초과분 25%
        brackets: [
          { upTo: 300_000_000, rate: 0.2, progressiveDeduction: 0 },
          { upTo: null, rate: 0.25, progressiveDeduction: 15_000_000 },
        ],
      },
    ] as { key: string; label: string; brackets: IncomeTaxBracket[] }[],
    defaultType: 'smbSmall',
  },

  corporateTax: {
    /** 법인세법 제55조 세율 (2023.1.1 이후). 산출세액 = 과세표준 × rate − 누진공제 */
    brackets: [
      { upTo: 200_000_000, rate: 0.09, progressiveDeduction: 0 },
      { upTo: 20_000_000_000, rate: 0.19, progressiveDeduction: 20_000_000 },
      { upTo: 300_000_000_000, rate: 0.21, progressiveDeduction: 420_000_000 },
      { upTo: null, rate: 0.24, progressiveDeduction: 9_420_000_000 },
    ] as IncomeTaxBracket[],
    /** 지방소득세(법인분): 법인세액의 10% 별도 부과 */
    localSurtaxRate: 0.1,
  },

  startupTaxRelief: {
    // 조특법 제6조 — 창업중소기업·창업벤처중소기업 세액감면
    // TODO(검증): 지역·업종·연령(청년)·매출 요건과 감면율·기간은 단순화 프리셋. 최신 법령·세무자문 확인 필요.
    presets: [
      { key: 'youngOutside', label: '청년창업 · 수도권 과밀억제권역 밖', rate: 1.0, years: 5 },
      { key: 'general', label: '일반 창업중소기업 / 수도권 청년 / 창업벤처', rate: 0.5, years: 5 },
    ] as { key: string; label: string; rate: number; years: number }[],
    /** 일몰: 창업 기준일 TODO(검증) */
    sunsetEstablishBefore: '2027-12-31',
  },

  socialInsurance: {
    // 4대보험 사용자(회사) 부담 요율 + 퇴직금 적립. 매년 변동 → 개략 추정.
    // TODO(검증): 요율은 연도별 변동·소득상한·업종(산재)에 따라 달라짐. 최신 고시 확인 필요.
    /** 국민연금 사용자부담 (총 9% 중 절반). ※ 기준소득월액 상한 미반영 */
    pensionRate: 0.045,
    /** 건강보험 사용자부담 (총 7.09% 중 절반, 2025 기준) */
    healthRate: 0.03545,
    /** 장기요양보험 = 건강보험료 × 요율 (2025 기준) */
    longTermCareRate: 0.1295,
    /** 고용보험 사용자부담 (실업급여 0.9% + 고용안정·직능 0.25%, 우선지원 대상 가정) */
    employmentRate: 0.0115,
    /** 산재보험 사용자부담 (업종 평균 추정 — 업종별 상이) */
    industrialAccidentRate: 0.007,
    /** 퇴직금 적립 (연 1개월분 = 월급의 1/12) */
    severanceRate: 1 / 12,
    /** 근로자(직원) 본인부담 요율 — 연봉 실수령 계산용 */
    employee: {
      /** 국민연금 본인부담 (총 9% 중 절반) */
      pensionRate: 0.045,
      /** 건강보험 본인부담 (총 7.09% 중 절반) */
      healthRate: 0.03545,
      /** 장기요양보험 = 건강보험료 × 요율 */
      longTermCareRate: 0.1295,
      /** 고용보험 본인부담 (실업급여 0.9%) */
      employmentRate: 0.009,
    },
  },

  /** 근로소득공제 (소득세법 제47조). 구간별 누적 적용 후 한도 2천만원. */
  earnedIncomeDeduction: {
    // 단순화: marginal 누적 공제. 한도 2천만원.
    tiers: [
      { upTo: 5_000_000, rate: 0.7 },
      { upTo: 15_000_000, rate: 0.4 },
      { upTo: 45_000_000, rate: 0.15 },
      { upTo: 100_000_000, rate: 0.05 },
      { upTo: null, rate: 0.02 },
    ] as { upTo: number | null; rate: number }[],
    /** 공제 한도 */
    cap: 20_000_000,
  },

  /** 종합소득공제 — 본인·부양가족·자녀세액공제. 단순화 (의료비/신용카드/연금 등 미반영). */
  personalDeductions: {
    /** 본인·부양가족 1인당 (소득세법 제50조) */
    perPerson: 1_500_000,
    /** 자녀세액공제 — 1명 25만, 2명 55만, 3명 이상은 추가분 40만/명 (소득세법 제59조의2, 2024 개정 후) */
    childCredit: { first: 250_000, second: 550_000, additionalPerThirdPlus: 400_000 },
    /** 근로소득세액공제 (소득세법 제59조) — 단순화: 산출세액 130만 이하 55%, 초과분 30%, 한도 74만 */
    earnedIncomeTaxCredit: { thresholdTax: 1_300_000, lowRate: 0.55, highRate: 0.3, maxCredit: 740_000 },
    /** 비과세 식대 한도(월, 2023.1.1~) */
    nontaxableMealMaxMonthly: 200_000,
  },

  vat: {
    // 부가가치세법 — 일반과세 10%, 간이과세 업종별 부가율
    /** 일반과세 세율 */
    standardRate: 0.1,
    /** 간이과세 적용 매출 임계점 (연 8천만원 미만) */
    simplifiedThreshold: 80_000_000,
    /** 간이과세 매입세액공제율 (매입 × 0.5%) */
    simplifiedPurchaseCreditRate: 0.005,
    /**
     * 간이과세 업종별 부가율 (납부세액 = 매출 × 부가율 × 10% − 매입공제).
     * 2021년 부가율 단순화 프리셋. TODO(검증): 업종 세부분류·최신 고시 확인 필요.
     */
    simplifiedSectors: [
      { key: 'retail', label: '소매업·재생용재료수집·자동차정비 등', rate: 0.15 },
      { key: 'manufacturing', label: '제조업·농임어업·운수업', rate: 0.2 },
      { key: 'restaurant', label: '음식점업', rate: 0.15 },
      { key: 'construction', label: '건설업·운수·창고·정보통신업', rate: 0.3 },
      { key: 'realEstateService', label: '부동산임대·기타 서비스업', rate: 0.4 },
    ] as { key: string; label: string; rate: number }[],
  },

  /** 퇴직소득세 (소득세법 제48조) — 환산급여 누진. 근속연수공제와 환산급여공제 단순화 적용. */
  retirement: {
    /** 근속연수공제 — 구간별 누적 (소득세법 제48조 제1항) */
    serviceYearDeduction: [
      { upToYears: 5, base: 0, perYear: 1_000_000 },
      { upToYears: 10, base: 5_000_000, perYear: 2_000_000 },
      { upToYears: 20, base: 15_000_000, perYear: 2_500_000 },
      { upToYears: null, base: 40_000_000, perYear: 3_000_000 },
    ] as { upToYears: number | null; base: number; perYear: number }[],
    /** 환산급여공제 — 구간별 누적 (소득세법 제48조 제2항) */
    convertedSalaryDeduction: [
      { upTo: 8_000_000, base: 0, rate: 1.0 },
      { upTo: 70_000_000, base: 8_000_000, rate: 0.6 },
      { upTo: 100_000_000, base: 45_200_000, rate: 0.55 },
      { upTo: 300_000_000, base: 61_700_000, rate: 0.45 },
      { upTo: null, base: 151_700_000, rate: 0.35 },
    ] as { upTo: number | null; base: number; rate: number }[],
  },

  /** R&D 세액공제 (조특법 제10조) — 단순화: 당기 발생액 기준. */
  rndTaxCredit: {
    /** 기업 유형별 당기 발생액 공제율 */
    rates: [
      { key: 'smb', label: '중소기업', currentRate: 0.25, increaseRate: 0.5 },
      { key: 'middleStanding', label: '중견기업', currentRate: 0.08, increaseRate: 0.4 },
      { key: 'large', label: '대기업·중견기업 외', currentRate: 0.02, increaseRate: 0.25 },
    ] as { key: string; label: string; currentRate: number; increaseRate: number }[],
    /** 최저한세율 (조특법 제132조) — 중소기업 7%, 일반 17% */
    minimumTaxRates: { smb: 0.07, general: 0.17 },
    /** 일몰 TODO(검증) */
    sunsetBefore: '2027-12-31',
  },

  /** 배당소득세 (소득세법 제17조·제129조) */
  dividend: {
    /** 원천징수 세율 (분리과세) — 14% + 지방세 1.4% */
    withholdingRate: 0.14,
    /** 종합과세 임계점: 금융소득(이자+배당) 2,000만원 초과 시 종합과세 */
    separateTaxationLimit: 20_000_000,
    /** 지방소득세: 동일 10% 부가 */
    localSurtaxRate: 0.1,
  },

  sources: [
    '조세특례제한법 제6조·제16조의2~4 (국세청 안내)',
    '소득세법 제55조 (종합소득 과세표준 세율, 2023.1.1 이후)',
    '소득세법 제103·104조 (양도소득 기본공제·주식 양도소득세율)',
    '법인세법 제55조 (법인세 세율, 2023.1.1 이후)',
    '벤처투자 촉진에 관한 법률 시행규칙 제3조 (2020.8 시행)',
    '중소기업 조세지원 안내(2025)',
  ],
} as const;

export type TaxConfig = typeof taxConfig;
