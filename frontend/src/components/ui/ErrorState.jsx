import React from "react";

export default function ErrorState({ message = "An error occurred.", onRetry }) {
    return (
        <div className="error-state-container">
            <div className="error-state-icon">⚠️</div>
            <h3 className="error-state-title">Something went wrong</h3>
            <p className="error-state-message">{message}</p>
            {onRetry && (
                <button className="error-retry-btn" onClick={onRetry}>
                    🔄 Retry
                </button>
            )}
        </div>
    );
}
