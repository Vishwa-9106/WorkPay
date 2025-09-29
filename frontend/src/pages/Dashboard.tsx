import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { workerApi, expensesApi, settingsApi, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ISO week helper (matches Reports.tsx)
function getISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [totalWorkers, setTotalWorkers] = useState<number>(0);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  const currency = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }), []);

  useEffect(() => {
    const load = async () => {
      try {
        const [workers, expenses, revenue] = await Promise.all([
          workerApi.getAll(),
          expensesApi.getAll(),
          settingsApi.getRevenue(),
        ]);
        setTotalWorkers(Array.isArray(workers) ? workers.length : 0);
        setExpensesList(expenses || []);
        const sum = (expenses || []).reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);
        setTotalExpenses(sum);
        setTotalRevenue(Number(revenue?.value) || 0);
      } catch (error) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load dashboard data';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    load();
  }, [toast]);

  const totalProfit = useMemo(() => totalRevenue - totalExpenses, [totalRevenue, totalExpenses]);

  // Week-wise cumulative profit for line chart
  const weeklyProfitData = useMemo(() => {
    const map = new Map<string, number>();
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
      const cumulativeRevenueShare = totalRevenue * ((idx + 1) / totalWeeks);
      const profit = cumulativeRevenueShare - cumExpenses;
      return { label: `Week ${idx + 1}`, profit };
    });
  }, [expensesList, totalRevenue]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">Welcome back to {t('app.name')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Workers Card */}
        <Card className="bg-gradient-card border-border shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalWorkers')}
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalWorkers}</div>
            <p className="text-xs text-muted-foreground">
              Active workforce
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card className="bg-gradient-card border-border shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalExpenses')}
            </CardTitle>
            <Receipt className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currency.format(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        {/* Total Profit Card */}
        <Card className="bg-gradient-card border-border shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalProfit')}
            </CardTitle>
            {totalProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currency.format(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit/Loss Chart */}
      <Card className="bg-gradient-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            {t('dashboard.profitLossChart')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyProfitData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="label" 
                  className="text-xs fill-muted-foreground"
                />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                  formatter={(value: any) => [currency.format(Number(value)), 'Profit']}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Chart will populate as you add workers, production data, and expenses
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card className="bg-gradient-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            {t('dashboard.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity yet</p>
            <p className="text-sm">Add workers and production data to see activity here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}