import { pct } from '../../lib/format';

export interface StackSegment {
  label: string;
  /** fraction 0~1 */
  value: number;
  color: string;
}

interface StackedBarProps {
  segments: StackSegment[];
  /** 0 비중 세그먼트 숨김 */
  hideZero?: boolean;
}

export function StackedBar({ segments, hideZero = true }: StackedBarProps) {
  const visible = hideZero ? segments.filter((s) => s.value > 0.0005) : segments;
  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-lg bg-slate-100">
        {visible.map((s) => (
          <div
            key={s.label}
            className="h-full"
            style={{ width: `${Math.max(0, s.value) * 100}%`, backgroundColor: s.color }}
            title={`${s.label} ${pct(s.value)}`}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {visible.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
            <span className="tnum font-semibold text-slate-900">{pct(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
