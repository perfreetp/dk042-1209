import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { DailyDataPoint } from '@/types';
import { formatPercent } from '@/utils/format';

interface TrendLineChartProps {
  data: Array<Record<string, any>>;
  series: Array<{
    key: string;
    name: string;
    color: string;
  }>;
}

const TrendLineChart = ({ data, series }: TrendLineChartProps) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s, idx) => (
              <linearGradient key={s.key} id={`grad_${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 10px 40px -12px rgba(0,0,0,0.12)',
              padding: '12px 14px',
            }}
            labelStyle={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(v: number, name: string) => [formatPercent(v), name]}
          />
          {series.map((s, idx) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              fill={`url(#grad_${idx})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendLineChart;
