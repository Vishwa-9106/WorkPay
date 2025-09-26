import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { workerApi, ApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';

interface Worker {
  _id: string;
  name: string;
  phone?: string;
  powerLoomNumber?: number;
  role?: 'Loom Operator' | 'Mechanic' | 'Loader' | string;
}

export default function Salary() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await workerApi.getAll();
        setWorkers(list);
      } catch (error) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load workers';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const groups = useMemo(() => {
    const byRole: Record<string, Worker[]> = {};
    for (const w of workers) {
      const role = w.role || 'Others';
      if (!byRole[role]) byRole[role] = [];
      byRole[role].push(w);
    }
    // Exclude roles Mechanic and Loader as per requirement
    delete byRole['Mechanic'];
    delete byRole['Loader'];
    // Keep a stable order: Loom Operator, Mechanic, Loader, Others, then any other roles alphabetically
    const preferred = ['Loom Operator', 'Others'];
    const keys = Array.from(new Set([...preferred, ...Object.keys(byRole).sort()]));
    return keys.filter(k => byRole[k]?.length).map(k => ({ role: k, items: byRole[k] }));
  }, [workers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t('salary.title', 'Salary')}</h1>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">{t('salary.loading', 'Loading workers...')}</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">{t('salary.noWorkers', 'No workers found')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(section => (
            <div key={section.role} className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">{section.role}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map(w => (
                  <Card
                    key={w._id}
                    className="bg-gradient-card border-border shadow-md cursor-pointer transition hover:shadow-lg hover:translate-y-[1px]"
                    onClick={() => {
                      if (section.role === 'Loom Operator') {
                        navigate(`/salary/loom-operator/${w._id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (section.role === 'Loom Operator') {
                          navigate(`/salary/loom-operator/${w._id}`);
                        }
                      }
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="text-foreground text-lg">{w.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm">
                        <div className="text-muted-foreground"><span className="text-foreground/90">{t('common.phone')}:</span> {w.phone || '-'}</div>
                        <div className="text-muted-foreground"><span className="text-foreground/90">Power Loom:</span> {w.powerLoomNumber ?? '-'}</div>
                        <div className="text-muted-foreground"><span className="text-foreground/90">Role:</span> {w.role || 'Others'}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {/* Mechanic & Loader Salary Table */}
          <MechanicLoaderSalaryTable allWorkers={workers} onReload={async () => {
            try {
              const list = await workerApi.getAll();
              setWorkers(list);
            } catch (error) {
              const msg = error instanceof ApiError ? error.message : 'Failed to reload workers';
              toast({ title: 'Error', description: msg, variant: 'destructive' });
            }
          }} />
        </div>
      )}
    </div>
  );
}

function MechanicLoaderSalaryTable({ allWorkers, onReload }: { allWorkers: Worker[]; onReload: () => Promise<void> }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Filter mechanics and loaders; keep deterministic order by name
  const rows = useMemo(() => {
    const list = allWorkers.filter(w => (w.role === 'Mechanic' || w.role === 'Loader'))
      .map(w => ({ ...w, salary: (w as any).salary ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [allWorkers]);

  // Auto refresh polling and on focus
  useEffect(() => {
    const interval = window.setInterval(() => { onReload(); }, 5000);
    const onFocus = () => { onReload(); };
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [onReload]);

  // Salary is read-only in this table; values are pulled from the server and auto-refreshed

  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{t('salary.mechanicLoaderTitle', 'Mechanic & Loader Salary')}</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">S.No</TableHead>
              <TableHead className="text-foreground">Worker</TableHead>
              <TableHead className="text-foreground">Powerloom Number</TableHead>
              <TableHead className="text-foreground">Salary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((w, idx) => (
              <TableRow key={w._id} className="border-border">
                <TableCell className="text-foreground">{idx + 1}</TableCell>
                <TableCell className="text-foreground">{w.name}</TableCell>
                <TableCell className="text-foreground">{w.powerLoomNumber ?? '-'}</TableCell>
                <TableCell className="text-foreground w-[220px] font-medium">
                  {(w as any).salary ?? 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
