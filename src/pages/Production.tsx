import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Factory, Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductionEntry {
  id: string;
  serialNumber: number;
  date: string;
  workerName: string;
  machineNumber: string;
  quantityProduced: number;
}

// Mock workers data - in real app, this would come from workers page
const mockWorkers = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
];

export default function Production() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [productions, setProductions] = useState<ProductionEntry[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workerName: '',
    machineNumber: '',
    quantityProduced: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.workerName || !formData.machineNumber || !formData.quantityProduced) {
      toast({
        title: "Error",
        description: t('forms.required'),
        variant: "destructive",
      });
      return;
    }

    const newEntry: ProductionEntry = {
      id: Date.now().toString(),
      serialNumber: productions.length + 1,
      date: formData.date,
      workerName: formData.workerName,
      machineNumber: formData.machineNumber,
      quantityProduced: parseInt(formData.quantityProduced),
    };

    setProductions([...productions, newEntry]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      workerName: '',
      machineNumber: '',
      quantityProduced: '',
    });

    toast({
      title: "Success",
      description: "Production entry added successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">{t('production.title')}</h1>
        <p className="text-muted-foreground">Track daily production by workers and machines</p>
      </div>

      {/* Add Production Form */}
      <Card className="bg-gradient-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Plus className="h-5 w-5 text-primary" />
            {t('production.addProduction')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <Label htmlFor="worker" className="text-foreground">{t('production.workerName')}</Label>
              <Select 
                value={formData.workerName} 
                onValueChange={(value) => setFormData({ ...formData, workerName: value })}
              >
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder={t('production.selectWorker')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {mockWorkers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.name}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine" className="text-foreground">{t('production.machineNumber')}</Label>
              <Input
                id="machine"
                value={formData.machineNumber}
                onChange={(e) => setFormData({ ...formData, machineNumber: e.target.value })}
                placeholder="Enter machine number"
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-foreground">{t('production.quantityProduced')}</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantityProduced}
                onChange={(e) => setFormData({ ...formData, quantityProduced: e.target.value })}
                placeholder="Enter quantity"
                className="bg-background border-input"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full bg-gradient-primary hover:bg-primary-hover">
                {t('production.addRow')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Production Table */}
      <Card className="bg-gradient-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Factory className="h-5 w-5 text-primary" />
            Production Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productions.length === 0 ? (
            <div className="text-center py-8">
              <Factory className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t('production.noProduction')}</p>
              <p className="text-sm text-muted-foreground">{t('production.addFirstEntry')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">{t('production.serialNumber')}</TableHead>
                    <TableHead className="text-foreground">{t('common.date')}</TableHead>
                    <TableHead className="text-foreground">{t('production.workerName')}</TableHead>
                    <TableHead className="text-foreground">{t('production.machineNumber')}</TableHead>
                    <TableHead className="text-foreground">{t('production.quantityProduced')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productions.map((entry) => (
                    <TableRow key={entry.id} className="border-border hover:bg-accent">
                      <TableCell className="text-foreground font-medium">{entry.serialNumber}</TableCell>
                      <TableCell className="text-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(entry.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{entry.workerName}</TableCell>
                      <TableCell className="text-foreground">{entry.machineNumber}</TableCell>
                      <TableCell className="text-foreground">{entry.quantityProduced}</TableCell>
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