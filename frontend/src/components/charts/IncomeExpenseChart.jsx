import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import ChartEmptyState from "./ChartEmptyState";
import { formatChartValue } from "../../utils/formatters";
import CustomTooltip from "./CustomTooltip";

export default function IncomeExpenseChart({ data = [] }) {
  if (!data || data.length === 0) return <ChartEmptyState title="No Trend Data" message="No income or expense data found." />;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,.08)" />

        <XAxis
          dataKey="month"
          stroke="#6B7280"
          axisLine={false}
          tickLine={false}
          dy={10}
        />

        <YAxis 
          stroke="#6B7280" 
          tickFormatter={(value) => formatChartValue(value)} 
          width={60}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />

        <Bar
          dataKey="income"
          fill="#10B981"
          radius={[6, 6, 0, 0]}
          name="Income"
        />

        <Bar
          dataKey="expense"
          fill="#EC4899"
          radius={[6, 6, 0, 0]}
          name="Expense"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}