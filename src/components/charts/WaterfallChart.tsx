import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { calculateWaterfall, type CommonHolder, type PreferredSeries } from '../../lib/waterfall/waterfall';
import { wonShort } from '../../lib/format';

const LINE_COLORS = ['#0ea5e9', '#f59e0b', '#a855f7', '#10b981', '#ef4444'];

export function WaterfallChart({
  common,
  preferred,
  currentExit,
  maxExit,
}: {
  common: CommonHolder[];
  preferred: PreferredSeries[];
  currentExit: number;
  maxExit: number;
}) {
  const steps = 40;
  const data = Array.from({ length: steps + 1 }, (_, i) => {
    const exit = (maxExit / steps) * i;
    const res = calculateWaterfall({ exitProceeds: exit, common, preferred });
    const row: Record<string, number> = { exit };
    row.common = res.rows.filter((r) => r.kind === 'common').reduce((a, r) => a + r.payout, 0);
    for (const p of preferred) {
      row[p.id] = res.rows.find((r) => r.id === p.id)?.payout ?? 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="exit"
          type="number"
          domain={[0, maxExit]}
          tickFormatter={(v) => wonShort(v)}
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => wonShort(v)}
          width={56}
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: number, name: string) => [wonShort(value), name]}
          labelFormatter={(l) => `엑싯 ${wonShort(Number(l))}`}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {currentExit > 0 && currentExit <= maxExit && (
          <ReferenceLine x={currentExit} stroke="#2563eb" strokeDasharray="4 4" />
        )}
        <Line type="monotone" dataKey="common" name="보통주" stroke="#2563eb" strokeWidth={2} dot={false} />
        {preferred.map((p, i) => (
          <Line
            key={p.id}
            type="monotone"
            dataKey={p.id}
            name={p.name}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
