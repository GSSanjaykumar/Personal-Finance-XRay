import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import AppRoutes from "./AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { FinanceProvider } from "./context/FinanceContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <FinanceProvider>
        <AppRoutes />
      </FinanceProvider>
    </AuthProvider>
  </React.StrictMode>
);