import { useState, useEffect, useCallback, useMemo } from "react";
import { getDashboard, getTransactions } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import TransactionTable from "../components/ui/TransactionTable";
import { formatCurrency, getDisplayMerchant, formatCategory } from "../utils/formatters";

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
            setBudgets(dashboardData.budget || []);
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
        
        // Map budgets for quick lookup
        const budgetMap = {};
        budgets.forEach(b => {
            budgetMap[b.category] = b;
        });

        transactions.forEach(txn => {
            const rawCat = formatCategory(txn.category);
            const cat = rawCat;
            // Only aggregate expenses for category cards
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
            statsMap[cat].total_spend += txn.amount;
            statsMap[cat].count += 1;
            statsMap[cat].transactions.push(txn);
            
            const merchant = getDisplayMerchant(txn.merchant_name || txn.merchant, txn.raw_description, txn.description);
            statsMap[cat].merchants[merchant] = (statsMap[cat].merchants[merchant] || 0) + txn.amount;
        });

        return Object.values(statsMap).map(stat => {
            // Find top merchant
            const topMerchant = Object.entries(stat.merchants).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
            
            return {
                ...stat,
                average: stat.total_spend / stat.count,
                top_merchant: topMerchant
            };
        }).sort((a, b) => b.total_spend - a.total_spend);

    }, [transactions, budgets]);

    if (loading) return (
        <>
                        <div style={{ marginTop: '24px' }}>
                <Skeleton type="grid" count={2} />
            </div>
        </>
    );
    if (error) return <><ErrorState message={error} onRetry={fetchData} /></>;
    if (categoryStats.length === 0) return <><EmptyState title="No categories found" message="No expense data available to analyze." /></>;

    return (
        <div className="space-y-6">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
                <p className="mt-1.5 text-muted-foreground">Detailed breakdown of your spending by category.</p>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {categoryStats.map((stat, idx) => {
                    const hasBudget = stat.budget !== null;
                    const pct = hasBudget ? Math.min(stat.budget.percentage, 100) : 0;
                    const statusClass = hasBudget ? (stat.budget.status === "Exceeded" ? "bg-[var(--negative)]" : stat.budget.status === "Near Limit" ? "bg-[var(--warning)]" : "bg-[var(--positive)]") : "bg-[var(--positive)]";
                    const statusTextClass = hasBudget ? (stat.budget.status === "Exceeded" ? "text-[var(--negative)]" : stat.budget.status === "Near Limit" ? "text-[var(--warning)]" : "text-[var(--positive)]") : "text-muted-foreground";

                    return (
                        <div 
                            key={idx} 
                            className="group cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
                            onClick={() => setSelectedCategory(stat)}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xl">
                                        <span aria-hidden="true">{ICONS[stat.category] || "📊"}</span>
                                    </div>
                                    <h3 className="text-lg font-semibold">{stat.category}</h3>
                                </div>
                                <span className="text-xl font-semibold tracking-tight">{formatCurrency(stat.total_spend)}</span>
                            </div>
                            
                            <div className="mb-5 grid grid-cols-3 gap-4 rounded-xl bg-[var(--surface-2)] p-4 group-hover:bg-[var(--surface)] transition-colors">
                                <div>
                                    <span className="block text-xs font-medium text-muted-foreground">Transactions</span>
                                    <strong className="mt-1 block font-semibold">{stat.count}</strong>
                                </div>
                                <div>
                                    <span className="block text-xs font-medium text-muted-foreground">Avg. Spend</span>
                                    <strong className="mt-1 block font-semibold">{formatCurrency(Math.round(stat.average))}</strong>
                                </div>
                                <div>
                                    <span className="block text-xs font-medium text-muted-foreground">Top Merchant</span>
                                    <strong className="mt-1 block truncate font-semibold">{stat.top_merchant}</strong>
                                </div>
                            </div>

                            {hasBudget ? (
                                <div>
                                    <div className="mb-2 flex justify-between text-sm">
                                        <span className="font-medium text-muted-foreground">Budget: {formatCurrency(stat.budget.budget)}</span>
                                        <span className={`font-semibold ${statusTextClass}`}>
                                            {stat.budget.remaining >= 0 ? `${formatCurrency(stat.budget.remaining)} left` : `Exceeded by ${formatCurrency(Math.abs(stat.budget.remaining))}`}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                                        <div className={`h-full rounded-full transition-all duration-500 ${statusClass}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center rounded-lg border border-dashed border-[var(--border)] p-3 text-sm text-muted-foreground">
                                    No budget set for this category
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedCategory && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedCategory(null)}
                >
                    <div 
                        className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
                            <h2 className="text-xl font-semibold tracking-tight">
                                {ICONS[selectedCategory.category] || "📊"} {selectedCategory.category} Transactions
                            </h2>
                            <button 
                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-[var(--surface-2)] hover:text-foreground"
                                onClick={() => setSelectedCategory(null)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6">
                            <TransactionTable 
                                transactions={selectedCategory.transactions.sort((a,b) => new Date(b.date) - new Date(a.date))} 
                                title={null} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}