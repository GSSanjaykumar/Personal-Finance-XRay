import { useState, useEffect, useCallback, useMemo } from "react";
import { getDashboard, getTransactions } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import { formatCurrency, getDisplayMerchant } from "../utils/formatters";

// Vercel UI components
import { KpiCards } from "../components/v0-dashboard/kpi-cards";
import { CashflowChart } from "../components/v0-dashboard/cashflow-chart";
import { SpendDonut } from "../components/v0-dashboard/spend-donut";
import { kpis as mockKpis } from "../v0-lib/data";

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
    const { monthlyData, topMerchants, largestExpenses, pieData, mappedKpis } = useMemo(() => {
        if (!transactions.length || !dashboard) {
            return { monthlyData: [], topMerchants: [], largestExpenses: [], pieData: [], mappedKpis: [] };
        }

        // Monthly Trend & Income vs Expense
        const monthMap = {};
        transactions.forEach(txn => {
            const date = new Date(txn.date);
            const monthKey = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
            if (!monthMap[monthKey]) {
                monthMap[monthKey] = { month: monthKey, income: 0, expense: 0, sortKey: date.getTime() };
            }
            if (txn.transaction_type === "Credit" || txn.amount > 0) {
                monthMap[monthKey].income += Math.abs(txn.amount);
            } else {
                monthMap[monthKey].expense += Math.abs(txn.amount);
            }
        });
        
        const monthlyArray = Object.values(monthMap).sort((a, b) => a.sortKey - b.sortKey);

        const formattedMonthlyData = monthlyArray.map(m => ({
            month: m.month,
            income: m.income / 1000,
            expense: m.expense / 1000,
            rawIncome: m.income,
            rawExpense: m.expense
        }));

        // Top Merchants
        const merchantMap = {};
        transactions.filter(t => t.transaction_type === "Debit" || t.amount < 0).forEach(txn => {
            const merchant = txn.merchant_name || "Unknown";
            merchantMap[merchant] = (merchantMap[merchant] || 0) + Math.abs(txn.amount);
        });
        const topMerchantsArray = Object.entries(merchantMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);

        // Largest Expenses
        const largestExpensesArray = [...transactions]
            .filter(t => t.transaction_type === "Debit" || t.amount < 0)
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
            .slice(0, 10);

        // Pie Data
        const byCategory = dashboard.analytics?.spending?.by_category || {};
        const totalExpense = dashboard.summary?.total_expense || 1;
        const pieDataArray = Object.entries(byCategory).map(([name, value]) => ({ 
            name, 
            amount: value,
            pct: Math.round((value / totalExpense) * 100)
        })).sort((a, b) => b.amount - a.amount).slice(0, 5);

        // Map KPIs
        const kpiArray = [
            {
                id: "net-worth",
                label: "Total Income",
                value: dashboard.summary.total_income || 0,
                prefix: "₹",
                positive: true,
                trend: mockKpis[0].trend,
            },
            {
                id: "safe-to-spend",
                label: "Total Expense",
                value: dashboard.summary.total_expense || 0,
                prefix: "₹",
                positive: false,
                trend: mockKpis[2].trend,
            },
            {
                id: "health-score",
                label: "Transaction Count",
                value: dashboard.summary.transaction_count || 0,
                delta: "",
                positive: true,
                trend: mockKpis[3].trend,
            },
        ];

        return { monthlyData: formattedMonthlyData, topMerchants: topMerchantsArray, largestExpenses: largestExpensesArray, pieData: pieDataArray, mappedKpis: kpiArray };
    }, [transactions, dashboard]);

    if (loading) return (
        <div className="space-y-6">
            <header className="mb-6">
                <Skeleton type="card" count={1} style={{ height: '80px' }} />
            </header>
            <Skeleton type="grid" count={1} />
            <Skeleton type="table" count={1} />
        </div>
    );
    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    return (
        <div className="space-y-6">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
                <p className="mt-1.5 text-muted-foreground">Deep dive into your financial data.</p>
            </header>

            <KpiCards data={mappedKpis} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <CashflowChart data={monthlyData} />
                <SpendDonut data={pieData} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
                    <h3 className="mb-4 text-lg font-semibold">Top 10 Merchants</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)] text-left text-muted-foreground">
                                    <th className="pb-3 font-medium">Merchant</th>
                                    <th className="pb-3 text-right font-medium">Total Spend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topMerchants.map((m, i) => {
                                    const displayMerchant = getDisplayMerchant(m.name);
                                    return (
                                        <tr key={i} className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                                            <td className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                                                        {displayMerchant.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium">{displayMerchant}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right tabular-nums text-[var(--negative)]">
                                                {formatCurrency(m.amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
                    <h3 className="mb-4 text-lg font-semibold">Largest Expenses</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)] text-left text-muted-foreground">
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 font-medium">Merchant</th>
                                    <th className="pb-3 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {largestExpenses.map((txn, i) => {
                                    const displayMerchant = getDisplayMerchant(txn.merchant_name || txn.merchant, txn.raw_description, txn.description);
                                    return (
                                        <tr key={i} className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                                            <td className="py-3 text-muted-foreground">
                                                {new Date(txn.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                            </td>
                                            <td className="py-3 font-medium">{displayMerchant}</td>
                                            <td className="py-3 text-right tabular-nums text-[var(--negative)]">
                                                {formatCurrency(Math.abs(txn.amount))}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
                <h3 className="mb-4 text-lg font-semibold">Monthly Summary</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] text-left text-muted-foreground">
                                <th className="pb-3 font-medium">Month</th>
                                <th className="pb-3 font-medium">Income</th>
                                <th className="pb-3 font-medium">Expense</th>
                                <th className="pb-3 text-right font-medium">Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.map((m, i) => (
                                <tr key={i} className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                                    <td className="py-3 font-medium">{m.month}</td>
                                    <td className="py-3 tabular-nums text-[var(--positive)]">+{formatCurrency(m.rawIncome)}</td>
                                    <td className="py-3 tabular-nums text-[var(--negative)]">-{formatCurrency(m.rawExpense)}</td>
                                    <td className={`py-3 text-right tabular-nums ${m.rawIncome - m.rawExpense >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                                        {m.rawIncome - m.rawExpense >= 0 ? "+" : "-"}{formatCurrency(Math.abs(m.rawIncome - m.rawExpense))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}