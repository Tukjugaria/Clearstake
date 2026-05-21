import { usePerspective } from '../../context/PerspectiveContext';
import { SegmentedControl } from '../ui/SegmentedControl';

/** 관점 토글 + 프라이버시 배지 (계산기 페이지 상단 공통 — 기획서 §4.2) */
export function PerspectiveBar() {
  const { perspective, setPerspective } = usePerspective();
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <SegmentedControl
        ariaLabel="관점 선택"
        value={perspective}
        onChange={setPerspective}
        segments={[
          { value: 'founder', label: '창업자 관점' },
          { value: 'investor', label: '투자자 관점' },
        ]}
      />
      <div className="flex items-center gap-1.5 text-sm text-emerald-700">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="3" y="7" width="10" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <span>입력값은 브라우저를 떠나지 않습니다</span>
      </div>
    </div>
  );
}
