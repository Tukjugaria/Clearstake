import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** 강조 (관점에 따라 핵심 지표) */
  highlight?: boolean;
}

export function StatCard({ label, value, sub, highlight = false }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        highlight ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-slate-50/60'
      }`}
    >
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div
        className={`tnum mt-1 text-xl font-bold ${highlight ? 'text-brand-700' : 'text-slate-900'}`}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
