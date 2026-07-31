import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReport } from "../../api/financeApi";

/**
 * ReportCard — Dashboard widget for quick PDF generation.
 * Shows description, "Generate PDF" button, and inline loading state.
 * "View Details" navigates to the full /report page.
 */
export default function ReportCard() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("idle"); // idle | loading | done | error

    const handleGenerate = async () => {
        setStatus("loading");
        try {
            const blob = await getReport();
            const url = URL.createObjectURL(blob);
            const today = new Date().toISOString().split("T")[0];
            const link = document.createElement("a");
            link.href = url;
            link.download = `Financial_Report_${today}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setStatus("done");
            // Auto-reset after 3 seconds
            setTimeout(() => setStatus("idle"), 3000);
        } catch {
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    };

    return (
        <div className="table-card report-dash-card" id="report-dashboard-card">
            <div className="report-dash-header">
                <div className="report-dash-icon">📑</div>
                <div>
                    <h3>Financial Report</h3>
                    <p className="report-dash-desc">
                        Download your complete financial analysis as a
                        professional multi-page PDF.
                    </p>
                </div>
            </div>

            <div className="report-dash-features">
                <span>📊 Charts</span>
                <span>🔮 Forecast</span>
                <span>🧠 AI Insights</span>
                <span>📋 Transactions</span>
            </div>

            <div className="report-dash-actions">
                {status === "idle" && (
                    <button
                        className="report-generate-btn-sm"
                        onClick={handleGenerate}
                        id="dash-generate-report"
                    >
                        📥 Generate PDF
                    </button>
                )}

                {status === "loading" && (
                    <div className="report-dash-loading">
                        <div className="report-dash-spinner" />
                        <span>Generating…</span>
                    </div>
                )}

                {status === "done" && (
                    <span className="report-dash-success">✅ Downloaded!</span>
                )}

                {status === "error" && (
                    <span className="report-dash-error">⚠️ Failed. Try again.</span>
                )}

                <button
                    className="view-all-btn"
                    onClick={() => navigate("/report")}
                    id="dash-view-report-page"
                >
                    View Details →
                </button>
            </div>
        </div>
    );
}
