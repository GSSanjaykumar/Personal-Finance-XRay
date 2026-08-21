import { useEffect, useState, useCallback, useMemo } from "react";
import { getDashboard } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, getDisplayMerchant, formatFrequency } from "../utils/formatters";

const FREQUENCY_ICONS = {
    daily: "📅", weekly: "🗓️", biweekly: "📆", monthly: "🔄", quarterly: "📊", yearly: "🎯", irregular: "❓",
};

export default function Recurring() {
    const [recurring, setRecurring] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters & Sorting
    const [search, setSearch] = useState("");
    const [frequency, setFrequency] = useState("All");
    const [minConfidence, setMinConfidence] = useState(0);
    const [sortBy, setSortBy] = useState("Highest Confidence");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDashboard();
            setRecurring(data.recurring || []);
        } catch {
            setError("Unable to load recurring payments.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const frequencies = useMemo(() => {
        return ["All", ...new Set(recurring.map((r) => r.frequency))];
    }, [recurring]);

    const filteredRecurring = useMemo(() => {
        return recurring
            .filter((item) => {
                const matchesSearch = item.merchant.toLowerCase().includes(search.toLowerCase());
                const matchesFreq = frequency === "All" || item.frequency === frequency;
                const matchesConf = (item.confidence * 100) >= minConfidence;
                return matchesSearch && matchesFreq && matchesConf;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case "Highest Amount":
                        return b.average_amount - a.average_amount;
                    case "Upcoming":
                        if (!a.next_expected) return 1;
                        if (!b.next_expected) return -1;
                        return new Date(a.next_expected) - new Date(b.next_expected);
                    case "Highest Confidence":
                    default:
                        return b.confidence - a.confidence;
                }
            });
    }, [recurring, search, frequency, minConfidence, sortBy]);

    if (loading) return (
        <>
                        <div style={{ marginTop: '24px' }}>
                <Skeleton type="grid" count={1} style={{ marginBottom: '32px' }} />
                <Skeleton type="table" count={1} />
            </div>
        </>
    );
    if (error) return <><ErrorState message={error} onRetry={fetchData} /></>;

    return (
        <>
            
            <div className="page-header" id="recurring-page-header">
                <div>
                    <h1>Recurring Payments</h1>
                    <p className="subtitle">
                        {recurring.length > 0 ? `${recurring.length} detected recurring payment${recurring.length !== 1 ? "s" : ""}` : "No recurring payments detected yet"}
                    </p>
                </div>
                
                <div className="filters">
                    <input
                        className="search-box"
                        type="text"
                        placeholder="Search merchant..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="filter-select">
                        {frequencies.map((freq) => (
                            <option key={freq} value={freq}>{freq === "All" ? "All Frequencies" : freq}</option>
                        ))}
                    </select>
                    <select value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} className="filter-select">
                        <option value={0}>All Confidence</option>
                        <option value={50}>50%+ Confidence</option>
                        <option value={75}>75%+ Confidence</option>
                        <option value={90}>90%+ Confidence</option>
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                        <option value="Highest Confidence">Highest Confidence</option>
                        <option value="Highest Amount">Highest Amount</option>
                        <option value="Upcoming">Upcoming Soon</option>
                    </select>
                </div>
            </div>

            {filteredRecurring.length === 0 ? (
                <EmptyState 
                    title={recurring.length === 0 ? "No recurring payments detected" : "No matches found"} 
                    message={recurring.length === 0 ? "At least 3 transactions from the same merchant are needed." : "Try adjusting your filters or search terms."} 
                    icon="🔄" 
                />
            ) : (
                <div className="recurring-full-grid">
                    {filteredRecurring.map((item, index) => {
                        const confidencePct = Math.round(item.confidence * 100);
                        const icon = FREQUENCY_ICONS[item.frequency] || "🔄";
                        const confColor = confidencePct >= 75 ? "#22C55E" : confidencePct >= 50 ? "#EAB308" : "#EF4444";
                        const confBg = confidencePct >= 75 ? "rgba(34,197,94,.12)" : confidencePct >= 50 ? "rgba(234,179,8,.12)" : "rgba(239,68,68,.12)";

                        return (
                            <div className="recurring-card recurring-card-full" key={index} tabIndex={0}>
                                <div className="recurring-card-top">
                                    <div className="merchant-avatar">{item.merchant.charAt(0)}</div>
                                    <div className="recurring-merchant-info">
                                        <div className="merchant-name">{getDisplayMerchant(item.merchant)}</div>
                                        <div className="merchant-sub">{item.category}</div>
                                    </div>
                                    <span className="confidence-pill" style={{ color: confColor, background: confBg }}>
                                        {confidencePct}% confidence
                                    </span>
                                </div>

                                <div className="recurring-card-body">
                                    <div className="recurring-stat">
                                        <span>Avg. Amount</span>
                                        <strong>{formatCurrency(item.average_amount)}</strong>
                                    </div>
                                    <div className="recurring-stat">
                                        <span>Frequency</span>
                                        <strong>{icon} {formatFrequency(item.frequency)}</strong>
                                    </div>
                                    <div className="recurring-stat">
                                        <span>Occurrences</span>
                                        <strong>{item.count}</strong>
                                    </div>
                                    <div className="recurring-stat">
                                        <span>First Seen</span>
                                        <strong>{item.first_seen}</strong>
                                    </div>
                                    <div className="recurring-stat">
                                        <span>Last Seen</span>
                                        <strong>{item.last_seen}</strong>
                                    </div>
                                    <div className="recurring-stat">
                                        <span>Next Expected</span>
                                        <strong>{item.next_expected || "Unknown"}</strong>
                                    </div>
                                </div>

                                <div className="recurring-confidence-bar">
                                    <div className="recurring-confidence-fill" style={{ width: `${confidencePct}%`, background: confColor }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
