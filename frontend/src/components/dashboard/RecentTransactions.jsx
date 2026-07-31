/**
 * RecentTransactions — Displays the latest 10 transactions.
 * Uses getDisplayMerchant to normalize "Unknown Merchant" entries.
 * Credit amounts shown in green, Debit in red.
 */
import { getDisplayMerchant, formatCurrency, formatDate } from "../../utils/formatters";

export default function RecentTransactions({ transactions }) {
    const items = Array.isArray(transactions) ? transactions : [];

    if (items.length === 0) {
        return (
            <div className="table-card" id="recent-transactions">
                <h3>Recent Transactions</h3>
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No transactions found.</p>
                    <small>Upload a bank statement to view your transactions.</small>
                </div>
            </div>
        );
    }

    return (
        <div className="table-card" id="recent-transactions">
            <h3>Recent Transactions</h3>

            <table className="transaction-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Merchant</th>
                        <th>Category</th>
                        <th style={{ textAlign: "right" }}>Amount</th>
                        <th style={{ textAlign: "right" }}>Type</th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((txn, index) => {
                        const isCredit = txn.transaction_type === "Credit";
                        const displayMerchant = getDisplayMerchant(
                            txn.merchant || txn.merchant_name,
                            txn.raw_description,
                            txn.description
                        );

                        return (
                            <tr key={index}>
                                <td>{formatDate(txn.date)}</td>

                                <td>
                                    <div className="merchant-cell">
                                        <div className="merchant-avatar">
                                            {displayMerchant.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="merchant-name">
                                                {displayMerchant}
                                            </div>
                                            <div className="merchant-sub">
                                                {txn.description}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <span
                                        className={`category-badge ${
                                            isCredit ? "income" : ""
                                        }`}
                                    >
                                        {txn.category}
                                    </span>
                                </td>

                                <td style={{ textAlign: "right" }}>
                                    <span
                                        className={
                                            isCredit
                                                ? "amount-credit"
                                                : "amount-debit"
                                        }
                                    >
                                        {isCredit ? "+" : "-"}{formatCurrency(txn.amount)}
                                    </span>
                                </td>

                                <td style={{ textAlign: "right" }}>
                                    <span
                                        className={`type-badge ${
                                            isCredit
                                                ? "type-credit"
                                                : "type-debit"
                                        }`}
                                    >
                                        {txn.transaction_type}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
