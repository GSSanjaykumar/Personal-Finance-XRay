"use client"

import { useState } from "react"
import { ToastProvider } from "@/components/ui/toast"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { SettingsPanel } from "@/components/dashboard/settings-panel"
import { HeroAI } from "@/components/dashboard/hero-ai"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { Transactions } from "@/components/dashboard/transactions"
import { Forecast } from "@/components/dashboard/forecast"
import { ReportBanner } from "@/components/dashboard/report-banner"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { SpendDonut } from "@/components/dashboard/spend-donut"
import { BudgetOverview } from "@/components/dashboard/budget-overview"
import { RecurringPayments } from "@/components/dashboard/recurring-payments"

export function DashboardShell() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />

        <div className="lg:pl-[248px]">
          <Topbar onOpenCommand={() => setCommandOpen(true)} />

          <main className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8">
            <header className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle">August 2026</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Good afternoon, Alex</h1>
              <p className="mt-1.5 text-muted-foreground">Here&apos;s your financial X-ray for this month.</p>
            </header>

            <div className="space-y-6">
              <HeroAI />

              <KpiCards />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <Transactions />
                <Forecast />
              </div>

              <ReportBanner />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                <CashflowChart />
                <SpendDonut />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <BudgetOverview />
                <RecurringPayments />
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
