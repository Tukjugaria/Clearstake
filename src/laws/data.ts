/**
 * VCEquityNote — 법령 노트 (지분노트 계산기들의 법적 근거)
 *
 * ⚠️ 본 데이터는 일반 정보 제공용 요지이며 자문이 아닙니다.
 * 정확한 최신 본문은 각 조항의 sourceUrl(국가법령정보센터)에서 확인하세요.
 *
 * 데이터 갱신 시 lastVerifiedDate를 함께 업데이트하세요.
 */
export const LAWS_LAST_VERIFIED = '2026-05';

export type LawCategory = 'tax' | 'equity' | 'corporate' | 'labor' | 'vc-investment';

export interface LawArticle {
  id: string;
  /** 법령 공식명 */
  law: string;
  /** 약칭 (없으면 동일) */
  lawShort: string;
  /** 조 번호 표기 (예: '제16조의2') */
  article: string;
  /** 조 제목 */
  title: string;
  /** 핵심 요지 (2~3문장) */
  summary: string;
  /** 검색 키워드 */
  keywords: string[];
  category: LawCategory;
  /** 이 조항을 참조하는 계산기 경로 */
  relatedTools: string[];
  /** 국가법령정보센터 deep link */
  sourceUrl: string;
}

export const CATEGORY_LABEL: Record<LawCategory, string> = {
  tax: '세제',
  equity: '지분·주식',
  corporate: '법인·회사',
  labor: '노동·근로',
  'vc-investment': '벤처투자',
};

export const laws: LawArticle[] = [
  // ── 조세특례제한법 ────────────────────────────────────────
  {
    id: 'choteukbeop-6',
    law: '조세특례제한법',
    lawShort: '조특법',
    article: '제6조',
    title: '창업중소기업 등에 대한 세액감면',
    summary:
      '창업 후 일정 요건을 갖춘 중소기업의 법인세를 일정 기간(보통 5년) 동안 50~100% 감면. 청년창업·수도권 외 지역에 따라 감면율 차등.',
    keywords: ['창업', '세액감면', '청년창업', '벤처기업', '법인세'],
    category: 'tax',
    relatedTools: ['/startup-tax'],
    sourceUrl: 'https://www.law.go.kr/법령/조세특례제한법/제6조',
  },
  {
    id: 'choteukbeop-10',
    law: '조세특례제한법',
    lawShort: '조특법',
    article: '제10조',
    title: '연구·인력개발비에 대한 세액공제 (R&D 세액공제)',
    summary:
      '당기 연구·인력개발비에 대해 중소기업 25%, 중견 8%, 일반 2%의 세액공제. 또는 증가분 방식(중소 50%, 중견 40%, 일반 25%) 중 큰 금액 선택.',
    keywords: ['R&D', '연구개발비', '세액공제', '인력개발비'],
    category: 'tax',
    relatedTools: ['/rnd-tax-credit'],
    sourceUrl: 'https://www.law.go.kr/법령/조세특례제한법/제10조',
  },
  {
    id: 'choteukbeop-16',
    law: '조세특례제한법',
    lawShort: '조특법',
    article: '제16조',
    title: '벤처기업 등에의 개인투자에 대한 과세특례 (엔젤투자 소득공제)',
    summary:
      '개인이 벤처기업 등에 직접투자·개인투자조합 출자 시 투자금 구간별로 100%/70%/30% 소득공제. 종합소득금액 50% 한도.',
    keywords: ['엔젤투자', '소득공제', '벤처투자', '개인투자조합'],
    category: 'tax',
    relatedTools: ['/angel-tax'],
    sourceUrl: 'https://www.law.go.kr/법령/조세특례제한법/제16조',
  },
  {
    id: 'choteukbeop-16-2',
    law: '조세특례제한법',
    lawShort: '조특법',
    article: '제16조의2',
    title: '벤처기업 주식매수선택권 행사이익에 대한 비과세 등',
    summary:
      '벤처기업 임직원이 적격 주식매수선택권을 행사해 얻는 이익 중 연 2억원(2023년 이후 행사분)·벤처기업별 누적 5억원까지 비과세.',
    keywords: ['스톡옵션', '비과세', '벤처기업', '행사이익', '주식매수선택권'],
    category: 'tax',
    relatedTools: ['/tax', '/scenario'],
    sourceUrl: 'https://www.law.go.kr/법령/조세특례제한법/제16조의2',
  },
  {
    id: 'choteukbeop-16-3',
    law: '조세특례제한법',
    lawShort: '조특법',
    article: '제16조의3',
    title: '벤처기업 주식매수선택권 행사이익 분할납부 특례',
    summary:
      '비과세 한도를 초과한 행사이익에 대한 소득세를 5년 균등 분할 납부할 수 있는 특례.',
    keywords: ['스톡옵션', '분할납부', '행사이익'],
    category: 'tax',
    relatedTools: ['/tax'],
    sourceUrl: 'https://www.law.go.kr/법령/조세특례제한법/제16조의3',
  },
  {
    id: 'choteukbeop-16-4',
    law: '조세특례제한법',
    lawShort: '조특법',
    article: '제16조의4',
    title: '적격 주식매수선택권 양도소득 과세선택',
    summary:
      '행사이익을 근로소득 대신 양도소득으로 과세할 수 있는 특례. 비과세 미적용 대신 양도세율 적용.',
    keywords: ['스톡옵션', '양도소득', '과세선택'],
    category: 'tax',
    relatedTools: ['/tax'],
    sourceUrl: 'https://www.law.go.kr/법령/조세특례제한법/제16조의4',
  },
  {
    id: 'choteukbeop-132',
    law: '조세특례제한법',
    lawShort: '조특법',
    article: '제132조',
    title: '최저한세액 규정',
    summary:
      'R&D 세액공제 등 적용 후라도 과세표준의 일정 비율(중소 7%, 일반 17%) 이상의 세금은 납부. 공제 일부를 이월시키는 효과.',
    keywords: ['최저한세', '세액공제 한도', 'R&D'],
    category: 'tax',
    relatedTools: ['/rnd-tax-credit'],
    sourceUrl: 'https://www.law.go.kr/법령/조세특례제한법/제132조',
  },

  // ── 소득세법 ─────────────────────────────────────────────
  {
    id: 'sodeukse-47',
    law: '소득세법',
    lawShort: '소득세법',
    article: '제47조',
    title: '근로소득공제',
    summary:
      '총급여액 구간별로 70%/40%/15%/5%/2% 누적 공제. 한도 2,000만원. 근로소득금액 = 총급여 − 근로소득공제.',
    keywords: ['근로소득공제', '총급여', '근로소득금액'],
    category: 'tax',
    relatedTools: ['/salary-take-home'],
    sourceUrl: 'https://www.law.go.kr/법령/소득세법/제47조',
  },
  {
    id: 'sodeukse-48',
    law: '소득세법',
    lawShort: '소득세법',
    article: '제48조',
    title: '퇴직소득 (근속연수공제·환산급여공제)',
    summary:
      '퇴직소득세 계산 시 근속연수공제와 환산급여공제를 적용. 환산급여 = (퇴직금 − 근속연수공제) × 12 ÷ 근속연수.',
    keywords: ['퇴직소득세', '근속연수공제', '환산급여'],
    category: 'tax',
    relatedTools: ['/retirement-tax'],
    sourceUrl: 'https://www.law.go.kr/법령/소득세법/제48조',
  },
  {
    id: 'sodeukse-55',
    law: '소득세법',
    lawShort: '소득세법',
    article: '제55조',
    title: '종합소득과세표준에 대한 세율 (누진 8단계)',
    summary:
      '1,400만 6%부터 10억 초과 45%까지 8단계 누진세율 + 누진공제액. 지방소득세 10% 별도.',
    keywords: ['종합소득세율', '누진세', '소득세 구간'],
    category: 'tax',
    relatedTools: ['/tax', '/salary-take-home', '/angel-tax', '/salary-vs-dividend', '/retirement-tax'],
    sourceUrl: 'https://www.law.go.kr/법령/소득세법/제55조',
  },
  {
    id: 'sodeukse-59',
    law: '소득세법',
    lawShort: '소득세법',
    article: '제59조',
    title: '근로소득세액공제',
    summary:
      '근로소득자에 대한 산출세액 공제. 산출세액 130만 이하 부분 55%, 초과분 30%, 한도 74만(총급여에 따라 차등).',
    keywords: ['근로소득세액공제', '실수령'],
    category: 'tax',
    relatedTools: ['/salary-take-home'],
    sourceUrl: 'https://www.law.go.kr/법령/소득세법/제59조',
  },
  {
    id: 'sodeukse-59-2',
    law: '소득세법',
    lawShort: '소득세법',
    article: '제59조의2',
    title: '자녀세액공제',
    summary:
      '자녀 1명 25만, 2명 55만, 3명 이상은 추가 1인당 40만의 세액공제 (2024년 개정 후).',
    keywords: ['자녀세액공제', '부양가족'],
    category: 'tax',
    relatedTools: ['/salary-take-home'],
    sourceUrl: 'https://www.law.go.kr/법령/소득세법/제59조의2',
  },
  {
    id: 'sodeukse-103',
    law: '소득세법',
    lawShort: '소득세법',
    article: '제103조',
    title: '양도소득 기본공제',
    summary:
      '양도소득에 대한 연간 250만원 기본공제. 자산 종류별·과세기간별 적용.',
    keywords: ['양도소득', '기본공제'],
    category: 'tax',
    relatedTools: ['/tax', '/rsu-tax'],
    sourceUrl: 'https://www.law.go.kr/법령/소득세법/제103조',
  },
  {
    id: 'sodeukse-104',
    law: '소득세법',
    lawShort: '소득세법',
    article: '제104조',
    title: '주식 양도소득세율',
    summary:
      '중소기업 소액주주 10%, 대주주 양도차익 3억 이하 20%·초과 25%. 보유기간·상장 여부에 따라 차등.',
    keywords: ['양도소득세', '대주주', '주식 양도'],
    category: 'tax',
    relatedTools: ['/tax', '/rsu-tax'],
    sourceUrl: 'https://www.law.go.kr/법령/소득세법/제104조',
  },

  // ── 법인세법 ─────────────────────────────────────────────
  {
    id: 'beopinse-55',
    law: '법인세법',
    lawShort: '법인세법',
    article: '제55조',
    title: '법인세 세율 (4단계 누진)',
    summary:
      '2억 이하 9%, 2억~200억 19%, 200억~3천억 21%, 3천억 초과 24%. 지방소득세(법인분) 10% 별도.',
    keywords: ['법인세율', '누진'],
    category: 'tax',
    relatedTools: ['/startup-tax', '/rnd-tax-credit', '/salary-vs-dividend'],
    sourceUrl: 'https://www.law.go.kr/법령/법인세법/제55조',
  },
  {
    id: 'beopinse-yeong-44',
    law: '법인세법 시행령',
    lawShort: '법인세법령',
    article: '제44조',
    title: '임원의 퇴직급여 한도',
    summary:
      '임원에게 지급한 퇴직급여 중 한도 초과분은 손금불산입. 정관 또는 임원퇴직급여 지급규정 한도까지만 인정.',
    keywords: ['임원퇴직금', '손금불산입', '한도'],
    category: 'corporate',
    relatedTools: ['/retirement-tax'],
    sourceUrl: 'https://www.law.go.kr/법령/법인세법시행령/제44조',
  },

  // ── 부가가치세법 ─────────────────────────────────────────
  {
    id: 'bugase-3',
    law: '부가가치세법',
    lawShort: '부가세법',
    article: '제3조',
    title: '납세의무자',
    summary:
      '사업자(영리·비영리, 개인·법인 불문) 및 재화·용역의 수입자가 부가가치세 납세의무를 진다.',
    keywords: ['부가세', '납세의무자', '사업자'],
    category: 'tax',
    relatedTools: ['/vat'],
    sourceUrl: 'https://www.law.go.kr/법령/부가가치세법/제3조',
  },
  {
    id: 'bugase-61',
    law: '부가가치세법',
    lawShort: '부가세법',
    article: '제61조',
    title: '간이과세자 (연 매출 8천만원 미만)',
    summary:
      '직전 연도 공급대가 합계 8천만원 미만 개인사업자는 간이과세 적용 가능. 업종별 부가율 × 10% − 매입공제(0.5%). 환급 불가.',
    keywords: ['간이과세', '부가율', '매출 임계점'],
    category: 'tax',
    relatedTools: ['/vat'],
    sourceUrl: 'https://www.law.go.kr/법령/부가가치세법/제61조',
  },

  // ── 벤처기업 육성에 관한 특별법 (벤촉법) ──────────────────
  {
    id: 'benchok-2',
    law: '벤처기업육성에 관한 특별법',
    lawShort: '벤촉법',
    article: '제2조',
    title: '벤처기업의 정의·요건',
    summary:
      '벤처투자 유치액, 연구개발비 비중, 기술평가 등 요건 중 하나를 충족하고 중소기업기본법상 중소기업에 해당하는 기업.',
    keywords: ['벤처기업', '벤처 요건', '벤처 확인'],
    category: 'vc-investment',
    relatedTools: ['/tax', '/startup-tax'],
    sourceUrl: 'https://www.law.go.kr/법령/벤처기업육성에관한특별법/제2조',
  },
  {
    id: 'benchok-16-3',
    law: '벤처기업육성에 관한 특별법',
    lawShort: '벤촉법',
    article: '제16조의3',
    title: '벤처기업 주식매수선택권의 부여',
    summary:
      '벤처기업이 임직원·외부 전문가에게 주식매수선택권을 부여할 수 있는 근거. 부여 한도, 행사가, 행사기간 등 규정.',
    keywords: ['스톡옵션', '주식매수선택권', '벤처기업'],
    category: 'vc-investment',
    relatedTools: ['/tax', '/vesting'],
    sourceUrl: 'https://www.law.go.kr/법령/벤처기업육성에관한특별법/제16조의3',
  },
  {
    id: 'benchok-25',
    law: '벤처기업육성에 관한 특별법',
    lawShort: '벤촉법',
    article: '제25조',
    title: '벤처기업의 확인',
    summary:
      '벤처기업협회 등 확인기관에서 벤처기업 요건 충족 여부를 확인하고 벤처기업확인서를 발급. 유효기간 3년.',
    keywords: ['벤처 확인', '벤처확인서'],
    category: 'vc-investment',
    relatedTools: ['/tax', '/startup-tax'],
    sourceUrl: 'https://www.law.go.kr/법령/벤처기업육성에관한특별법/제25조',
  },

  // ── 벤처투자 촉진에 관한 법률 (벤투법) ────────────────────
  {
    id: 'bento-2',
    law: '벤처투자 촉진에 관한 법률',
    lawShort: '벤투법',
    article: '제2조',
    title: '정의 (벤처투자·조건부지분인수계약 등)',
    summary:
      '벤처투자조합, 개인투자조합, 조건부지분인수계약(SAFE) 등 본법 적용 대상 개념을 정의.',
    keywords: ['벤투법 정의', 'SAFE', '벤처투자조합'],
    category: 'vc-investment',
    relatedTools: ['/safe', '/convertible'],
    sourceUrl: 'https://www.law.go.kr/법령/벤처투자촉진에관한법률/제2조',
  },
  {
    id: 'bento-28',
    law: '벤처투자 촉진에 관한 법률',
    lawShort: '벤투법',
    article: '제28조',
    title: '벤처투자조합의 투자방법',
    summary:
      '벤처투자조합이 투자할 수 있는 방법(주식 인수, 전환사채, 조건부지분인수계약 등). SAFE 적격성의 근거.',
    keywords: ['SAFE', '벤처투자조합', '투자방법', 'CB'],
    category: 'vc-investment',
    relatedTools: ['/safe', '/convertible'],
    sourceUrl: 'https://www.law.go.kr/법령/벤처투자촉진에관한법률/제28조',
  },
  {
    id: 'bento-sihaeng-3',
    law: '벤처투자 촉진에 관한 법률 시행규칙',
    lawShort: '벤투법령',
    article: '제3조',
    title: '조건부지분인수계약(SAFE)의 요건',
    summary:
      'SAFE의 법적 요건: 후속투자 등의 사유 발생 시 주식으로 전환되는 계약, 만기·이자·담보 없음 등. 적격 SAFE의 핵심 기준.',
    keywords: ['SAFE', '조건부지분인수계약', '벤투법 시행규칙'],
    category: 'vc-investment',
    relatedTools: ['/safe'],
    sourceUrl: 'https://www.law.go.kr/법령/벤처투자촉진에관한법률시행규칙/제3조',
  },

  // ── 상법 ───────────────────────────────────────────────
  {
    id: 'sangbeop-340-2',
    law: '상법',
    lawShort: '상법',
    article: '제340조의2',
    title: '주식매수선택권',
    summary:
      '회사가 정관·이사회 결의로 임직원·외부인에게 신주를 인수하거나 자기주식을 매수할 권리를 부여할 수 있음. 부여 한도·행사가 등 규정.',
    keywords: ['주식매수선택권', '스톡옵션', '신주발행'],
    category: 'equity',
    relatedTools: ['/tax', '/vesting', '/captable'],
    sourceUrl: 'https://www.law.go.kr/법령/상법/제340조의2',
  },
  {
    id: 'sangbeop-513',
    law: '상법',
    lawShort: '상법',
    article: '제513조',
    title: '전환사채(CB)의 발행',
    summary:
      '회사가 정관 또는 이사회 결의로 전환사채를 발행할 수 있는 근거. 전환조건·전환비율·전환청구기간 등 규정.',
    keywords: ['전환사채', 'CB', '발행'],
    category: 'equity',
    relatedTools: ['/convertible'],
    sourceUrl: 'https://www.law.go.kr/법령/상법/제513조',
  },
  {
    id: 'sangbeop-345',
    law: '상법',
    lawShort: '상법',
    article: '제345조',
    title: '상환주식·전환주식 (RCPS의 근거)',
    summary:
      '회사가 종류주식(상환·전환·우선주)을 발행할 수 있는 근거. 우선배당·청산우선·전환·상환 조건을 정관에 기재.',
    keywords: ['RCPS', '우선주', '전환주식', '상환주식'],
    category: 'equity',
    relatedTools: ['/waterfall', '/termsheet', '/captable'],
    sourceUrl: 'https://www.law.go.kr/법령/상법/제345조',
  },
  {
    id: 'sangbeop-418',
    law: '상법',
    lawShort: '상법',
    article: '제418조',
    title: '신주발행과 주주의 신주인수권',
    summary:
      '신주 발행 시 기존 주주의 신주인수권 보호. 제3자 배정 신주발행은 정관 근거·경영상 목적이 필요.',
    keywords: ['신주발행', '신주인수권', '희석', '제3자 배정'],
    category: 'equity',
    relatedTools: ['/captable', '/safe'],
    sourceUrl: 'https://www.law.go.kr/법령/상법/제418조',
  },

  // ── 근로자퇴직급여 보장법 ────────────────────────────────
  {
    id: 'toejik-8',
    law: '근로자퇴직급여 보장법',
    lawShort: '퇴직급여법',
    article: '제8조',
    title: '퇴직금 제도 (1년 근속 시 30일분 평균임금 이상)',
    summary:
      '계속근로기간 1년에 대해 30일분 이상의 평균임금을 퇴직금으로 지급. 4주 평균 1주 15시간 미만 근로자는 제외.',
    keywords: ['퇴직금', '평균임금', '근속'],
    category: 'labor',
    relatedTools: ['/retirement-tax', '/payroll'],
    sourceUrl: 'https://www.law.go.kr/법령/근로자퇴직급여보장법/제8조',
  },
];

/** 카테고리별 묶음 */
export function lawsByCategory(category: LawCategory): LawArticle[] {
  return laws.filter((l) => l.category === category);
}

/** 특정 계산기 경로와 연결된 조항만 */
export function lawsForTool(toolPath: string): LawArticle[] {
  return laws.filter((l) => l.relatedTools.includes(toolPath));
}

/** 키워드/조항 검색 (단순 포함 매칭, 대소문자 무시) */
export function searchLaws(query: string): LawArticle[] {
  const q = query.trim().toLowerCase();
  if (q === '') return laws;
  return laws.filter((l) => {
    const haystack = [
      l.law,
      l.lawShort,
      l.article,
      l.title,
      l.summary,
      ...l.keywords,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
