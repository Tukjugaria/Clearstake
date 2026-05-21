import { useId } from 'react';
import { formatWithCommas } from '../../lib/format';

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
  /** 오른쪽 단위 표시 (₩, %, 주 등) */
  suffix?: string;
  placeholder?: string;
  hint?: string;
  /** 천단위 콤마 자동 포맷 (기본 true) */
  comma?: boolean;
}

export function NumberInput({
  label,
  value,
  onChange,
  optional = false,
  suffix,
  placeholder,
  hint,
  comma = true,
}: NumberInputProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {optional && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
            선택
          </span>
        )}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(comma ? formatWithCommas(e.target.value) : e.target.value)}
          className="tnum w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-right text-slate-900 shadow-sm transition outline-none placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
