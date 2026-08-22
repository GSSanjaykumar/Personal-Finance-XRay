import { useEffect, useState, useCallback, useMemo } from "react";
import BudgetModal from "../components/budget/BudgetModal";
import { getBudget, updateBudget, getBudgetAnalysis } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, formatCategory } from "../utils/formatters";
import { Edit2, Lightbulb, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { KpiCards } from "../components/v0-dashboard/kpi-cards";
import { Reveal } from "../components/v0-ui/surface";
import { motion, AnimatePresence } from "framer-motion";

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

    const summaryKpis = useMemo(() => {
        if (!analysis.length) return [];
        return [
            {
                id: "net-worth",
                label: "Total Budget",
                value: summary.totalBudget,
                prefix: "₹",
                trend: []
            },
            {
                id: "savings-rate",
                label: "Total Spent",
                value: summary.totalSpent,
                prefix: "₹",
                trend: []
            },
            {
                id: "safe-to-spend",
                label: "Remaining",
                value: summary.totalRemaining,
                prefix: "₹", // CountUp inherently formats negative values with - prefix cleanly.
                trend: []
            },
            {
                id: "health-score",
                label: "Budget Utilization",
                value: Math.round(summary.totalPct),
                suffix: "%",
                trend: []
            }
        ];
    }, [analysis, summary]);

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
                    <h1 className="text-3xl font-semibold tracking-tight">Budget</h1>
                    <p className="mt-1.5 text-muted-foreground">Plan your spending and stay on track.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90 outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--background)]"
                >
                    <Edit2 className="size-4" />
                    Edit Budget
                </button>
            </header>

            {analysis.length > 0 && (
                <KpiCards data={summaryKpis} />
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
                <Reveal className="h-full">
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
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ delay: index * 0.05, duration: 0.4 }}
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-colors duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)]"
                                >
                                    <div className="p-5 flex-1 flex flex-col justify-between gap-6">
                                        <div className="flex w-full items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--surface-3)] text-xl transition-transform duration-200 group-hover:scale-105 group-hover:bg-[var(--accent-soft)]">
                                                    {ICONS[item.category] || "💰"}
                                                </span>
                                                <div className="flex flex-col items-start gap-1">
                                                    <h3 className="text-sm font-semibold text-foreground">{formatCategory(item.category)}</h3>
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBg} ${statusText}`}>
                                                        <StatusIcon className="size-3" />
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`tabular block text-base font-semibold ${isExceeded ? 'text-[var(--negative)]' : 'text-foreground'}`}>
                                                    {formatCurrency(item.spent)}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">spent</span>
                                            </div>
                                        </div>

                                        <div className="w-full">
                                            <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                                                <span className="text-muted-foreground">Budget: {formatCurrency(catBudget)}</span>
                                                {isExceeded ? (
                                                    <span className="text-[var(--negative)]">Exceeded by {formatCurrency(Math.abs(item.remaining))}</span>
                                                ) : (
                                                    <span className="text-[var(--positive)]">{formatCurrency(item.remaining)} left</span>
                                                )}
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${pct}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                    className={`h-full rounded-full ${barColor}`} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {budgetInsights.filter(i => i.category === item.category).length > 0 && (
                                        <div className="border-t border-[var(--border)] bg-[var(--surface-2)]/50 p-3 px-5">
                                            {budgetInsights.filter(i => i.category === item.category).map((insight, idx) => (
                                                <p key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                    <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[var(--accent)]" />
                                                    <span className="leading-relaxed">{insight.message}</span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </Reveal>
            )}

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="w-full"
                        >
                            <BudgetModal
                                budget={budget}
                                onSave={saveBudget}
                                onClose={() => setShowModal(false)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}