import { useState, useEffect, useCallback, useMemo } from "react";
import { getDashboard } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { RefreshCw, Copy, X, AlertCircle, CheckCircle2, Info, Lightbulb } from "lucide-react";
import { KpiCards } from "../components/v0-dashboard/kpi-cards";
import { Reveal } from "../components/v0-ui/surface";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../utils/formatters";

export default function Insights() {
    const [insights, setInsights] = useState([]);
    const [dismissed, setDismissed] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDashboard();
            setInsights(data.insights || []);
            setDismissed(new Set()); 
        } catch {
            setError("Failed to load insights.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activeInsights = useMemo(() => {
        return insights.filter(insight => !dismissed.has(insight.title));
    }, [insights, dismissed]);

    const handleDismiss = (title) => {
        setDismissed(prev => {
            const newSet = new Set(prev);
            newSet.add(title);
            return newSet;
        });
    };

    const handleCopy = (insight) => {
        const text = `${insight.title}: ${insight.description} (${insight.value})`;
        navigator.clipboard.writeText(text);
    };

    const grouped = useMemo(() => {
        const groups = {
            "Action Needed": [],
            "Positive Trends": [],
            "General Observations": []
        };

        activeInsights.forEach(insight => {
            const desc = (insight.description || "").toLowerCase();
            if (desc.includes("exceeded") || desc.includes("risk") || desc.includes("reduce") || desc.includes("over")) {
                groups["Action Needed"].push(insight);
            } else if (desc.includes("excellent") || desc.includes("saved") || desc.includes("good") || desc.includes("under")) {
                groups["Positive Trends"].push(insight);
            } else {
                groups["General Observations"].push(insight);
            }
        });
        
        return groups;
    }, [activeInsights]);

    const summaryKpis = useMemo(() => {
        if (!activeInsights.length) return [];
        return [
            {
                id: "safe-to-spend",
                label: "Active Insights",
                value: activeInsights.length,
                trend: []
            },
            {
                id: "health-score",
                label: "Action Needed",
                value: grouped["Action Needed"].length,
                trend: []
            },
            {
                id: "net-worth",
                label: "Positive Trends",
                value: grouped["Positive Trends"].length,
                trend: []
            }
        ];
    }, [activeInsights, grouped]);

    const renderValue = (val) => {
        if (typeof val === 'number') {
            return `${val < 0 ? "-" : ""}₹${formatCurrency(Math.abs(val))}`;
        }
        return val;
    };

    if (loading) return (
        <div className="space-y-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton type="card" style={{ height: "40px", width: "200px" }} />
                </div>
            </header>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Skeleton type="card" style={{ height: "140px" }} />
                <Skeleton type="card" style={{ height: "140px" }} />
                <Skeleton type="card" style={{ height: "140px" }} />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Skeleton type="card" style={{ height: "200px" }} />
                <Skeleton type="card" style={{ height: "200px" }} />
                <Skeleton type="card" style={{ height: "200px" }} />
            </div>
        </div>
    );

    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Insights</h1>
                    <p className="mt-1.5 text-muted-foreground">Understand your financial patterns and take smarter actions.</p>
                </div>
                <button 
                    onClick={fetchData}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90 outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--background)]"
                >
                    <RefreshCw className="size-4" />
                    Refresh
                </button>
            </header>

            {summaryKpis.length > 0 && (
                <KpiCards data={summaryKpis} />
            )}

            {activeInsights.length === 0 ? (
                <Reveal>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card)]">
                        <EmptyState 
                            title="No active insights" 
                            message="You have dismissed all current insights or none were generated." 
                            icon="🧠" 
                        />
                    </div>
                </Reveal>
            ) : (
                <div className="space-y-10">
                    {Object.entries(grouped).map(([groupName, groupInsights]) => {
                        if (groupInsights.length === 0) return null;
                        
                        let GroupIcon = Info;
                        let groupColor = "text-[var(--accent)]";
                        let softBg = "bg-[var(--accent-soft)]";
                        let borderStyle = "border-[var(--accent)]/30";
                        
                        if (groupName === "Action Needed") {
                            GroupIcon = AlertCircle;
                            groupColor = "text-[var(--negative)]";
                            softBg = "bg-[var(--negative-soft)]";
                            borderStyle = "border-[var(--negative)]/30";
                        } else if (groupName === "Positive Trends") {
                            GroupIcon = CheckCircle2;
                            groupColor = "text-[var(--positive)]";
                            softBg = "bg-[var(--positive-soft)]";
                            borderStyle = "border-[var(--positive)]/30";
                        }
                        
                        return (
                            <Reveal key={groupName}>
                                <section className="space-y-5">
                                    <div className="flex items-center gap-3 border-b border-[var(--border)] pb-3">
                                        <div className={`flex size-8 items-center justify-center rounded-lg ${softBg} ${groupColor}`}>
                                            <GroupIcon className="size-4" />
                                        </div>
                                        <h3 className="text-xl font-semibold tracking-tight">{groupName}</h3>
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${softBg} ${groupColor}`}>
                                            {groupInsights.length}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                        <AnimatePresence mode="popLayout">
                                            {groupInsights.map((insight, index) => (
                                                <motion.div 
                                                    key={insight.title}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                                    className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-colors duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)]"
                                                >
                                                    <div className="p-6 flex-1 flex flex-col">
                                                        <div className="mb-4 flex items-start justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className={`flex size-10 items-center justify-center rounded-xl bg-[var(--surface-3)] text-xl transition-transform duration-200 group-hover:scale-105 group-hover:${softBg}`}>
                                                                    {insight.icon || "💡"}
                                                                </span>
                                                            </div>
                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${borderStyle} ${softBg} ${groupColor}`}>
                                                                {groupName === "Action Needed" ? "High Priority" : groupName === "Positive Trends" ? "Success" : "Observation"}
                                                            </span>
                                                        </div>
                                                        
                                                        <h4 className="mb-2 font-semibold text-foreground text-lg leading-tight">{insight.title}</h4>
                                                        {insight.value && (
                                                            <div className={`mb-3 text-2xl font-bold tracking-tight tabular-nums ${groupColor}`}>
                                                                {renderValue(insight.value)}
                                                            </div>
                                                        )}
                                                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                                                            {insight.description}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 border-t border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
                                                        <button 
                                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-2 text-xs font-medium text-foreground border border-[var(--border)] transition-colors hover:bg-[var(--surface-3)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                                                            onClick={() => handleCopy(insight)}
                                                        >
                                                            <Copy className="size-3.5" />
                                                            Copy
                                                        </button>
                                                        <button 
                                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-2 text-xs font-medium text-foreground border border-[var(--border)] transition-colors hover:bg-[var(--negative-soft)] hover:text-[var(--negative)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--negative)]"
                                                            onClick={() => handleDismiss(insight.title)}
                                                        >
                                                            <X className="size-3.5" />
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </section>
                            </Reveal>
                        );
                    })}
                </div>
            )}
        </div>
    );
}