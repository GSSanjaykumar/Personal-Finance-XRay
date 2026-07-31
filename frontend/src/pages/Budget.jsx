import { useEffect, useState, useCallback, useMemo } from "react";
import Navbar from "../components/layout/Navbar";
import BudgetModal from "../components/budget/BudgetModal";
import { getBudget, updateBudget, getBudgetAnalysis } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, formatCategory } from "../utils/formatters";

const ICONS = {
    "Food & Dining": "🍕",
    "Shopping": "🛍️",
    "Transport": "🚕",
    "Bills": "💡",
    "Others": "📦",
    "Cash Withdrawal": "🏧"
};

export default function Budget() {
    const [analysis, setAnalysis] = useState([]);
    const [budget, setBudget] = useState({});
    const [budgetInsights, setBudgetInsights] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadBudget = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [budgetData, analysisData] = await Promise.all([
                getBudget(),
                getBudgetAnalysis()
            ]);
            setBudget(budgetData || {});
            // BUG FIX: /budget-analysis returns a plain array, not {budget: [], budget_insights: []}
            const analysisArray = Array.isArray(analysisData) ? analysisData : (analysisData?.budget || []);
            setAnalysis(analysisArray);
            // Generate insights from the analysis array directly on client side
            setBudgetInsights(analysisData?.budget_insights || []);
        } catch {
            setError("Failed to load budget data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBudget();
    }, [loadBudget]);

    async function saveBudget(values) {
        try {
            const result = await updateBudget(values);
            setBudget(result.budget);

            // Recalculate analysis
            const newAnalysis = await getBudgetAnalysis();
            const analysisArray = Array.isArray(newAnalysis) ? newAnalysis : (newAnalysis?.budget || []);
            setAnalysis(analysisArray);
            setBudgetInsights(newAnalysis?.budget_insights || []);
            setShowModal(false);
        } catch {
            alert("Failed to save budget.");
        }
    }
    
    // Budget Summary Calculation
    const summary = useMemo(() => {
        let totalBudget = 0;
        let totalSpent = 0;
        let exceededCount = 0;

        analysis.forEach(item => {
            const catBudget = budget[item.category] || item.budget;
            totalBudget += catBudget;
            totalSpent += item.spent;
            if (item.status === "Exceeded") {
                exceededCount += 1;
            }
        });

        const totalRemaining = totalBudget - totalSpent;
        const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        return { totalBudget, totalSpent, totalRemaining, exceededCount, totalPct };
    }, [analysis, budget]);

    if (loading) return (
        <>
            <Navbar />
            <div style={{ marginTop: '24px' }}>
                <Skeleton type="grid" count={2} />
            </div>
        </>
    );
    if (error) return <><Navbar /><ErrorState message={error} onRetry={loadBudget} /></>;

    return (
        <>
            <Navbar />
            
            <div className="page-header">
                <div>
                    <h1>Budget Analyzer</h1>
                    <p className="subtitle">Track your spending against monthly limits.</p>
                </div>
                <button className="edit-budget-btn" onClick={() => setShowModal(true)}>
                    ✏ Edit Budget
                </button>
            </div>

            {analysis.length > 0 && (
                <div className="budget-summary-block">
                    <div className="budget-summary-card">
                        <span>Total Budget</span>
                        <h2>{formatCurrency(summary.totalBudget)}</h2>
                    </div>
                    <div className="budget-summary-card">
                        <span>Total Spent</span>
                        <h2>{formatCurrency(summary.totalSpent)}</h2>
                    </div>
                    <div className="budget-summary-card">
                        <span>Remaining</span>
                        <h2 className={summary.totalRemaining >= 0 ? "amount-credit" : "amount-debit"}>
                            {summary.totalRemaining >= 0 ? formatCurrency(summary.totalRemaining) : `-${formatCurrency(Math.abs(summary.totalRemaining))}`}
                        </h2>
                    </div>
                    <div className="budget-summary-card">
                        <span>Exceeded Categories</span>
                        <h2 className={summary.exceededCount > 0 ? "amount-debit" : "amount-credit"}>
                            {summary.exceededCount}
                        </h2>
                    </div>
                </div>
            )}

            {analysis.length === 0 ? (
                <div style={{ padding: '40px 0' }}>
                    <EmptyState 
                        title="No Budget Established" 
                        message="Take control of your finances by setting category-wise spending limits." 
                        icon="🎯" 
                        actionText="Create Budget"
                        onAction={() => setShowModal(true)}
                    />
                </div>
            ) : (
                <div className="budget-grid">
                    {analysis.map((item, index) => {
                        const isExceeded = item.status === "Exceeded";
                        const isWarning = item.status === "Near Limit";
                        const statusClass = isExceeded ? "danger" : isWarning ? "warning" : "good";
                        const catBudget = budget[item.category] || item.budget;
                        
                        return (
                            <div className="budget-card" key={index} tabIndex="0">
                                <div className="budget-header">
                                    <h3><span aria-hidden="true">{ICONS[item.category] || "💰"}</span> {formatCategory(item.category)}</h3>
                                    <span className={`status-badge status-${statusClass}`}>{item.status}</span>
                                </div>

                                {/* Bug #3 Fix: Replace unreadable badge with readable stat rows */}
                                <div className="budget-stat-rows">
                                    <div className="budget-stat-row">
                                        <span className="bsr-label">Budget</span>
                                        <span className="bsr-value">{formatCurrency(catBudget)}</span>
                                    </div>
                                    <div className="budget-stat-row">
                                        <span className="bsr-label">Spent</span>
                                        <span className={`bsr-value ${isExceeded ? 'amount-debit' : ''}`}>{formatCurrency(item.spent)}</span>
                                    </div>
                                    {isExceeded ? (
                                        <div className="budget-stat-row">
                                            <span className="bsr-label">Exceeded by</span>
                                            <span className="bsr-value amount-debit">{formatCurrency(Math.abs(item.remaining))}</span>
                                        </div>
                                    ) : (
                                        <div className="budget-stat-row">
                                            <span className="bsr-label">Remaining</span>
                                            <span className="bsr-value amount-credit">{formatCurrency(item.remaining)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="budget-progress">
                                    <div
                                        className={`budget-fill ${statusClass}`}
                                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                    />
                                </div>

                                <div className="budget-footer">
                                    <span>{item.percentage.toFixed(1)}% used</span>
                                </div>

                                {budgetInsights
                                    .filter(i => i.category === item.category)
                                    .map((i, idx) => (
                                        <div key={idx} className="budget-tip">
                                            💡 {i.message}
                                        </div>
                                    ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <BudgetModal
                    budget={budget}
                    onSave={saveBudget}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}