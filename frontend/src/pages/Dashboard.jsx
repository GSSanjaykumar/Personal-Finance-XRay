import { useEffect, useState, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getDashboard, getForecast, getTransactions } from "../api/financeApi";

// Import Vercel UI components
import { HeroAI } from "../components/v0-dashboard/hero-ai";
import { KpiCards } from "../components/v0-dashboard/kpi-cards";
import { Transactions } from "../components/v0-dashboard/transactions";
import { Forecast } from "../components/v0-dashboard/forecast";
import { ReportBanner } from "../components/v0-dashboard/report-banner";
import { CashflowChart } from "../components/v0-dashboard/cashflow-chart";
import { SpendDonut } from "../components/v0-dashboard/spend-donut";
import { BudgetOverview } from "../components/v0-dashboard/budget-overview";
import { RecurringPayments } from "../components/v0-dashboard/recurring-payments";

import { kpis as mockKpis } from "../v0-lib/data";

import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";

import { ArrowDownLeft, ShoppingCart, Smartphone, Car, Code2, Coffee } from "lucide-react";

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [transactionsData, setTransactionsData] = useState([]);
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
            setTransactionsData(txnsResult || []);
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

    // Loading & Error states
    if (loading) {
        return (
            <div style={{ marginTop: '24px' }}>
                <Skeleton type="grid" count={1} style={{ marginBottom: '32px' }} />
                <Skeleton type="card" count={1} style={{ height: '200px', marginBottom: '32px' }} />
                <Skeleton type="table" count={1} />
            </div>
        );
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchDashboard} />;
    }

    const isEmpty = !data || data?.summary?.transaction_count === 0;

    if (isEmpty) {
        return (
            <EmptyState
                title="No Financial Data Yet"
                message="Upload your bank statement PDF to unlock your complete financial analysis — insights, budgets, recurring payments and more."
                icon="📂"
            />
        );
    }

    // ── DATA MAPPING FOR VERCEL COMPONENTS ────────────────────────────

    // Map KPIs
    const mappedKpis = [
        {
            id: "net-worth",
            label: "Net savings",
            value: data.summary.savings || 0,
            prefix: "₹",
            delta: "", // Could compute delta if backend provided previous month
            positive: data.summary.savings >= 0,
            trend: mockKpis[0].trend, // Mock trend lines as backend doesn't provide them yet
        },
        {
            id: "savings-rate",
            label: "Savings rate",
            value: Math.round(((data.summary.savings || 0) / (data.summary.total_income || 1)) * 100),
            suffix: "%",
            delta: "",
            positive: true,
            trend: mockKpis[1].trend,
        },
        {
            id: "safe-to-spend",
            label: "Total Income",
            value: data.summary.total_income || 0,
            prefix: "₹",
            note: "this month",
            trend: mockKpis[2].trend,
        },
        {
            id: "health-score",
            label: "Health score",
            value: data.financial_health?.score || 0,
            delta: "",
            positive: true,
            trend: mockKpis[3].trend,
        },
    ];

    // Map Transactions
    const mappedTransactions = transactionsData?.length > 0 ? transactionsData.slice(0, 5).map((t, i) => ({
        id: t.id || `txn-${i}`,
        name: t.merchant_name || t.merchant || 'Unknown',
        category: t.category || 'Uncategorized',
        method: "Card/Bank",
        amount: t.amount,
        date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        icon: t.amount > 0 ? ArrowDownLeft : ShoppingCart,
        incoming: t.amount > 0
    })) : [];

    // Map Forecast
    const mappedForecast = forecastData?.monthly_spending?.length > 0 ? forecastData.monthly_spending.map(f => ({
        month: new Date(f.month).toLocaleDateString('en-US', { month: 'short' }),
        value: f.amount / 1000 // scaling to K for chart readability
    })) : [];

    // Map Income vs Expense from transactionsData
    let mappedIE = [];
    if (transactionsData?.length > 0) {
        const monthMap = {};
        transactionsData.forEach(txn => {
            const date = new Date(txn.date);
            const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
            if (!monthMap[monthKey]) {
                monthMap[monthKey] = { month: monthKey, income: 0, expense: 0, sortKey: date.getTime() };
            }
            if (txn.transaction_type === "Credit" || txn.amount > 0) {
                monthMap[monthKey].income += Math.abs(txn.amount);
            } else {
                monthMap[monthKey].expense += Math.abs(txn.amount);
            }
        });
        mappedIE = Object.values(monthMap)
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(m => ({
                month: m.month,
                income: m.income / 1000,
                expense: m.expense / 1000
            }));
    } else {
        mappedIE = [];
    }

    // Map Spend Donut from transactionsData
    let mappedDonut = [];
    if (transactionsData?.length > 0) {
        const catMap = {};
        transactionsData
            .filter(t => t.transaction_type === "Debit" || t.amount < 0)
            .forEach(txn => {
                const cat = txn.category || "Uncategorized";
                catMap[cat] = (catMap[cat] || 0) + Math.abs(txn.amount);
            });
        
        mappedDonut = Object.entries(catMap)
            .map(([name, amount]) => ({
                name,
                amount,
                pct: Math.round((amount / (data.summary?.total_expense || 1)) * 100)
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    } else {
        mappedDonut = [];
    }

    // Map Budgets
    const mappedBudgets = data.budget?.category_budgets?.length > 0 ? data.budget.category_budgets.map(b => ({
        name: b.category,
        used: b.spent,
        total: b.allocated,
        status: b.spent > b.allocated ? "over" : (b.spent > b.allocated * 0.8 ? "watch" : "ontrack")
    })) : [];

    // Map Recurring
    const mappedRecurring = data.recurring?.length > 0 ? data.recurring.map((r, i) => ({
        id: `rec-${i}`,
        name: r.merchant,
        initials: r.merchant.substring(0, 2).toUpperCase(),
        cadence: r.frequency,
        next: "Upcoming",
        amount: r.average_amount || 0
    })) : [];

    return (
        <div className="space-y-6">
            <header className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Good afternoon, {user?.name || "Sanjay"}</h1>
              <p className="mt-1.5 text-muted-foreground">Here&apos;s your financial X-ray for this month.</p>
            </header>

            <HeroAI 
                insights={data.financial_health?.insights || []} 
                totalSavings={data.summary?.savings || 0}
                totalExpense={data.summary?.total_expense || 0}
            />

            <KpiCards data={mappedKpis} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <Transactions data={mappedTransactions} />
                <Forecast data={mappedForecast} />
            </div>

            <ReportBanner />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <CashflowChart data={mappedIE} />
                <SpendDonut data={mappedDonut} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <BudgetOverview data={mappedBudgets} />
                <RecurringPayments data={mappedRecurring} />
            </div>
        </div>
    );
}
