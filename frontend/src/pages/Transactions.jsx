import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../components/layout/Navbar";
import TransactionTable from "../components/ui/TransactionTable";
import { getTransactions } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import Pagination from "../components/ui/Pagination";
import { getDisplayMerchant } from "../utils/formatters";

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        <>
            <Navbar />
            
            <div className="page-header">
                <div>
                    <h1>Transactions</h1>
                    <p className="subtitle">View and search your complete transaction history.</p>
                </div>

                <div className="filters">
                    <input
                        className="search-box"
                        type="text"
                        placeholder="Search merchant..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="filter-select">
                        <option value="All">All Types</option>
                        <option value="Credit">Credit</option>
                        <option value="Debit">Debit</option>
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                        <option value="Newest">Newest</option>
                        <option value="Oldest">Oldest</option>
                        <option value="Highest Amount">Highest Amount</option>
                        <option value="Lowest Amount">Lowest Amount</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ marginTop: '24px' }}>
                    <Skeleton type="table" count={1} />
                </div>
            ) : error ? (
                <ErrorState message={error} onRetry={fetchData} />
            ) : filteredTransactions.length === 0 ? (
                <EmptyState 
                    title="No matching transactions" 
                    message="Try adjusting your filters or search terms." 
                    icon="🔍"
                />
            ) : (
                <>
                    <TransactionTable transactions={paginatedTransactions} title={null} />
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={setCurrentPage} 
                    />
                </>
            )}
        </>
    );
}