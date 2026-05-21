/**
 * EquityKit — 도구 레지스트리 (단일 출처)
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

export const categoryOrder: ToolCategory[] = ['지분·딜', '세제', '투자·수익', '운영'];

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
    path: '/runway',
    title: '런웨이 · 번레이트 계산기',
    short: '런웨이',
    desc: '현금·번레이트로 소진 시점(런웨이)과 다음 라운드 마감 데드라인을 계산합니다.',
    category: '운영',
    audience: 'both',
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
