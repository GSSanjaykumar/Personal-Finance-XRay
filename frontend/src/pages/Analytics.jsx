import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../components/layout/Navbar";
import { getDashboard, getTransactions } from "../api/financeApi";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import AnalyticsSummary from "../components/ui/AnalyticsSummary";
import ExpensePieChart from "../components/charts/ExpensePieChart";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";
import MonthlyTrendChart from "../components/charts/MonthlyTrendChart";
import Skeleton from "../components/ui/Skeleton";
import { formatCurrency, getDisplayMerchant } from "../utils/formatters";

export default function Analytics() {
    const [dashboard, setDashboard] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [dash, txns] = await Promise.all([
                getDashboard(),
                getTransactions()
            ]);
            setDashboard(dash);
            setTransactions(txns || []);
        } catch {
            setError("Failed to load analytics data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Data Aggregation
    const { monthlyData, topMerchants, largestExpenses, pieData } = useMemo(() => {
        if (!transactions.length || !dashboard) {
            return { monthlyData: [], topMerchants: [], largestExpenses: [], pieData: [] };
        }

        // Monthly Trend & Income vs Expense
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
        
        const monthlyArray = Object.values(monthMap).sort((a, b) => a.sortKey - b.sortKey);

        // Top Merchants
        const merchantMap = {};
        transactions.filter(t => t.transaction_type === "Debit").forEach(txn => {
            const merchant = txn.merchant_name || "Unknown";
            merchantMap[merchant] = (merchantMap[merchant] || 0) + txn.amount;
        });
        const topMerchantsArray = Object.entries(merchantMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);

        // Largest Expenses
        const largestExpensesArray = [...transactions]
            .filter(t => t.transaction_type === "Debit")
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);

        // Pie Data
        const pieDataArray = Object.entries(dashboard.analytics?.spending?.by_category || {}).map(
            ([name, value]) => ({ name, value })
        );

        return { monthlyData: monthlyArray, topMerchants: topMerchantsArray, largestExpenses: largestExpensesArray, pieData: pieDataArray };
    }, [transactions, dashboard]);

    if (loading) return (
        <>
            <Navbar />
            <div style={{ marginTop: '24px' }}>
                <Skeleton type="grid" count={1} style={{ marginBottom: '32px' }} />
                <Skeleton type="table" count={1} />
            </div>
        </>
    );
    if (error) return <><Navbar /><ErrorState message={error} onRetry={fetchData} /></>;

    return (
        <>
            <Navbar />
            
            <div className="page-header">
                <div>
                    <h1>Analytics</h1>
                    <p className="subtitle">Deep dive into your financial data.</p>
                </div>
            </div>

            <AnalyticsSummary summary={dashboard?.summary || {}} />

            <div className="chart-grid">
                <div className="chart-card">
                    <h3>Monthly Spending Trend</h3>
                    <MonthlyTrendChart data={monthlyData} />
                </div>
                <div className="chart-card">
                    <h3>Income vs Expense</h3>
                    <IncomeExpenseChart data={monthlyData} />
                </div>
                <div className="chart-card">
                    <h3>Expense by Category</h3>
                    <ExpensePieChart data={pieData} />
                </div>
            </div>

            <div className="analytics-tables-grid">
                <div className="table-card">
                    <h3>Top 10 Merchants</h3>
                    <table className="transaction-table">
                        <thead>
                            <tr>
                                <th>Merchant</th>
                                <th style={{textAlign: 'right'}}>Total Spend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topMerchants.map((m, i) => {
                                const displayMerchant = getDisplayMerchant(m.name);
                                return (
                                <tr key={i} tabIndex="0">
                                    <td>
                                        <div className="merchant-cell">
                                            <div className="merchant-avatar">{displayMerchant.charAt(0).toUpperCase()}</div>
                                            <div className="merchant-name">{displayMerchant}</div>
                                        </div>
                                    </td>
                                    <td style={{textAlign: 'right'}} className="amount-debit">
                                        {formatCurrency(m.amount)}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="table-card">
                    <h3>Largest Expenses</h3>
                    <table className="transaction-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Merchant</th>
                                <th style={{textAlign: 'right'}}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {largestExpenses.map((txn, i) => {
                                const displayMerchant = getDisplayMerchant(txn.merchant_name || txn.merchant, txn.raw_description, txn.description);
                                return (
                                <tr key={i} tabIndex="0">
                                    <td>{new Date(txn.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                                    <td>{displayMerchant}</td>
                                    <td style={{textAlign: 'right'}} className="amount-debit">
                                        {formatCurrency(txn.amount)}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                <div className="table-card">
                    <h3>Monthly Summary</h3>
                    <table className="transaction-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Income</th>
                                <th>Expense</th>
                                <th style={{textAlign: 'right'}}>Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.map((m, i) => (
                                <tr key={i} tabIndex="0">
                                    <td>{m.month}</td>
                                    <td className="amount-credit">+{formatCurrency(m.income)}</td>
                                    <td className="amount-debit">-{formatCurrency(m.expense)}</td>
                                    <td style={{textAlign: 'right'}} className={m.income - m.expense >= 0 ? "amount-credit" : "amount-debit"}>
                                        {m.income - m.expense >= 0 ? "+" : "-"}{formatCurrency(Math.abs(m.income - m.expense))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}