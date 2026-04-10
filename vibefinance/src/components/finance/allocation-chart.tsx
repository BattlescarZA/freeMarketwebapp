import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AssetAllocation } from '@/types';

interface AllocationChartProps {
  data: AssetAllocation[];
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export function AllocationChart({ data }: AllocationChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry: any) => `${entry.ticker} ${entry.percentage.toFixed(1)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
