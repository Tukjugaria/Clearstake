import { lawsForTool } from '../laws/data';

interface RelatedLawsProps {
  /** 현재 계산기 경로 (예: '/tax') */
  toolPath: string;
}

/**
 * 계산기 페이지 결과 카드 아래에 표시할 "이 계산의 법적 근거" 위젯.
 * 해당 도구와 연결된 조항만 자동 필터링해 카드로 보여주고,
 * 국가법령정보센터 deep link + /laws 페이지로 이동 가능.
 */
export function RelatedLaws({ toolPath }: RelatedLawsProps) {
  const items = lawsForTool(toolPath);
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">
          이 계산의 법적 근거
          <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
            {items.length}
          </span>
        </h3>
        <a
          href="/laws"
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          전체 법령 노트 →
        </a>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((l) => (
          <li
            key={l.id}
            className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-xs font-semibold text-slate-700">
                {l.lawShort} {l.article}
              </span>
              <span className="text-sm text-slate-900">{l.title}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{l.summary}</p>
            <a
              href={l.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline"
            >
              원문 (국가법령정보센터) ↗
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-slate-400">
        ※ 본 요지는 일반 정보 제공용이며 자문이 아닙니다. 정확한 최신 본문은 위 원문 링크에서 확인하세요.
      </p>
    </section>
  );
}
