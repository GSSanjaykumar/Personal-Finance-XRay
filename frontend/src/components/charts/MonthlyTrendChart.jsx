import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ChartEmptyState from "./ChartEmptyState";
import { formatChartValue } from "../../utils/formatters";
import CustomTooltip from "./CustomTooltip";

export default function MonthlyTrendChart({ data = [] }) {
  if (!data || data.length === 0) return <ChartEmptyState title="No Trend Data" message="No expense data found." />;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />

        <Line
          type="monotone"
          dataKey="expense"
          name="Expense"
          stroke="#EC4899"
          strokeWidth={4}
          dot={{
            r: 4,
            fill: "#EC4899",
            strokeWidth: 2,
            stroke: "#101827"
          }}
          activeDot={{
            r: 6,
            stroke: "white",
            strokeWidth: 2
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}