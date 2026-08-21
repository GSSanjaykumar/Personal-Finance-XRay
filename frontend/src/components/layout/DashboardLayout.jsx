import { useState, useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ToastProvider } from "../v0-ui/toast";
import { ThemeProvider } from "../v0-dashboard/theme-provider";
import { Sidebar } from "../v0-dashboard/sidebar";
import { Topbar } from "../v0-dashboard/topbar";
import { CommandPalette } from "../v0-dashboard/command-palette";
import { ErrorBoundary } from "../../ErrorBoundary";

export default function DashboardLayout() {
  const [commandOpen, setCommandOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
          <Sidebar 
            onLogout={handleLogout}
          />

          <div className="lg:pl-[248px]">
            <Topbar 
              onOpenCommand={() => setCommandOpen(true)} 
              user={user} 
            />

            <main className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </main>
          </div>

          <CommandPalette
            open={commandOpen}
            onOpenChange={setCommandOpen}
          />
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}