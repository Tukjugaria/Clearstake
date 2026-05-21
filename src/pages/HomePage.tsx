import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
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

const audienceColor: Record<Audience, string> = {
  founder: 'bg-blue-50 text-blue-700',
  investor: 'bg-emerald-50 text-emerald-700',
  both: 'bg-slate-100 text-slate-600',
};

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-brand-50 px-6 py-10 sm:px-10 sm:py-14">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
          <BrandMark size={22} className="text-brand-600" />
          ClearStake
        </div>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          한국 벤처투자 관행·세법 기반
          <br />
          지분·세제·투자 계산기
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          SAFE 전환·캡테이블 희석·스톡옵션 세제부터 런웨이·투자수익까지. 창업자와 투자자 모두의
          관점으로 한 곳에서 시뮬레이션하세요.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/safe"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            SAFE 계산기 시작하기
          </Link>
          <Link
            to="/captable"
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            캡테이블 시뮬레이터
          </Link>
        </div>
      </section>

      {/* 핵심 가치 */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {values.map((v) => (
          <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-brand-700">{v.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{v.desc}</p>
          </div>
        ))}
      </section>

      {/* 도구 디렉터리 (카테고리별) */}
      {categoryOrder.map((cat) => {
        const items = toolsByCategory(cat);
        if (items.length === 0) return null;
        return (
          <section key={cat} className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-slate-900">{cat}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((m) => (
                <Link key={m.path} to={m.path} className="group block">
                  <Card className="h-full transition group-hover:border-brand-300 group-hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                        {m.badge ?? m.title.slice(0, 1)}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-700">
                            {m.title}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${audienceColor[m.audience]}`}
                          >
                            {audienceLabel[m.audience]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{m.desc}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* 면책 */}
      <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm leading-relaxed text-amber-800">
          ⚠ <strong>면책</strong> — 본 도구는 일반 정보 제공용이며 법률·세무·투자 자문이 아닙니다.
          계산은 단순화된 모델에 기반한 개략 추정이며, 실제 의사결정은 반드시 전문가(변호사·세무사)
          확인이 필요합니다. 세율·한도·일몰연도 등 법령 의존 값은 개정될 수 있습니다.
        </p>
      </section>
    </div>
  );
}
