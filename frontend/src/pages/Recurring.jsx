import { useEffect, useState, useCallback, useMemo } from "react";
import { getDashboard } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency, getDisplayMerchant, formatFrequency } from "../utils/formatters";
import { Repeat, Search, SlidersHorizontal } from "lucide-react";
import { Reveal } from "../components/v0-ui/surface";
import { motion } from "framer-motion";
import { KpiCards } from "../components/v0-dashboard/kpi-cards";

const FREQUENCY_ICONS = {
    daily: "📅", weekly: "🗓️", biweekly: "📆", monthly: "🔄", quarterly: "📊", yearly: "🎯", irregular: "❓",
};

export default function Recurring() {
    const [recurring, setRecurring] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const summaryKpis = useMemo(() => {
        if (!recurring.length) return [];
        const totalMonthly = recurring
            .filter(r => r.frequency === "monthly")
            .reduce((sum, r) => sum + r.average_amount, 0);
        return [
            { id: "net-worth", label: "Total Detected", value: recurring.length, trend: [] },
            { id: "savings-rate", label: "Filtered Results", value: filteredRecurring.length, trend: [] },
            { id: "safe-to-spend", label: "Monthly Recurring", value: totalMonthly, prefix: "₹", trend: [] },
        ];
    }, [recurring, filteredRecurring]);

    if (loading) return (
        <div className="space-y-6">
            <header className="mb-6">
                <Skeleton type="card" style={{ height: "40px", width: "200px" }} />
            </header>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Skeleton type="card" style={{ height: "100px" }} />
                <Skeleton type="card" style={{ height: "100px" }} />
                <Skeleton type="card" style={{ height: "100px" }} />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                <Skeleton type="card" style={{ height: "220px" }} />
                <Skeleton type="card" style={{ height: "220px" }} />
                <Skeleton type="card" style={{ height: "220px" }} />
            </div>
        </div>
    );

    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Recurring Payments</h1>
                    <p className="mt-1.5 text-muted-foreground">
                        {recurring.length > 0
                            ? `${recurring.length} detected recurring payment${recurring.length !== 1 ? "s" : ""}`
                            : "No recurring payments detected yet"}
                    </p>
                </div>
            </header>

            {summaryKpis.length > 0 && <KpiCards data={summaryKpis} />}

            <Reveal>
                <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:flex-wrap">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search merchant..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                        />
                    </div>
                    <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground hidden sm:block" />
                    <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="min-w-[150px] rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 px-3 text-sm font-medium text-foreground outline-none focus:border-[var(--accent)]"
                    >
                        {frequencies.map((freq) => (
                            <option key={freq} value={freq}>{freq === "All" ? "All Frequencies" : freq}</option>
                        ))}
                    </select>
                    <select
                        value={minConfidence}
                        onChange={(e) => setMinConfidence(Number(e.target.value))}
                        className="min-w-[150px] rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 px-3 text-sm font-medium text-foreground outline-none focus:border-[var(--accent)]"
                    >
                        <option value={0}>All Confidence</option>
                        <option value={50}>50%+ Confidence</option>
                        <option value={75}>75%+ Confidence</option>
                        <option value={90}>90%+ Confidence</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="min-w-[160px] rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 px-3 text-sm font-medium text-foreground outline-none focus:border-[var(--accent)]"
                    >
                        <option value="Highest Confidence">Highest Confidence</option>
                        <option value="Highest Amount">Highest Amount</option>
                        <option value="Upcoming">Upcoming Soon</option>
                    </select>
                </div>
            </Reveal>

            {filteredRecurring.length === 0 ? (
                <Reveal>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card)]">
                        <EmptyState 
                            title={recurring.length === 0 ? "No recurring payments detected" : "No matches found"} 
                            message={recurring.length === 0 ? "At least 3 transactions from the same merchant are needed." : "Try adjusting your filters or search terms."} 
                            icon="🔄" 
                        />
                    </div>
                </Reveal>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredRecurring.map((item, index) => {
                        const confidencePct = Math.round(item.confidence * 100);
                        const icon = FREQUENCY_ICONS[item.frequency] || "🔄";

                        let confColor = "text-[var(--positive)]";
                        let confBg = "bg-[var(--positive-soft)]";
                        let barColor = "bg-[var(--positive)]";
                        if (confidencePct < 75) {
                            confColor = "text-[var(--warning)]";
                            confBg = "bg-[var(--warning-soft)]";
                            barColor = "bg-[var(--warning)]";
                        }
                        if (confidencePct < 50) {
                            confColor = "text-[var(--negative)]";
                            confBg = "bg-[var(--negative-soft)]";
                            barColor = "bg-[var(--negative)]";
                        }

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ delay: index * 0.04, duration: 0.4 }}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lift)]"
                            >
                                <div className="p-5 flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--surface-3)] text-lg transition-transform duration-200 group-hover:scale-105">
                                                {item.merchant.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground leading-tight">{getDisplayMerchant(item.merchant)}</h3>
                                                <p className="text-xs font-medium text-muted-foreground mt-0.5">{item.category}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${confBg} ${confColor}`}>
                                            {confidencePct}%
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-0.5 rounded-xl bg-[var(--surface-2)] p-3">
                                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Avg. Amount</span>
                                            <span className="text-base font-bold tabular-nums text-foreground">{formatCurrency(item.average_amount)}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 rounded-xl bg-[var(--surface-2)] p-3">
                                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Frequency</span>
                                            <span className="text-base font-bold text-foreground">{icon} {formatFrequency(item.frequency)}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 rounded-xl bg-[var(--surface-2)] p-3">
                                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Occurrences</span>
                                            <span className="text-base font-bold tabular-nums text-foreground">{item.count}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 rounded-xl bg-[var(--surface-2)] p-3">
                                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Next Expected</span>
                                            <span className="text-sm font-bold text-foreground">{item.next_expected || "Unknown"}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                                            <span className="text-muted-foreground">Confidence</span>
                                            <span className={confColor}>{confidencePct}%</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${confidencePct}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className={`h-full rounded-full ${barColor}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-2)]/50 px-5 py-2.5">
                                    <span className="text-xs text-muted-foreground">First: {item.first_seen}</span>
                                    <span className="text-xs text-muted-foreground">Last: {item.last_seen}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
