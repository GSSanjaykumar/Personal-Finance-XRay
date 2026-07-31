import { useEffect, useState, useCallback } from "react";
import Navbar from "../components/layout/Navbar";
import { getForecast } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { formatCurrency } from "../utils/formatters";

/**
 * Forecast page — consumes GET /forecast.
 * Displays projected month-end spending, savings, budget risk, daily average,
 * cashflow prediction, and pending recurring charges as visual cards.
 */

const RISK_CONFIG = {
    Low: {
        color: "#22C55E",
        bg: "rgba(34,197,94,.12)",
        border: "rgba(34,197,94,.25)",
        icon: "✅",
        label: "Low Risk",
    },
    Medium: {
        color: "#EAB308",
        bg: "rgba(234,179,8,.12)",
        border: "rgba(234,179,8,.25)",
        icon: "⚠️",
        label: "Medium Risk",
    },
    High: {
        color: "#EF4444",
        bg: "rgba(239,68,68,.12)",
        border: "rgba(239,68,68,.25)",
        icon: "🚨",
        label: "High Risk",
        msg: "Budget exceeded or at high risk.",
    },
};

function RiskGauge({ risk }) {
    const cfg = RISK_CONFIG[risk] || RISK_CONFIG.Low;
    const pct = risk === "Low" ? 33 : risk === "Medium" ? 66 : 100;

    return (
        <div 
            className="forecast-banner" 
            style={{ 
                background: cfg.bg, 
                borderLeft: `4px solid ${cfg.color}`,
                padding: '16px 24px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '24px'
            }}
        >
            <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '12px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
            }}>
                {cfg.icon}
            </div>
            <div style={{ flex: 1 }}>
                <h3 style={{ color: cfg.color, margin: '0 0 4px 0', fontSize: '18px' }}>{cfg.label} Level</h3>
                <p style={{ margin: 0, color: 'white', fontSize: '14px', opacity: 0.9 }}>{cfg.msg}</p>
            </div>
            
            <div style={{ width: '150px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: 'white', opacity: 0.8 }}>
                    <span>Confidence</span>
                    <span>{pct}%</span>
                </div>
                <div className="risk-gauge-track" style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                        className="risk-gauge-fill"
                        style={{
                            width: `${pct}%`,
                            background: cfg.color,
                            height: '100%'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function ForecastBar({ label, value, max, color }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="forecast-bar-row">
            <div className="forecast-bar-label">
                <span>{label}</span>
                <strong style={{ color }}>{formatCurrency(value)}</strong>
            </div>
            <div className="forecast-bar-track">
                <div
                    className="forecast-bar-fill"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value, sub, color, id }) {
    return (
        <div className="forecast-metric-card" id={id}>
            <div className="forecast-metric-icon">{icon}</div>
            <div className="forecast-metric-body">
                <p className="forecast-metric-label">{label}</p>
                <h3
                    className="forecast-metric-value"
                    style={{ color: color || "white" }}
                >
                    {value}
                </h3>
                {sub && (
                    <span className="forecast-metric-sub">{sub}</span>
                )}
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

    // ── Loading ──────────────────────────────────────────────────────────
    if (loading) return (
        <>
            <Navbar />
            <div style={{ marginTop: '24px' }}>
                <Skeleton type="grid" count={2} />
            </div>
        </>
    );

    // ── Error ────────────────────────────────────────────────────────────
    if (error) {
        return (
            <>
                <Navbar />
                <ErrorState message={error} onRetry={fetchForecast} />
            </>
        );
    }

    // ── Empty state ──────────────────────────────────────────────────────
    const isEmpty =
        !data || data?.current_month?.days_elapsed === 0;

    if (isEmpty) {
        return (
            <>
                <Navbar />
                <div className="page-header" id="forecast-page-header">
                    <div>
                        <h1>Spending Forecast</h1>
                        <p className="subtitle">Cash flow prediction for this month</p>
                    </div>
                </div>
                <div className="table-card">
                    <EmptyState 
                        title="No forecast data available."
                        description="Upload a bank statement containing transactions from the current month to generate a forecast."
                    />
                </div>
            </>
        );
    }

    const { current_month, forecast, daily_average, cashflow_prediction } = data;
    const risk = forecast.budget_risk;
    const maxBar = Math.max(
        forecast.projected_month_end_expense,
        current_month.expense,
        forecast.remaining_budget,
        1
    );

    const savingsColor =
        forecast.projected_savings >= 0 ? "#22C55E" : "#EF4444";
    const cashflowColor = cashflow_prediction >= 0 ? "#22C55E" : "#EF4444";

    return (
        <>
            <Navbar />

            {/* ── Page header ──────────────────────────────────────────── */}
            <div className="page-header" id="forecast-page-header">
                <div>
                    <h1>Spending Forecast</h1>
                    <p className="subtitle">
                        Cash flow prediction · {current_month.days_elapsed} days
                        elapsed · {current_month.days_remaining} days remaining
                    </p>
                </div>
            </div>

            {/* ── Budget Risk Gauge ─────────────────────────────────────── */}
            <RiskGauge risk={risk} />

            {/* ── Four metric cards ─────────────────────────────────────── */}
            <div className="forecast-metrics-grid" id="forecast-metrics">
                <MetricCard
                    id="metric-projected-expense"
                    icon="📊"
                    label="Projected Month-End Spending"
                    value={formatCurrency(forecast.projected_month_end_expense)}
                    sub={`Based on ${formatCurrency(daily_average)}/day average`}
                    color="white"
                />
                <MetricCard
                    id="metric-projected-savings"
                    icon="🏦"
                    label="Projected Savings"
                    value={formatCurrency(forecast.projected_savings)}
                    sub="Income − projected spend"
                    color={savingsColor}
                />
                <MetricCard
                    id="metric-remaining-budget"
                    icon="💳"
                    label="Remaining Budget"
                    value={formatCurrency(forecast.remaining_budget)}
                    sub="Monthly budget − spent so far"
                    color={
                        forecast.remaining_budget > 0 ? "#22C55E" : "#EF4444"
                    }
                />
                <MetricCard
                    id="metric-cashflow"
                    icon="💰"
                    label="Cashflow Prediction"
                    value={formatCurrency(cashflow_prediction)}
                    sub="Expected end-of-month net position"
                    color={cashflowColor}
                />
            </div>

            {/* ── Forecast progress bars ────────────────────────────────── */}
            <div className="table-card" id="forecast-bars">
                <h3>Forecast Overview</h3>
                <div className="forecast-bars-container">
                    <ForecastBar
                        label="Spent So Far"
                        value={current_month.expense}
                        max={maxBar}
                        color="#7B2FF7"
                    />
                    <ForecastBar
                        label="Projected Month-End"
                        value={forecast.projected_month_end_expense}
                        max={maxBar}
                        color={
                            risk === "High"
                                ? "#EF4444"
                                : risk === "Medium"
                                ? "#EAB308"
                                : "#22C55E"
                        }
                    />
                    <ForecastBar
                        label="Pending Recurring Charges"
                        value={forecast.expected_recurring_remaining}
                        max={maxBar}
                        color="#F72585"
                    />
                    <ForecastBar
                        label="Remaining Budget"
                        value={forecast.remaining_budget}
                        max={maxBar}
                        color="#00C9A7"
                    />
                </div>
            </div>

            {/* ── Current month summary ─────────────────────────────────── */}
            <div className="table-card" id="forecast-current-month">
                <h3>This Month So Far</h3>
                <div className="forecast-summary-grid">
                    <div className="forecast-summary-item">
                        <span>Income</span>
                        <strong style={{ color: "#22C55E" }}>
                            {formatCurrency(current_month.income)}
                        </strong>
                    </div>
                    <div className="forecast-summary-item">
                        <span>Expenses</span>
                        <strong style={{ color: "#EF4444" }}>
                            {formatCurrency(current_month.expense)}
                        </strong>
                    </div>
                    <div className="forecast-summary-item">
                        <span>Daily Average</span>
                        <strong>{formatCurrency(daily_average)}</strong>
                    </div>
                    <div className="forecast-summary-item">
                        <span>Pending Recurring</span>
                        <strong style={{ color: "#F72585" }}>
                            {formatCurrency(forecast.expected_recurring_remaining)}
                        </strong>
                    </div>
                    <div className="forecast-summary-item">
                        <span>Days Elapsed</span>
                        <strong>{current_month.days_elapsed}</strong>
                    </div>
                    <div className="forecast-summary-item">
                        <span>Days Remaining</span>
                        <strong>{current_month.days_remaining}</strong>
                    </div>
                </div>
            </div>
        </>
    );
}
