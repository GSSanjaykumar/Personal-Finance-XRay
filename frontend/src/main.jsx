import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import AppRoutes from "./AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { FinanceProvider } from "./context/FinanceContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
    console.error("VITE_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work.");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <FinanceProvider>
          <AppRoutes />
        </FinanceProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);