/**
 * BudgetOverview — Shows top budget categories with progress bars.
 * Reads from the dashboard `budget` array.
 */

const ICONS = {
    "Food & Dining": "🍕",
    Shopping: "🛍️",
    Transport: "🚕",
    Bills: "💡",
    Others: "📦",
    "Cash Withdrawal": "🏧",
};

import { formatCompact, formatCurrency, formatPercentage } from "../../utils/formatters";

function getBarClass(status) {
    if (status === "Exceeded") return "danger";
    if (status === "Near Limit") return "warning";
    return "good";
}

function getStatusClass(status) {
    if (status === "Exceeded") return "exceeded";
    if (status === "Near Limit") return "near-limit";
    return "within-budget";
}

export default function BudgetOverview({ budget }) {
    const items = Array.isArray(budget) ? budget : [];

    if (items.length === 0) {
        return (
            <div className="table-card" id="budget-overview">
                <h3>Budget Overview</h3>
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <p>No budget data available.</p>
                    <small>Upload a statement to see your budget analysis.</small>
                </div>
            </div>
        );
    }

    return (
        <div className="table-card" id="budget-overview">
            <h3>Budget Overview</h3>

            {items.map((item, index) => (
                <div className="budget-card" key={index}>
                    <div className="budget-header">
                        <h3>
                            <span className="cat-icon-small">{ICONS[item.category] || "💰"}</span>
                            {item.category}
                        </h3>
                    </div>

                    <div className="budget-stats-row">
                        <div className="budget-stat-col">
                            <span className="text-label">Spent</span>
                            <span className="text-card-title">{formatCompact(item.spent)}</span>
                        </div>
                        <div className="budget-stat-col" style={{ textAlign: "right" }}>
                            <span className="text-label">Budget</span>
                            <span className="text-card-title" style={{ color: "#9CA3AF" }}>{formatCompact(item.budget)}</span>
                        </div>
                    </div>

                    <div className="budget-progress-container">
                        <div className="budget-progress">
                            <div
                                className={`budget-fill ${getBarClass(item.status)}`}
                                style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="budget-footer-row">
                        <div className="budget-status-container">
                            <span className={`status-badge-v2 ${getStatusClass(item.status)}`}>
                                {item.status}
                            </span>
                        </div>
                        <div className="budget-remaining-col">
                            <span className="text-label">
                                {item.remaining >= 0 ? "Remaining" : "Exceeded"}
                            </span>
                            <span className="text-secondary-metric">
                                {formatCompact(Math.abs(item.remaining))}
                            </span>
                        </div>
                        <div className="budget-pct-col">
                            <span className="text-label">{formatPercentage(item.percentage)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
