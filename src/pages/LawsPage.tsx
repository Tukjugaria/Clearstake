import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import {
  CATEGORY_LABEL,
  LAWS_LAST_VERIFIED,
  laws,
  searchLaws,
  type LawArticle,
  type LawCategory,
} from '../laws/data';
import { toolByPath } from '../tools';

type CategoryFilter = LawCategory | 'all';

function LawCard({ law }: { law: LawArticle }) {
  return (
    <article
      id={law.id}
      className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-slate-700">
          {law.lawShort}
        </span>
        <span className="text-sm font-semibold text-slate-700">{law.article}</span>
        <span className="text-base font-semibold text-slate-900">{law.title}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{law.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {law.keywords.slice(0, 5).map((k) => (
          <span
            key={k}
            className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500"
          >
            #{k}
          </span>
        ))}
      </div>

      {law.relatedTools.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
          <span className="text-[11px] text-slate-400">관련 계산기:</span>
          {law.relatedTools.map((p) => {
            const t = toolByPath(p);
            const label = t?.short ?? p;
            return (
              <a
                key={p}
                href={p}
                className="rounded border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-brand-700 hover:bg-brand-50 hover:underline"
              >
                {label}
              </a>
            );
          })}
        </div>
      )}

      <a
        href={law.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
      >
        원문 (국가법령정보센터) ↗
      </a>
    </article>
  );
}

export function LawsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const filtered = useMemo(() => {
    const base = query.trim() ? searchLaws(query) : laws;
    return category === 'all' ? base : base.filter((l) => l.category === category);
  }, [query, category]);

  // 카테고리별 그룹
  const grouped = useMemo(() => {
    const order: LawCategory[] = ['vc-investment', 'equity', 'tax', 'corporate', 'labor'];
    return order.map((c) => ({
      key: c,
      label: CATEGORY_LABEL[c],
      items: filtered.filter((l) => l.category === c),
    }));
  }, [filtered]);

  const filtering = query.trim() !== '' || category !== 'all';

  return (
    <div>
      <PageHeader
        title="법령 노트 — 계산기의 법적 근거"
        description="지분노트 계산기들이 참조하는 핵심 조항을 한 곳에. 키워드 검색·카테고리 필터로 빠르게 찾고, 원문은 국가법령정보센터 deep link로 바로 이동합니다."
      />

      {/* 검색 / 필터 */}
      <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="키워드·조항·법령명 검색 (예: 스톡옵션, 조특법, 16조)"
          aria-label="법령 조항 검색"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <SegmentedControl
            size="sm"
            ariaLabel="카테고리 필터"
            value={category}
            onChange={setCategory}
            segments={[
              { value: 'all', label: '전체' },
              { value: 'vc-investment', label: '벤처' },
              { value: 'equity', label: '지분' },
              { value: 'tax', label: '세제' },
              { value: 'corporate', label: '법인' },
              { value: 'labor', label: '노동' },
            ]}
          />
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              초기화
            </button>
          )}
        </div>
      </section>

      {filtering && filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          일치하는 조항이 없습니다. 다른 키워드를 시도해 보세요.
        </p>
      )}

      {/* 카테고리별 카드 */}
      <div className="space-y-8">
        {grouped.map((g) => {
          if (g.items.length === 0) return null;
          return (
            <section key={g.key}>
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {g.label} <span className="ml-1 text-slate-400">({g.items.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {g.items.map((l) => (
                  <LawCard key={l.id} law={l} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* 안내 */}
      <section className="mt-10 rounded-lg border border-slate-200 bg-white px-5 py-4">
        <p className="text-xs leading-relaxed text-slate-500">
          <span className="font-semibold text-slate-700">정보 제공용 — 자문 아님.</span> 본 페이지의
          조항 요지는 지분노트 운영자가 일반 이해를 돕기 위해 정리한 것이며 법률·세무·투자 자문이 아닙니다.
          정확한 최신 본문은 각 카드의 원문 링크(국가법령정보센터)에서 확인하세요. 최종 의사결정은
          반드시 전문가(변호사·세무사) 검토 후 진행해야 합니다.
          <br />
          <span className="text-slate-400">데이터 최종 점검 기준일: {LAWS_LAST_VERIFIED}</span>
        </p>
      </section>
    </div>
  );
}
