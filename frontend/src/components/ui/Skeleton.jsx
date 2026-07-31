export default function Skeleton({ type = "card", count = 1, style = {} }) {
    const renderSkeleton = (key) => {
        switch (type) {
            case "table":
                return (
                    <div key={key} className="skeleton-container" style={{ ...style }}>
                        <div className="skeleton skeleton-header"></div>
                        <div className="skeleton skeleton-row"></div>
                        <div className="skeleton skeleton-row"></div>
                        <div className="skeleton skeleton-row"></div>
                        <div className="skeleton skeleton-row"></div>
                    </div>
                );
            case "grid":
                return (
                    <div key={key} className="skeleton-grid" style={{ ...style }}>
                        <div className="skeleton skeleton-card"></div>
                        <div className="skeleton skeleton-card"></div>
                        <div className="skeleton skeleton-card"></div>
                        <div className="skeleton skeleton-card"></div>
                    </div>
                );
            case "card":
            default:
                return (
                    <div key={key} className="skeleton skeleton-card" style={{ ...style }}></div>
                );
        }
    };

    return (
        <div className="skeleton-wrapper">
            {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
        </div>
    );
}
