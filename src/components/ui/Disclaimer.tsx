/** 면책 문구 (모든 결과 화면 하단 고정 노출 — 기획서 §7 필수) */
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs leading-relaxed text-slate-400">
        ⚠ 본 도구는 일반 정보 제공용이며 법률·세무·투자 자문이 아닙니다. 실제 의사결정은 전문가
        확인이 필요합니다.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-xs leading-relaxed text-amber-800">
        ⚠ <strong>면책</strong> — 본 도구는 일반 정보 제공용이며 법률·세무·투자 자문이 아닙니다.
        계산은 단순화된 모델에 기반한 개략 추정이며, 실제 의사결정은 반드시 전문가(변호사·세무사)
        확인이 필요합니다.
      </p>
    </div>
  );
}
