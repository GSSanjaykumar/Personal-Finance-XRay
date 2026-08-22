import { useState, useCallback } from "react";
import { getReport } from "../api/financeApi";
import { Download, CheckCircle2, AlertCircle, RefreshCw, FileText, BarChart3, PieChart, Repeat, TrendingUp, Lightbulb, ListOrdered, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "../components/v0-ui/surface";

const FEATURE_LIST = [
    { icon: FileText, label: "Financial Health Score & Grade" },
    { icon: BarChart3, label: "Budget vs Actual with Progress Bars" },
    { icon: PieChart, label: "Category Spending Pie Chart" },
    { icon: BarChart3, label: "Top Categories Bar Chart" },
    { icon: Repeat, label: "Recurring Payments Schedule" },
    { icon: TrendingUp, label: "Month-End Forecast & Cashflow" },
    { icon: Lightbulb, label: "AI-Powered Insights" },
    { icon: ListOrdered, label: "Latest 20 Transactions Table" },
];

const PAGE_LIST = [
    { num: "1", title: "Cover Page", desc: "Health score, grade, quick summary", icon: "📄" },
    { num: "2", title: "Budget Analysis", desc: "Budget vs actual, risk indicator", icon: "📊" },
    { num: "3", title: "Spending Analytics", desc: "Category table, pie & bar charts", icon: "🥧" },
    { num: "4", title: "Recurring Payments", desc: "Merchant, frequency, confidence", icon: "🔄" },
    { num: "5", title: "Spending Forecast", desc: "Projections, cashflow, risk", icon: "📈" },
    { num: "6", title: "AI Insights", desc: "Recommendation cards", icon: "💡" },
    { num: "7", title: "Recent Transactions", desc: "Latest 20 with colour coding", icon: "📋" },
];

export default function Report() {
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState("");
    const [progress, setProgress] = useState(0);

    const generateReport = useCallback(async () => {
        setStatus("loading");
        setErrorMsg("");
        setProgress(0);

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

            const url = URL.createObjectURL(blob);
            const today = new Date().toISOString().split("T")[0];
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Finance_X-Ray_Report_${today}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            setTimeout(() => setStatus("success"), 500);
        } catch (err) {
            clearInterval(ticker);
            setStatus("error");
            setErrorMsg("Failed to generate report. Please try again.");
        }
    }, []);

    const reset = () => {
        setStatus("idle");
        setErrorMsg("");
        setProgress(0);
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
                    <p className="mt-1.5 text-muted-foreground">Generate and review your financial reports.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-7">
                    <Reveal>
                        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card)]">
                            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] shadow-sm">
                                <FileText className="size-7 text-[var(--accent)]" />
                            </div>
                            <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Personal Finance Report</h2>
                            <p className="mb-8 leading-relaxed text-muted-foreground">
                                Download your complete financial analysis as a professionally formatted PDF. The report includes charts, tables, AI insights, and forecasts — ready to share or archive.
                            </p>
                            
                            <AnimatePresence mode="wait">
                                {status === "idle" && (
                                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <button
                                            onClick={generateReport}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 font-medium text-white shadow-sm transition-all hover:bg-[var(--accent)]/90 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                                        >
                                            <Download className="size-5" />
                                            Generate PDF Report
                                        </button>
                                    </motion.div>
                                )}
                                
                                {status === "loading" && (
                                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-6">
                                        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
                                            <span className="flex items-center gap-2 text-foreground">
                                                <Loader2 className="size-4 animate-spin text-[var(--accent)]" /> 
                                                Generating your report…
                                            </span>
                                            <span className="text-[var(--accent)]">{progress}%</span>
                                        </div>
                                        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                                            <div
                                                className="h-full rounded-full bg-[var(--accent)] transition-all duration-300 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {progress < 30
                                                ? "Aggregating financial data…"
                                                : progress < 60
                                                ? "Generating charts…"
                                                : progress < 90
                                                ? "Building PDF pages…"
                                                : "Finalizing document…"}
                                        </p>
                                    </motion.div>
                                )}
                                
                                {status === "success" && (
                                    <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-start rounded-xl border border-[var(--positive)]/30 bg-[var(--positive-soft)] p-6">
                                        <div className="mb-4 flex items-center gap-3">
                                            <CheckCircle2 className="size-6 text-[var(--positive)]" />
                                            <h3 className="text-lg font-bold tracking-tight text-[var(--positive)]">Report Downloaded!</h3>
                                        </div>
                                        <p className="mb-6 text-sm font-medium text-[var(--positive)]/80">
                                            Your financial report has been securely saved to your downloads folder.
                                        </p>
                                        <button
                                            onClick={reset}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--surface)] border border-[var(--positive)]/30 px-5 text-sm font-semibold text-[var(--positive)] shadow-sm transition-colors hover:bg-[var(--surface-2)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--positive)]/50"
                                        >
                                            <RefreshCw className="size-4" />
                                            Generate Another
                                        </button>
                                    </motion.div>
                                )}
                                
                                {status === "error" && (
                                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-start rounded-xl border border-[var(--negative)]/30 bg-[var(--negative-soft)] p-6">
                                        <div className="mb-4 flex items-center gap-3">
                                            <AlertCircle className="size-6 text-[var(--negative)]" />
                                            <h3 className="text-lg font-bold tracking-tight text-[var(--negative)]">Generation Failed</h3>
                                        </div>
                                        <p className="mb-6 text-sm font-medium text-[var(--negative)]/80">{errorMsg}</p>
                                        <button
                                            onClick={reset}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--surface)] border border-[var(--negative)]/30 px-5 text-sm font-semibold text-[var(--negative)] shadow-sm transition-colors hover:bg-[var(--surface-2)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--negative)]/50"
                                        >
                                            <RefreshCw className="size-4" />
                                            Try Again
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
                            <h3 className="mb-6 text-lg font-bold tracking-tight">What's Included</h3>
                            <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-x-8">
                                {FEATURE_LIST.map((f, i) => (
                                    <div className="flex items-center gap-3" key={i}>
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)]">
                                            <f.icon className="size-4" />
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">{f.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Reveal>
                </div>

                <div className="space-y-6 lg:col-span-5">
                    <Reveal delay={0.1}>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
                            <h3 className="text-lg font-bold tracking-tight">Report Structure</h3>
                            <p className="mb-6 mt-1 text-sm text-muted-foreground">7-page professional PDF</p>
    
                            <div className="space-y-4">
                                {PAGE_LIST.map((page, i) => (
                                    <div className="flex items-start gap-4" key={i}>
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-xs font-bold text-muted-foreground border border-[var(--border)]">
                                            {page.num}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground leading-snug">{page.title}</p>
                                            <p className="mt-0.5 text-sm text-muted-foreground">{page.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Reveal>

                    <Reveal delay={0.2}>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
                            <h3 className="text-lg font-bold tracking-tight">Report Preview</h3>
                            <p className="mb-6 mt-1 text-sm text-muted-foreground">Visual layout of the generated PDF</p>
                            
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {PAGE_LIST.map((page, i) => (
                                    <div key={i} className="flex h-[150px] w-[100px] shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--border-strong)] bg-white shadow-sm p-2 transition-transform hover:scale-[1.02]">
                                        <div className="mb-2 border-b-2 border-[var(--accent)] pb-1 text-[8px] font-bold text-gray-800 uppercase tracking-wide">
                                            {page.title}
                                        </div>
                                        <div className="flex flex-1 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-2xl">
                                            {page.icon}
                                        </div>
                                        <div className="mt-1.5 text-right text-[7px] font-bold text-gray-500">Page {page.num}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </div>
    );
}
