import React from "react";

export default function LoadingState({ message = "Loading data..." }) {
    return (
        <div className="loading-state-container">
            <div className="loading-spinner" />
            <p className="loading-message">{message}</p>
        </div>
    );
}
