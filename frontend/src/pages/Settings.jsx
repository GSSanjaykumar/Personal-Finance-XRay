import { useTheme } from "../components/v0-dashboard/theme-provider";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Check, LogOut, Trash2, Bell, Shield } from "lucide-react";
import { cn } from "../v0-lib/utils";

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

function Section({ title, desc, children }) {
    return (
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-12">
            <div className="w-full shrink-0 md:w-64">
                <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
                {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
            </div>
            <div className="w-full flex-1 space-y-4">
                {children}
            </div>
        </div>
    );
}

export default function Settings() {
    const { accent, setAccent, density, setDensity, motion, setMotion, currency, setCurrency } = useTheme();
    const { user, logout } = useContext(AuthContext);

    const initials = user?.name ? String(user.name).substring(0, 2).toUpperCase() : "US";

    return (
        <div className="space-y-10 pb-12">
            <header>
                <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
                <p className="mt-1.5 text-muted-foreground">Manage your account, preferences, and personalization.</p>
            </header>

            <div className="space-y-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] md:p-10">
                
                {/* Account Section */}
                <Section title="Account" desc="Your personal profile information.">
                    <div className="flex items-center gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-6">
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xl font-bold text-white shadow-sm">
                            {initials}
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-foreground">{user?.name || "User"}</h4>
                            <p className="text-sm text-muted-foreground">{user?.email || "user@example.com"}</p>
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                <Shield className="size-3 text-[var(--accent)]" /> Free Plan
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={logout}
                        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[var(--surface-3)]"
                    >
                        <LogOut className="size-4" />
                        Log out of all devices
                    </button>
                </Section>
                
                <hr className="border-[var(--border)]" />

                {/* Appearance Section */}
                <Section title="Appearance" desc="Customize the look and feel of the dashboard.">
                    <div className="space-y-6">
                        <div>
                            <label className="mb-3 block text-sm font-medium text-foreground">Accent Color</label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {accents.map((a) => (
                                    <button
                                        key={a.id}
                                        onClick={() => setAccent(a.id)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5",
                                            accent === a.id
                                                ? "border-[var(--accent)] bg-[var(--surface-2)]"
                                                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                                        )}
                                    >
                                        <span className="size-5 shrink-0 rounded-full ring-2 ring-white/10" style={{ background: a.swatch }} />
                                        <span className="flex-1 text-sm font-medium text-foreground">{a.label}</span>
                                        {accent === a.id && <Check className="size-4 text-[var(--accent)]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-sm font-medium text-foreground">Layout Density</label>
                            <div className="flex gap-3">
                                {densities.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDensity(d.id)}
                                        className={cn(
                                            "flex-1 rounded-xl border p-3 text-sm font-medium transition-all duration-200",
                                            density === d.id
                                                ? "border-[var(--accent)] bg-[var(--surface-2)] text-foreground"
                                                : "border-[var(--border)] bg-[var(--surface)] text-muted-foreground hover:border-[var(--border-strong)]"
                                        )}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                            <div>
                                <h4 className="text-sm font-medium text-foreground">Reduced Motion</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">Minimize animations for a calmer experience.</p>
                            </div>
                            <button
                                onClick={() => setMotion(!motion)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                    !motion ? "bg-[var(--accent)]" : "bg-[var(--surface-3)]"
                                )}
                            >
                                <span className={cn(
                                    "inline-block size-4 transform rounded-full bg-white transition-transform",
                                    !motion ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>
                    </div>
                </Section>
                
                <hr className="border-[var(--border)]" />

                {/* Regional Section */}
                <Section title="Regional" desc="Language and currency formatting.">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Currency</label>
                            <select 
                                value={currency} 
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                            >
                                {currencies.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Language</label>
                            <select 
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                                defaultValue="English"
                            >
                                {languages.map((l) => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Section>
                
                <hr className="border-[var(--border)]" />

                {/* Notifications Section */}
                <Section title="Notifications" desc="Choose what we update you on.">
                    <div className="space-y-3">
                        {["Budget alerts", "Weekly AI insights", "Monthly reports", "Unusual spending alerts"].map((label, i) => (
                            <label key={i} className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-colors hover:bg-[var(--surface-3)]">
                                <div className="flex items-center gap-3">
                                    <Bell className="size-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">{label}</span>
                                </div>
                                <input type="checkbox" defaultChecked={i !== 2} className="size-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)]" />
                            </label>
                        ))}
                    </div>
                </Section>

                <hr className="border-[var(--border)]" />

                {/* Danger Zone */}
                <Section title="Danger Zone" desc="Destructive actions for your account.">
                    <div className="rounded-xl border border-[var(--negative)]/30 bg-[var(--negative-soft)] p-6">
                        <h4 className="text-sm font-medium text-[var(--negative)]">Delete Account</h4>
                        <p className="mt-1 text-sm text-foreground/80 mb-4">
                            Permanently delete your account and all associated financial data. This action cannot be undone.
                        </p>
                        <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--negative)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--negative)]/90">
                            <Trash2 className="size-4" />
                            Delete Account
                        </button>
                    </div>
                </Section>

            </div>
        </div>
    );
}
