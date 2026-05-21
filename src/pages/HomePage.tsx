import { Link } from 'react-router-dom';
import { BrandMark } from '../components/ui/BrandMark';
import { categoryOrder, toolsByCategory, type Audience } from '../tools';

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

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="rounded-lg border border-slate-200 bg-white px-6 py-9 sm:px-9 sm:py-12">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <BrandMark size={20} className="text-brand-600" />
          ClearStake
        </div>
        <h1 className="mt-4 max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          한국 벤처투자 관행·세법 기반 지분·세제·투자 계산기
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
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

      {/* 도구 디렉터리 (카테고리별) */}
      {categoryOrder.map((cat) => {
        const items = toolsByCategory(cat);
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
