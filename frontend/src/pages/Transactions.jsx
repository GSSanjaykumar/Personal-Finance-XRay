import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import TransactionTable from "../components/ui/TransactionTable";
import { getTransactions, uploadStatement } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import Pagination from "../components/ui/Pagination";
import { getDisplayMerchant } from "../utils/formatters";
import { FileUp, FileText, X, Loader2 } from "lucide-react";
import { useToast } from "../components/v0-ui/toast";

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
            toast({ tone: "warning", title: "Invalid File", description: "Please select a PDF bank statement." });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        setIsUploading(true);
        try {
            const data = await uploadStatement(selectedFile);
            toast({ 
                tone: "success", 
                title: "Statement uploaded successfully", 
                description: `${data.transactions?.length || 0} transactions imported successfully.` 
            });
            setSelectedFile(null);
            fetchData();
        } catch (err) {
            if (err.response?.status === 409) {
                toast({ tone: "warning", title: "Duplicate Statement", description: "This statement has already been imported." });
            } else if (err.response?.status === 400) {
                toast({ tone: "error", title: "Unsupported Statement", description: "Finance X-Ray couldn't extract transactions from this statement." });
            } else {
                toast({ tone: "error", title: "Upload Failed", description: "An error occurred while uploading the statement." });
            }
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // Filters
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [type, setType] = useState("All");
    const [sortBy, setSortBy] = useState("Newest");
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
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

    // Reset pagination when filters change
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
                        return b.amount - a.amount;
                    case "Lowest Amount":
                        return a.amount - b.amount;
                    case "Oldest":
                        return new Date(a.date) - new Date(b.date);
                    case "Newest":
                    default:
                        return new Date(b.date) - new Date(a.date);
                }
            });
    }, [transactions, search, category, type, sortBy]);

    // Pagination slice
    const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    return (
        <div className="space-y-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
                    <p className="mt-1.5 text-muted-foreground">View and search your complete transaction history.</p>
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
                <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                            onClick={handleUpload}
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
                            onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            disabled={isUploading}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-transparent text-muted-foreground hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
            
            <div className="mb-6 flex flex-wrap items-center gap-3">
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
                    <Skeleton type="table" count={1} />
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
                <div className="space-y-6">
                    <TransactionTable transactions={paginatedTransactions} title={null} />
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={setCurrentPage} 
                    />
                </div>
            )}
        </div>
    );
}