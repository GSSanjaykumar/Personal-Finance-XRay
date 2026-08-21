import fs from 'fs';

const modifications = [
  {
    file: './src/components/v0-dashboard/kpi-cards.tsx',
    replace: [
      { from: 'export function KpiCards() {', to: 'export function KpiCards({ data = kpis }: { data?: any }) {' },
      { from: 'kpis.map((k, i) => {', to: 'data.map((k: any, i: number) => {' }
    ]
  },
  {
    file: './src/components/v0-dashboard/transactions.tsx',
    replace: [
      { from: 'export function Transactions() {', to: 'export function Transactions({ data = transactions }: { data?: any }) {' },
      { from: 'transactions.map(', to: 'data.map(' }
    ]
  },
  {
    file: './src/components/v0-dashboard/forecast.tsx',
    replace: [
      { from: 'export function Forecast() {', to: 'export function Forecast({ data = forecast }: { data?: any }) {' },
      { from: 'data={forecast}', to: 'data={data}' }
    ]
  },
  {
    file: './src/components/v0-dashboard/cashflow-chart.tsx',
    replace: [
      { from: 'export function CashflowChart() {', to: 'export function CashflowChart({ data = incomeExpense }: { data?: any }) {' },
      { from: 'data={incomeExpense}', to: 'data={data}' }
    ]
  },
  {
    file: './src/components/v0-dashboard/spend-donut.tsx',
    replace: [
      { from: 'export function SpendDonut() {', to: 'export function SpendDonut({ data = spendBreakdown }: { data?: any }) {' },
      { from: 'data={spendBreakdown}', to: 'data={data}' },
      { from: 'spendBreakdown.reduce(', to: 'data.reduce(' },
      { from: 'spendBreakdown.map(', to: 'data.map(' }
    ]
  },
  {
    file: './src/components/v0-dashboard/budget-overview.tsx',
    replace: [
      { from: 'export function BudgetOverview() {', to: 'export function BudgetOverview({ data = budgets }: { data?: any }) {' },
      { from: 'budgets.map(', to: 'data.map(' }
    ]
  },
  {
    file: './src/components/v0-dashboard/recurring-payments.tsx',
    replace: [
      { from: 'export function RecurringPayments() {', to: 'export function RecurringPayments({ data = recurring }: { data?: any }) {' },
      { from: 'recurring.map(', to: 'data.map(' }
    ]
  },
  {
    file: './src/components/v0-dashboard/topbar.tsx',
    replace: [
      { from: 'export function Topbar({ onOpenCommand }: { onOpenCommand: () => void }) {', to: 'export function Topbar({ onOpenCommand, user }: { onOpenCommand: () => void, user?: any }) {' },
      { from: '>Alex Rivera<', to: '>{user?.name || "Alex Rivera"}<' },
      { from: '>AR<', to: '>{user?.name ? user.name.substring(0, 2).toUpperCase() : "AR"}<' }
    ]
  },
  {
    file: './src/components/v0-dashboard/shell.tsx',
    replace: [
      { from: 'export function DashboardShell() {', to: 'export function DashboardShell({ data, user }: { data?: any, user?: any }) {' },
      { from: '<Topbar onOpenCommand={() => setCommandOpen(true)} />', to: '<Topbar onOpenCommand={() => setCommandOpen(true)} user={user} />' },
      { from: '<KpiCards />', to: '<KpiCards data={data?.kpis} />' },
      { from: '<Transactions />', to: '<Transactions data={data?.transactions} />' },
      { from: '<Forecast />', to: '<Forecast data={data?.forecast} />' },
      { from: '<CashflowChart />', to: '<CashflowChart data={data?.incomeExpense} />' },
      { from: '<SpendDonut />', to: '<SpendDonut data={data?.spendBreakdown} />' },
      { from: '<BudgetOverview />', to: '<BudgetOverview data={data?.budgets} />' },
      { from: '<RecurringPayments />', to: '<RecurringPayments data={data?.recurring} />' }
    ]
  }
];

modifications.forEach(mod => {
  let content = fs.readFileSync(mod.file, 'utf8');
  mod.replace.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  fs.writeFileSync(mod.file, content, 'utf8');
});

console.log("Props migration complete.");
