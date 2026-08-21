import type { LucideIcon } from "lucide-react"
import {
  ShoppingCart,
  ArrowDownLeft,
  Smartphone,
  Car,
  Code2,
  Coffee,
} from "lucide-react"

export type Transaction = {
  id: string
  name: string
  category: string
  method: string
  amount: number
  date: string
  pending?: boolean
  icon: LucideIcon
  incoming?: boolean
}

export const transactions: Transaction[] = [
  {
    id: "t1",
    name: "Whole Foods Market",
    category: "Groceries",
    method: "Visa •• 4821",
    amount: -128.44,
    date: "Aug 2",
    icon: ShoppingCart,
  },
  {
    id: "t2",
    name: "Acme Payroll",
    category: "Income",
    method: "ACH deposit",
    amount: 8600,
    date: "Aug 1",
    icon: ArrowDownLeft,
    incoming: true,
  },
  {
    id: "t3",
    name: "Apple Store",
    category: "Electronics",
    method: "Amex •• 1002",
    amount: -1299,
    date: "Jul 31",
    icon: Smartphone,
    pending: true,
  },
  {
    id: "t4",
    name: "Uber",
    category: "Transport",
    method: "Apple Pay",
    amount: -24.9,
    date: "Jul 30",
    icon: Car,
  },
  {
    id: "t5",
    name: "Notion Labs",
    category: "Software",
    method: "Visa •• 4821",
    amount: -16,
    date: "Jul 29",
    icon: Code2,
  },
  {
    id: "t6",
    name: "Blue Bottle Coffee",
    category: "Dining",
    method: "Apple Pay",
    amount: -7.5,
    date: "Jul 29",
    icon: Coffee,
  },
]

export const kpis = [
  {
    id: "net-worth",
    label: "Net worth",
    value: 142860,
    prefix: "$",
    delta: "+4.2%",
    positive: true,
    trend: [120, 122, 119, 126, 131, 129, 136, 138, 135, 141, 143],
  },
  {
    id: "savings-rate",
    label: "Savings rate",
    value: 34,
    suffix: "%",
    delta: "+6 pts",
    positive: true,
    trend: [22, 24, 23, 27, 28, 26, 30, 31, 29, 33, 34],
  },
  {
    id: "safe-to-spend",
    label: "Safe-to-spend",
    value: 2140,
    prefix: "$",
    note: "this week",
    trend: [30, 45, 38, 52, 48, 41, 55, 44, 60, 50, 47],
  },
  {
    id: "health-score",
    label: "Health score",
    value: 78,
    delta: "+3 pts",
    positive: true,
    trend: [62, 64, 63, 67, 69, 68, 72, 74, 73, 76, 78],
  },
] as const

export const forecast = [
  { month: "Aug", value: 42.9 },
  { month: "Sep", value: 45.1 },
  { month: "Oct", value: 47.8 },
  { month: "Nov", value: 50.2 },
  { month: "Dec", value: 52.6 },
  { month: "Jan", value: 55.1 },
]

export const incomeExpense = [
  { month: "Jan", income: 9.2, expense: 6.8 },
  { month: "Feb", income: 9.6, expense: 7.1 },
  { month: "Mar", income: 10.1, expense: 6.9 },
  { month: "Apr", income: 9.8, expense: 7.4 },
  { month: "May", income: 10.6, expense: 7.2 },
  { month: "Jun", income: 10.9, expense: 7.6 },
  { month: "Jul", income: 11.2, expense: 7.3 },
  { month: "Aug", income: 11.0, expense: 7.7 },
  { month: "Sep", income: 11.8, expense: 7.5 },
  { month: "Oct", income: 12.4, expense: 7.9 },
  { month: "Nov", income: 13.1, expense: 8.2 },
  { month: "Dec", income: 12.6, expense: 8.6 },
]

export const spendBreakdown = [
  { name: "Housing", pct: 42, amount: 3234 },
  { name: "Food & Dining", pct: 24, amount: 1848 },
  { name: "Transport", pct: 12, amount: 924 },
  { name: "Subscriptions", pct: 8, amount: 616 },
  { name: "Other", pct: 14, amount: 1078 },
]

export const budgets = [
  { name: "Housing", used: 3200, total: 3400, status: "watch" as const },
  { name: "Food & Dining", used: 1840, total: 1600, status: "over" as const },
  { name: "Transport", used: 920, total: 1200, status: "ontrack" as const },
  { name: "Entertainment", used: 410, total: 600, status: "ontrack" as const },
  { name: "Shopping", used: 780, total: 900, status: "ontrack" as const },
]

export const recurring = [
  { id: "r1", name: "Rent", initials: "RE", cadence: "Monthly", next: "next Sep 1", amount: 3200 },
  { id: "r2", name: "Spotify", initials: "SP", cadence: "Monthly", next: "next Aug 14", amount: 11.99 },
  { id: "r3", name: "iCloud+", initials: "IC", cadence: "Monthly", next: "next Aug 18", amount: 9.99 },
  { id: "r4", name: "Gym Membership", initials: "GM", cadence: "Monthly", next: "next Aug 20", amount: 49 },
  { id: "r5", name: "Adobe CC", initials: "AD", cadence: "Monthly", next: "next Aug 24", amount: 54.99 },
]

export type Notification = {
  id: string
  title: string
  body: string
  time: string
  tone: "positive" | "warning" | "info" | "negative"
  unread: boolean
}

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "Salary detected",
    body: "Acme Payroll deposited $8,600.00 to your checking account.",
    time: "2h ago",
    tone: "positive",
    unread: true,
  },
  {
    id: "n2",
    title: "Budget exceeded",
    body: "Food & Dining is 15% over budget this month ($1,840 / $1,600).",
    time: "5h ago",
    tone: "warning",
    unread: true,
  },
  {
    id: "n3",
    title: "AI found savings",
    body: "Trimming subscriptions could add an estimated $420/month to your runway.",
    time: "Yesterday",
    tone: "info",
    unread: true,
  },
  {
    id: "n4",
    title: "Monthly report ready",
    body: "Your July financial X-ray is ready to view and export.",
    time: "2 days ago",
    tone: "info",
    unread: false,
  },
  {
    id: "n5",
    title: "Credit card due",
    body: "Amex payment of $1,299.00 is due in 4 days.",
    time: "3 days ago",
    tone: "negative",
    unread: false,
  },
]
