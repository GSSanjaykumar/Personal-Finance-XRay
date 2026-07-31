import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import Categories from "./pages/Categories";
import DashboardLayout from "./components/layout/DashboardLayout";
import Insights from "./pages/Insights";
import Budget from "./pages/Budget";
import Recurring from "./pages/Recurring";
import Forecast from "./pages/Forecast";
import Report from "./pages/Report";
import ChatAssistant from "./pages/ChatAssistant";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function AppRoutes() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/categories" element={<Categories/>} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/report" element={<Report />} />
            <Route path="/chat" element={<ChatAssistant />} />
          </Route>
        </Route>

        

      </Routes>

    </BrowserRouter>

  );

}