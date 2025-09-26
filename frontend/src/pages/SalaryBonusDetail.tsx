import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { exportLogsApi, ApiError } from '@/lib/api';

interface LogRec {
  workerId: string;
  workerName: string;
  fromDate: string; // ISO
  toDate: string;   // ISO
  salary: number;
  createdAt: string; // ISO
}

export default function SalaryBonusDetail() {
  const { workerId = '' } = useParams();
  const [logs, setLogs] = useState<LogRec[]>([]);

  const reload = async () => {
    try {
      if (workerId) {
        const resp = await exportLogsApi.getAll(workerId);
        // Normalize to LogRec
        const mapped = Array.isArray(resp) ? resp.map((r: any) => ({
          workerId: typeof r.worker === 'string' ? r.worker : r.worker?._id,
          workerName: typeof r.worker === 'object' ? (r.worker?.name || 'Worker') : 'Worker',
          fromDate: r.fromDate,
          toDate: r.toDate,
          salary: r.salary,
          createdAt: r.createdAt,
        })) : [];
        setLogs(mapped);
        return;
      }
    } catch (e) {
      console.warn('Backend export logs fetch failed, falling back to localStorage', e);
    }
    // Fallback to localStorage
    try {
      const key = 'salaryBonusLogs';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(arr)) setLogs(arr);
    } catch {}
  };

  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => { if (e.key === 'salaryBonusLogs') reload(); };
    window.addEventListener('storage', onStorage);
    const interval = window.setInterval(reload, 5000);
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('storage', onStorage); window.clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [workerId]);

  const rows = useMemo(() => logs.filter(l => l.workerId === workerId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [logs, workerId]);
  const workerName = rows[0]?.workerName || 'Worker';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{workerName} — Weekly Salary History</h1>
        <Link to="/salary-bonus" className="text-primary underline">Back</Link>
      </div>

      <Card className="bg-gradient-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-foreground">Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">From date</TableHead>
                  <TableHead className="text-foreground">Last date</TableHead>
                  <TableHead className="text-foreground">Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l, idx) => (
                  <TableRow key={idx} className="border-border">
                    <TableCell className="text-foreground">{new Date(l.fromDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-foreground">{new Date(l.toDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-foreground font-medium">{l.salary}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow className="border-border">
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No exports yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
