import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getTransactions } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import Pagination from "../components/ui/Pagination";
import { getDisplayMerchant, formatCurrency, formatDate } from "../utils/formatters";
import { FileUp, FileText, X, Loader2, ArrowDownLeft, ArrowUpRight, ShoppingCart, Wallet, Receipt } from "lucide-react";
import { useToast } from "../components/v0-ui/toast";
import { useStatementUpload } from "../hooks/useStatementUpload";
import { motion } from "framer-motion";
import { KpiCards } from "../components/v0-dashboard/kpi-cards";
import { Reveal } from "../components/v0-ui/surface";

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { toast } = useToast();
    const { 
        selectedFile, 
        isUploading, 
        fileInputRef, 
        handleFileSelect, 
        handleUpload, 
        resetSelection 
    } = useStatementUpload({ onSuccess: () => fetchData() });

    // Filters
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [type, setType] = useState("All");
    const [sortBy, setSortBy] = useState("Newest");
    
    // Pagination & Modal
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTxn, setSelectedTxn] = useState(null);
    const rowsPerPage = 20;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTransactions();
            setTransactions(data || []);
        } catch {
            setError("Failed to load transactions.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, category, type, sortBy]);

    const categories = useMemo(() => {
        return ["All", ...new Set(transactions.map((t) => t.category))].sort();
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter((txn) => {
                const merchant = getDisplayMerchant(txn.merchant_name || txn.merchant, txn.raw_description, txn.description).toLowerCase();
                const description = (txn.raw_description || "").toLowerCase();
                const searchLower = search.toLowerCase();

                const matchesSearch = merchant.includes(searchLower) || description.includes(searchLower);
                const matchesCategory = category === "All" || txn.category === category;
                const matchesType = type === "All" || txn.transaction_type === type;

                return matchesSearch && matchesCategory && matchesType;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case "Highest Amount":
                        return Math.abs(b.amount) - Math.abs(a.amount);
                    case "Lowest Amount":
                        return Math.abs(a.amount) - Math.abs(b.amount);
                    case "Oldest":
                        return new Date(a.date) - new Date(b.date);
                    case "Newest":
                    default:
                        return new Date(b.date) - new Date(a.date);
                }
            });
    }, [transactions, search, category, type, sortBy]);

    const summaryKpis = useMemo(() => {
        if (!transactions.length) return [];
        let credits = 0;
        let debits = 0;
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.transaction_type === "Credit" || t.amount > 0) {
                credits += 1;
                totalIncome += Math.abs(t.amount);
            } else {
                debits += 1;
                totalExpense += Math.abs(t.amount);
            }
        });

        return [
            {
                id: "net-worth",
                label: "Total Income",
                value: totalIncome,
                prefix: "₹",
                trend: []
            },
            {
                id: "savings-rate",
                label: "Total Expenses",
                value: totalExpense,
                prefix: "₹",
                trend: []
            },
            {
                id: "safe-to-spend",
                label: "Credits",
                value: credits,
                trend: []
            },
            {
                id: "health-score",
                label: "Debits",
                value: debits,
                trend: []
            }
        ];
    }, [transactions]);

    const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const getTxnIcon = (txn) => {
        const isCredit = txn.transaction_type === "Credit" || txn.amount > 0;
        if (isCredit) return ArrowDownLeft;
        
        const cat = (txn.category || "").toLowerCase();
        if (cat.includes("shopping") || cat.includes("purchase")) return ShoppingCart;
        if (cat.includes("transfer")) return Wallet;
        return Receipt;
    };

    return (
        <div className="space-y-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
                    <p className="mt-1.5 text-muted-foreground">Review and manage all your imported financial activity.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                        type="file" 
                        accept=".pdf,application/pdf" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90 outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--background)]"
                    >
                        <FileUp className="h-4 w-4" />
                        Upload Statement
                    </button>
                </div>
            </header>

            {/* Upload State UI */}
            {selectedFile && (
                <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[200px] sm:max-w-[300px]">
                                {selectedFile.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => handleUpload()}
                            disabled={isUploading}
                            className="flex-1 sm:flex-none inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                "Import Statement"
                            )}
                        </button>
                        <button
                            onClick={resetSelection}
                            disabled={isUploading}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-transparent text-muted-foreground hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
            
            {summaryKpis.length > 0 && !loading && !error && (
                <KpiCards data={summaryKpis} />
            )}

            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
                <input
                    className="h-10 w-[240px] rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                    type="text"
                    placeholder="Search merchant..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                >
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)} 
                    className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                >
                    <option value="All">All Types</option>
                    <option value="Credit">Credit</option>
                    <option value="Debit">Debit</option>
                </select>
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)} 
                    className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                >
                    <option value="Newest">Newest</option>
                    <option value="Oldest">Oldest</option>
                    <option value="Highest Amount">Highest Amount</option>
                    <option value="Lowest Amount">Lowest Amount</option>
                </select>
            </div>

            {loading ? (
                <div className="space-y-6">
                    <Skeleton type="grid" count={1} style={{ marginBottom: '32px' }} />
                    <Skeleton type="card" count={1} style={{ height: '300px' }} />
                </div>
            ) : error ? (
                <ErrorState message={error} onRetry={fetchData} />
            ) : filteredTransactions.length === 0 ? (
                <EmptyState 
                    title={transactions.length === 0 ? "No transactions yet" : "No matching transactions"} 
                    message={transactions.length === 0 ? "Upload a bank statement to start your financial X-ray." : "Try adjusting your filters or search terms."} 
                    icon={transactions.length === 0 ? "📄" : "🔍"}
                    action={transactions.length === 0 ? (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90"
                        >
                            <FileUp className="h-4 w-4" />
                            Upload Statement
                        </button>
                    ) : null}
                />
            ) : (
                <Reveal className="h-full">
                    <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
                        <div className="flex-1 px-3 py-3">
                            {paginatedTransactions.map((t, i) => {
                                const isCredit = t.transaction_type === "Credit" || t.amount > 0;
                                const displayMerchant = getDisplayMerchant(t.merchant_name || t.merchant, t.raw_description, t.description);
                                const Icon = getTxnIcon(t);

                                return (
                                    <motion.button
                                        key={t.id || i}
                                        initial={{ opacity: 0, y: 8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: (i % rowsPerPage) * 0.03 }}
                                        onClick={() => setSelectedTxn(t)}
                                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-[var(--surface-2)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                                    >
                                        <span
                                            className="flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
                                            style={{
                                                background: isCredit ? "var(--positive-soft)" : "var(--surface-3)",
                                                color: isCredit ? "var(--positive)" : "var(--muted)",
                                            }}
                                        >
                                            <Icon className="size-[18px]" />
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-2">
                                                <span className="truncate text-sm font-medium text-foreground">{displayMerchant}</span>
                                            </span>
                                            <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                    {t.category || "Uncategorized"}
                                                </span>
                                                {formatDate(t.date)}
                                            </span>
                                        </span>

                                        <span className="text-right">
                                            <span
                                                className="tabular block text-sm font-semibold"
                                                style={{ color: isCredit ? "var(--positive)" : "var(--foreground)" }}
                                            >
                                                {isCredit ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-muted-foreground">{t.transaction_type}</span>
                                        </span>
                                        <ArrowUpRight className="size-4 -translate-x-1 text-subtle opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                                    </motion.button>
                                );
                            })}
                        </div>
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={setCurrentPage} 
                        />
                    </div>
                </Reveal>
            )}

            {/* Transaction Detail Drawer / Modal */}
            {selectedTxn && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedTxn(null)}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight">Transaction Details</h2>
                            <button 
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-[var(--surface-2)] hover:text-foreground transition-colors"
                                onClick={() => setSelectedTxn(null)} 
                                aria-label="Close modal"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-[var(--border)] pb-3">
                                <span className="text-muted-foreground">Date</span>
                                <strong className="font-medium">{formatDate(selectedTxn.date)}</strong>
                            </div>
                            <div className="flex justify-between border-b border-[var(--border)] pb-3">
                                <span className="text-muted-foreground">Merchant</span>
                                <strong className="font-medium">{getDisplayMerchant(selectedTxn.merchant_name || selectedTxn.merchant, selectedTxn.raw_description, selectedTxn.description)}</strong>
                            </div>
                            <div className="flex justify-between border-b border-[var(--border)] pb-3">
                                <span className="text-muted-foreground">Category</span>
                                <strong className="font-medium">{selectedTxn.category}</strong>
                            </div>
                            <div className="flex justify-between border-b border-[var(--border)] pb-3">
                                <span className="text-muted-foreground">Description</span>
                                <strong className="max-w-[200px] text-right font-medium text-pretty">{selectedTxn.description || selectedTxn.raw_description}</strong>
                            </div>
                            <div className="flex justify-between pb-1">
                                <span className="text-muted-foreground">Amount</span>
                                <strong className={`font-semibold tabular-nums ${selectedTxn.transaction_type === "Credit" || selectedTxn.amount > 0 ? "text-[var(--positive)]" : "text-foreground"}`}>
                                    {selectedTxn.transaction_type === "Credit" || selectedTxn.amount > 0 ? "+" : "-"}{formatCurrency(Math.abs(selectedTxn.amount))}
                                </strong>
                            </div>
                            <div className="flex justify-between pb-1">
                                <span className="text-muted-foreground">Type</span>
                                <strong className="font-medium">{selectedTxn.transaction_type}</strong>
                            </div>
                            <div className="flex justify-between pb-1">
                                <span className="text-muted-foreground">Account</span>
                                <strong className="font-medium">{selectedTxn.account_id || "Main Account"}</strong>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}