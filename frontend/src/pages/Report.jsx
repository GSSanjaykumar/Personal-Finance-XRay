import { useState, useCallback } from "react";
import Navbar from "../components/layout/Navbar";
import { getReport } from "../api/financeApi";

/**
 * Report page — triggers PDF generation from GET /report.
 * Features: Generate button, animated loading, download progress indicator,
 * success state, and error handling.
 */

const FEATURE_LIST = [
    { icon: "🏦", label: "Financial Health Score & Grade" },
    { icon: "📊", label: "Budget vs Actual with Progress Bars" },
    { icon: "🥧", label: "Category Spending Pie Chart" },
    { icon: "📈", label: "Top Categories Bar Chart" },
    { icon: "🔄", label: "Recurring Payments Schedule" },
    { icon: "🔮", label: "Month-End Forecast & Cashflow" },
    { icon: "🧠", label: "AI-Powered Insights" },
    { icon: "📋", label: "Latest 20 Transactions Table" },
];

const PAGE_LIST = [
    { num: "1", title: "Cover Page",            desc: "Health score, grade, quick summary" },
    { num: "2", title: "Budget Analysis",        desc: "Budget vs actual, risk indicator" },
    { num: "3", title: "Spending Analytics",     desc: "Category table, pie & bar charts" },
    { num: "4", title: "Recurring Payments",     desc: "Merchant, frequency, confidence" },
    { num: "5", title: "Spending Forecast",      desc: "Projections, cashflow, risk" },
    { num: "6", title: "AI Insights",            desc: "Recommendation cards" },
    { num: "7", title: "Recent Transactions",    desc: "Latest 20 with colour coding" },
];

export default function Report() {
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState("");
    const [progress, setProgress] = useState(0);

    const generateReport = useCallback(async () => {
        setStatus("loading");
        setErrorMsg("");
        setProgress(0);

        // Simulate progress stages while PDF is being built on server
        const stages = [15, 35, 55, 72, 88, 96];
        let stageIdx = 0;
        const ticker = setInterval(() => {
            if (stageIdx < stages.length) {
                setProgress(stages[stageIdx++]);
            }
        }, 400);

        try {
            const blob = await getReport();

            clearInterval(ticker);
            setProgress(100);

            // Trigger browser download
            const url = URL.createObjectURL(blob);
            const today = new Date().toISOString().split("T")[0];
            const link = document.createElement("a");
            link.href = url;
            link.download = `Financial_Report_${today}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setStatus("success");
        } catch (err) {
            clearInterval(ticker);
            console.error("Report generation failed:", err);
            setErrorMsg("Failed to generate the report. Please try again.");
            setStatus("error");
        }
    }, []);

    const reset = () => {
        setStatus("idle");
        setProgress(0);
        setErrorMsg("");
    };

    return (
        <>
            <Navbar />

            {/* ── Page Header ──────────────────────────────────────────── */}
            <div className="page-header" id="report-page-header">
                <div>
                    <h1>Financial Report</h1>
                    <p className="subtitle">
                        Generate a professional multi-page PDF containing your
                        complete financial analysis
                    </p>
                </div>
            </div>

            <div className="report-layout">

                {/* ── Left column — Report info ─────────────────────────── */}
                <div className="report-info-col">
                    {/* Generate card */}
                    <div className="table-card report-generate-card" id="report-generate-card">
                        <div className="report-card-icon">📑</div>
                        <h2>Personal Finance Report</h2>
                        <p className="report-card-desc">
                            Download your complete financial analysis as a
                            professionally formatted PDF. The report includes
                            charts, tables, AI insights, and forecasts — ready
                            to share or archive.
                        </p>

                        {/* Idle / success / error generate button */}
                        {status === "idle" && (
                            <button
                                className="report-generate-btn"
                                onClick={generateReport}
                                id="btn-generate-report"
                            >
                                📥 Generate PDF Report
                            </button>
                        )}

                        {status === "loading" && (
                            <div className="report-loading" id="report-loading">
                                <div className="report-loading-label">
                                    <span>Generating your report…</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="report-progress-track">
                                    <div
                                        className="report-progress-fill"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="report-loading-sub">
                                    {progress < 30
                                        ? "Aggregating financial data…"
                                        : progress < 60
                                        ? "Generating charts…"
                                        : progress < 90
                                        ? "Building PDF pages…"
                                        : "Finalising document…"}
                                </p>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="report-success" id="report-success">
                                <div className="report-success-icon">✅</div>
                                <h3>Report Downloaded!</h3>
                                <p>
                                    Your financial report has been saved to your
                                    downloads folder.
                                </p>
                                <button
                                    className="report-again-btn"
                                    onClick={generateReport}
                                    id="btn-report-again"
                                >
                                    🔄 Generate Again
                                </button>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="report-error-state" id="report-error">
                                <div className="report-error-icon">⚠️</div>
                                <p>{errorMsg}</p>
                                <button
                                    className="retry-btn"
                                    onClick={reset}
                                    id="btn-report-retry"
                                >
                                    🔄 Try Again
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Contents info */}
                    <div className="table-card" id="report-features">
                        <h3>What's Included</h3>
                        <div className="report-features-grid">
                            {FEATURE_LIST.map((f, i) => (
                                <div className="report-feature-item" key={i}>
                                    <span className="report-feature-icon">{f.icon}</span>
                                    <span>{f.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right column — Page preview ───────────────────────── */}
                <div className="report-pages-col">
                    <div className="table-card" id="report-pages-list">
                        <h3>Report Structure</h3>
                        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
                            7-page professional PDF
                        </p>

                        {PAGE_LIST.map((page, i) => (
                            <div className="report-page-row" key={i}>
                                <div className="report-page-number">
                                    {page.num}
                                </div>
                                <div className="report-page-info">
                                    <strong>{page.title}</strong>
                                    <span>{page.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Bug #8 Fix: Add Visual Previews */}
                    <div className="table-card" id="report-previews" style={{ marginTop: '24px' }}>
                        <h3>Report Preview</h3>
                        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
                            Visual layout of the generated PDF
                        </p>
                        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                            {PAGE_LIST.map((page, i) => (
                                <div key={i} style={{
                                    minWidth: '100px',
                                    height: '141px', // A4 aspect ratio
                                    background: 'white',
                                    borderRadius: '4px',
                                    padding: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    color: '#333'
                                }}>
                                    <div style={{ borderBottom: '2px solid #7B2FF7', paddingBottom: '4px', marginBottom: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                                        {page.title}
                                    </div>
                                    <div style={{ flex: 1, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '24px' }}>
                                        {i === 0 ? "📄" : i === 1 ? "📊" : i === 2 ? "🥧" : i === 3 ? "🔄" : i === 4 ? "📈" : i === 5 ? "💡" : "📋"}
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '8px', marginTop: '4px' }}>Page {page.num}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
