import { usePerspective } from '../../context/PerspectiveContext';
import { SegmentedControl } from '../ui/SegmentedControl';

/** 관점 토글 (계산기 페이지 상단 공통 — 기획서 §4.2) */
export function PerspectiveBar() {
  const { perspective, setPerspective } = usePerspective();
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <SegmentedControl
        ariaLabel="관점 선택"
        value={perspective}
        onChange={setPerspective}
        segments={[
          { value: 'founder', label: '창업자 관점' },
          { value: 'investor', label: '투자자 관점' },
        ]}
      />
    </div>
  );
}
