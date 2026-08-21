import React, { useState } from "react";
import { formatCurrency, getDisplayMerchant, formatDate } from "../../utils/formatters";
import { X } from "lucide-react";

const TransactionTable = React.memo(({ transactions = [], title = "Recent Transactions" }) => {
    const [selectedTxn, setSelectedTxn] = useState(null);

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--border)] text-left text-muted-foreground">
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Merchant</th>
                            <th className="pb-3 font-medium">Category</th>
                            <th className="pb-3 text-right font-medium">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((txn, index) => {
                            const displayMerchant = getDisplayMerchant(txn.merchant_name || txn.merchant, txn.raw_description, txn.description);
                            const isCredit = txn.transaction_type === "Credit" || txn.amount > 0;

                            return (
                                <tr 
                                    key={index} 
                                    onClick={() => setSelectedTxn(txn)} 
                                    className="group cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors"
                                    tabIndex="0"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setSelectedTxn(txn);
                                        }
                                    }}
                                >
                                    <td className="py-3 text-muted-foreground">{formatDate(txn.date)}</td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                                                {displayMerchant.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">{displayMerchant}</div>
                                                <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                    {txn.description || txn.raw_description || ""}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wider uppercase ${isCredit ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--surface-3)] text-muted-foreground'}`}>
                                            {txn.category}
                                        </span>
                                    </td>
                                    <td className={`py-3 text-right tabular-nums font-medium ${isCredit ? 'text-[var(--positive)]' : 'text-foreground'}`}>
                                        {isCredit ? "+" : "-"}{formatCurrency(Math.abs(txn.amount))}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Transaction Detail Drawer / Modal */}
            {selectedTxn && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedTxn(null)}
                >
                    <div 
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
                                    {formatCurrency(Math.abs(selectedTxn.amount))}
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
                    </div>
                </div>
            )}
        </div>
    );
});

export default TransactionTable;