import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Label, Tooltip } from "recharts";
import ChartEmptyState from "./ChartEmptyState";
import { formatCompact, formatPercentage, formatCurrency } from "../../utils/formatters";
import CustomTooltip from "./CustomTooltip";

// SaaS-grade color palette
const COLORS = [
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#14B8A6", // Teal
  "#F43F5E", // Rose
];

export default function ExpensePieChart({ data = [] }) {
  // Filter and sort by value descending
  const validData = useMemo(() => {
    return data
      .filter((item) => item && typeof item.value === "number" && item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const totalExpense = useMemo(() => {
    return validData.reduce((acc, curr) => acc + curr.value, 0);
  }, [validData]);

  if (!validData || validData.length === 0) {
    return <ChartEmptyState title="No Expense Data" message="No category spending found." />;
  }

  return (
    <div style={{ display: 'flex', gap: '40px', alignItems: 'center', height: '100%', minHeight: '350px' }}>
      
      {/* Left: Large Donut */}
      <div style={{ flex: '0 0 300px', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={validData}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              cornerRadius={6}
            >
              {validData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              
              <Label
                value={formatCompact(totalExpense)}
                position="center"
                dy={-8}
                fill="white"
                fontSize={32}
                fontWeight="bold"
              />
              <Label
                value="Total Spent"
                position="center"
                dy={20}
                fill="#9CA3AF"
                fontSize={14}
                fontWeight={500}
              />
            </Pie>
            
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Right: Category Breakdown Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto', paddingRight: '12px' }}>
        {validData.map((item, index) => {
          const color = COLORS[index % COLORS.length];
          const pct = (item.value / totalExpense) * 100;
          
          return (
            <div key={index} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              transition: 'background 0.2s, transform 0.2s',
              cursor: 'default'
            }}
            className="pie-legend-row"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            >
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left side: Dot + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    display: 'inline-block'
                  }} />
                  <span style={{ fontSize: '15px', color: '#E5E7EB', fontWeight: 500 }}>{item.name}</span>
                </div>
                
                {/* Right side: Amount + Pct */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{ fontSize: '15px', color: 'white', fontWeight: 600 }}>{formatCompact(item.value)}</span>
                  <span style={{ fontSize: '13px', color: '#9CA3AF', width: '36px', textAlign: 'right' }}>{formatPercentage(pct)}</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: color,
                  borderRadius: '3px'
                }} />
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
}