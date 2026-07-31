import { useRef } from "react";
import {
  FaHome,
  FaChartPie,
  FaExchangeAlt,
  FaFolder,
  FaRobot,
  FaCog,
  FaUpload,
  FaChartLine,
  FaFilePdf,
  FaWallet,
  FaCalendarAlt,
  FaCommentDots,
  FaSignOutAlt,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { useContext } from "react";

import { uploadStatement } from "../../api/financeApi";
import { useFinance } from "../../context/FinanceContext";
import { AuthContext } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: <FaHome />, end: true },
  { to: "/analytics", label: "Analytics", icon: <FaChartPie /> },
  { to: "/transactions", label: "Transactions", icon: <FaExchangeAlt /> },
  { to: "/categories", label: "Categories", icon: <FaFolder /> },
  { to: "/insights", label: "AI Insights", icon: <FaRobot /> },
  { to: "/chat", label: "AI Assistant", icon: <FaCommentDots /> },
  { to: "/budget", label: "Budget", icon: <FaWallet /> },
  { to: "/recurring", label: "Recurring", icon: <FaCalendarAlt /> },
  { to: "/forecast", label: "Forecast", icon: <FaChartLine /> },
  { to: "/report", label: "Reports", icon: <FaFilePdf /> },
];

export default function Sidebar() {
  const fileInputRef = useRef(null);
  const { setFinanceData } = useFinance();
  const { logout } = useContext(AuthContext);

  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const result = await uploadStatement(file);
      setFinanceData(result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo">
        ⚡
        <span>Finance X-Ray</span>
      </div>

      {/* Navigation */}
      <nav className="menu" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section: Upload + Settings */}
      <div className="sidebar-bottom">
        <input
          type="file"
          accept=".pdf"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: "none" }}
          aria-label="Upload bank statement PDF"
        />

        <button
          className="upload-btn"
          onClick={openFilePicker}
          aria-label="Upload bank statement"
        >
          <FaUpload />
          Upload Statement
        </button>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
        >
          <FaCog />
          Settings
        </NavLink>

        <button
          className="menu-item"
          style={{ color: "#f87171", cursor: "pointer", background: "none", border: "none", width: "100%", textAlign: "left", fontSize: "inherit", padding: "10px 15px", display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}
          onClick={logout}
          aria-label="Logout"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </aside>
  );
}