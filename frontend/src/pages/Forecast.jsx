import { useEffect, useState, useCallback, useMemo } from "react";
import { getForecast } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency } from "../utils/formatters";
import { AlertCircle, CheckCircle2, CalendarDays } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { KpiCards } from "../components/v0-dashboard/kpi-cards";
import { Reveal } from "../components/v0-ui/surface";
import { motion } from "framer-motion";

const RISK_CONFIG = {
    Low: {
        color: "text-[var(--positive)]",
        bg: "bg-[var(--positive-soft)]",
        border: "border-[var(--positive)]/30",
        icon: CheckCircle2,
        label: "Low Risk",
        msg: "Your spending is well within budget limits.",
    },
    Medium: {
        color: "text-[var(--warning)]",
        bg: "bg-[var(--warning-soft)]",
        border: "border-[var(--warning)]/30",
        icon: AlertCircle,
        label: "Medium Risk",
        msg: "Spending is approaching your budget limit.",
    },
    High: {
        color: "text-[var(--negative)]",
        bg: "bg-[var(--negative-soft)]",
        border: "border-[var(--negative)]/30",
        icon: AlertCircle,
        label: "High Risk",
        msg: "Budget exceeded or at high risk.",
    },
};

function ForecastBar({ label, value, max, colorClass, bgClass, delay = 0 }) {
    const pct = max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <strong className={`font-semibold ${colorClass}`}>
                    {value < 0 ? "-" : ""}{formatCurrency(Math.abs(value))}
                </strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ delay, duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${bgClass}`} 
                />
            </div>
        </div>
    );
}

export default function Forecast() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchForecast = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getForecast();
            setData(result);
        } catch {
            setError("Unable to load forecast. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchForecast();
    }, [fetchForecast]);

    const chartData = useMemo(() => {
        if (!data) return [];
        const { current_month, daily_average } = data;
        
        const daysInMonth = current_month.days_elapsed + current_month.days_remaining;
        const pts = [];
        
        let cumulativeSpent = 0;
        for (let i = 1; i <= daysInMonth; i++) {
            if (i <= current_month.days_elapsed) {
                // Historical
                cumulativeSpent += daily_average; 
                pts.push({
                    day: `Day ${i}`,
                    actual: i === current_month.days_elapsed ? current_month.expense : cumulativeSpent,
                    projected: null
                });
            } else {
                // Projected
                if (i === current_month.days_elapsed + 1) {
                    // Connect the lines
                    pts.push({
                        day: `Day ${i}`,
                        actual: null,
                        projected: current_month.expense + daily_average
                    });
                } else {
                    pts.push({
                        day: `Day ${i}`,
                        actual: null,
                        projected: current_month.expense + (daily_average * (i - current_month.days_elapsed))
                    });
                }
            }
        }
        return pts;
    }, [data]);

    const summaryKpis = useMemo(() => {
        if (!data || !data.forecast) return [];
        return [
            {
                id: "net-worth",
                label: "Projected Month-End",
                value: data.forecast.projected_month_end_expense,
                prefix: "₹",
                trend: []
            },
            {
                id: "savings-rate",
                label: "Projected Savings",
                value: data.forecast.projected_savings,
                prefix: "₹",
                trend: []
            },
            {
                id: "safe-to-spend",
                label: "Remaining Budget",
                value: data.forecast.remaining_budget,
                prefix: "₹",
                trend: []
            },
            {
                id: "health-score",
                label: "Cashflow Prediction",
                value: data.cashflow_prediction,
                prefix: "₹",
                trend: []
            }
        ];
    }, [data]);

    if (loading) return (
        <div className="space-y-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton type="card" style={{ height: "40px", width: "200px" }} />
            </header>
            <Skeleton type="card" style={{ height: "80px" }} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton type="card" style={{ height: "140px" }} />
                <Skeleton type="card" style={{ height: "140px" }} />
                <Skeleton type="card" style={{ height: "140px" }} />
                <Skeleton type="card" style={{ height: "140px" }} />
            </div>
            <Skeleton type="card" style={{ height: "350px" }} />
        </div>
    );

    if (error) return <ErrorState message={error} onRetry={fetchForecast} />;

    const isEmpty = !data || data?.current_month?.days_elapsed === 0;

    if (isEmpty) {
        return (
            <div className="space-y-8 pb-10">
                <header>
                    <h1 className="text-3xl font-semibold tracking-tight">Forecast</h1>
                    <p className="mt-1.5 text-muted-foreground">See where your finances are heading.</p>
                </header>
                <Reveal>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card)]">
                        <EmptyState 
                            title="No forecast data available"
                            message="Upload a bank statement containing transactions from the current month to generate a forecast."
                            icon="📈"
                        />
                    </div>
                </Reveal>
            </div>
        );
    }

    const { current_month, forecast, daily_average } = data;
    const risk = forecast.budget_risk || "Low";
    const cfg = RISK_CONFIG[risk];
    
    const maxBar = Math.max(
        forecast.projected_month_end_expense,
        current_month.expense,
        Math.abs(forecast.remaining_budget),
        1
    );

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] p-4 shadow-xl">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <div className="space-y-2">
                        {payload.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                                <span className="size-2.5 rounded-full" style={{ background: p.color }} />
                                <span className="flex-1">{p.name === 'actual' ? 'Actual' : 'Projected'}</span>
                                <span className="tabular-nums">{formatCurrency(p.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Forecast</h1>
                    <p className="mt-1.5 text-muted-foreground">
                        See where your finances are heading.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {current_month.days_elapsed} days elapsed · {current_month.days_remaining} days left
                </div>
            </header>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-4 rounded-2xl border ${cfg.border} ${cfg.bg} p-5`}
            >
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 shadow-sm ${cfg.color}`}>
                    <cfg.icon className="size-6" />
                </div>
                <div>
                    <h3 className={`font-semibold ${cfg.color}`}>{cfg.label} Level</h3>
                    <p className="text-sm text-foreground/80 mt-0.5">{cfg.msg}</p>
                </div>
            </motion.div>

            {summaryKpis.length > 0 && (
                <KpiCards data={summaryKpis} />
            )}

            <Reveal>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Spend Trajectory</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Historical vs Projected Month-End Spending</p>
                        </div>
                        <div className="flex items-center gap-5 text-xs font-medium">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="size-2.5 rounded-full bg-[var(--accent)]" />
                                Actual
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="size-2.5 rounded-full border-2 border-[var(--border-strong)] border-dashed bg-transparent" />
                                Projected
                            </div>
                        </div>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} dy={10} minTickGap={30} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area type="monotone" dataKey="actual" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                                <Area type="monotone" dataKey="projected" stroke="var(--border-strong)" strokeDasharray="5 5" strokeWidth={2} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Reveal>

            <Reveal delay={0.1}>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
                        <h3 className="mb-6 text-lg font-semibold tracking-tight">Forecast Overview</h3>
                        <div className="space-y-6">
                            <ForecastBar
                                label="Spent So Far"
                                value={current_month.expense}
                                max={maxBar}
                                colorClass="text-[var(--accent)]"
                                bgClass="bg-[var(--accent)]"
                                delay={0.1}
                            />
                            <ForecastBar
                                label="Projected Month-End"
                                value={forecast.projected_month_end_expense}
                                max={maxBar}
                                colorClass={cfg.color}
                                bgClass={cfg.color.replace('text-', 'bg-')}
                                delay={0.2}
                            />
                            <ForecastBar
                                label="Pending Recurring"
                                value={forecast.expected_recurring_remaining}
                                max={maxBar}
                                colorClass="text-[var(--warning)]"
                                bgClass="bg-[var(--warning)]"
                                delay={0.3}
                            />
                            <ForecastBar
                                label="Remaining Budget"
                                value={forecast.remaining_budget}
                                max={maxBar}
                                colorClass={forecast.remaining_budget >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}
                                bgClass={forecast.remaining_budget >= 0 ? "bg-[var(--positive)]" : "bg-[var(--negative)]"}
                                delay={0.4}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
                        <h3 className="mb-6 text-lg font-semibold tracking-tight">This Month So Far</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-colors hover:bg-[var(--surface-3)]">
                                <span className="text-xs font-medium text-muted-foreground">Income</span>
                                <span className="text-lg font-bold tracking-tight text-[var(--positive)]">{formatCurrency(current_month.income)}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-colors hover:bg-[var(--surface-3)]">
                                <span className="text-xs font-medium text-muted-foreground">Expenses</span>
                                <span className="text-lg font-bold tracking-tight text-[var(--negative)]">{formatCurrency(current_month.expense)}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-colors hover:bg-[var(--surface-3)]">
                                <span className="text-xs font-medium text-muted-foreground">Daily Average</span>
                                <span className="text-lg font-bold tracking-tight text-foreground">{formatCurrency(daily_average)}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-colors hover:bg-[var(--surface-3)]">
                                <span className="text-xs font-medium text-muted-foreground">Pending Recurring</span>
                                <span className="text-lg font-bold tracking-tight text-[var(--warning)]">{formatCurrency(forecast.expected_recurring_remaining)}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-colors hover:bg-[var(--surface-3)]">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CalendarDays className="size-3.5" /> Elapsed</span>
                                <span className="text-lg font-bold tracking-tight text-foreground">{current_month.days_elapsed} days</span>
                            </div>
                            <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-colors hover:bg-[var(--surface-3)]">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CalendarDays className="size-3.5" /> Remaining</span>
                                <span className="text-lg font-bold tracking-tight text-foreground">{current_month.days_remaining} days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Reveal>
        </div>
    );
}
