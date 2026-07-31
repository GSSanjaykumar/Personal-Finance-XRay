import React from "react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const pages = [];
    
    // Simple window logic: show current, previous, next, first, last
    const showPage = (p) => {
        if (p === 1 || p === totalPages) return true;
        if (p >= currentPage - 1 && p <= currentPage + 1) return true;
        return false;
    };

    for (let i = 1; i <= totalPages; i++) {
        if (showPage(i)) {
            pages.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`pagination-btn ${currentPage === i ? "active" : ""}`}
                >
                    {i}
                </button>
            );
        } else if (pages[pages.length - 1] !== "...") {
            pages.push("...");
        }
    }

    return (
        <div className="pagination-container">
            <button
                className="pagination-nav-btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Prev
            </button>
            <div className="pagination-pages">
                {pages.map((p, idx) => (
                    p === "..." ? (
                        <span key={`dots-${idx}`} className="pagination-dots">...</span>
                    ) : p
                ))}
            </div>
            <button
                className="pagination-nav-btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    );
}
