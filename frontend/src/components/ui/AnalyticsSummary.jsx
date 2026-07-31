import { formatCompact } from "../../utils/formatters";

export default function AnalyticsSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="analytics-summary">

      <div className="analytics-box">
        <h4>Total Income</h4>
        <h2 className="text-primary-metric">{formatCompact(summary.total_income || summary.income || 0)}</h2>
      </div>

      <div className="analytics-box">
        <h4>Total Expense</h4>
        <h2 className="text-primary-metric">{formatCompact(summary.total_expense || summary.expense || 0)}</h2>
      </div>

      <div className="analytics-box">
        <h4>Net Savings</h4>
        <h2 className="text-primary-metric">{formatCompact(summary.savings || 0)}</h2>
      </div>

    </div>
  );
}