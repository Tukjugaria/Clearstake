import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ShareholderGroup } from '../../lib/captable/types';
import { groupColors, groupLabels } from '../../lib/groups';

/** 각 시점(초기/라운드)별 그룹 지분율(%) 데이터 행 */
export interface DilutionDatum {
  stage: string;
  founder: number;
  investor: number;
  optionPool: number;
  safe: number;
  newInvestor: number;
}

const order: ShareholderGroup[] = ['founder', 'investor', 'optionPool', 'safe', 'newInvestor'];

export function DilutionTrendChart({ data }: { data: DilutionDatum[] }) {
  // 전 구간에서 값이 0뿐인 그룹은 범례에서 제외
  const activeGroups = order.filter((g) => data.some((d) => d[g] > 0.05));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="stage" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 12, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: number, name: string) => [`${Number(value).toFixed(2)}%`, name]}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {activeGroups.map((g) => (
          <Bar
            key={g}
            dataKey={g}
            stackId="a"
            fill={groupColors[g]}
            name={groupLabels[g]}
            maxBarSize={72}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
