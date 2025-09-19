import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileBarChart, Download, Calendar, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Sample empty data for charts
const monthlyData = [
  { month: 'Jan', revenue: 0, expenses: 0, profit: 0 },
  { month: 'Feb', revenue: 0, expenses: 0, profit: 0 },
  { month: 'Mar', revenue: 0, expenses: 0, profit: 0 },
  { month: 'Apr', revenue: 0, expenses: 0, profit: 0 },
  { month: 'May', revenue: 0, expenses: 0, profit: 0 },
  { month: 'Jun', revenue: 0, expenses: 0, profit: 0 },
];

const expenseBreakdown = [
  { name: 'Raw Materials', value: 0 },
  { name: 'Labor Costs', value: 0 },
  { name: 'Utilities', value: 0 },
  { name: 'Maintenance', value: 0 },
  { name: 'Other', value: 0 },
];

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

export default function Reports() {
  const { t } = useTranslation();

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
        <Card className="bg-gradient-card border-border shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">₹0</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground">₹0</p>
              </div>
              <TrendingUp className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-foreground">₹0</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold text-foreground">0%</p>
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
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--success))" name="Revenue" />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                  <Bar dataKey="profit" fill="hsl(var(--primary))" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Chart will populate with real data from production and expenses
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