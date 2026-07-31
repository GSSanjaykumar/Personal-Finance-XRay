import { useEffect, useState, useCallback } from "react";

import Navbar from "../components/layout/Navbar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import QuickStats from "../components/dashboard/QuickStats";
import HealthScoreCard from "../components/dashboard/HealthScoreCard";
import BudgetOverview from "../components/dashboard/BudgetOverview";
import RecurringWidget from "../components/dashboard/RecurringWidget";
import AIInsightsWidget from "../components/dashboard/AIInsightsWidget";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import DashboardCharts from "../components/dashboard/DashboardCharts";
import ForecastWidget from "../components/dashboard/ForecastWidget";
import ReportCard from "../components/dashboard/ReportCard";

import { getDashboard, getForecast, getTransactions } from "../api/financeApi";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";

/**
 * Dashboard page — consumes GET /dashboard.
 * FIX: Also fetches /transactions to pass to DashboardCharts so
 * MonthlyTrendChart and IncomeExpenseChart receive proper data.
 */
export default function Dashboard() {
    const [data, setData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [dashResult, forecastResult, txnsResult] = await Promise.all([
                getDashboard(),
                getForecast(),
                getTransactions(),
            ]);
            setData(dashResult);
            setForecastData(forecastResult);
            setTransactions(txnsResult || []);
            setLastUpdated(new Date().toISOString());
        } catch (err) {
            console.error("Dashboard fetch failed:", err);
            setError("Unable to load dashboard. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // ── Loading state — skeleton loaders ────────────────────────────────
    if (loading) {
        return (
            <>
                <Navbar />
                <div style={{ marginTop: '24px' }}>
                    <Skeleton type="grid" count={1} style={{ marginBottom: '32px' }} />
                    <Skeleton type="card" count={1} style={{ height: '200px', marginBottom: '32px' }} />
                    <Skeleton type="table" count={1} />
                </div>
            </>
        );
    }

    // ── Error state ─────────────────────────────────────────────────────
    if (error) {
        return (
            <>
                <Navbar />
                <ErrorState message={error} onRetry={fetchDashboard} />
            </>
        );
    }

    const isEmpty =
        !data || data?.summary?.transaction_count === 0;

    // ── Empty state ─────────────────────────────────────────────────────
    if (isEmpty) {
        return (
            <>
                <Navbar />
                <DashboardHeader lastUpdated={lastUpdated} />
                <EmptyState
                    title="No Financial Data Yet"
                    message="Upload your bank statement PDF to unlock your complete financial analysis — insights, budgets, recurring payments and more."
                    icon="📂"
                />
            </>
        );
    }

    const hasChartData = data.analytics?.spending?.by_category &&
        Object.keys(data.analytics.spending.by_category).length > 0;

    // ── Full dashboard ───────────────────────────────────────────────────
    return (
        <>
            <Navbar />

            <DashboardHeader lastUpdated={lastUpdated} />

            {/* 1. KPIs */}
            <QuickStats summary={data.summary} />

            {/* 2. Charts & Category Analysis */}
            {hasChartData && (
                <DashboardCharts
                    financeData={{
                        summary: {
                            income: data.summary.total_income,
                            expense: data.summary.total_expense,
                            savings: data.summary.savings,
                            transactions: data.summary.transaction_count,
                        },
                        spending: data.analytics.spending,
                    }}
                    transactions={transactions}
                />
            )}

            {/* 3. Budget Overview */}
            <div className="dashboard-two-col">
                <BudgetOverview budget={data.budget} />
                <RecurringWidget recurring={data.recurring} />
            </div>

            {/* 4. Recent Transactions */}
            <RecentTransactions transactions={data.recent_transactions} />

            {/* 5. Insights & Remaining Widgets */}
            <AIInsightsWidget insights={data.insights} />
            <ForecastWidget forecast={forecastData} />
            <HealthScoreCard financialHealth={data.financial_health} />
            <ReportCard />
        </>
    );
}
