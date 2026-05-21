import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** 강조 (관점에 따라 핵심 지표) — 잉크 반전 카드로 표현 */
  highlight?: boolean;
}

export function StatCard({ label, value, sub, highlight = false }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        highlight ? 'border-slate-900 bg-slate-900' : 'border-slate-200 bg-white'
      }`}
    >
      <div className={`text-xs font-medium ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </div>
      <div
        className={`tnum mt-1 text-xl font-semibold tracking-tight ${
          highlight ? 'text-white' : 'text-slate-900'
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className={`mt-0.5 text-xs ${highlight ? 'text-slate-500' : 'text-slate-400'}`}>
          {sub}
        </div>
      )}
    </div>
  );
}
