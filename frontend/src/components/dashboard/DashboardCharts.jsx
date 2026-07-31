import { useMemo } from "react";
import ExpensePieChart from "../charts/ExpensePieChart";
import IncomeExpenseChart from "../charts/IncomeExpenseChart";
import MonthlyTrendChart from "../charts/MonthlyTrendChart";

/**
 * DashboardCharts — receives financeData (from dashboard API) and
 * transactions (full list) to build chart datasets identical to Analytics page.
 *
 * BUG FIX: Previously MonthlyTrendChart and IncomeExpenseChart were called with
 * no `data` prop, causing them to always render "No Trend Data".
 */
export default function DashboardCharts({ financeData, transactions = [] }) {
  if (!financeData) return null;

  // Build pie data from dashboard API spending categories
  const pieData = useMemo(() => {
    return Object.entries(financeData.spending?.by_category || {})
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);
  }, [financeData]);

  // Build monthly trend data from transactions (same logic as Analytics page)
  const monthlyData = useMemo(() => {
    if (!transactions.length) return [];

    const monthMap = {};
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, income: 0, expense: 0, sortKey: date.getTime() };
      }
      if (txn.transaction_type === "Credit") {
        monthMap[monthKey].income += txn.amount;
      } else {
        monthMap[monthKey].expense += txn.amount;
      }
    });

    return Object.values(monthMap).sort((a, b) => a.sortKey - b.sortKey);
  }, [transactions]);

  return (
    <>
      <div className="chart-card">
        <h3>Monthly Spending Trend</h3>
        <MonthlyTrendChart data={monthlyData} />
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Expense Categories</h3>
          <ExpensePieChart data={pieData} />
        </div>

        <div className="chart-card">
          <h3>Income vs Expense</h3>
          <IncomeExpenseChart data={monthlyData} />
        </div>
      </div>
    </>
  );
}