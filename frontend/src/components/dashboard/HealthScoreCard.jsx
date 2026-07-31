import {
    CircularProgressbar,
    buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { formatCompact } from "../../utils/formatters";

/**
 * HealthScoreCard — Financial health score with grade, status and metrics.
 * Reads from the dashboard `financial_health` object.
 * Refactored to V2 design.
 */

const GRADE_COLORS = {
    A: "#22C55E",
    B: "#84CC16",
    C: "#EAB308",
    D: "#F97316",
    F: "#EF4444",
};

const STATUS_COLORS = {
    Excellent: "rgba(34,197,94,.18)",
    Good: "rgba(132,204,22,.18)",
    Fair: "rgba(234,179,8,.18)",
    Poor: "rgba(249,115,22,.18)",
    Critical: "rgba(239,68,68,.18)",
};

export default function HealthScoreCard({ financialHealth }) {
    if (!financialHealth || Object.keys(financialHealth).length === 0) {
        return (
            <div className="hero-card health-empty">
                <div className="health-left">
                    <h3>Financial Health</h3>
                    <p style={{ opacity: 0.7, marginTop: 12 }}>
                        Upload a bank statement to see your financial health score.
                    </p>
                </div>
            </div>
        );
    }

    const {
        score = 0,
        grade = "F",
        status = "N/A",
        income = 0,
        expense = 0,
        savings = 0,
    } = financialHealth;

    const pathColor = GRADE_COLORS[grade] || "#22C55E";
    const statusBg = STATUS_COLORS[status] || "rgba(255,255,255,.1)";

    return (
        <div className="health-card-v2" id="health-score-card">
            <div className="health-card-header">
                <div>
                    <h3>Financial Health</h3>
                    <p style={{ opacity: 0.7, fontSize: "13px", marginTop: "4px" }}>Overall financial wellness score.</p>
                </div>
                <div className="health-status-badge" style={{ background: statusBg, color: pathColor }}>
                    {status === "Excellent" ? "🌟" : status === "Good" ? "✅" : status === "Fair" ? "⚠️" : "🚨"} {status}
                </div>
            </div>

            <div className="health-card-body">
                <div className="gauge-container">
                    <CircularProgressbar
                        value={score}
                        text={`${score}/100`}
                        styles={buildStyles({
                            pathColor,
                            trailColor: "rgba(255,255,255,.05)",
                            textColor: "#fff",
                            textSize: "16px",
                        })}
                    />
                    <div className="health-grade-text" style={{ color: pathColor }}>
                        Grade {grade}
                    </div>
                </div>

                <div className="health-metrics-v2">
                    <div className="health-metric">
                        <span>Income</span>
                        <h4>{formatCompact(income)}</h4>
                    </div>
                    <div className="health-metric">
                        <span>Expense</span>
                        <h4>{formatCompact(expense)}</h4>
                    </div>
                    <div className="health-metric">
                        <span>Savings</span>
                        <h4 style={{ color: savings >= 0 ? "#10B981" : "#EF4444" }}>
                            {formatCompact(savings)}
                        </h4>
                    </div>
                </div>
            </div>
        </div>
    );
}
