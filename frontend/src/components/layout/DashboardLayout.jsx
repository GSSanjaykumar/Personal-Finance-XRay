import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>

    </div>
  );
}