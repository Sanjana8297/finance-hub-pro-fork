import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Receipts from "./pages/Receipts";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
