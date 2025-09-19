import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Receipt, Plus, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  date: string;
  expenseType: string;
  amount: number;
}

export default function Expenses() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    expenseType: '',
    amount: '',
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      expenseType: '',
      amount: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.expenseType || !formData.amount) {
      toast({
        title: "Error",
        description: t('forms.required'),
        variant: "destructive",
      });
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      date: formData.date,
      expenseType: formData.expenseType,
      amount: parseFloat(formData.amount),
    };

    setExpenses([...expenses, newExpense]);
    resetForm();
    setIsDialogOpen(false);

    toast({
      title: "Success",
      description: "Expense added successfully",
    });
  };

  const handleDelete = (expenseId: string) => {
    setExpenses(expenses.filter(e => e.id !== expenseId));
    toast({
      title: "Success",
      description: "Expense deleted successfully",
    });
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
                <Input
                  id="expenseType"
                  value={formData.expenseType}
                  onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                  placeholder="Enter expense type (e.g., Raw Materials, Fuel, Maintenance)"
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
                    <TableHead className="text-foreground">{t('common.amount')}</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id} className="border-border hover:bg-accent">
                      <TableCell className="text-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">{expense.expenseType}</TableCell>
                      <TableCell className="text-foreground">₹{expense.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(expense.id)}
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