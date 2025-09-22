import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productApi, workerApi, powerloomProductionApi, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProductionEntry {
  id: string;
  serialNumber: number;
  date: string;
  workerName: string;
  machineNumber: string;
  quantityProduced: number;
}

const mockWorkers = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
];

interface Worker {
  _id: string;
  name: string;
  phone?: string;
  powerLoomNumber?: number;
}

interface Product {
  _id: string;
  name: string;
}

interface PowerloomEntry {
  _id: string;
  date: string;
  worker: { _id: string; name: string } | string;
  machines: Array<{ index: number; product: { _id: string; name: string } | string; quantity: number }>;
  createdAt?: string;
}

export default function Production() {
  const [selectedLoom, setSelectedLoom] = useState<number | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [entries, setEntries] = useState<PowerloomEntry[]>([]); // Loom 1 entries
  const [entries2, setEntries2] = useState<PowerloomEntry[]>([]); // Loom 2 entries
  const [entries3, setEntries3] = useState<PowerloomEntry[]>([]); // Loom 3 entries
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const { toast } = useToast();

  // Form state
  const [form, setForm] = useState<{
    workerId: string;
    date: string;
    machines: Array<{ quantity: string; productId: string }>;
  }>(() => ({
    workerId: "",
    date: new Date().toISOString().split("T")[0],
    machines: Array.from({ length: 8 }, () => ({ quantity: "", productId: "" })),
  }));

  // Loom 2 form (9 machines)
  const [form2, setForm2] = useState<{
    workerId: string;
    date: string;
    machines: Array<{ quantity: string; productId: string }>;
  }>(() => ({
    workerId: "",
    date: new Date().toISOString().split("T")[0],
    machines: Array.from({ length: 9 }, () => ({ quantity: "", productId: "" })),
  }));

  // Loom 3 form (5 machines)
  const [form3, setForm3] = useState<{
    workerId: string;
    date: string;
    machines: Array<{ quantity: string; productId: string }>;
  }>(() => ({
    workerId: "",
    date: new Date().toISOString().split("T")[0],
    machines: Array.from({ length: 5 }, () => ({ quantity: "", productId: "" })),
  }));

  const loom1Workers = useMemo(() => workers.filter(w => w.powerLoomNumber === 1), [workers]);
  const loom2Workers = useMemo(() => workers.filter(w => w.powerLoomNumber === 2), [workers]);
  const loom3Workers = useMemo(() => workers.filter(w => w.powerLoomNumber === 3), [workers]);

  useEffect(() => {
    // Fetch workers and products
    const loadData = async () => {
      try {
        const [w, p, e, e2, e3] = await Promise.all([
          workerApi.getAll(),
          productApi.getAll(),
          powerloomProductionApi.getAll(1),
          powerloomProductionApi.getAll(2),
          powerloomProductionApi.getAll(3),
        ]);
        setWorkers(w);
        setProducts(p);
        // Ensure ascending order (oldest first)
        const list = [...e].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEntries(list);
        const list2 = [...e2].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEntries2(list2);
        const list3 = [...e3].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEntries3(list3);
      } catch (error) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load data';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };

    loadData();
  }, []);

  const saveProduction2 = async () => {
    if (!form2.workerId || !form2.date) {
      toast({ title: 'Error', description: 'Worker and Date are required', variant: 'destructive' });
      return;
    }
    const machinesToSave: Array<{ index: number; product: string; quantity: number }> = [];
    for (let i = 0; i < 9; i++) {
      const q = form2.machines[i].quantity.trim();
      const prod = form2.machines[i].productId;
      if (q !== "") {
        const num = Number(q);
        if (Number.isNaN(num) || num < 0) {
          toast({ title: 'Error', description: `Machine ${i + 1}: Quantity must be a non-negative number`, variant: 'destructive' });
          return;
        }
        if (!prod) {
          toast({ title: 'Error', description: `Machine ${i + 1}: Please select a product`, variant: 'destructive' });
          return;
        }
        machinesToSave.push({ index: i + 1, product: prod, quantity: num });
      }
    }
    if (machinesToSave.length === 0) {
      toast({ title: 'Error', description: 'Enter at least one machine quantity', variant: 'destructive' });
      return;
    }

    try {
      const created = await powerloomProductionApi.create({
        loomNumber: 2,
        date: form2.date,
        worker: form2.workerId,
        machines: machinesToSave,
      });
      setEntries2(prev => [...prev, created]);
      toast({ title: 'Success', description: 'Production saved successfully' });
      setOpen2(false);
      resetForm2();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to save production';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const saveProduction3 = async () => {
    if (!form3.workerId || !form3.date) {
      toast({ title: 'Error', description: 'Worker and Date are required', variant: 'destructive' });
      return;
    }
    const machinesToSave: Array<{ index: number; product: string; quantity: number }> = [];
    for (let i = 0; i < 5; i++) {
      const q = form3.machines[i].quantity.trim();
      const prod = form3.machines[i].productId;
      if (q !== "") {
        const num = Number(q);
        if (Number.isNaN(num) || num < 0) {
          toast({ title: 'Error', description: `Machine ${i + 1}: Quantity must be a non-negative number`, variant: 'destructive' });
          return;
        }
        if (!prod) {
          toast({ title: 'Error', description: `Machine ${i + 1}: Please select a product`, variant: 'destructive' });
          return;
        }
        machinesToSave.push({ index: i + 1, product: prod, quantity: num });
      }
    }
    if (machinesToSave.length === 0) {
      toast({ title: 'Error', description: 'Enter at least one machine quantity', variant: 'destructive' });
      return;
    }

    try {
      const created = await powerloomProductionApi.create({
        loomNumber: 3,
        date: form3.date,
        worker: form3.workerId,
        machines: machinesToSave,
      });
      setEntries3(prev => [...prev, created]);
      toast({ title: 'Success', description: 'Production saved successfully' });
      setOpen3(false);
      resetForm3();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to save production';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  // Prefill machine product selections from the latest entry shown in the table (entries[0])
  const prefillProductsFromLastEntry = () => {
    if (!entries || entries.length === 0) return;
    const latest = entries[entries.length - 1];
    const nextMachines = form.machines.map((m, idx) => {
      const found = latest.machines.find(mm => mm.index === idx + 1);
      const productId = found
        ? (typeof found.product === 'string' ? found.product : (found.product as any)?._id || '')
        : '';
      return { ...m, productId };
    });
    setForm(prev => ({ ...prev, machines: nextMachines }));
  };

  const prefillProductsFromLastEntry2 = () => {
    if (!entries2 || entries2.length === 0) return;
    const latest = entries2[entries2.length - 1];
    const nextMachines = form2.machines.map((m, idx) => {
      const found = latest.machines.find(mm => mm.index === idx + 1);
      const productId = found
        ? (typeof found.product === 'string' ? found.product : (found.product as any)?._id || '')
        : '';
      return { ...m, productId };
    });
    setForm2(prev => ({ ...prev, machines: nextMachines }));
  };

  const prefillProductsFromLastEntry3 = () => {
    if (!entries3 || entries3.length === 0) return;
    const latest = entries3[entries3.length - 1];
    const nextMachines = form3.machines.map((m, idx) => {
      const found = latest.machines.find(mm => mm.index === idx + 1);
      const productId = found
        ? (typeof found.product === 'string' ? found.product : (found.product as any)?._id || '')
        : '';
      return { ...m, productId };
    });
    setForm3(prev => ({ ...prev, machines: nextMachines }));
  };

  const resetForm = () => {
    setForm({
      workerId: "",
      date: new Date().toISOString().split("T")[0],
      machines: Array.from({ length: 8 }, () => ({ quantity: "", productId: "" })),
    });
  };

  const resetForm2 = () => {
    setForm2({
      workerId: "",
      date: new Date().toISOString().split("T")[0],
      machines: Array.from({ length: 9 }, () => ({ quantity: "", productId: "" })),
    });
  };

  const resetForm3 = () => {
    setForm3({
      workerId: "",
      date: new Date().toISOString().split("T")[0],
      machines: Array.from({ length: 5 }, () => ({ quantity: "", productId: "" })),
    });
  };

  const saveProduction = async () => {
    // Validate
    if (!form.workerId || !form.date) {
      toast({ title: 'Error', description: 'Worker and Date are required', variant: 'destructive' });
      return;
    }
    const machinesToSave: Array<{ index: number; product: string; quantity: number }> = [];
    for (let i = 0; i < 8; i++) {
      const q = form.machines[i].quantity.trim();
      const prod = form.machines[i].productId;
      if (q !== "") {
        const num = Number(q);
        if (Number.isNaN(num) || num < 0) {
          toast({ title: 'Error', description: `Machine ${i + 1}: Quantity must be a non-negative number`, variant: 'destructive' });
          return;
        }
        if (!prod) {
          toast({ title: 'Error', description: `Machine ${i + 1}: Please select a product`, variant: 'destructive' });
          return;
        }
        machinesToSave.push({ index: i + 1, product: prod, quantity: num });
      }
    }
    if (machinesToSave.length === 0) {
      toast({ title: 'Error', description: 'Enter at least one machine quantity', variant: 'destructive' });
      return;
    }

    try {
      const created = await powerloomProductionApi.create({
        loomNumber: 1,
        date: form.date,
        worker: form.workerId,
        machines: machinesToSave,
      });
      // Append to entries (newest at bottom)
      setEntries(prev => [...prev, created]);
      toast({ title: 'Success', description: 'Production saved successfully' });
      setOpen(false);
      resetForm();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to save production';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          className="bg-gradient-card border-border shadow-md cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => setSelectedLoom(1)}
        >
          <CardHeader>
            <CardTitle className="text-foreground">PowerLoom 1</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Content for PowerLoom 1 can be added here later */}
          </CardContent>
        </Card>
        <Card
          className="bg-gradient-card border-border shadow-md cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => setSelectedLoom(2)}
        >
          <CardHeader>
            <CardTitle className="text-foreground">Powerloom 2</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Content for Powerloom 2 can be added here later */}
          </CardContent>
        </Card>
        <Card
          className="bg-gradient-card border-border shadow-md cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => setSelectedLoom(3)}
        >
          <CardHeader>
            <CardTitle className="text-foreground">PowerLoom 3</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Content for PowerLoom 3 can be added here later */}
          </CardContent>
        </Card>
      </div>

      {selectedLoom === 1 && (
        <Card className="bg-gradient-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground">PowerLoom 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { prefillProductsFromLastEntry(); setOpen(true); }} className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Production
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">S.No</TableHead>
                    <TableHead className="text-foreground">Worker Name</TableHead>
                    <TableHead className="text-foreground">Date</TableHead>
                    <TableHead className="text-foreground">Machine 1</TableHead>
                    <TableHead className="text-foreground">Machine 2</TableHead>
                    <TableHead className="text-foreground">Machine 3</TableHead>
                    <TableHead className="text-foreground">Machine 4</TableHead>
                    <TableHead className="text-foreground">Machine 5</TableHead>
                    <TableHead className="text-foreground">Machine 6</TableHead>
                    <TableHead className="text-foreground">Machine 7</TableHead>
                    <TableHead className="text-foreground">Machine 8</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground">No records</TableCell>
                    </TableRow>
                  ) : (
                    entries.map((e, idx) => {
                      const machineQuantities = Array.from({ length: 8 }, (_, i) => {
                        const found = e.machines.find(m => m.index === i + 1);
                        return found ? found.quantity : '-';
                      });
                      const workerName = typeof e.worker === 'string' ? e.worker : e.worker?.name;
                      const dateStr = new Date(e.date).toLocaleDateString();
                      return (
                        <TableRow key={e._id} className="border-border hover:bg-accent">
                          <TableCell className="text-foreground font-medium">{idx + 1}</TableCell>
                          <TableCell className="text-foreground">{workerName}</TableCell>
                          <TableCell className="text-foreground">{dateStr}</TableCell>
                          {machineQuantities.map((q, i) => (
                            <TableCell key={i} className="text-foreground">{q}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        )}
      {selectedLoom === 3 && (
        <Card className="bg-gradient-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground">PowerLoom 3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { prefillProductsFromLastEntry3(); setOpen3(true); }} className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Production
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">S.No</TableHead>
                    <TableHead className="text-foreground">Worker Name</TableHead>
                    <TableHead className="text-foreground">Date</TableHead>
                    {Array.from({ length: 5 }, (_, i) => (
                      <TableHead key={i} className="text-foreground">{`Machine ${i + 1}`}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries3.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">No records</TableCell>
                    </TableRow>
                  ) : (
                    entries3.map((e, idx) => {
                      const machineQuantities = Array.from({ length: 5 }, (_, i) => {
                        const found = e.machines.find(m => m.index === i + 1);
                        return found ? found.quantity : '-';
                      });
                      const workerName = typeof e.worker === 'string' ? e.worker : e.worker?.name;
                      const dateStr = new Date(e.date).toLocaleDateString();
                      return (
                        <TableRow key={e._id} className="border-border hover:bg-accent">
                          <TableCell className="text-foreground font-medium">{idx + 1}</TableCell>
                          <TableCell className="text-foreground">{workerName}</TableCell>
                          <TableCell className="text-foreground">{dateStr}</TableCell>
                          {machineQuantities.map((q, i) => (
                            <TableCell key={i} className="text-foreground">{q}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {selectedLoom === 2 && (
        <Card className="bg-gradient-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground">PowerLoom 2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { prefillProductsFromLastEntry2(); setOpen2(true); }} className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Production
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">S.No</TableHead>
                    <TableHead className="text-foreground">Worker Name</TableHead>
                    <TableHead className="text-foreground">Date</TableHead>
                    {Array.from({ length: 9 }, (_, i) => (
                      <TableHead key={i} className="text-foreground">{`Machine ${i + 1}`}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries2.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground">No records</TableCell>
                    </TableRow>
                  ) : (
                    entries2.map((e, idx) => {
                      const machineQuantities = Array.from({ length: 9 }, (_, i) => {
                        const found = e.machines.find(m => m.index === i + 1);
                        return found ? found.quantity : '-';
                      });
                      const workerName = typeof e.worker === 'string' ? e.worker : e.worker?.name;
                      const dateStr = new Date(e.date).toLocaleDateString();
                      return (
                        <TableRow key={e._id} className="border-border hover:bg-accent">
                          <TableCell className="text-foreground font-medium">{idx + 1}</TableCell>
                          <TableCell className="text-foreground">{workerName}</TableCell>
                          <TableCell className="text-foreground">{dateStr}</TableCell>
                          {machineQuantities.map((q, i) => (
                            <TableCell key={i} className="text-foreground">{q}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Production Modal for PowerLoom 1 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Production - PowerLoom 1</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-foreground">Worker Name</Label>
              <Select value={form.workerId} onValueChange={(v) => setForm({ ...form, workerId: v })}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60 overflow-auto">
                  {loom1Workers.map(w => (
                    <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-background border-input" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {form.machines.map((m, idx) => (
              <div key={idx} className="border border-border rounded-md p-3 space-y-2">
                <div className="font-medium text-foreground">Machine {idx + 1}</div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-foreground">Quantity</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={m.quantity}
                      onWheel={(e) => {
                        // Prevent changing the value using mouse wheel
                        (e.currentTarget as HTMLInputElement).blur();
                      }}
                      onChange={e => {
                        const v = e.target.value;
                        setForm(prev => {
                          const next = { ...prev };
                          next.machines = [...prev.machines];
                          next.machines[idx] = { ...next.machines[idx], quantity: v };
                          return next;
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
                          e.preventDefault();
                        }
                      }}
                      inputMode="decimal"
                      className="bg-background border-input no-spinner"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-foreground">Company Product</Label>
                    <Select
                      value={m.productId}
                      onValueChange={(v) => setForm(prev => {
                        const next = { ...prev };
                        next.machines = [...prev.machines];
                        next.machines[idx] = { ...next.machines[idx], productId: v };
                        return next;
                      })}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border max-h-60 overflow-auto">
                        {products.map(p => (
                          <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="border-border" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button className="bg-gradient-primary hover:bg-primary-hover" onClick={saveProduction}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Production Modal for PowerLoom 3 */}
      <Dialog open={open3} onOpenChange={setOpen3}>
        <DialogContent className="bg-card border-border w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Production - PowerLoom 3</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-foreground">Worker Name</Label>
              <Select value={form3.workerId} onValueChange={(v) => setForm3({ ...form3, workerId: v })}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60 overflow-auto">
                  {loom3Workers.map(w => (
                    <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Date</Label>
              <Input type="date" value={form3.date} onChange={e => setForm3({ ...form3, date: e.target.value })} className="bg-background border-input" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {form3.machines.map((m, idx) => (
              <div key={idx} className="border border-border rounded-md p-3 space-y-2">
                <div className="font-medium text-foreground">Machine {idx + 1}</div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-foreground">Quantity</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={m.quantity}
                      onWheel={(e) => {
                        // Prevent changing the value using mouse wheel
                        (e.currentTarget as HTMLInputElement).blur();
                      }}
                      onChange={e => {
                        const v = e.target.value;
                        setForm3(prev => {
                          const next = { ...prev };
                          next.machines = [...prev.machines];
                          next.machines[idx] = { ...next.machines[idx], quantity: v };
                          return next;
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
                          e.preventDefault();
                        }
                      }}
                      inputMode="decimal"
                      className="bg-background border-input no-spinner"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-foreground">Company Product</Label>
                    <Select
                      value={m.productId}
                      onValueChange={(v) => setForm3(prev => {
                        const next = { ...prev };
                        next.machines = [...prev.machines];
                        next.machines[idx] = { ...next.machines[idx], productId: v };
                        return next;
                      })}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border max-h-60 overflow-auto">
                        {products.map(p => (
                          <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="border-border" onClick={() => { setOpen3(false); resetForm3(); }}>Cancel</Button>
            <Button className="bg-gradient-primary hover:bg-primary-hover" onClick={saveProduction3}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Production Modal for PowerLoom 2 */}
      <Dialog open={open2} onOpenChange={setOpen2}>
        <DialogContent className="bg-card border-border w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Production - PowerLoom 2</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-foreground">Worker Name</Label>
              <Select value={form2.workerId} onValueChange={(v) => setForm2({ ...form2, workerId: v })}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60 overflow-auto">
                  {loom2Workers.map(w => (
                    <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Date</Label>
              <Input type="date" value={form2.date} onChange={e => setForm2({ ...form2, date: e.target.value })} className="bg-background border-input" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {form2.machines.map((m, idx) => (
              <div key={idx} className="border border-border rounded-md p-3 space-y-2">
                <div className="font-medium text-foreground">Machine {idx + 1}</div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-foreground">Quantity</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={m.quantity}
                      onWheel={(e) => {
                        // Prevent changing the value using mouse wheel
                        (e.currentTarget as HTMLInputElement).blur();
                      }}
                      onChange={e => {
                        const v = e.target.value;
                        setForm2(prev => {
                          const next = { ...prev };
                          next.machines = [...prev.machines];
                          next.machines[idx] = { ...next.machines[idx], quantity: v };
                          return next;
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
                          e.preventDefault();
                        }
                      }}
                      inputMode="decimal"
                      className="bg-background border-input no-spinner"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-foreground">Company Product</Label>
                    <Select
                      value={m.productId}
                      onValueChange={(v) => setForm2(prev => {
                        const next = { ...prev };
                        next.machines = [...prev.machines];
                        next.machines[idx] = { ...next.machines[idx], productId: v };
                        return next;
                      })}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border max-h-60 overflow-auto">
                        {products.map(p => (
                          <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="border-border" onClick={() => { setOpen2(false); resetForm2(); }}>Cancel</Button>
            <Button className="bg-gradient-primary hover:bg-primary-hover" onClick={saveProduction2}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}