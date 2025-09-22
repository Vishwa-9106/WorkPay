import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ApiError, powerloomProductionApi, workerApi, productApi } from '@/lib/api';

interface Worker {
  _id: string;
  name: string;
}

interface PowerloomEntry {
  _id: string;
  date: string;
  worker: { _id: string; name: string } | string;
  machines: Array<{ index: number; product: { _id: string; name: string } | string; quantity: number }>;
}

export default function SalaryLoomOperator() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { workerId } = useParams<{ workerId: string }>();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [entriesByLoom, setEntriesByLoom] = useState<{ [loom: number]: PowerloomEntry[] }>({ 1: [], 2: [], 3: [] });
  const [products, setProducts] = useState<Array<{ _id: string; name: string; workerSalary?: number | null }>>([]);

  useEffect(() => {
    const load = async () => {
      if (!workerId) return;
      try {
        const [w, e1, e2, e3, p] = await Promise.all([
          workerApi.getById(workerId),
          powerloomProductionApi.getAll(1),
          powerloomProductionApi.getAll(2),
          powerloomProductionApi.getAll(3),
          productApi.getAll(),
        ]);
        setWorker(w);
        setEntriesByLoom({ 1: e1, 2: e2, 3: e3 });
        setProducts(p);
      } catch (error) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load data';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    };
    load();

    // Poll for latest data periodically
    const intervalId = window.setInterval(load, 5000); // 5s

    // Refetch when window gains focus
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [workerId]);

  const productName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) map.set(p._id, p.name);
    return (id: string, fallback?: any) => map.get(id) || (typeof fallback === 'string' ? fallback : (fallback?.name ?? 'Unknown'));
  }, [products]);

  // Group by product and date for current worker with machine -> quantity details
  const groupedByProduct = useMemo(() => {
    if (!workerId) return [] as Array<{
      productId: string;
      productName: string;
      rows: Array<{ dateStr: string; byMachine: Array<{ index: number; qty: number }> }>;
    }>;
    // productId -> date(yyyy-mm-dd) -> machineIndex -> qty
    const agg = new Map<string, Map<string, Map<number, number>>>();
    const all: PowerloomEntry[] = [
      ...(entriesByLoom[1] || []),
      ...(entriesByLoom[2] || []),
      ...(entriesByLoom[3] || []),
    ];
    for (const entry of all) {
      const wid = typeof entry.worker === 'string' ? entry.worker : entry.worker?._id;
      if (wid !== workerId) continue;
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      for (const m of entry.machines) {
        if (!m || m.quantity <= 0) continue;
        const pid = typeof m.product === 'string' ? m.product : (m.product as any)?._id;
        if (!pid) continue;
        if (!agg.has(pid)) agg.set(pid, new Map());
        const byDate = agg.get(pid)!;
        if (!byDate.has(dateKey)) byDate.set(dateKey, new Map());
        const byM = byDate.get(dateKey)!;
        byM.set(m.index, (byM.get(m.index) || 0) + m.quantity);
      }
    }
    // Convert to array and sort
    return Array.from(agg.entries())
      .map(([pid, byDate]) => ({
        productId: pid,
        productName: productName(pid),
        rows: Array.from(byDate.entries())
          .map(([dateStr, byM]) => ({
            dateStr,
            byMachine: Array.from(byM.entries())
              .map(([index, qty]) => ({ index, qty }))
              .sort((a, b) => a.index - b.index),
          }))
          .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime()),
      }))
      // Only keep products that have at least one machine with qty > 0 over all dates
      .filter(row => row.rows.some(r => r.byMachine.some(m => m.qty > 0)))
      .sort((a, b) => a.productName.localeCompare(b.productName));
  }, [entriesByLoom, workerId, productName]);

  // Total Salary across all products for the selected worker
  const totalSalary = useMemo(() => {
    // Sum over all products: (sum of all machine quantities across all dates) * workerSalary
    let total = 0;
    for (const prod of groupedByProduct) {
      const productDetail = products.find(p => p._id === prod.productId);
      const workerSalary = productDetail?.workerSalary ?? 0;
      const qtySum = prod.rows.reduce((acc, r) => acc + r.byMachine.reduce((a, m) => a + m.qty, 0), 0);
      total += qtySum * workerSalary;
    }
    return Number(total.toFixed(2));
  }, [groupedByProduct, products]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          {worker ? `${t('salary.loomOperator.title', 'Workers of Loom Operator')} — ${worker.name}` : t('salary.loomOperator.title', 'Workers of Loom Operator')}
        </h1>
      </div>
      {/* Grouped by Company Product - one table per product with Date and Machines */}
      {groupedByProduct.length === 0 ? (
        <Card className="bg-gradient-card border-border shadow-md">
          <CardContent>
            <div className="p-6 text-center text-muted-foreground">{t('salary.loomOperator.noProductData', 'No products produced by this worker')}</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Total Salary Card (shown above the first table) */}
          <Card className="bg-gradient-card border-border shadow-md">
            <CardContent>
              <div className="text-xl font-bold text-foreground">Total Salary: {totalSalary}</div>
            </CardContent>
          </Card>
          {groupedByProduct.map(prod => (
            <Card key={prod.productId} className="bg-gradient-card border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-foreground">{prod.productName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-foreground">{t('common.date', 'Date')}</TableHead>
                        {Array.from(new Set(prod.rows.flatMap(r => r.byMachine.filter(m => m.qty > 0).map(m => m.index))))
                          .sort((a, b) => a - b)
                          .map(idx => (
                            <TableHead key={idx} className="text-foreground">{`M${idx}`}</TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const headerIdx = Array.from(new Set(prod.rows.flatMap(rr => rr.byMachine.filter(m => m.qty > 0).map(m => m.index))))
                          .sort((a,b) => a-b);
                        const productDetail = products.find(p => p._id === prod.productId);
                        const workerSalary = productDetail?.workerSalary ?? 0;
                        // Column sums per machine
                        const colSums: Record<number, number> = {};
                        headerIdx.forEach(i => { colSums[i] = 0; });
                        const rowsRendered = prod.rows.map(r => {
                          return (
                            <TableRow key={`${prod.productId}-${r.dateStr}`} className="border-border hover:bg-accent/30">
                              <TableCell className="text-foreground font-medium">{new Date(r.dateStr).toLocaleDateString()}</TableCell>
                              {headerIdx.map(idx => {
                                const found = r.byMachine.find(m => m.index === idx);
                                const val = found ? found.qty : 0;
                                colSums[idx] += val;
                                return (
                                  <TableCell key={idx} className="text-foreground">{found ? val : '-'}</TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        });
                        const salaryRow = (
                          <TableRow key={`${prod.productId}-salary`} className="border-border bg-accent/40 font-semibold">
                            <TableCell className="text-foreground">Salary</TableCell>
                            {headerIdx.map(idx => (
                              <TableCell key={`salary-${idx}`} className="text-foreground">
                                {Number((colSums[idx] * workerSalary).toFixed(2))}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                        return [rowsRendered, salaryRow];
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
