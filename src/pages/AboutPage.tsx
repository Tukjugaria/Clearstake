import { PageHeader } from '../components/layout/Layout';
import { BrandMark } from '../components/ui/BrandMark';

const BOOKING_URL = 'https://app.simplymeet.me/hrgwak';

const talkTopics = [
  {
    title: '창업자',
    desc: 'SAFE·라운드 구조, 지분 희석, 스톡옵션/세금 고민을 함께 정리해요.',
  },
  {
    title: '투자자 · 심사역',
    desc: '딜 구조(우선주·텀시트), 펀드 수익 지표, 한국 세제 관점을 나눠요.',
  },
  {
    title: '피드백 · 제안',
    desc: '지분노트에 넣었으면 하는 계산기나 개선 아이디어 환영합니다.',
  },
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="소개" description="지분노트를 만든 사람, 그리고 만나는 방법." />

      {/* 프로필 */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
            H
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              안녕하세요, 지분노트를 만든 <span className="text-brand-700">Henry</span>입니다.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              한국 벤처투자 관행·세법에 맞는 무료 계산 도구가 마땅치 않아, 창업자와 투자자가 같은
              숫자를 <strong>양쪽 관점</strong>에서 볼 수 있는 도구를 직접 만들었습니다. SAFE 전환·캡테이블
              희석부터 스톡옵션·엔젤 세제, 런웨이·펀드 수익까지 — 흩어진 계산을 한 곳에 모으는 것이
              목표입니다.
            </p>
          </div>
        </div>

        <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-3">
          {[
            ['한국 특화', '벤처투자법·조특법 등 국내 제도 반영'],
            ['양면 관점', '창업자·투자자 시각을 한 번에'],
            ['프라이버시', '입력값은 브라우저에서만 — 서버 전송 없음'],
          ].map(([t, d]) => (
            <li key={t} className="bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">{t}</div>
              <div className="mt-1 text-xs leading-relaxed text-slate-500">{d}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* 예약 CTA */}
      <section className="mt-6 rounded-lg border border-slate-900 bg-slate-900 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
          <BrandMark size={18} className="text-white" />
          만나서 이야기해요
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight text-white">
          온라인 미팅 또는 오프라인 커피챗 예약
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
          창업·투자·세제 고민이든, 지분노트 피드백이든 편하게 잡아주세요. 아래에서 가능한 시간을
          골라 예약하면 됩니다.
        </p>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          미팅 · 커피챗 예약하기
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <p className="mt-3 text-xs text-slate-500">예약 페이지: app.simplymeet.me/hrgwak</p>
      </section>

      {/* 이런 이야기 */}
      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          이런 이야기를 나누고 싶어요
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {talkTopics.map((t) => (
            <div key={t.title} className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{t.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
