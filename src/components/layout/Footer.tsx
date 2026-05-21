import { taxConfig } from '../../config/taxConfig';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs leading-relaxed text-slate-500">
          ⚠ 본 도구는 일반 정보 제공용이며 법률·세무·투자 자문이 아닙니다. 실제 의사결정은 전문가
          확인이 필요합니다.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          모든 계산은 브라우저에서만 수행되며 입력값은 서버로 전송되지 않습니다 · 외부 API·추적
          스크립트 없음
        </p>
        <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-4 text-xs text-slate-400">
          <span>세제 수치 기준일: {taxConfig.lastUpdated} · 출처:</span>
          <ul className="list-inside list-disc">
            {taxConfig.sources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
