import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { workerApi, ApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
// Clicking a card navigates to a detail page with the table

interface Worker {
  _id: string;
  name: string;
  phone?: string;
  powerLoomNumber?: number;
  role?: 'Loom Operator' | 'Mechanic' | 'Loader' | string;
}

export default function SalaryBonus() {
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

  // No local table here; detail page will read from storage

  const loomOperators = useMemo(() =>
    workers.filter(w => (w.role === 'Loom Operator')).sort((a, b) => a.name.localeCompare(b.name))
  , [workers]);

  return (
    <div className="p-2">
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loomOperators.map((w) => (
            <Card
              key={w._id}
              className="bg-gradient-card border-border shadow-md cursor-pointer transition hover:shadow-lg hover:translate-y-[1px]"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/salary-bonus/${w._id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/salary-bonus/${w._id}`);
                }
              }}
            >
              <CardHeader>
                <CardTitle className="text-foreground">{w.name}</CardTitle>
              </CardHeader>
              <CardContent></CardContent>
            </Card>
          ))}
          {loomOperators.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">No Loom Operators found</div>
          )}
        </div>
      )}
    </div>
  );
}
