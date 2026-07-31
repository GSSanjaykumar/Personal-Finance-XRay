import React, { useState } from "react";
import { formatCurrency, getDisplayMerchant, formatDate } from "../../utils/formatters";

const TransactionTable = React.memo(({ transactions = [], title = "Recent Transactions" }) => {
    const [selectedTxn, setSelectedTxn] = useState(null);

    return (
        <div className="table-card">
            {title && <h3>{title}</h3>}

            <table className="transaction-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Merchant</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((txn, index) => {
                        const displayMerchant = getDisplayMerchant(txn.merchant_name || txn.merchant, txn.raw_description, txn.description);
                        const isCredit = txn.transaction_type === "Credit";

                        return (
                            <tr 
                                key={index} 
                                onClick={() => setSelectedTxn(txn)} 
                                style={{ cursor: "pointer" }}
                                tabIndex="0"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setSelectedTxn(txn);
                                    }
                                }}
                            >
                                <td>{formatDate(txn.date)}</td>
                                <td>
                                    <div className="merchant-cell">
                                        <div className="merchant-avatar">
                                            {displayMerchant.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="merchant-name">{displayMerchant}</div>
                                            <div className="merchant-sub">{txn.description || txn.raw_description || ""}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`category-badge ${isCredit ? "income" : ""}`}>
                                        {txn.category}
                                    </span>
                                </td>
                                <td>
                                    <span className={isCredit ? "amount-credit" : "amount-debit"}>
                                        {isCredit ? "+" : "-"}{formatCurrency(txn.amount)}
                                    </span>
                                </td>
                                <td>
                                    <span className={`type-badge ${isCredit ? "type-credit" : "type-debit"}`}>
                                        {txn.transaction_type}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Transaction Detail Drawer / Modal */}
            {selectedTxn && (
                <div className="modal-overlay" onClick={() => setSelectedTxn(null)}>
                    <div className="modal-content txn-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Transaction Details</h2>
                            <button className="close-btn" onClick={() => setSelectedTxn(null)} aria-label="Close modal">✖</button>
                        </div>
                        <div className="modal-body txn-details-body">
                            <div className="txn-detail-row">
                                <span>Date</span>
                                <strong>{formatDate(selectedTxn.date)}</strong>
                            </div>
                            <div className="txn-detail-row">
                                <span>Merchant</span>
                                <strong>{getDisplayMerchant(selectedTxn.merchant_name || selectedTxn.merchant, selectedTxn.raw_description, selectedTxn.description)}</strong>
                            </div>
                            <div className="txn-detail-row">
                                <span>Category</span>
                                <strong>{selectedTxn.category}</strong>
                            </div>
                            <div className="txn-detail-row">
                                <span>Description</span>
                                <strong>{selectedTxn.description || selectedTxn.raw_description}</strong>
                            </div>
                            <div className="txn-detail-row">
                                <span>Amount</span>
                                <strong className={selectedTxn.transaction_type === "Credit" ? "amount-credit" : "amount-debit"}>
                                    {formatCurrency(selectedTxn.amount)}
                                </strong>
                            </div>
                            <div className="txn-detail-row">
                                <span>Type</span>
                                <strong>{selectedTxn.transaction_type}</strong>
                            </div>
                            {selectedTxn.bank_name && (
                                <div className="txn-detail-row">
                                    <span>Bank</span>
                                    <strong>{selectedTxn.bank_name}</strong>
                                </div>
                            )}
                            {selectedTxn.balance !== undefined && selectedTxn.balance !== null && (
                                <div className="txn-detail-row">
                                    <span>Balance After</span>
                                    <strong>{formatCurrency(selectedTxn.balance)}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default TransactionTable;