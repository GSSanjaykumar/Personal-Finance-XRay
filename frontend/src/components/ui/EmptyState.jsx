import React from "react";

export default function EmptyState({ icon = "📦", title = "No data found", message = "Try adjusting your filters or check back later." }) {
    return (
        <div className="empty-state-container">
            <div className="empty-state-icon">{icon}</div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-message">{message}</p>
        </div>
    );
}
