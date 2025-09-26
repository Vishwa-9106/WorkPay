import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
import Production from "./pages/Production";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Salary from "./pages/Salary";
import SalaryLoomOperator from "./pages/SalaryLoomOperator";
import SalaryBonus from "./pages/SalaryBonus";
import SalaryBonusDetail from "./pages/SalaryBonusDetail";
import NotFound from "./pages/NotFound";
import CompanyProduct from "./pages/CompanyProduct";
import "@/lib/i18n";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="workers" element={<Workers />} />
            <Route path="production" element={<Production />} />
            <Route path="salary" element={<Salary />} />
            <Route path="salary/loom-operator/:workerId" element={<SalaryLoomOperator />} />
            <Route path="salary-bonus" element={<SalaryBonus />} />
            <Route path="salary-bonus/:workerId" element={<SalaryBonusDetail />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="products" element={<CompanyProduct />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
