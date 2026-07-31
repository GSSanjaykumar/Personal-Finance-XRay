import StatCard from "../ui/StatCard";
import { formatCompact } from "../../utils/formatters";

/**
 * QuickStats — Displays Total Income, Expense, Savings, and Transaction Count.
 * Reads from the dashboard `summary` object.
 * Reuses the existing StatCard component.
 */
export default function QuickStats({ summary }) {
    const {
        total_income = 0,
        total_expense = 0,
        savings = 0,
        transaction_count = 0,
    } = summary || {};

    return (
        <div className="stats-grid" id="quick-stats">
            <StatCard
                title="Total Income"
                value={formatCompact(total_income)}
                icon="💰"
                trend="Credit"
                subtitle="total received"
                color="linear-gradient(135deg, #10B981, #059669)"
            />

            <StatCard
                title="Total Expenses"
                value={formatCompact(total_expense)}
                icon="💸"
                trend="Debit"
                subtitle="total spent"
                color="linear-gradient(135deg, #F43F5E, #E11D48)"
            />

            <StatCard
                title="Net Savings"
                value={formatCompact(savings)}
                icon="🏦"
                trend={savings >= 0 ? "Positive" : "Negative"}
                subtitle="income − expenses"
                color={
                    savings >= 0
                        ? "linear-gradient(135deg, #8B5CF6, #7C3AED)"
                        : "linear-gradient(135deg, #F59E0B, #D97706)"
                }
            />

            <StatCard
                title="Transactions"
                value={transaction_count}
                icon="📄"
                trend="Total"
                subtitle="processed"
                color="linear-gradient(135deg, #3B82F6, #2563EB)"
            />
        </div>
    );
}
