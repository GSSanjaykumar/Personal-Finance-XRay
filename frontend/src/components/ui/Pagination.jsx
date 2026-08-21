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
            pages.push(i);
        } else if (pages[pages.length - 1] !== "...") {
            pages.push("...");
        }
    }

    return (
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <button
                className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border)] bg-transparent px-3 text-sm font-medium transition-colors hover:bg-[var(--surface-2)] hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Prev
            </button>
            <div className="flex items-center gap-1">
                {pages.map((p, i) => (
                    p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">...</span>
                    ) : (
                        <button
                            key={i}
                            onClick={() => onPageChange(p)}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-[var(--surface-2)] hover:text-foreground ${
                                currentPage === p 
                                    ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]" 
                                    : "bg-transparent text-muted-foreground"
                            }`}
                        >
                            {p}
                        </button>
                    )
                ))}
            </div>
            <button
                className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border)] bg-transparent px-3 text-sm font-medium transition-colors hover:bg-[var(--surface-2)] hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    );
}
