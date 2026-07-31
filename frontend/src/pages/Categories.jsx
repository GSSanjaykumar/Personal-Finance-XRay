import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../components/layout/Navbar";
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
            <Navbar />
            <div style={{ marginTop: '24px' }}>
                <Skeleton type="grid" count={2} />
            </div>
        </>
    );
    if (error) return <><Navbar /><ErrorState message={error} onRetry={fetchData} /></>;
    if (categoryStats.length === 0) return <><Navbar /><EmptyState title="No categories found" message="No expense data available to analyze." /></>;

    return (
        <>
            <Navbar />
            
            <div className="page-header">
                <div>
                    <h1>Categories</h1>
                    <p className="subtitle">Detailed breakdown of your spending by category.</p>
                </div>
            </div>

            <div className="categories-grid">
                {categoryStats.map((stat, idx) => {
                    const hasBudget = stat.budget !== null;
                    const pct = hasBudget ? Math.min(stat.budget.percentage, 100) : 0;
                    const statusClass = hasBudget ? (stat.budget.status === "Exceeded" ? "danger" : stat.budget.status === "Near Limit" ? "warning" : "good") : "good";

                    return (
                        <div key={idx} className="category-detail-card" onClick={() => setSelectedCategory(stat)}>
                            <div className="cat-card-header">
                                <div className="cat-card-title">
                                    <span className="cat-icon" aria-hidden="true">{ICONS[stat.category] || "📊"}</span>
                                    <h3>{stat.category}</h3>
                                </div>
                                <span className="cat-card-amount">{formatCurrency(stat.total_spend)}</span>
                            </div>
                            
                            <div className="cat-card-stats">
                                <div className="cat-stat">
                                    <span>Transactions</span>
                                    <strong>{stat.count}</strong>
                                </div>
                                <div className="cat-stat">
                                    <span>Avg. Spend</span>
                                    <strong>{formatCurrency(Math.round(stat.average))}</strong>
                                </div>
                                <div className="cat-stat">
                                    <span>Top Merchant</span>
                                    <strong>{stat.top_merchant}</strong>
                                </div>
                            </div>

                            {hasBudget ? (
                                <div className="cat-card-budget">
                                    <div className="cat-budget-labels">
                                        <span>Budget: {formatCurrency(stat.budget.budget)}</span>
                                        <span className={statusClass}>
                                            {stat.budget.remaining >= 0 ? `${formatCurrency(stat.budget.remaining)} left` : `Exceeded by ${formatCurrency(Math.abs(stat.budget.remaining))}`}
                                        </span>
                                    </div>
                                    <div className="budget-progress">
                                        <div className={`budget-fill ${statusClass}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <div className="cat-card-no-budget">
                                    <span>No budget set for this category</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedCategory && (
                <div className="modal-overlay" onClick={() => setSelectedCategory(null)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{ICONS[selectedCategory.category] || "📊"} {selectedCategory.category} Transactions</h2>
                            <button className="close-btn" onClick={() => setSelectedCategory(null)}>✖</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <TransactionTable 
                                transactions={selectedCategory.transactions.sort((a,b) => new Date(b.date) - new Date(a.date))} 
                                title={null} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}