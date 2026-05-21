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
import type { VestingPoint } from '../../lib/vesting/vesting';
import { num } from '../../lib/format';

export function VestingChart({
  schedule,
  elapsedMonths,
  cliffMonths,
}: {
  schedule: VestingPoint[];
  elapsedMonths: number;
  cliffMonths: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={schedule} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="vestFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
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
          width={64}
          tickFormatter={(v) => num(v)}
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: number) => [`${num(value)}주`, '누적 베스팅']}
          labelFormatter={(l) => `${l}개월`}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        {cliffMonths > 0 && (
          <ReferenceLine
            x={cliffMonths}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: '클리프', fontSize: 11, fill: '#64748b', position: 'top' }}
          />
        )}
        <ReferenceLine
          x={elapsedMonths}
          stroke="#2563eb"
          label={{ value: '현재', fontSize: 11, fill: '#2563eb', position: 'top' }}
        />
        <Area
          type="stepAfter"
          dataKey="vestedShares"
          stroke="#7c3aed"
          strokeWidth={2}
          fill="url(#vestFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
