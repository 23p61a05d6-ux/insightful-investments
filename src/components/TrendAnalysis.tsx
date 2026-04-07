import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnalysisResult } from '@/types/analysis';

interface TrendAnalysisProps {
  analyses: AnalysisResult[];
  companyName: string;
}

function getTrendDirection(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';
  const first = values[0];
  const last = values[values.length - 1];
  const change = ((last - first) / Math.abs(first || 1)) * 100;
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

function TrendInsight({ label, direction, positive }: { label: string; direction: 'up' | 'down' | 'stable'; positive: boolean }) {
  const isGood = (direction === 'up' && positive) || (direction === 'down' && !positive);
  const isBad = (direction === 'up' && !positive) || (direction === 'down' && positive);
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
      isGood ? 'border-success/20 bg-success/5 text-success' :
      isBad ? 'border-destructive/20 bg-destructive/5 text-destructive' :
      'border-border bg-muted/50 text-muted-foreground'
    }`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
  );
}

export function TrendAnalysis({ analyses, companyName }: TrendAnalysisProps) {
  const trendData = useMemo(() => {
    const companyAnalyses = analyses
      .filter(a => a.balanceSheetData.companyName.toLowerCase() === companyName.toLowerCase())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return companyAnalyses.map((a, i) => ({
      period: a.balanceSheetData.analysisPeriod || `Period ${i + 1}`,
      'Current Ratio': Number(a.ratios.currentRatio.toFixed(2)),
      'Debt Ratio': Number(a.ratios.debtRatio.toFixed(1)),
      'Equity Ratio': Number(a.ratios.equityRatio.toFixed(1)),
      'D/E Ratio': Number(a.ratios.debtToEquityRatio.toFixed(2)),
    }));
  }, [analyses, companyName]);

  const insights = useMemo(() => {
    if (trendData.length < 2) return [];
    const currentRatios = trendData.map(d => d['Current Ratio']);
    const debtRatios = trendData.map(d => d['Debt Ratio']);
    const equityRatios = trendData.map(d => d['Equity Ratio']);

    return [
      { label: getTrendDirection(currentRatios) === 'up' ? 'Liquidity improving' : getTrendDirection(currentRatios) === 'down' ? 'Liquidity declining' : 'Liquidity stable', direction: getTrendDirection(currentRatios), positive: true },
      { label: getTrendDirection(debtRatios) === 'up' ? 'Debt increasing over time' : getTrendDirection(debtRatios) === 'down' ? 'Debt decreasing' : 'Debt levels stable', direction: getTrendDirection(debtRatios), positive: false },
      { label: getTrendDirection(equityRatios) === 'up' ? 'Equity position strengthening' : getTrendDirection(equityRatios) === 'down' ? 'Equity position weakening' : 'Equity stable', direction: getTrendDirection(equityRatios), positive: true },
    ];
  }, [trendData]);

  if (trendData.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card text-center">
        <p className="text-sm text-muted-foreground">Upload multi-period data (Q1, Q2, Q3…) to see trend analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">📈 Ratio Trends Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="period" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))',
              }}
              labelStyle={{ color: 'hsl(var(--card-foreground))' }}
            />
            <Legend />
            <Line type="monotone" dataKey="Current Ratio" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Debt Ratio" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Equity Ratio" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="D/E Ratio" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {insights.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {insights.map((insight, i) => (
            <TrendInsight key={i} {...insight} />
          ))}
        </div>
      )}
    </div>
  );
}
