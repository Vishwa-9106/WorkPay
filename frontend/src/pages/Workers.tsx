import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { workerApi, ApiError } from "@/lib/api";

interface Worker {
  _id: string;
  name: string;
  phone: string;
  powerLoomNumber?: number;
  role?: 'Loom Operator' | 'Mechanic' | 'Loader';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  salary?: number | null;
}

export default function Workers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<{ name: string; phone: string; powerLoomNumber: string; role: string; salary: string }>({
    name: '',
    phone: '',
    powerLoomNumber: '',
    role: '',
    salary: '',
  });

  // Fetch workers from API
  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const data = await workerApi.getAll();
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load workers. Please check if the server is running.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load workers on component mount
  useEffect(() => {
    fetchWorkers();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', phone: '', powerLoomNumber: '', role: '', salary: '' });
    setEditingWorker(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({
        title: "Error",
        description: t('forms.required'),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let result: Worker;
      
      if (editingWorker) {
        result = await workerApi.update(editingWorker._id, {
          name: formData.name,
          phone: formData.phone,
          powerLoomNumber: formData.powerLoomNumber ? Number(formData.powerLoomNumber) : undefined,
          role: formData.role || undefined,
          salary: formData.role === 'Mechanic' || formData.role === 'Loader'
            ? (formData.salary !== '' ? Number(formData.salary) : 0)
            : null,
        });
        
        // Update existing worker in local state
        setWorkers(workers.map(w => 
          w._id === editingWorker._id ? result : w
        ));
        
        toast({
          title: "Success",
          description: "Worker updated successfully",
        });
      } else {
        result = await workerApi.create({
          name: formData.name,
          phone: formData.phone,
          powerLoomNumber: formData.powerLoomNumber ? Number(formData.powerLoomNumber) : undefined,
          role: formData.role || undefined,
          // Note: backend create accepts salary field via Worker model, include only for Mechanic/Loader
          ...(formData.role === 'Mechanic' || formData.role === 'Loader'
            ? { salary: formData.salary !== '' ? Number(formData.salary) : 0 }
            : { salary: null }),
        });
        
        // Add new worker to local state
        setWorkers([...workers, result]);
        
        toast({
          title: "Success",
          description: "Worker added successfully",
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving worker:', error);
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save worker. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone,
      powerLoomNumber: worker.powerLoomNumber != null ? String(worker.powerLoomNumber) : '',
      role: worker.role ?? '',
      salary: (worker.role === 'Mechanic' || worker.role === 'Loader') && worker.salary != null ? String(worker.salary) : '',
    });
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (worker: Worker) => {
    setWorkerToDelete(worker);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!workerToDelete) return;
    try {
      setDeleting(true);
      await workerApi.delete(workerToDelete._id);
      setWorkers(prev => prev.filter(w => w._id !== workerToDelete._id));
      setConfirmOpen(false);
      setWorkerToDelete(null);
      toast({ title: 'Success', description: 'Worker deleted successfully' });
    } catch (error) {
      console.error('Error deleting worker:', error);
      if (error instanceof ApiError) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to delete worker. Please try again.', variant: 'destructive' });
      }
    } finally {
      setDeleting(false);
    }
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="powerLoomNumber" className="text-foreground">Power Loom Number</Label>
                <Input
                  id="powerLoomNumber"
                  value={formData.powerLoomNumber}
                  onChange={(e) => setFormData({ ...formData, powerLoomNumber: e.target.value })}
                  placeholder="Enter power loom number"
                  className="bg-background border-input"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-foreground">Role</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, salary: (e.target.value === 'Mechanic' || e.target.value === 'Loader') ? (formData.salary) : '' })}
                  className="bg-background border-input"
                  disabled={submitting}
                >
                  <option value="">Select role</option>
                  <option value="Loom Operator">Loom Operator</option>
                  <option value="Mechanic">Mechanic</option>
                  <option value="Loader">Loader</option>
                </select>
              </div>
              {(formData.role === 'Mechanic' || formData.role === 'Loader') && (
                <div className="space-y-2">
                  <Label htmlFor="salary" className="text-foreground">Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    onWheel={(e) => { (e.currentTarget as HTMLInputElement).blur(); }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
                        e.preventDefault();
                      }
                    }}
                    inputMode="decimal"
                    placeholder="Enter salary"
                    className="bg-background border-input"
                    required
                    disabled={submitting}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                  className="border-border"
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:bg-primary-hover" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingWorker ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Are you sure you want to delete this worker?</DialogTitle>
            </DialogHeader>
            <div className="text-muted-foreground">
              {workerToDelete ? `${workerToDelete.name} (${workerToDelete.role ?? 'N/A'})` : ''}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-border" onClick={() => { setConfirmOpen(false); setWorkerToDelete(null); }} disabled={deleting}>
                Cancel
              </Button>
              <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Confirm'}
              </Button>
            </div>
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
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
              <p className="text-lg text-muted-foreground">Loading workers...</p>
            </div>
          ) : workers.length === 0 ? (
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
                    <TableHead className="text-foreground">Power Loom Number (1, 2, 3)</TableHead>
                    <TableHead className="text-foreground">Role (Loom Operator, Mechanic, Loader)</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => (
                    <TableRow key={worker._id} className="border-border hover:bg-accent">
                      <TableCell className="text-foreground font-medium">{worker.name}</TableCell>
                      <TableCell className="text-foreground">{worker.phone}</TableCell>
                      <TableCell className="text-foreground">{worker.powerLoomNumber ?? '-'}</TableCell>
                      <TableCell className="text-foreground">{worker.role ?? '-'}</TableCell>
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
                            onClick={() => openDeleteConfirm(worker)}
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