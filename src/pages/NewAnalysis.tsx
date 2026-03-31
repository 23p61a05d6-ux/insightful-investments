import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, Upload, Search, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAnalysisStore } from '@/store/analysisStore';
import { calculateRatios } from '@/lib/calculations';
import { BalanceSheetData } from '@/types/analysis';
import { useToast } from '@/hooks/use-toast';
import FileUploadTab from '@/components/FileUploadTab';

const numberFields: { key: keyof BalanceSheetData; label: string }[] = [
  { key: 'totalAssets', label: 'Total Assets' },
  { key: 'totalLiabilities', label: 'Total Liabilities' },
  { key: 'currentAssets', label: 'Current Assets' },
  { key: 'currentLiabilities', label: 'Current Liabilities' },
  { key: 'totalEquity', label: 'Total Equity' },
  { key: 'totalDebt', label: 'Total Debt' },
];

export default function NewAnalysis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCurrentAnalysis, addAnalysis } = useAnalysisStore();
  const [form, setForm] = useState<BalanceSheetData>({
    companyName: '',
    tickerSymbol: '',
    analysisPeriod: '',
    totalAssets: 0,
    totalLiabilities: 0,
    currentAssets: 0,
    currentLiabilities: 0,
    totalEquity: 0,
    totalDebt: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
    for (const f of numberFields) {
      const val = form[f.key] as number;
      if (val <= 0) newErrors[f.key as string] = `${f.label} must be greater than 0`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast({ title: 'Validation Error', description: 'Please fix the errors below.', variant: 'destructive' });
      return;
    }

    const ratios = calculateRatios(form);
    const analysis = {
      id: crypto.randomUUID(),
      balanceSheetData: { ...form },
      ratios,
      createdAt: new Date().toISOString(),
    };

    setCurrentAnalysis(analysis);
    addAnalysis(analysis);
    navigate('/results');
  };

  const updateField = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">New Analysis</h1>
          <p className="text-muted-foreground mt-1">Enter balance sheet data to analyze</p>
        </motion.div>

        <Tabs defaultValue="manual">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual" className="gap-2">
              <Calculator className="h-4 w-4" /> Manual Entry
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" /> File Upload
            </TabsTrigger>
            <TabsTrigger value="ticker" className="gap-2">
              <Search className="h-4 w-4" /> Ticker Lookup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
              {/* Company Info */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g. Apple Inc."
                    value={form.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    className={errors.companyName ? 'border-destructive' : ''}
                  />
                  {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tickerSymbol">Ticker Symbol</Label>
                  <Input
                    id="tickerSymbol"
                    placeholder="e.g. AAPL"
                    value={form.tickerSymbol}
                    onChange={(e) => updateField('tickerSymbol', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="analysisPeriod">Analysis Period</Label>
                  <Input
                    id="analysisPeriod"
                    placeholder="e.g. Q4 2025"
                    value={form.analysisPeriod}
                    onChange={(e) => updateField('analysisPeriod', e.target.value)}
                  />
                </div>
              </div>

              {/* Financial Data */}
              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Balance Sheet Data
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {numberFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label} *</Label>
                      <Input
                        id={field.key}
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={form[field.key] || ''}
                        onChange={(e) => updateField(field.key, parseFloat(e.target.value) || 0)}
                        className={errors[field.key as string] ? 'border-destructive' : ''}
                      />
                      {errors[field.key as string] && (
                        <p className="text-xs text-destructive">{errors[field.key as string]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button onClick={handleSubmit} className="gradient-electric text-primary-foreground border-0">
                  <Calculator className="mr-2 h-4 w-4" /> Calculate & Analyze
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setForm({
                    companyName: '', tickerSymbol: '', analysisPeriod: '',
                    totalAssets: 0, totalLiabilities: 0, currentAssets: 0,
                    currentLiabilities: 0, totalEquity: 0, totalDebt: 0,
                  })}
                >
                  Reset
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-card">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-card-foreground mb-2">Drag & drop your file here</p>
              <p className="text-sm text-muted-foreground mb-4">Supports .xlsx, .xls, .csv (max 5MB)</p>
              <Button variant="outline">Browse Files</Button>
              <p className="text-xs text-muted-foreground mt-4">
                <a href="#" className="text-primary underline">Download sample template</a>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="ticker" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-card-foreground mb-2">Quick Ticker Analysis</p>
              <p className="text-sm text-muted-foreground mb-6">Enter a stock ticker to auto-fetch financial data</p>
              <div className="flex max-w-sm mx-auto gap-3">
                <Input placeholder="e.g. AAPL, MSFT, GOOGL" />
                <Button className="gradient-electric text-primary-foreground border-0">Fetch & Analyze</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Requires real-time data integration (coming soon)</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
