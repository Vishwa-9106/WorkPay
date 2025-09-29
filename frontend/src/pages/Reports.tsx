import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileBarChart, Download, Calendar, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { expensesApi, ApiError, settingsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Helpers for week aggregation (ISO week)
function getISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday in current week decides the year.
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

export default function Reports() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [revenueValue, setRevenueValue] = useState<number>(0); // value from DB
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [revenueInput, setRevenueInput] = useState<string>(""); // dialog input text

  const currency = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }), []);

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const list = await expensesApi.getAll();
        setExpensesList(list || []);
        const sum = (list || []).reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);
        setTotalExpenses(sum);
      } catch (error) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load expenses';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    loadExpenses();
  }, [toast]);

  // Build Expense Breakdown by type (outside of useEffect)
  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expensesList) {
      const type = (e?.expenseType || 'Other') as string;
      const amount = Number(e?.amount) || 0;
      if (!Number.isFinite(amount) || amount <= 0) continue;
      map.set(type, (map.get(type) || 0) + amount);
    }
    const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    arr.sort((a, b) => b.value - a.value);
    return arr;
  }, [expensesList]);

  // Load revenue from DB on mount
  useEffect(() => {
    const loadRevenue = async () => {
      try {
        const res = await settingsApi.getRevenue();
        const val = Number(res?.value) || 0;
        setRevenueValue(val);
      } catch (error) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load revenue';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    loadRevenue();
  }, [toast]);

  const parsedRevenueInput = useMemo(() => {
    const n = Number((revenueInput || '').replace(/[\,\s]/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  }, [revenueInput]);
  const netProfit = useMemo(() => revenueValue - totalExpenses, [revenueValue, totalExpenses]);
  const profitMargin = useMemo(() => (revenueValue > 0 ? (netProfit / revenueValue) * 100 : 0), [netProfit, revenueValue]);

  // Build week-wise cumulative Profit/Loss:
  // Profit/Loss up to week N = (TotalRevenue * N/TotalWeeks) - (CumulativeExpenses up to week N)
  // This yields a meaningful trend over time given one total revenue value.
  const weeklyData = useMemo(() => {
    const map = new Map<string, number>(); // key: YYYY-WW, value: weekly expenses sum
    for (const e of expensesList) {
      const dt = e?.date ? new Date(e.date) : null;
      const amount = Number(e?.amount) || 0;
      if (!dt || !Number.isFinite(amount)) continue;
      const { year, week } = getISOWeek(dt);
      const key = `${year}-W${week}`;
      map.set(key, (map.get(key) || 0) + amount);
    }
    const keys = Array.from(map.keys()).sort((a, b) => {
      const [ay, aw] = a.replace('W', '-').split('-').map(Number);
      const [by, bw] = b.replace('W', '-').split('-').map(Number);
      return ay === by ? aw - bw : ay - by;
    });
    let cumExpenses = 0;
    const totalWeeks = Math.max(keys.length, 1);
    return keys.map((key, idx) => {
      const weeklyExpenses = map.get(key) || 0;
      cumExpenses += weeklyExpenses;
      const cumulativeRevenueShare = revenueValue * ((idx + 1) / totalWeeks);
      const profitLoss = cumulativeRevenueShare - cumExpenses;
      return { key, label: `Week ${idx + 1}`, profitLoss };
    });
  }, [expensesList, revenueValue]);

  const openRevenueDialog = () => {
    setRevenueInput(revenueValue ? String(revenueValue) : "");
    setRevenueDialogOpen(true);
  };

  const submitRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parsedRevenueInput;
    if (!Number.isFinite(n) || n < 0) {
      toast({ title: 'Error', description: 'Please enter a valid non-negative number', variant: 'destructive' });
      return;
    }
    try {
      const res = await settingsApi.setRevenue(n);
      const saved = Number(res?.value) || 0;
      setRevenueValue(saved);
      setRevenueDialogOpen(false);
      toast({ title: 'Success', description: 'Revenue updated' });
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to update revenue';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export functionality
    alert('PDF export functionality will be implemented');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('reports.title')}</h1>
          <p className="text-muted-foreground">Analyze business performance and trends</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select defaultValue="monthly">
            <SelectTrigger className="w-[180px] bg-background border-input">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="monthly">{t('reports.monthlyReport')}</SelectItem>
              <SelectItem value="yearly">{t('reports.yearlyReport')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleExportPDF}
            className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('reports.exportPDF')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Dialog open={revenueDialogOpen} onOpenChange={setRevenueDialogOpen}>
          <DialogTrigger asChild>
            <Card className="bg-gradient-card border-border shadow-md cursor-pointer" onClick={openRevenueDialog}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">{currency.format(revenueValue)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Set Total Revenue</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitRevenue} noValidate className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="revenue" className="text-sm text-foreground">Revenue (INR)</label>
                <Input
                  id="revenue"
                  type="text"
                  inputMode="decimal"
                  value={revenueInput}
                  onChange={(e) => setRevenueInput(e.target.value)}
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                  onKeyDown={(e) => {
                    const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
                    if (allowed.includes(e.key)) return;
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); return; }
                    const isNumber = /[0-9]/.test(e.key);
                    const isDot = e.key === '.' && !(e.currentTarget as HTMLInputElement).value.includes('.');
                    if (!isNumber && !isDot) e.preventDefault();
                  }}
                  placeholder="e.g., 150000"
                  className="bg-background border-input"
                />
                <p className="text-xs text-muted-foreground">Only numbers allowed. Up to 2 decimals.</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="border-border" onClick={() => setRevenueDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:bg-primary-hover">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Total Expenses */}
        <Card className="bg-gradient-card border-border shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground">{currency.format(totalExpenses)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="bg-gradient-card border-border shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-foreground">{currency.format(netProfit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card className="bg-gradient-card border-border shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold text-foreground">{profitMargin.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Profit/Loss Chart */}
        <Card className="bg-gradient-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileBarChart className="h-5 w-5 text-primary" />
              {t('reports.profitLossChart')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value: any) => [currency.format(Number(value)), 'Profit/Loss']}
                    labelFormatter={(label: any) => label}
                  />
                  <Bar dataKey="profitLoss" name="Profit/Loss">
                    {weeklyData.map((d, i) => (
                      <Cell key={`bar-${i}`} fill={d.profitLoss >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Profit/Loss aggregated by week. Updates when new expenses are added.
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown Chart */}
        <Card className="bg-gradient-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value: any, name: any) => [currency.format(Number(value)), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Expense categories will show when you add expense data
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No Data Message */}
      <Card className="bg-gradient-card border-border shadow-md">
        <CardContent className="text-center py-8">
          <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">{t('reports.noData')}</p>
          <p className="text-sm text-muted-foreground">{t('reports.addDataFirst')}</p>
        </CardContent>
      </Card>
    </div>
  );
}