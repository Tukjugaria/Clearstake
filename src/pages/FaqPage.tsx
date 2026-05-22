import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/Layout';
import { taxConfig } from '../config/taxConfig';

interface QA {
  q: string;
  a: ReactNode;
}

const faqs: QA[] = [
  {
    q: '지분노트는 어떤 서비스인가요?',
    a: (
      <>
        한국 벤처투자 관행·세법에 기반해 SAFE 전환, 캡테이블 희석, 스톡옵션·엔젤투자 세제, 런웨이,
        투자 수익률 등을 계산하는 무료 웹 도구입니다. 창업자와 투자자 양쪽 관점으로 동일한 데이터를
        볼 수 있는 것이 특징입니다.
      </>
    ),
  },
  {
    q: '입력한 데이터는 안전한가요? 어디에 저장되나요?',
    a: (
      <>
        <strong>모든 계산은 사용자의 브라우저에서만 수행되며, 입력값은 서버로 전송되지 않습니다.</strong>{' '}
        지분노트에는 서버·데이터베이스·외부 API 호출이 없고, 추적·광고 스크립트도 사용하지
        않습니다. 시나리오를 URL로 공유할 때도 값은 링크(쿼리스트링)에만 담기며 어디에도 저장되지
        않습니다. 따라서 캡테이블·연봉·투자 조건 같은 민감한 정보를 안심하고 입력할 수 있습니다.
      </>
    ),
  },
  {
    q: '계산 결과를 그대로 신뢰해도 되나요?',
    a: (
      <>
        아니요. 본 도구는 일반 정보 제공용이며 법률·세무·투자 자문이 아닙니다. 계산은 단순화된
        모델에 기반한 <strong>개략 추정</strong>으로, 실제 세액·지분·수익은 개인 상황과 계약 조건에
        따라 달라집니다. 실제 의사결정 전에는 반드시 전문가(변호사·세무사)의 확인을 받으세요.
      </>
    ),
  },
  {
    q: '세율·한도 같은 법령 수치가 바뀌면 어떻게 되나요?',
    a: (
      <>
        세율·비과세 한도·일몰연도 등 법령에 의존하는 값은 코드에 흩지 않고 한 곳(taxConfig)에 출처·기준일과
        함께 분리해 관리합니다. 현재 기준일은{' '}
        <strong>{taxConfig.lastUpdated}</strong>이며, 법 개정 시 이 값만 갱신하면 전체에 반영됩니다.
        화면 하단에 항상 기준일과 출처를 표시합니다.
      </>
    ),
  },
  {
    q: '시나리오를 다른 사람과 공유할 수 있나요?',
    a: (
      <>
        네. SAFE 계산기의 “URL로 시나리오 공유” 버튼을 누르면 입력값이 담긴 링크가 클립보드에
        복사됩니다. 이 링크를 받은 사람은 동일한 입력 상태로 결과를 볼 수 있습니다. 값은 링크에만
        존재하고 서버에 저장되지 않습니다.
      </>
    ),
  },
  {
    q: '창업자 관점 / 투자자 관점 토글은 무엇인가요?',
    a: (
      <>
        같은 계산 결과를 보는 시각만 바꾸는 기능입니다. 창업자 관점은 “내 지분이 얼마나 희석되나 /
        세금은 얼마인가”를, 투자자 관점은 “내 전환 지분·수익은 얼마인가”를 강조합니다. 계산 자체는
        동일합니다.
      </>
    ),
  },
  {
    q: '무료인가요?',
    a: <>네, 전부 무료입니다. 로그인·결제·회원가입이 필요 없습니다.</>,
  },
];

export function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="자주 묻는 질문 (FAQ)" description="지분노트에 대해 자주 묻는 질문을 모았습니다." />

      <div className="space-y-3">
        {faqs.map((item, i) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-slate-200 bg-white px-5 py-1 [&[open]]:border-brand-200"
            open={i === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-sm font-semibold text-slate-900 marker:hidden">
              {item.q}
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
                className="shrink-0 text-slate-400 transition group-open:rotate-180"
              >
                <path d="M5 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-slate-600">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm leading-relaxed text-amber-800">
          ⚠ 본 도구는 일반 정보 제공용이며 법률·세무·투자 자문이 아닙니다. 실제 의사결정은 전문가
          확인이 필요합니다.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        계산기를 둘러보려면{' '}
        <Link to="/" className="font-medium text-brand-700 hover:underline">
          홈으로
        </Link>{' '}
        이동하세요.
      </p>
    </div>
  );
}
