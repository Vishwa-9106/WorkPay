import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Worker {
  id: string;
  name: string;
  phone: string;
  dailyWage: number;
}

export default function Workers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dailyWage: '',
  });

  const resetForm = () => {
    setFormData({ name: '', phone: '', dailyWage: '' });
    setEditingWorker(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.dailyWage) {
      toast({
        title: "Error",
        description: t('forms.required'),
        variant: "destructive",
      });
      return;
    }

    const workerData = {
      id: editingWorker?.id || Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      dailyWage: parseFloat(formData.dailyWage),
    };

    if (editingWorker) {
      setWorkers(workers.map(w => w.id === editingWorker.id ? workerData : w));
      toast({
        title: "Success",
        description: "Worker updated successfully",
      });
    } else {
      setWorkers([...workers, workerData]);
      toast({
        title: "Success",
        description: "Worker added successfully",
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone,
      dailyWage: worker.dailyWage.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (workerId: string) => {
    setWorkers(workers.filter(w => w.id !== workerId));
    toast({
      title: "Success",
      description: "Worker deleted successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('workers.title')}</h1>
          <p className="text-muted-foreground">Manage your workforce</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              {t('workers.addWorker')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingWorker ? t('workers.editWorker') : t('workers.addWorker')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">{t('workers.workerName')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter worker name"
                  className="bg-background border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">{t('workers.phoneNumber')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="bg-background border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wage" className="text-foreground">{t('workers.dailyWage')}</Label>
                <Input
                  id="wage"
                  type="number"
                  value={formData.dailyWage}
                  onChange={(e) => setFormData({ ...formData, dailyWage: e.target.value })}
                  placeholder="Enter daily wage"
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

      {/* Workers Table */}
      <Card className="bg-gradient-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Workers List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t('workers.noWorkers')}</p>
              <p className="text-sm text-muted-foreground">{t('workers.addFirstWorker')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">{t('common.name')}</TableHead>
                    <TableHead className="text-foreground">{t('common.phone')}</TableHead>
                    <TableHead className="text-foreground">{t('workers.dailyWage')}</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => (
                    <TableRow key={worker.id} className="border-border hover:bg-accent">
                      <TableCell className="text-foreground font-medium">{worker.name}</TableCell>
                      <TableCell className="text-foreground">{worker.phone}</TableCell>
                      <TableCell className="text-foreground">₹{worker.dailyWage}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(worker)}
                            className="border-border hover:bg-accent"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(worker.id)}
                            className="border-border text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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