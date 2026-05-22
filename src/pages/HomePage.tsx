import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/ui/BrandMark';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { categoryOrder, toolsByCategory, type Audience, type Tool } from '../tools';
import { groupColors } from '../lib/groups';

const values = [
  {
    title: '양면 관점',
    desc: '동일 데이터를 창업자(희석·세금)와 투자자(전환·지분·수익) 관점으로 전환해 보여줍니다.',
  },
  {
    title: '한국 특화',
    desc: '벤처투자법 SAFE 요건, 조특법 스톡옵션·엔젤투자 세제 등 한국 제도를 반영합니다.',
  },
  {
    title: '딜·세제·운영 올인원',
    desc: 'SAFE·캡테이블부터 세제·런웨이·투자수익까지 흩어진 계산을 한 곳에서.',
  },
];

const audienceLabel: Record<Audience, string> = {
  founder: '창업자',
  investor: '투자자',
  both: '창업자·투자자',
};

// 히어로 제품 미리보기 (예시 데이터 — 라운드 후 지분 구성)
const previewRows: { name: string; pct: number; color: string }[] = [
  { name: '창업자', pct: 0.56, color: groupColors.founder },
  { name: '신규 투자자', pct: 0.2, color: groupColors.newInvestor },
  { name: '기존 투자자', pct: 0.1, color: groupColors.investor },
  { name: '옵션풀', pct: 0.1, color: groupColors.optionPool },
  { name: 'SAFE 투자자', pct: 0.04, color: groupColors.safe },
];

function HeroPreview() {
  return (
    <div className="relative hidden md:block">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_-24px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            라운드 후 지분
          </span>
          <span className="rounded border border-slate-200 px-1.5 py-px text-[11px] text-slate-400">
            Series A
          </span>
        </div>

        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
          {previewRows.map((r) => (
            <div key={r.name} style={{ width: `${r.pct * 100}%`, backgroundColor: r.color }} />
          ))}
        </div>

        <ul className="mt-4 space-y-2.5">
          {previewRows.map((r) => (
            <li key={r.name} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: r.color }} />
              <span className="text-slate-600">{r.name}</span>
              <span className="tnum ml-auto font-semibold text-slate-900">
                {(r.pct * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-900 px-3 py-2.5">
            <div className="text-[11px] text-slate-400">창업자 지분 (희석 후)</div>
            <div className="tnum mt-0.5 text-lg font-semibold text-white">56.0%</div>
          </div>
          <div className="rounded-lg border border-slate-200 px-3 py-2.5">
            <div className="text-[11px] text-slate-500">post-money</div>
            <div className="tnum mt-0.5 text-lg font-semibold text-slate-900">125억</div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-3 -left-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)]">
        <div className="text-[11px] text-slate-500">SAFE 전환가</div>
        <div className="tnum text-sm font-semibold text-slate-900">₩8,000</div>
      </div>
    </div>
  );
}

type AudienceFilter = 'all' | 'founder' | 'investor';

export function HomePage() {
  const [query, setQuery] = useState('');
  const [audience, setAudience] = useState<AudienceFilter>('all');

  const matches = (t: Tool): boolean => {
    const audOk = audience === 'all' || t.audience === audience || t.audience === 'both';
    const term = query.trim().toLowerCase();
    const textOk =
      term === '' || `${t.title} ${t.short} ${t.desc} ${t.category}`.toLowerCase().includes(term);
    return audOk && textOk;
  };

  const filtering = query.trim() !== '' || audience !== 'all';
  const totalMatches = useMemo(
    () => categoryOrder.reduce((sum, cat) => sum + toolsByCategory(cat).filter(matches).length, 0),
    [query, audience],
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'radial-gradient(var(--color-slate-200) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            maskImage: 'linear-gradient(to bottom right, black, transparent 70%)',
            WebkitMaskImage: 'linear-gradient(to bottom right, black, transparent 70%)',
          }}
        />
        <div className="relative grid items-center gap-8 px-6 py-10 sm:px-9 sm:py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <BrandMark size={20} className="text-brand-600" />
              지분노트
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem] sm:leading-[1.2]">
              한국 벤처투자 관행·세법 기반
              <br />
              지분·세제·투자 계산기
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
              SAFE 전환·캡테이블 희석·스톡옵션 세제부터 런웨이·투자수익까지. 창업자와 투자자 모두의
              관점으로 한 곳에서 시뮬레이션하세요.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/safe"
                className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                SAFE 계산기 시작하기
              </Link>
              <Link
                to="/captable"
                className="text-sm font-medium text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline"
              >
                캡테이블 시뮬레이터 →
              </Link>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* 핵심 가치 */}
      <section className="mt-6 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-3">
        {values.map((v) => (
          <div key={v.title} className="bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">{v.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{v.desc}</p>
          </div>
        ))}
      </section>

      {/* 검색 / 관점 필터 */}
      <section className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="계산기 검색 (이름·설명)"
          aria-label="계산기 검색"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <SegmentedControl
            size="sm"
            ariaLabel="관점 필터"
            value={audience}
            onChange={setAudience}
            segments={[
              { value: 'all', label: '전체' },
              { value: 'founder', label: '창업자' },
              { value: 'investor', label: '투자자' },
            ]}
          />
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setAudience('all');
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              초기화
            </button>
          )}
        </div>
      </section>

      {filtering && totalMatches === 0 && (
        <p className="mt-8 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          검색 결과가 없습니다. 다른 키워드나 필터를 시도해 보세요.
        </p>
      )}

      {/* 도구 디렉터리 (카테고리별) */}
      {categoryOrder.map((cat) => {
        const items = toolsByCategory(cat).filter(matches);
        if (items.length === 0) return null;
        return (
          <section key={cat} className="mt-9">
            <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {cat}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((m) => (
                <Link key={m.path} to={m.path} className="group block">
                  <div className="flex h-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition group-hover:border-slate-400">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-xs font-semibold text-slate-500">
                      {m.badge ?? m.title.slice(0, 1)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{m.title}</h3>
                        <span className="rounded border border-slate-200 px-1.5 py-px text-[11px] text-slate-400">
                          {audienceLabel[m.audience]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{m.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* 면책 */}
      <section className="mt-9 rounded-lg border border-slate-200 bg-white px-5 py-4">
        <p className="text-xs leading-relaxed text-slate-500">
          <span className="font-semibold text-slate-700">면책</span> — 본 도구는 일반 정보
          제공용이며 법률·세무·투자 자문이 아닙니다. 계산은 단순화된 모델에 기반한 개략 추정이며,
          실제 의사결정은 반드시 전문가(변호사·세무사) 확인이 필요합니다. 세율·한도·일몰연도 등 법령
          의존 값은 개정될 수 있습니다.
        </p>
      </section>
    </div>
  );
}
