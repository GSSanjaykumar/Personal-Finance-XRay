import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  LineChart,
  ArrowLeftRight,
  Tag,
  Sparkles,
  Bot,
  Wallet,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Scan,
  FileUp,
  Loader2,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/v0-lib/utils"
import { useStatementUpload } from "../../hooks/useStatementUpload"

type NavItem = { label: string; path: string; icon: LucideIcon; badge?: number }

const nav: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Analytics", path: "/analytics", icon: LineChart },
  { label: "Transactions", path: "/transactions", icon: ArrowLeftRight },
  { label: "Categories", path: "/categories", icon: Tag },
  { label: "AI Insights", path: "/insights", icon: Sparkles, badge: 3 },
  { label: "AI Assistant", path: "/chat", icon: Bot },
  { label: "Budget", path: "/budget", icon: Wallet },
  { label: "Forecast", path: "/forecast", icon: TrendingUp },
  { label: "Reports", path: "/report", icon: FileText },
]

export function Sidebar({ onOpenSettings, onLogout }: { onOpenSettings: () => void, onLogout?: () => void }) {
  const location = useLocation()
  
  const { 
    isUploading, 
    fileInputRef, 
    handleFileSelect 
  } = useStatementUpload({ onSuccess: () => window.location.reload() });

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 lg:flex">
      <div className="flex items-center gap-3 px-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_6px_18px_-6px_var(--accent)]">
          <Scan className="size-5" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">Finance X-Ray</span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--border-strong)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              {isActive && (
                <motion.span
                  layoutId="nav-bar"
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <item.icon
                className={cn(
                  "relative z-10 size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive && "text-[var(--accent)]",
                )}
              />
              <span className="relative z-10 flex-1 text-left font-medium">{item.label}</span>
              {item.badge && (
                <span className="relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-semibold text-[var(--accent-foreground)]">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-1">
        <Link
          to="/settings"
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200",
            location.pathname === "/settings" ? "text-foreground bg-[var(--surface-3)]" : "text-muted-foreground hover:bg-[var(--surface-3)] hover:text-foreground"
          )}
        >
          <Settings className="size-[18px]" />
          <span className="font-medium">Settings</span>
        </Link>
        
        <input 
          type="file" 
          accept=".pdf,application/pdf" 
          ref={fileInputRef} 
          onChange={(e) => handleFileSelect(e, true)} 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-[var(--surface-3)] hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="size-[18px] animate-spin text-[var(--accent)]" />
          ) : (
            <FileUp className="size-[18px] transition-transform duration-200 group-hover:-translate-y-0.5" />
          )}
          <span className="font-medium">{isUploading ? "Uploading..." : "Upload Statement"}</span>
        </button>

        <button onClick={onLogout} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-[var(--surface-3)] hover:text-foreground">
          <LogOut className="size-[18px] transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
