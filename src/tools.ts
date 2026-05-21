/**
 * ClearStake — 도구 레지스트리 (단일 출처)
 *
 * 새 계산기를 추가할 때 이 목록에만 항목을 등록하면
 * 헤더 네비게이션과 홈 디렉터리에 자동 반영된다.
 */

export type ToolCategory = '지분·딜' | '세제' | '투자·수익' | '운영';
export type Audience = 'founder' | 'investor' | 'both';

export interface Tool {
  path: string;
  /** 네비게이션·카드 제목 */
  title: string;
  /** 짧은 라벨 (네비) */
  short: string;
  desc: string;
  category: ToolCategory;
  audience: Audience;
  /** 모듈 식별 배지 (A/B/C…) — 선택 */
  badge?: string;
}

export const categoryOrder: ToolCategory[] = ['지분·딜', '투자·수익', '운영', '세제'];

export const tools: Tool[] = [
  {
    path: '/safe',
    title: 'SAFE 전환 계산기',
    short: 'SAFE 계산기',
    desc: 'cap·discount 기반 SAFE 전환 주식수·지분율과 적용 기준을 계산합니다.',
    category: '지분·딜',
    audience: 'both',
    badge: 'A',
  },
  {
    path: '/captable',
    title: '캡테이블 & 희석 시뮬레이터',
    short: '캡테이블',
    desc: '라운드별 신규 발행·옵션풀 확대·SAFE 전환을 반영한 before/after 지분율과 희석 추이.',
    category: '지분·딜',
    audience: 'both',
    badge: 'B',
  },
  {
    path: '/scenario',
    title: '통합 시나리오',
    short: '통합 시나리오',
    desc: '라운드 주당가치를 행사 시 시가로 연결해 희석과 세금을 한 흐름으로.',
    category: '지분·딜',
    audience: 'both',
    badge: 'D',
  },
  {
    path: '/tax',
    title: '스톡옵션 세제 계산기',
    short: '스톡옵션 세제',
    desc: '조특법 비과세(연 2억·누적 5억)·분할납부·양도세 선택을 개략 추정으로 비교.',
    category: '세제',
    audience: 'founder',
    badge: 'C',
  },
  {
    path: '/vesting',
    title: '베스팅 스케줄 계산기',
    short: '베스팅',
    desc: '클리프 + 주기 베스팅 기준으로 현재 베스팅 수량·비율과 향후 일정을 계산합니다.',
    category: '지분·딜',
    audience: 'founder',
  },
  {
    path: '/target',
    title: '목표 지분 역산 계산기',
    short: '목표 지분 역산',
    desc: '목표 지분을 지키려면 라운드 밸류에이션이 최소 얼마여야 하는지 역산합니다.',
    category: '지분·딜',
    audience: 'founder',
  },
  {
    path: '/convertible',
    title: '전환사채(CB) 분석 · SAFE 비교',
    short: '전환사채(CB)',
    desc: '표면이자율·만기보장수익률 기반 전환/만기상환 분석 + 무이자 SAFE와 비교.',
    category: '지분·딜',
    audience: 'both',
  },
  {
    path: '/termsheet',
    title: '텀시트 비교',
    short: '텀시트 비교',
    desc: '두 텀시트(밸류·옵션풀·청산우선권)의 지분 희석과 엑싯 회수금을 나란히 비교.',
    category: '지분·딜',
    audience: 'both',
  },
  {
    path: '/waterfall',
    title: '우선주(RCPS) Exit Waterfall',
    short: 'Exit Waterfall',
    desc: '청산우선권·참가·전환을 반영해 엑싯 매각대금의 보통주/우선주 분배를 계산.',
    category: '지분·딜',
    audience: 'both',
  },
  {
    path: '/valuation',
    title: '밸류에이션 추정 계산기',
    short: '밸류에이션',
    desc: '매출·순이익 멀티플로 기업가치를 개략 추정하고 범위를 제시합니다.',
    category: '투자·수익',
    audience: 'both',
  },
  {
    path: '/fund-metrics',
    title: '펀드 성과지표 (TVPI·DPI·XIRR)',
    short: '펀드 성과지표',
    desc: '납입·분배·NAV로 TVPI·DPI·RVPI와 불규칙 현금흐름 IRR(XIRR)을 계산합니다.',
    category: '투자·수익',
    audience: 'investor',
  },
  {
    path: '/fund-returner',
    title: '목표 수익 역산 (Fund-returner)',
    short: '목표 수익 역산',
    desc: '이 딜로 펀드를 N배 돌려주려면 필요한 엑싯 기업가치를 역산합니다.',
    category: '투자·수익',
    audience: 'investor',
  },
  {
    path: '/runway',
    title: '런웨이 · 번레이트 계산기',
    short: '런웨이',
    desc: '현금·번레이트로 소진 시점(런웨이)과 다음 라운드 마감 데드라인을 계산합니다.',
    category: '운영',
    audience: 'both',
  },
  {
    path: '/payroll',
    title: '인건비 · 4대보험 · 퇴직금 실부담',
    short: '인건비 실부담',
    desc: '연봉 입력 시 4대보험 사용자부담 + 퇴직금 적립까지 회사 실부담을 계산합니다.',
    category: '운영',
    audience: 'founder',
  },
  {
    path: '/hiring-runway',
    title: '채용 → 런웨이 영향',
    short: '채용 런웨이',
    desc: '신규 채용 비용이 런웨이를 얼마나 단축하는지 before/after로 비교합니다.',
    category: '운영',
    audience: 'founder',
  },
  {
    path: '/burn-multiple',
    title: '번 멀티플 (자본효율)',
    short: '번 멀티플',
    desc: '순현금소모 ÷ 순신규 ARR로 자본효율을 평가합니다(낮을수록 좋음).',
    category: '운영',
    audience: 'both',
  },
  {
    path: '/saas-metrics',
    title: 'SaaS 지표 (LTV·CAC·NRR)',
    short: 'SaaS 지표',
    desc: 'LTV·CAC·회수기간·NRR/GRR 등 SaaS 단위경제·유지율을 계산합니다.',
    category: '운영',
    audience: 'both',
  },
  {
    path: '/bep',
    title: '손익분기점(BEP) 계산기',
    short: '손익분기점',
    desc: '고정비 회수에 필요한 판매 수량·매출과 안전마진을 계산합니다.',
    category: '운영',
    audience: 'founder',
  },
  {
    path: '/angel-tax',
    title: '엔젤투자 소득공제 계산기',
    short: '엔젤 소득공제',
    desc: '조특법 제16조 개인 벤처투자 소득공제(구간별 공제율·종합소득 한도)를 추정합니다.',
    category: '세제',
    audience: 'investor',
  },
  {
    path: '/startup-tax',
    title: '창업·벤처기업 세액감면',
    short: '창업 세액감면',
    desc: '조특법 제6조 창업중소기업 등 세액감면(법인세 기준)을 개략 추정합니다.',
    category: '세제',
    audience: 'founder',
  },
  {
    path: '/rsu-tax',
    title: 'RSU 세제 계산기',
    short: 'RSU 세제',
    desc: 'RSU 베스팅 시 근로소득 과세와 매각 시 양도소득 과세를 개략 추정합니다.',
    category: '세제',
    audience: 'founder',
  },
  {
    path: '/returns',
    title: '투자 수익률 계산기 (MOIC·IRR)',
    short: '수익률 (MOIC·IRR)',
    desc: '진입가·지분·엑싯 가치로 회수금·배수(MOIC)·IRR과 후속투자(pro-rata)를 계산.',
    category: '투자·수익',
    audience: 'investor',
  },
];

export const toolByPath = (path: string): Tool | undefined => tools.find((t) => t.path === path);

export const toolsByCategory = (category: ToolCategory): Tool[] =>
  tools.filter((t) => t.category === category);
