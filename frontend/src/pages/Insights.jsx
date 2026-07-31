import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../components/layout/Navbar";
import { getDashboard } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";

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
        // Optional: show a small toast here if desired
    };

    // Group insights
    const grouped = useMemo(() => {
        const groups = {
            "Action Needed": [],
            "Positive Trends": [],
            "General Observations": []
        };

        activeInsights.forEach(insight => {
            // Very simple grouping heuristic based on icon or description
            if (insight.description.toLowerCase().includes("exceeded") || insight.description.toLowerCase().includes("risk")) {
                groups["Action Needed"].push(insight);
            } else if (insight.description.toLowerCase().includes("excellent") || insight.description.toLowerCase().includes("saved")) {
                groups["Positive Trends"].push(insight);
            } else {
                groups["General Observations"].push(insight);
            }
        });
        
        return groups;
    }, [activeInsights]);

    if (loading) return (
        <>
            <Navbar />
            <div style={{ marginTop: '24px' }}>
                <Skeleton type="grid" count={2} />
            </div>
        </>
    );
    if (error) return <><Navbar /><ErrorState message={error} onRetry={fetchData} /></>;

    return (
        <>
            <Navbar />
            
            <div className="page-header">
                <div>
                    <h1>AI Insights</h1>
                    <p className="subtitle">Smart recommendations based on your spending behavior.</p>
                </div>
                <button className="edit-budget-btn" onClick={fetchData}>
                    🔄 Refresh
                </button>
            </div>

            {activeInsights.length === 0 ? (
                <EmptyState title="No active insights" message="You have dismissed all current insights or none were generated." icon="🧠" />
            ) : (
                <div className="insights-container" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', paddingBottom: '40px' }}>
                    {Object.entries(grouped).map(([groupName, groupInsights]) => {
                        if (groupInsights.length === 0) return null;
                        
                        return (
                            <div key={groupName} className="insight-group">
                                <h3 className="insight-group-title" style={{ marginBottom: '16px', fontSize: '20px', color: '#E5E7EB', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                                    {groupName}
                                </h3>
                                <div className="insights-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                                    {groupInsights.map((insight, index) => (
                                        <div key={index} className="insight-card-full" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <div className="insight-card-header">
                                                <div className="insight-title-wrap">
                                                    <span className="insight-icon">{insight.icon}</span>
                                                    <h4>{insight.title}</h4>
                                                </div>
                                                <span className={`insight-severity ${groupName === "Action Needed" ? "danger" : groupName === "Positive Trends" ? "good" : "neutral"}`}>
                                                    {groupName === "Action Needed" ? "High Priority" : "Observation"}
                                                </span>
                                            </div>
                                            
                                            <div className="insight-value">{insight.value}</div>
                                            <p className="insight-desc" style={{ flexGrow: 1 }}>{insight.description}</p>
                                            
                                            <div className="insight-actions" style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                                <button className="insight-action-btn" onClick={() => handleCopy(insight)}>
                                                    📋 Copy
                                                </button>
                                                <button className="insight-action-btn" onClick={() => handleDismiss(insight.title)}>
                                                    ✖ Dismiss
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}