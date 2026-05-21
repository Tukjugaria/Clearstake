interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  segments: Segment<T>[];
  size?: 'sm' | 'md';
  ariaLabel?: string;
  fullWidth?: boolean;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  size = 'md',
  ariaLabel,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  const pad = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm';
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex rounded-full bg-slate-100 p-1 ${fullWidth ? 'flex w-full' : ''}`}
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <button
            key={seg.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(seg.value)}
            className={`${pad} ${fullWidth ? 'flex-1' : ''} rounded-full font-medium transition ${
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
