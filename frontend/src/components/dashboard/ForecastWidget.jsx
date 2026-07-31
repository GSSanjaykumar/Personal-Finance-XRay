import { useNavigate } from "react-router-dom";

/**
 * ForecastWidget — Dashboard summary card for the spending forecast.
 * Shows projected spend, cashflow prediction, budget risk badge,
 * and a "View Details" button navigating to /forecast.
 *
 * Props:
 *   forecast  — the full forecast response object from GET /forecast
 */

const RISK_CONFIG = {
    Low: { color: "#22C55E", bg: "rgba(34,197,94,.15)", icon: "✅" },
    Medium: { color: "#EAB308", bg: "rgba(234,179,8,.15)", icon: "⚠️" },
    High: { color: "#EF4444", bg: "rgba(239,68,68,.15)", icon: "🚨" },
};

function fmt(n) {
    return `₹${Number(n || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    })}`;
}

export default function ForecastWidget({ forecast }) {
    const navigate = useNavigate();

    if (!forecast || !forecast.forecast) {
        return (
            <div className="table-card forecast-widget" id="forecast-widget">
                <div className="widget-header">
                    <h3>📈 Spending Forecast</h3>
                </div>
                <div className="empty-state" style={{ padding: "24px" }}>
                    <p style={{ fontSize: 14 }}>No forecast data yet.</p>
                    <small>Upload a statement from the current month.</small>
                </div>
            </div>
        );
    }

    const {
        forecast: { projected_month_end_expense, budget_risk },
        cashflow_prediction,
        daily_average,
        current_month,
    } = forecast;

    const risk = budget_risk || "Low";
    const riskCfg = RISK_CONFIG[risk] || RISK_CONFIG.Low;

    // Progress bar: days elapsed vs total
    const totalDays =
        (current_month?.days_elapsed || 0) +
        (current_month?.days_remaining || 0);
    const elapsedPct =
        totalDays > 0
            ? Math.round(((current_month?.days_elapsed || 0) / totalDays) * 100)
            : 0;

    return (
        <div className="table-card forecast-widget" id="forecast-widget">
            {/* Header */}
            <div className="widget-header">
                <h3>📈 Spending Forecast</h3>
                <button
                    className="view-all-btn"
                    onClick={() => navigate("/forecast")}
                    id="view-forecast-details"
                >
                    View Details →
                </button>
            </div>

            {/* Risk badge */}
            <div
                className="forecast-risk-badge"
                style={{ background: riskCfg.bg, color: riskCfg.color }}
            >
                {riskCfg.icon} Budget Risk: <strong>{risk}</strong>
            </div>

            {/* Key numbers */}
            <div className="forecast-widget-stats">
                <div className="fw-stat">
                    <span>Projected Spend</span>
                    <strong>{fmt(projected_month_end_expense)}</strong>
                </div>
                <div className="fw-stat">
                    <span>Cashflow</span>
                    <strong
                        style={{
                            color:
                                cashflow_prediction >= 0
                                    ? "#22C55E"
                                    : "#EF4444",
                        }}
                    >
                        {fmt(cashflow_prediction)}
                    </strong>
                </div>
                <div className="fw-stat">
                    <span>Daily Avg</span>
                    <strong>{fmt(daily_average)}</strong>
                </div>
            </div>

            {/* Month progress bar */}
            <div className="forecast-month-progress">
                <div className="forecast-month-label">
                    <span>Month Progress</span>
                    <span>
                        {current_month?.days_elapsed || 0} /{" "}
                        {totalDays} days
                    </span>
                </div>
                <div className="forecast-month-track">
                    <div
                        className="forecast-month-fill"
                        style={{ width: `${elapsedPct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
