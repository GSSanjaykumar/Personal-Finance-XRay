import { useTheme } from "../components/v0-dashboard/theme-provider";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Check, LogOut, Trash2, Bell, Shield, User, Palette, Globe, AlertTriangle } from "lucide-react";
import { cn } from "../v0-lib/utils";
import { Reveal } from "../components/v0-ui/surface";

const accents = [
    { id: "midnight", label: "Midnight Blue", swatch: "#5b7cfa" },
    { id: "green", label: "Green", swatch: "#10b981" },
    { id: "violet", label: "Violet", swatch: "#7c5cff" },
];

const densities = [
    { id: "comfortable", label: "Comfortable" },
    { id: "compact", label: "Compact" },
];

const currencies = ["USD", "EUR", "GBP", "INR", "JPY"];
const languages = ["English", "Español", "Français", "Deutsch"];

function SectionCard({ title, desc, icon: Icon, children }) {
    return (
        <Reveal>
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)] md:p-8">
                <div className="w-full shrink-0 md:w-64">
                    <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)] shadow-sm">
                        <Icon className="size-5" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
                    {desc && <p className="mt-2 text-sm font-medium text-muted-foreground leading-relaxed">{desc}</p>}
                </div>
                <div className="w-full flex-1 space-y-6 md:mt-1">
                    {children}
                </div>
            </div>
        </Reveal>
    );
}

export default function Settings() {
    const { accent, setAccent, density, setDensity, motion: themeMotion, setMotion, currency, setCurrency } = useTheme();
    const { user, logout } = useContext(AuthContext);

    const initials = user?.name ? String(user.name).substring(0, 2).toUpperCase() : "US";

    return (
        <div className="space-y-6 pb-12">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between shrink-0 mb-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
                    <p className="mt-1.5 text-muted-foreground">Manage your account, preferences, and personalization.</p>
                </div>
            </header>

            <div className="space-y-6">
                
                {/* Account Section */}
                <SectionCard title="Account" desc="Your personal profile information." icon={User}>
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5 transition-colors hover:border-[var(--border-strong)]">
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 text-xl font-bold text-[var(--accent)] shadow-sm">
                            {initials}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold tracking-tight text-foreground">{user?.name || "User"}</h4>
                            <p className="text-sm font-medium text-muted-foreground">{user?.email || "user@example.com"}</p>
                            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground shadow-sm">
                                <Shield className="size-3.5 text-[var(--accent)]" /> Free Plan
                            </div>
                        </div>
                    </div>
                    <div className="flex">
                        <button 
                            onClick={logout}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--negative)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--negative)]/50"
                        >
                            <LogOut className="size-4" />
                            Log out of all devices
                        </button>
                    </div>
                </SectionCard>

                {/* Appearance Section */}
                <SectionCard title="Appearance" desc="Customize the look and feel of the dashboard." icon={Palette}>
                    <div className="space-y-8">
                        <div>
                            <label className="mb-3 block text-sm font-bold text-foreground">Accent Color</label>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {accents.map((a) => (
                                    <button
                                        key={a.id}
                                        onClick={() => setAccent(a.id)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50",
                                            accent === a.id
                                                ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm"
                                                : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]"
                                        )}
                                    >
                                        <span className="size-5 shrink-0 rounded-full ring-2 ring-[var(--surface)] shadow-sm" style={{ background: a.swatch }} />
                                        <span className={`flex-1 text-sm font-bold ${accent === a.id ? 'text-[var(--accent)]' : 'text-foreground'}`}>{a.label}</span>
                                        {accent === a.id && <Check className="size-4.5 text-[var(--accent)]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-sm font-bold text-foreground">Layout Density</label>
                            <div className="flex gap-4">
                                {densities.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDensity(d.id)}
                                        className={cn(
                                            "flex-1 rounded-xl border p-3 text-sm font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50",
                                            density === d.id
                                                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm"
                                                : "border-[var(--border)] bg-[var(--surface-2)] text-muted-foreground hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-foreground"
                                        )}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5 transition-colors hover:border-[var(--border-strong)]">
                            <div>
                                <h4 className="text-sm font-bold text-foreground">Reduced Motion</h4>
                                <p className="text-xs font-medium text-muted-foreground mt-1">Minimize animations for a calmer experience.</p>
                            </div>
                            <button
                                onClick={() => setMotion(!themeMotion)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50",
                                    !themeMotion ? "bg-[var(--accent)]" : "bg-[var(--surface-3)] border border-[var(--border-strong)]"
                                )}
                            >
                                <span className={cn(
                                    "inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform duration-300",
                                    !themeMotion ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>
                    </div>
                </SectionCard>

                {/* Regional Section */}
                <SectionCard title="Regional" desc="Language and currency formatting preferences." icon={Globe}>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-foreground">Currency</label>
                            <select 
                                value={currency} 
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 text-sm font-medium text-foreground outline-none transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                            >
                                {currencies.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-foreground">Language</label>
                            <select 
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 text-sm font-medium text-foreground outline-none transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                                defaultValue="English"
                            >
                                {languages.map((l) => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </SectionCard>

                {/* Notifications Section */}
                <SectionCard title="Notifications" desc="Choose what we update you on." icon={Bell}>
                    <div className="flex flex-col gap-3">
                        {["Budget alerts", "Weekly AI insights", "Monthly reports", "Unusual spending alerts"].map((label, i) => (
                            <label key={i} className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]">
                                <div className="flex items-center gap-3">
                                    <Bell className="size-4.5 text-muted-foreground" />
                                    <span className="text-sm font-bold text-foreground">{label}</span>
                                </div>
                                <input type="checkbox" defaultChecked={i !== 2} className="size-4.5 rounded border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--accent)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-2)] transition-shadow" />
                            </label>
                        ))}
                    </div>
                </SectionCard>

                {/* Danger Zone */}
                <SectionCard title="Danger Zone" desc="Destructive actions for your account." icon={AlertTriangle}>
                    <div className="rounded-xl border border-[var(--negative)]/30 bg-[var(--negative-soft)] p-6">
                        <h4 className="text-base font-bold tracking-tight text-[var(--negative)]">Delete Account</h4>
                        <p className="mt-1.5 text-sm font-medium text-[var(--negative)]/80 mb-5">
                            Permanently delete your account and all associated financial data. This action cannot be undone.
                        </p>
                        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--negative)] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--negative)]/90 outline-none focus-visible:ring-2 focus-visible:ring-[var(--negative)]/50">
                            <Trash2 className="size-4" />
                            Delete Account
                        </button>
                    </div>
                </SectionCard>

            </div>
        </div>
    );
}
