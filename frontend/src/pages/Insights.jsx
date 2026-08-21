import { useState, useEffect, useCallback, useMemo } from "react";
import { getDashboard } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { RefreshCw, Copy, X, AlertCircle, CheckCircle2, Info } from "lucide-react";

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
            // reset dismissals on refresh
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

    // Group insights
    const grouped = useMemo(() => {
        const groups = {
            "Action Needed": [],
            "Positive Trends": [],
            "General Observations": []
        };

        activeInsights.forEach(insight => {
            if (insight.description.toLowerCase().includes("exceeded") || insight.description.toLowerCase().includes("risk") || insight.description.toLowerCase().includes("reduce")) {
                groups["Action Needed"].push(insight);
            } else if (insight.description.toLowerCase().includes("excellent") || insight.description.toLowerCase().includes("saved") || insight.description.toLowerCase().includes("good")) {
                groups["Positive Trends"].push(insight);
            } else {
                groups["General Observations"].push(insight);
            }
        });
        
        return groups;
    }, [activeInsights]);

    if (loading) return (
        <div className="space-y-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton type="card" style={{ height: "40px", width: "200px" }} />
                </div>
            </header>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Skeleton type="card" style={{ height: "200px" }} />
                <Skeleton type="card" style={{ height: "200px" }} />
            </div>
        </div>
    );
    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    return (
        <div className="space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">AI Insights</h1>
                    <p className="mt-1.5 text-muted-foreground">Smart recommendations based on your spending behavior.</p>
                </div>
                <button 
                    onClick={fetchData}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90"
                >
                    <RefreshCw className="size-4" />
                    Refresh Insights
                </button>
            </header>

            {activeInsights.length === 0 ? (
                <EmptyState title="No active insights" message="You have dismissed all current insights or none were generated." icon="🧠" />
            ) : (
                <div className="space-y-10 pb-10">
                    {Object.entries(grouped).map(([groupName, groupInsights]) => {
                        if (groupInsights.length === 0) return null;
                        
                        let GroupIcon = Info;
                        let groupColor = "text-[var(--accent)]";
                        if (groupName === "Action Needed") {
                            GroupIcon = AlertCircle;
                            groupColor = "text-[var(--negative)]";
                        } else if (groupName === "Positive Trends") {
                            GroupIcon = CheckCircle2;
                            groupColor = "text-[var(--positive)]";
                        }
                        
                        return (
                            <section key={groupName} className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
                                    <GroupIcon className={`size-5 ${groupColor}`} />
                                    <h3 className="text-lg font-semibold tracking-tight">{groupName}</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {groupInsights.map((insight, index) => (
                                        <div 
                                            key={index} 
                                            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)]"
                                        >
                                            <div className="p-5 flex-1">
                                                <div className="mb-3 flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--surface-2)] text-lg">
                                                            {insight.icon}
                                                        </span>
                                                        <h4 className="font-semibold text-foreground">{insight.title}</h4>
                                                    </div>
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                        groupName === "Action Needed" 
                                                            ? "bg-[var(--negative-soft)] text-[var(--negative)]" 
                                                            : groupName === "Positive Trends" 
                                                                ? "bg-[var(--positive-soft)] text-[var(--positive)]" 
                                                                : "bg-[var(--surface-3)] text-muted-foreground"
                                                    }`}>
                                                        {groupName === "Action Needed" ? "High Priority" : "Observation"}
                                                    </span>
                                                </div>
                                                
                                                <div className="mb-2 text-2xl font-bold tracking-tight text-foreground">{insight.value}</div>
                                                <p className="text-sm text-muted-foreground">{insight.description}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
                                                <button 
                                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-foreground border border-[var(--border)] transition-colors hover:bg-[var(--surface-3)]"
                                                    onClick={() => handleCopy(insight)}
                                                >
                                                    <Copy className="size-3.5" />
                                                    Copy
                                                </button>
                                                <button 
                                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-foreground border border-[var(--border)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--negative)]"
                                                    onClick={() => handleDismiss(insight.title)}
                                                >
                                                    <X className="size-3.5" />
                                                    Dismiss
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}