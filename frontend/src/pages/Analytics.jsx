import { useState, useEffect, useCallback, useMemo } from "react";
import { getDashboard, getTransactions } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import { formatCurrency, getDisplayMerchant } from "../utils/formatters";
import { Store, Receipt, CalendarDays, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

// Vercel UI components
import { KpiCards } from "../components/v0-dashboard/kpi-cards";
import { CashflowChart } from "../components/v0-dashboard/cashflow-chart";
import { SpendDonut } from "../components/v0-dashboard/spend-donut";
import { Reveal } from "../components/v0-ui/surface";
import EmptyState from "../components/ui/EmptyState";


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
                trend: [],
            },
            {
                id: "safe-to-spend",
                label: "Total Expense",
                value: dashboard.summary.total_expense || 0,
                prefix: "₹",
                positive: false,
                trend: [],
            },
            {
                id: "health-score",
                label: "Transaction Count",
                value: dashboard.summary.transaction_count || 0,
                delta: "",
                positive: true,
                trend: [],
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

    const isEmpty = !dashboard || dashboard?.summary?.transaction_count === 0;

    if (isEmpty) {
        return (
            <EmptyState
                title="No Analytics Data"
                message="Upload your bank statement PDF to view your detailed analytics and spending trends."
                icon="📊"
            />
        );
    }

    return (
        <div className="space-y-6">
            <header className="mb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Analytics</h1>
                <p className="mt-1.5 text-muted-foreground">Deep dive into your financial data.</p>
            </header>

            <KpiCards data={mappedKpis} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <CashflowChart data={monthlyData} />
                <SpendDonut data={pieData} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Reveal delay={0.1} className="h-full">
                    <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
                        <div className="flex items-start justify-between p-6 pb-4">
                            <div>
                                <h2 className="text-base font-semibold">Top Merchants</h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">Highest spending destinations</p>
                            </div>
                        </div>
                        <div className="flex-1 px-3 pb-3">
                            {topMerchants.map((m, i) => {
                                const displayMerchant = getDisplayMerchant(m.name);
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-[var(--surface-2)]"
                                    >
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>
                                            <Store className="size-[18px]" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="truncate text-sm font-medium text-foreground">{displayMerchant}</span>
                                        </span>
                                        <span className="text-right">
                                            <span className="tabular block text-sm font-semibold text-[var(--negative)]">
                                                -{formatCurrency(m.amount)}
                                            </span>
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </Reveal>

                <Reveal delay={0.2} className="h-full">
                    <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
                        <div className="flex items-start justify-between p-6 pb-4">
                            <div>
                                <h2 className="text-base font-semibold">Largest Expenses</h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">Highest single transactions</p>
                            </div>
                        </div>
                        <div className="flex-1 px-3 pb-3">
                            {largestExpenses.map((txn, i) => {
                                const displayMerchant = getDisplayMerchant(txn.merchant_name || txn.merchant, txn.raw_description, txn.description);
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-[var(--surface-2)]"
                                    >
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>
                                            <Receipt className="size-[18px]" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="truncate text-sm font-medium text-foreground">{displayMerchant}</span>
                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                {new Date(txn.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                            </span>
                                        </span>
                                        <span className="text-right">
                                            <span className="tabular block text-sm font-semibold text-[var(--negative)]">
                                                -{formatCurrency(Math.abs(txn.amount))}
                                            </span>
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </Reveal>
            </div>

            <Reveal delay={0.3} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
                    <div className="flex items-start justify-between p-6 pb-4">
                        <div>
                            <h2 className="text-base font-semibold">Monthly Summary</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">Income vs Expense breakdown</p>
                        </div>
                    </div>
                    <div className="flex-1 px-3 pb-3">
                        {monthlyData.map((m, i) => {
                            const isPositive = m.rawIncome - m.rawExpense >= 0;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-[var(--surface-2)]"
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>
                                        <CalendarDays className="size-[18px]" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="truncate text-sm font-medium text-foreground">{m.month}</span>
                                        <span className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <ArrowUpRight className="size-3 text-[var(--positive)]" /> {formatCurrency(m.rawIncome)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ArrowDownRight className="size-3 text-[var(--negative)]" /> {formatCurrency(m.rawExpense)}
                                            </span>
                                        </span>
                                    </span>
                                    <span className="text-right">
                                        <span className="tabular block text-sm font-semibold" style={{ color: isPositive ? "var(--positive)" : "var(--negative)" }}>
                                            {isPositive ? "+" : "-"}{formatCurrency(Math.abs(m.rawIncome - m.rawExpense))}
                                        </span>
                                        <span className="mt-1 block text-xs text-muted-foreground">Net Savings</span>
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </Reveal>
        </div>
    );
}