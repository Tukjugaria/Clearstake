import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { RunwayPoint } from '../../lib/runway/runway';
import { wonShort, won } from '../../lib/format';

export function CashTrendChart({
  series,
  zeroMonth,
}: {
  series: RunwayPoint[];
  zeroMonth: number | null;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={series} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          tickFormatter={(v) => `${v}M`}
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={false}
        />
        <YAxis
          width={52}
          tickFormatter={(v) => wonShort(v)}
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: number) => [won(value), '현금']}
          labelFormatter={(l) => `${l}개월 후`}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
        {zeroMonth != null && (
          <ReferenceLine
            x={Math.round(zeroMonth)}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: '소진', fontSize: 11, fill: '#ef4444', position: 'top' }}
          />
        )}
        <Area type="monotone" dataKey="cash" stroke="#2563eb" strokeWidth={2} fill="url(#cashFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
