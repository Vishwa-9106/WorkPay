import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { productApi, ApiError } from '@/lib/api';

interface Product {
  _id: string;
  name: string;
  workerSalary: number;
  ownerSalary: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function CompanyProduct() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<{ name: string; workerSalary: string; ownerSalary: string }>({
    name: '',
    workerSalary: '',
    ownerSalary: '',
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      const msg = error instanceof ApiError ? error.message : 'Failed to load products';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setForm({ name: '', workerSalary: '', ownerSalary: '' });
    setEditing(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.workerSalary) {
      toast({ title: 'Error', description: t('forms.required'), variant: 'destructive' });
      return;
    }
    const payload = {
      name: form.name,
      workerSalary: Number(form.workerSalary),
      ownerSalary: form.ownerSalary ? Number(form.ownerSalary) : null,
    };
    if (Number.isNaN(payload.workerSalary)) {
      toast({ title: 'Error', description: 'Worker salary must be a number', variant: 'destructive' });
      return;
    }
    if (payload.ownerSalary !== null && Number.isNaN(payload.ownerSalary)) {
      toast({ title: 'Error', description: 'Owner salary must be a number', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let result: Product;
      if (editing) {
        result = await productApi.update(editing._id, payload);
        setProducts(products.map(p => (p._id === editing._id ? result : p)));
        toast({ title: 'Success', description: 'Product updated successfully' });
      } else {
        result = await productApi.create(payload);
        setProducts([...products, result]);
        toast({ title: 'Success', description: 'Product added successfully' });
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      const msg = error instanceof ApiError ? error.message : 'Failed to save product';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      workerSalary: String(product.workerSalary),
      ownerSalary: product.ownerSalary != null ? String(product.ownerSalary) : '',
    });
    setIsDialogOpen(true);
  };

  const onDelete = async (id: string) => {
    try {
      await productApi.delete(id);
      setProducts(products.filter(p => p._id !== id));
      toast({ title: 'Success', description: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      const msg = error instanceof ApiError ? error.message : 'Failed to delete product';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('products.title', 'Company Product')}</h1>
          <p className="text-muted-foreground">{t('products.subtitle', 'Manage company products')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              {t('products.addProduct', 'Add Product')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editing ? t('products.editProduct', 'Edit Product') : t('products.addProduct', 'Add Product')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">{t('products.productName', 'Product Name')}</Label>
                <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" className="bg-background border-input" disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workerSalary" className="text-foreground">{t('products.workerSalary', 'Salary for the Product for worker')}</Label>
                <Input id="workerSalary" value={form.workerSalary} onChange={e => setForm({ ...form, workerSalary: e.target.value })} placeholder="Enter worker salary" className="bg-background border-input" disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerSalary" className="text-foreground">{t('products.ownerSalary', 'Salary for the owner')}</Label>
                <Input id="ownerSalary" value={form.ownerSalary} onChange={e => setForm({ ...form, ownerSalary: e.target.value })} placeholder="Enter owner salary" className="bg-background border-input" disabled={submitting} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false); }} className="border-border" disabled={submitting}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:bg-primary-hover" disabled={submitting}>
                  {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />{editing ? 'Updating...' : 'Adding...'}</>) : t('common.save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gradient-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-primary" />
            {t('products.listTitle', 'Products List')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
              <p className="text-lg text-muted-foreground">{t('products.loading', 'Loading products...')}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t('products.noProducts', 'No products added yet')}</p>
              <p className="text-sm text-muted-foreground">{t('products.addFirstProduct', 'Add your first product to get started')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">S.No</TableHead>
                    <TableHead className="text-foreground">Product Name</TableHead>
                    <TableHead className="text-foreground">Salary for the Product for worker</TableHead>
                    <TableHead className="text-foreground">Salary for the owner</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p, idx) => (
                    <TableRow key={p._id} className="border-border hover:bg-accent">
                      <TableCell className="text-foreground font-medium">{idx + 1}</TableCell>
                      <TableCell className="text-foreground">{p.name}</TableCell>
                      <TableCell className="text-foreground">{p.workerSalary}</TableCell>
                      <TableCell className="text-foreground">{p.ownerSalary ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => onEdit(p)} className="border-border hover:bg-accent">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onDelete(p._id)} className="border-border text-destructive hover:bg-destructive hover:text-destructive-foreground">
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
