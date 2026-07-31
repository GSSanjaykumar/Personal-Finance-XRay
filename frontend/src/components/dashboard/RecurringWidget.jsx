import { useNavigate } from "react-router-dom";

/**
 * RecurringWidget — Shows top 3 recurring payments.
 * "View All" navigates to /recurring.
 * Reads from the dashboard `recurring` array.
 */

const FREQUENCY_ICONS = {
    daily: "📅",
    weekly: "🗓️",
    biweekly: "📆",
    monthly: "🔄",
    quarterly: "📊",
    yearly: "🎯",
    irregular: "❓",
};

export default function RecurringWidget({ recurring }) {
    const navigate = useNavigate();
    const items = Array.isArray(recurring) ? recurring.slice(0, 3) : [];

    if (items.length === 0) {
        return (
            <div className="table-card" id="recurring-widget">
                <div className="widget-header">
                    <h3>Recurring Payments</h3>
                </div>
                <div className="empty-state">
                    <div className="empty-icon">🔄</div>
                    <p>No recurring payments detected.</p>
                    <small>
                        At least 3 transactions from the same merchant are needed.
                    </small>
                </div>
            </div>
        );
    }

    return (
        <div className="table-card" id="recurring-widget">
            <div className="widget-header">
                <h3>Recurring Payments</h3>
                <button
                    className="view-all-btn"
                    onClick={() => navigate("/recurring")}
                    id="view-all-recurring"
                >
                    View All →
                </button>
            </div>

            <div className="recurring-grid">
                {items.map((item, index) => {
                    const confidencePct = Math.round(item.confidence * 100);
                    const icon = FREQUENCY_ICONS[item.frequency] || "🔄";

                    return (
                        <div className="recurring-card" key={index}>
                            <div className="recurring-card-top">
                                <div className="merchant-avatar">
                                    {item.merchant.charAt(0)}
                                </div>
                                <div className="recurring-merchant-info">
                                    <div className="merchant-name">
                                        {item.merchant}
                                    </div>
                                    <div className="merchant-sub">
                                        {item.category}
                                    </div>
                                </div>
                            </div>

                            <div className="recurring-card-body">
                                <div className="recurring-stat">
                                    <span>Avg. Amount</span>
                                    <strong>
                                        ₹{item.average_amount.toLocaleString("en-IN")}
                                    </strong>
                                </div>
                                <div className="recurring-stat">
                                    <span>Frequency</span>
                                    <strong>
                                        {icon} {item.frequency}
                                    </strong>
                                </div>
                                <div className="recurring-stat">
                                    <span>Confidence</span>
                                    <strong
                                        style={{
                                            color:
                                                confidencePct >= 75
                                                    ? "#22C55E"
                                                    : confidencePct >= 50
                                                    ? "#EAB308"
                                                    : "#EF4444",
                                        }}
                                    >
                                        {confidencePct}%
                                    </strong>
                                </div>
                            </div>

                            <div className="recurring-confidence-bar">
                                <div
                                    className="recurring-confidence-fill"
                                    style={{ width: `${confidencePct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
