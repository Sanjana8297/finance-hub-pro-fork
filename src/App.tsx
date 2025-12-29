import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Receipts from "./pages/Receipts";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receipts"
              element={
                <ProtectedRoute>
                  <Receipts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute requiredRoles={["super_admin", "admin", "finance_manager", "accountant"]}>
                  <Invoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute requiredRoles={["super_admin", "admin", "finance_manager", "hr"]}>
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute requiredRoles={["super_admin", "admin", "hr"]}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredRoles={["super_admin", "admin", "finance_manager", "accountant", "auditor"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute requiredRoles={["super_admin", "admin", "auditor"]}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRoles={["super_admin", "admin"]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredRoles={["super_admin", "admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
