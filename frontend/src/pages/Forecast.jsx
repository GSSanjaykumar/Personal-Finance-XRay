import { useEffect, useState, useCallback, useMemo } from "react";
import { getForecast } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency } from "../utils/formatters";
import { AlertCircle, CheckCircle2, TrendingUp, DollarSign, Target, CalendarDays, Wallet } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";

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

function ForecastBar({ label, value, max, colorClass }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <strong className={`font-semibold ${colorClass}`}>{formatCurrency(value)}</strong>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${colorClass.replace('text-', 'bg-')}`} 
                    style={{ width: `${pct}%` }} 
                />
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, sub, colorClass }) {
    return (
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[var(--surface-2)]">
                <Icon className={`size-6 ${colorClass}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <h3 className={`mt-2 text-2xl font-bold tracking-tight ${colorClass}`}>
                {value}
            </h3>
            {sub && <span className="mt-1 text-xs text-muted-foreground">{sub}</span>}
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
        const { current_month, forecast, daily_average } = data;
        
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
            <div className="space-y-8">
                <header>
                    <h1 className="text-3xl font-semibold tracking-tight">Spending Forecast</h1>
                    <p className="mt-1.5 text-muted-foreground">Cash flow prediction for this month</p>
                </header>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
                    <EmptyState 
                        title="No forecast data available"
                        message="Upload a bank statement containing transactions from the current month to generate a forecast."
                        icon="📈"
                    />
                </div>
            </div>
        );
    }

    const { current_month, forecast, daily_average, cashflow_prediction } = data;
    const risk = forecast.budget_risk || "Low";
    const cfg = RISK_CONFIG[risk];
    
    const maxBar = Math.max(
        forecast.projected_month_end_expense,
        current_month.expense,
        forecast.remaining_budget,
        1
    );

    const isSavingsPositive = forecast.projected_savings >= 0;
    const isCashflowPositive = cashflow_prediction >= 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] p-3 shadow-lg">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
                    {payload.map((p, i) => (
                        <p key={i} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span className="size-2 rounded-full" style={{ background: p.color }} />
                            {p.name === 'actual' ? 'Actual Spend' : 'Projected Spend'}: {formatCurrency(p.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Spending Forecast</h1>
                    <p className="mt-1.5 text-muted-foreground">
                        Cash flow prediction · {current_month.days_elapsed} days elapsed · {current_month.days_remaining} days remaining
                    </p>
                </div>
            </header>

            {/* Risk Banner */}
            <div className={`flex items-center gap-4 rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 ${cfg.color}`}>
                    <cfg.icon className="size-5" />
                </div>
                <div>
                    <h3 className={`font-semibold ${cfg.color}`}>{cfg.label} Level</h3>
                    <p className="text-sm text-foreground/80">{cfg.msg}</p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    icon={TrendingUp}
                    label="Projected Month-End"
                    value={formatCurrency(forecast.projected_month_end_expense)}
                    sub={`Based on ${formatCurrency(daily_average)}/day`}
                    colorClass="text-foreground"
                />
                <MetricCard
                    icon={Wallet}
                    label="Projected Savings"
                    value={formatCurrency(forecast.projected_savings)}
                    sub="Income − projected spend"
                    colorClass={isSavingsPositive ? "text-[var(--positive)]" : "text-[var(--negative)]"}
                />
                <MetricCard
                    icon={Target}
                    label="Remaining Budget"
                    value={formatCurrency(forecast.remaining_budget)}
                    sub="Monthly budget − spent so far"
                    colorClass={forecast.remaining_budget > 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}
                />
                <MetricCard
                    icon={DollarSign}
                    label="Cashflow Prediction"
                    value={formatCurrency(cashflow_prediction)}
                    sub="Expected end-of-month position"
                    colorClass={isCashflowPositive ? "text-[var(--positive)]" : "text-[var(--negative)]"}
                />
            </div>

            {/* Main Chart */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">Spend Trajectory</h2>
                        <p className="text-sm text-muted-foreground">Historical vs Projected Month-End Spending</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2.5 rounded-full bg-[var(--accent)]" />
                            Actual
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2.5 rounded-full border border-[var(--border-strong)] border-dashed bg-transparent" />
                            Projected
                        </div>
                    </div>
                </div>
                <div className="h-[300px] w-full">
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
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="actual" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                            <Area type="monotone" dataKey="projected" stroke="var(--border-strong)" strokeDasharray="5 5" strokeWidth={2} fill="transparent" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Split Bottom Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Forecast Overview Bars */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
                    <h3 className="mb-6 text-lg font-semibold tracking-tight">Forecast Overview</h3>
                    <div className="space-y-6">
                        <ForecastBar
                            label="Spent So Far"
                            value={current_month.expense}
                            max={maxBar}
                            colorClass="text-[var(--accent)]"
                        />
                        <ForecastBar
                            label="Projected Month-End"
                            value={forecast.projected_month_end_expense}
                            max={maxBar}
                            colorClass={cfg.color}
                        />
                        <ForecastBar
                            label="Pending Recurring"
                            value={forecast.expected_recurring_remaining}
                            max={maxBar}
                            colorClass="text-[#F72585]"
                        />
                        <ForecastBar
                            label="Remaining Budget"
                            value={forecast.remaining_budget}
                            max={maxBar}
                            colorClass="text-[var(--positive)]"
                        />
                    </div>
                </div>

                {/* This Month So Far */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
                    <h3 className="mb-6 text-lg font-semibold tracking-tight">This Month So Far</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 rounded-xl bg-[var(--surface-2)] p-4">
                            <span className="text-xs font-medium text-muted-foreground">Income</span>
                            <span className="text-lg font-semibold text-[var(--positive)]">{formatCurrency(current_month.income)}</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl bg-[var(--surface-2)] p-4">
                            <span className="text-xs font-medium text-muted-foreground">Expenses</span>
                            <span className="text-lg font-semibold text-[var(--negative)]">{formatCurrency(current_month.expense)}</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl bg-[var(--surface-2)] p-4">
                            <span className="text-xs font-medium text-muted-foreground">Daily Average</span>
                            <span className="text-lg font-semibold text-foreground">{formatCurrency(daily_average)}</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl bg-[var(--surface-2)] p-4">
                            <span className="text-xs font-medium text-muted-foreground">Pending Recurring</span>
                            <span className="text-lg font-semibold text-[#F72585]">{formatCurrency(forecast.expected_recurring_remaining)}</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl bg-[var(--surface-2)] p-4">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><CalendarDays className="size-3.5" /> Days Elapsed</span>
                            <span className="text-lg font-semibold text-foreground">{current_month.days_elapsed}</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl bg-[var(--surface-2)] p-4">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><CalendarDays className="size-3.5" /> Days Remaining</span>
                            <span className="text-lg font-semibold text-foreground">{current_month.days_remaining}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
