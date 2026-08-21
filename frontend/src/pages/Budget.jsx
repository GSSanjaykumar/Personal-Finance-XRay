import { useEffect, useState, useCallback, useMemo } from "react";
import BudgetModal from "../components/budget/BudgetModal";
import { getBudget, updateBudget, getBudgetAnalysis } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, formatCategory } from "../utils/formatters";
import { Edit2, Lightbulb, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

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
            const analysisArray = Array.isArray(analysisData) ? analysisData : (analysisData?.budget || []);
            setAnalysis(analysisArray);
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

            const newAnalysis = await getBudgetAnalysis();
            const analysisArray = Array.isArray(newAnalysis) ? newAnalysis : (newAnalysis?.budget || []);
            setAnalysis(analysisArray);
            setBudgetInsights(newAnalysis?.budget_insights || []);
            setShowModal(false);
        } catch {
            alert("Failed to save budget.");
        }
    }
    
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
        <div className="space-y-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton type="card" style={{ height: "40px", width: "200px" }} />
            </header>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Skeleton type="card" style={{ height: "100px" }} />
                <Skeleton type="card" style={{ height: "100px" }} />
                <Skeleton type="card" style={{ height: "100px" }} />
                <Skeleton type="card" style={{ height: "100px" }} />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                <Skeleton type="card" style={{ height: "250px" }} />
                <Skeleton type="card" style={{ height: "250px" }} />
            </div>
        </div>
    );
    if (error) return <ErrorState message={error} onRetry={loadBudget} />;

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Budget Analyzer</h1>
                    <p className="mt-1.5 text-muted-foreground">Track your spending against monthly limits.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--surface-3)] px-4 text-sm font-medium text-foreground transition-colors hover:bg-[var(--surface-2)] border border-[var(--border)]"
                >
                    <Edit2 className="size-4" />
                    Edit Budget
                </button>
            </header>

            {analysis.length > 0 && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
                        <span className="text-sm font-medium text-muted-foreground">Total Budget</span>
                        <h2 className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground">{formatCurrency(summary.totalBudget)}</h2>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
                        <span className="text-sm font-medium text-muted-foreground">Total Spent</span>
                        <h2 className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground">{formatCurrency(summary.totalSpent)}</h2>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
                        <span className="text-sm font-medium text-muted-foreground">Remaining</span>
                        <h2 className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${summary.totalRemaining >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                            {summary.totalRemaining >= 0 ? formatCurrency(summary.totalRemaining) : `-${formatCurrency(Math.abs(summary.totalRemaining))}`}
                        </h2>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
                        <span className="text-sm font-medium text-muted-foreground">Exceeded Categories</span>
                        <h2 className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${summary.exceededCount > 0 ? "text-[var(--negative)]" : "text-[var(--positive)]"}`}>
                            {summary.exceededCount}
                        </h2>
                    </div>
                </div>
            )}

            {analysis.length === 0 ? (
                <EmptyState 
                    title="No Budget Established" 
                    message="Take control of your finances by setting category-wise spending limits." 
                    icon="🎯" 
                    actionText="Create Budget"
                    onAction={() => setShowModal(true)}
                />
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {analysis.map((item, index) => {
                        const isExceeded = item.status === "Exceeded";
                        const isWarning = item.status === "Near Limit";
                        const catBudget = budget[item.category] || item.budget;
                        const pct = Math.min(item.percentage, 100);
                        
                        let StatusIcon = CheckCircle2;
                        let statusBg = "bg-[var(--positive-soft)]";
                        let statusText = "text-[var(--positive)]";
                        let barColor = "bg-[var(--positive)]";
                        
                        if (isExceeded) {
                            StatusIcon = XCircle;
                            statusBg = "bg-[var(--negative-soft)]";
                            statusText = "text-[var(--negative)]";
                            barColor = "bg-[var(--negative)]";
                        } else if (isWarning) {
                            StatusIcon = AlertTriangle;
                            statusBg = "bg-[var(--warning-soft)]";
                            statusText = "text-[var(--warning)]";
                            barColor = "bg-[var(--warning)]";
                        }
                        
                        return (
                            <div key={index} className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)]">
                                <div className="p-5 flex-1">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{ICONS[item.category] || "💰"}</span>
                                            <h3 className="font-semibold text-foreground">{formatCategory(item.category)}</h3>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBg} ${statusText}`}>
                                            <StatusIcon className="size-3" />
                                            {item.status}
                                        </span>
                                    </div>

                                    <div className="mb-5 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Budget</span>
                                            <span className="font-medium text-foreground">{formatCurrency(catBudget)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Spent</span>
                                            <span className={`font-medium ${isExceeded ? 'text-[var(--negative)]' : 'text-foreground'}`}>{formatCurrency(item.spent)}</span>
                                        </div>
                                        {isExceeded ? (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[var(--negative)] font-medium">Exceeded by</span>
                                                <span className="font-medium text-[var(--negative)]">{formatCurrency(Math.abs(item.remaining))}</span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Remaining</span>
                                                <span className="font-medium text-[var(--positive)]">{formatCurrency(item.remaining)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-1.5 flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{item.percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                            style={{ width: `${pct}%` }} 
                                        />
                                    </div>
                                </div>
                                
                                {budgetInsights.filter(i => i.category === item.category).length > 0 && (
                                    <div className="border-t border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
                                        {budgetInsights.filter(i => i.category === item.category).map((insight, idx) => (
                                            <p key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[var(--accent)]" />
                                                <span className="leading-relaxed">{insight.message}</span>
                                            </p>
                                        ))}
                                    </div>
                                )}
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
        </div>
    );
}