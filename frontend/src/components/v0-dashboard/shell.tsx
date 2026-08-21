import { useState } from "react"
import { ToastProvider } from "@/components/v0-ui/toast"
import { Sidebar } from "@/components/v0-dashboard/sidebar"
import { Topbar } from "@/components/v0-dashboard/topbar"
import { CommandPalette } from "@/components/v0-dashboard/command-palette"
import { SettingsPanel } from "@/components/v0-dashboard/settings-panel"
import { HeroAI } from "@/components/v0-dashboard/hero-ai"
import { KpiCards } from "@/components/v0-dashboard/kpi-cards"
import { Transactions } from "@/components/v0-dashboard/transactions"
import { Forecast } from "@/components/v0-dashboard/forecast"
import { ReportBanner } from "@/components/v0-dashboard/report-banner"
import { CashflowChart } from "@/components/v0-dashboard/cashflow-chart"
import { SpendDonut } from "@/components/v0-dashboard/spend-donut"
import { BudgetOverview } from "@/components/v0-dashboard/budget-overview"
import { RecurringPayments } from "@/components/v0-dashboard/recurring-payments"

export function DashboardShell({ data, user }: { data?: any, user?: any }) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />

        <div className="lg:pl-[248px]">
          <Topbar onOpenCommand={() => setCommandOpen(true)} user={user} />

          <main className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8">
            <header className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle">August 2026</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Good afternoon, Alex</h1>
              <p className="mt-1.5 text-muted-foreground">Here&apos;s your financial X-ray for this month.</p>
            </header>

            <div className="space-y-6">
              <HeroAI />

              <KpiCards data={data?.kpis} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <Transactions data={data?.transactions} />
                <Forecast data={data?.forecast} />
              </div>

              <ReportBanner />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <CashflowChart data={data?.incomeExpense} />
                <SpendDonut data={data?.spendBreakdown} />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <BudgetOverview data={data?.budgets} />
                <RecurringPayments data={data?.recurring} />
              </div>
            </div>
          </main>
        </div>

        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </ToastProvider>
  )
}
