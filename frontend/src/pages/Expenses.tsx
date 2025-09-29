import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Plus, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { expensesApi, ApiError } from "@/lib/api";

const EXPENSE_TYPES = [
  'Raw Materials',
  'Equipment',
  'Utilities',
  'Labor',
  'Maintenance',
  'Transport',
  'Office Supplies',
  'Salary',
  'Other',
] as const;

type ExpenseType = typeof EXPENSE_TYPES[number];

interface ExpenseDoc {
  _id: string;
  date: string;
  expenseType: ExpenseType | string;
  amount: number;
  description?: string;
}

export default function Expenses() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    expenseType: '',
    amount: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      expenseType: '',
      amount: '',
      description: '',
    });
  };

  // Load expenses from backend
  const loadExpenses = async () => {
    try {
      const list = await expensesApi.getAll();
      setExpenses(list);
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to load expenses';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.expenseType || !formData.amount) {
      toast({ title: 'Error', description: t('forms.required'), variant: 'destructive' });
      return;
    }
    if (!EXPENSE_TYPES.includes(formData.expenseType as ExpenseType)) {
      toast({ title: 'Error', description: 'Please select a valid expense type', variant: 'destructive' });
      return;
    }
    const amountNum = Number(formData.amount);
    if (Number.isNaN(amountNum) || amountNum < 0) {
      toast({ title: 'Error', description: 'Amount must be a non-negative number', variant: 'destructive' });
      return;
    }
    try {
      await expensesApi.create({
        date: formData.date,
        expenseType: formData.expenseType,
        amount: amountNum,
        description: formData.description?.trim() ? formData.description.trim() : undefined,
      });
      await loadExpenses();
      resetForm();
      setIsDialogOpen(false);
      toast({ title: 'Success', description: 'Expense added successfully' });
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to add expense';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleDelete = async (expenseId: string) => {
    try {
      await expensesApi.delete(expenseId);
      await loadExpenses();
      toast({ title: 'Success', description: 'Expense deleted successfully' });
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to delete expense';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('expenses.title')}</h1>
          <p className="text-muted-foreground">Track and manage business expenses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              {t('expenses.addExpense')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{t('expenses.addExpense')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-foreground">{t('common.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-background border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseType" className="text-foreground">{t('expenses.expenseType')}</Label>
                <Select value={formData.expenseType} onValueChange={(v) => setFormData({ ...formData, expenseType: v })}>
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder="Select expense type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-60 overflow-auto">
                    {EXPENSE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Electric bill for September"
                  className="bg-background border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-foreground">{t('common.amount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="bg-background border-input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                  className="border-border"
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:bg-primary-hover">
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Expenses Summary */}
      <Card className="bg-gradient-card border-border shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary rounded-lg p-3">
                <Receipt className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{expenses.length} entries</p>
              <p className="text-sm text-muted-foreground">All time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="bg-gradient-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Receipt className="h-5 w-5 text-primary" />
            Expenses List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t('expenses.noExpenses')}</p>
              <p className="text-sm text-muted-foreground">{t('expenses.addFirstExpense')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">{t('common.date')}</TableHead>
                    <TableHead className="text-foreground">{t('expenses.expenseType')}</TableHead>
                    <TableHead className="text-foreground">Description</TableHead>
                    <TableHead className="text-foreground">{t('common.amount')}</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense._id} className="border-border hover:bg-accent">
                      <TableCell className="text-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">{expense.expenseType}</TableCell>
                      <TableCell className="text-foreground">{expense.description || '-'}</TableCell>
                      <TableCell className="text-foreground">₹{expense.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(expense._id)}
                          className="border-border text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
