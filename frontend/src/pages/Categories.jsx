import { useState, useEffect, useCallback, useMemo } from "react";
import { getDashboard, getTransactions } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, getDisplayMerchant, formatCategory, formatDate } from "../utils/formatters";
import { SpendDonut } from "../components/v0-dashboard/spend-donut";
import { Reveal } from "../components/v0-ui/surface";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownLeft, ArrowUpRight, ShoppingCart, Wallet, Receipt } from "lucide-react";

const ICONS = {
    "Food & Dining": "🍕",
    "Shopping": "🛍️",
    "Transport": "🚕",
    "Bills": "💡",
    "Entertainment": "🎬",
    "Income": "💰",
    "Others": "📦",
    "Cash Withdrawal": "🏧"
};

export default function Categories() {
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [dashboardData, txnsData] = await Promise.all([
                getDashboard(),
                getTransactions()
            ]);
            setBudgets(dashboardData.budget?.category_budgets || dashboardData.budget || []);
            setTransactions(txnsData || []);
        } catch {
            setError("Failed to load category data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const categoryStats = useMemo(() => {
        if (!transactions.length) return [];

        const statsMap = {};
        
        const budgetMap = {};
        if (Array.isArray(budgets)) {
            budgets.forEach(b => {
                budgetMap[b.category] = b;
            });
        }

        transactions.forEach(txn => {
            const rawCat = formatCategory(txn.category);
            const cat = rawCat;
            if (txn.transaction_type === "Credit") return; 

            if (!statsMap[cat]) {
                statsMap[cat] = {
                    category: cat,
                    total_spend: 0,
                    count: 0,
                    merchants: {},
                    budget: budgetMap[cat] || budgetMap[txn.category] || null,
                    transactions: []
                };
            }
            statsMap[cat].total_spend += Math.abs(txn.amount);
            statsMap[cat].count += 1;
            statsMap[cat].transactions.push(txn);
            
            const merchant = getDisplayMerchant(txn.merchant_name || txn.merchant, txn.raw_description, txn.description);
            statsMap[cat].merchants[merchant] = (statsMap[cat].merchants[merchant] || 0) + Math.abs(txn.amount);
        });

        return Object.values(statsMap).map(stat => {
            const topMerchant = Object.entries(stat.merchants).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
            
            return {
                ...stat,
                average: stat.total_spend / stat.count,
                top_merchant: topMerchant
            };
        }).sort((a, b) => b.total_spend - a.total_spend);

    }, [transactions, budgets]);

    const totalOverallSpend = useMemo(() => categoryStats.reduce((sum, stat) => sum + stat.total_spend, 0), [categoryStats]);

    const donutData = useMemo(() => {
        return categoryStats.map(stat => ({
            name: stat.category,
            amount: stat.total_spend,
            pct: totalOverallSpend > 0 ? Math.round((stat.total_spend / totalOverallSpend) * 100) : 0
        })).slice(0, 5);
    }, [categoryStats, totalOverallSpend]);

    const getTxnIcon = (txn) => {
        const isCredit = txn.transaction_type === "Credit" || txn.amount > 0;
        if (isCredit) return ArrowDownLeft;
        
        const cat = (txn.category || "").toLowerCase();
        if (cat.includes("shopping") || cat.includes("purchase")) return ShoppingCart;
        if (cat.includes("transfer")) return Wallet;
        return Receipt;
    };

    if (loading) return (
        <div className="space-y-6">
            <header className="mb-6">
                <Skeleton type="card" count={1} style={{ height: '80px' }} />
            </header>
            <Skeleton type="grid" count={2} />
        </div>
    );
    if (error) return <ErrorState message={error} onRetry={fetchData} />;
    if (categoryStats.length === 0) return <EmptyState title="No categories found" message="No expense data available to analyze." icon="📊" />;

    return (
        <div className="space-y-6">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
                <p className="mt-1.5 text-muted-foreground">Understand where your money is going.</p>
            </header>

            {donutData.length > 0 && (
                <div className="mb-6 flex justify-start">
                    <div className="w-full max-w-md">
                        <SpendDonut data={donutData} />
                    </div>
                </div>
            )}

            <Reveal className="h-full">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {categoryStats.map((stat, idx) => {
                        const hasBudget = stat.budget !== null && stat.budget !== undefined;
                        let budgetPct = 0;
                        let statusClass = "bg-[var(--positive)]";
                        let statusTextClass = "text-muted-foreground";
                        let budgetStatusText = "";

                        if (hasBudget) {
                            const budgetLimit = stat.budget.budget || stat.budget.allocated || 1;
                            budgetPct = Math.min((stat.total_spend / budgetLimit) * 100, 100);
                            const remaining = budgetLimit - stat.total_spend;
                            
                            if (remaining < 0) {
                                statusClass = "bg-[var(--negative)]";
                                statusTextClass = "text-[var(--negative)]";
                                budgetStatusText = `Exceeded by ${formatCurrency(Math.abs(remaining))}`;
                            } else if (budgetPct > 80) {
                                statusClass = "bg-[var(--warning)]";
                                statusTextClass = "text-[var(--warning)]";
                                budgetStatusText = `${formatCurrency(remaining)} left`;
                            } else {
                                statusClass = "bg-[var(--positive)]";
                                statusTextClass = "text-[var(--positive)]";
                                budgetStatusText = `${formatCurrency(remaining)} left`;
                            }
                        }

                        const overallPct = totalOverallSpend > 0 ? Math.round((stat.total_spend / totalOverallSpend) * 100) : 0;

                        return (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ delay: idx * 0.05, duration: 0.4 }}
                                onClick={() => setSelectedCategory(stat)}
                                className="group flex w-full flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-card)] transition-colors duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                            >
                                <div className="flex w-full items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--surface-3)] text-xl transition-transform duration-200 group-hover:scale-105 group-hover:bg-[var(--accent-soft)]">
                                            {ICONS[stat.category] || "📊"}
                                        </span>
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground">{stat.category}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">{stat.count} Transactions</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="tabular block text-base font-semibold text-foreground">
                                            {formatCurrency(stat.total_spend)}
                                        </span>
                                        <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">{overallPct}% of total</span>
                                    </div>
                                </div>
                                
                                {hasBudget ? (
                                    <div className="w-full mt-2">
                                        <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                                            <span className="text-muted-foreground">Budget: {formatCurrency(stat.budget.budget || stat.budget.allocated)}</span>
                                            <span className={statusTextClass}>{budgetStatusText}</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${budgetPct}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className={`h-full rounded-full ${statusClass}`} 
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full mt-2 flex h-[26px] items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-[11px] text-muted-foreground transition-colors group-hover:border-[var(--border-strong)]">
                                        No budget set
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </Reveal>

            <AnimatePresence>
                {selectedCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedCategory(null)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xl">
                                        {ICONS[selectedCategory.category] || "📊"}
                                    </span>
                                    <div>
                                        <h2 className="text-lg font-semibold tracking-tight">{selectedCategory.category}</h2>
                                        <p className="text-xs text-muted-foreground">{selectedCategory.transactions.length} transactions</p>
                                    </div>
                                </div>
                                <button 
                                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-[var(--surface-2)] hover:text-foreground"
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                            <div className="overflow-y-auto p-3">
                                {selectedCategory.transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map((t, i) => {
                                    const isCredit = t.transaction_type === "Credit" || t.amount > 0;
                                    const displayMerchant = getDisplayMerchant(t.merchant_name || t.merchant, t.raw_description, t.description);
                                    const Icon = getTxnIcon(t);

                                    return (
                                        <div
                                            key={t.id || i}
                                            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-[var(--surface-2)]"
                                        >
                                            <span
                                                className="flex size-10 shrink-0 items-center justify-center rounded-full"
                                                style={{
                                                    background: isCredit ? "var(--positive-soft)" : "var(--surface-3)",
                                                    color: isCredit ? "var(--positive)" : "var(--muted)",
                                                }}
                                            >
                                                <Icon className="size-[18px]" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-2">
                                                    <span className="truncate text-sm font-medium text-foreground">{displayMerchant}</span>
                                                </span>
                                                <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                        {t.category || "Uncategorized"}
                                                    </span>
                                                    {formatDate(t.date)}
                                                </span>
                                            </span>
                                            <span className="text-right">
                                                <span
                                                    className="tabular block text-sm font-semibold"
                                                    style={{ color: isCredit ? "var(--positive)" : "var(--foreground)" }}
                                                >
                                                    {isCredit ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
                                                </span>
                                                <span className="mt-0.5 block text-xs text-muted-foreground">{t.transaction_type}</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}