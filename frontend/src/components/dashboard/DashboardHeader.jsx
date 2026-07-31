/**
 * DashboardHeader — Page title, subtitle, and last-updated timestamp.
 */
export default function DashboardHeader({ lastUpdated }) {
    const formatted = lastUpdated
        ? new Date(lastUpdated).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : null;

    return (
        <div className="dashboard-header">
            <div className="dashboard-header-left">
                <h1 className="dashboard-title">
                    Financial Dashboard
                </h1>
                <p className="dashboard-subtitle">
                    Your complete financial overview at a glance
                </p>
            </div>

            {formatted && (
                <div className="dashboard-header-right">
                    <span className="last-updated">
                        🕐 Updated {formatted}
                    </span>
                </div>
            )}
        </div>
    );
}
