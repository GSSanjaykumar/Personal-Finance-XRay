/**
 * AIInsightsWidget — Shows top 5 AI-generated insights.
 * Reads from the dashboard `insights` array.
 * Reuses the existing insight item structure (title, icon, value, description).
 */
export default function AIInsightsWidget({ insights }) {
    const items = Array.isArray(insights) ? insights.slice(0, 5) : [];

    if (items.length === 0) {
        return (
            <div className="table-card" id="ai-insights-widget">
                <h3>AI Insights</h3>
                <div className="empty-state">
                    <div className="empty-icon">🧠</div>
                    <p>No insights available.</p>
                    <small>Upload a bank statement to generate AI-powered insights.</small>
                </div>
            </div>
        );
    }

    return (
        <div className="table-card" id="ai-insights-widget">
            <h3>AI Insights</h3>

            <div className="insights-grid-v2">
                {items.map((item, index) => (
                    <div key={index} className="insight-subcard">
                        <div className="insight-sub-header">
                            <span className="insight-sub-icon">{item.icon}</span>
                            <span className="insight-sub-title">{item.title}</span>
                        </div>
                        <div className="insight-sub-val">{item.value}</div>
                        {item.description && (
                            <div className="insight-sub-desc">{item.description}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
