import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Trophy, Plus, X, Loader2, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAnalysisStore } from '@/store/analysisStore';
import { AnalysisResult } from '@/types/analysis';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

/**
 * Generate a detailed multi-paragraph explanation comparing selected companies.
 * Highlights the winner's strengths and the laggard's weaknesses across the
 * four core ratios (Debt, D/E, Equity, Current).
 */
function generateComparisonReasoning(selected: AnalysisResult[], winner: AnalysisResult | null): string[] {
  if (!winner || selected.length < 2) return [];

  const others = selected.filter(a => a.id !== winner.id);
  const worst = others.reduce((w, a) =>
    (a.ratios.debtRatio > w.ratios.debtRatio || a.ratios.currentRatio < w.ratios.currentRatio) ? a : w,
    others[0]
  );

  const w = winner.ratios;
  const l = worst.ratios;
  const wn = winner.balanceSheetData.companyName;
  const ln = worst.balanceSheetData.companyName;

  const debtVerdict = w.debtRatio < l.debtRatio
    ? `${wn} carries a lower debt burden (${w.debtRatio.toFixed(1)}%) than ${ln} (${l.debtRatio.toFixed(1)}%), meaning a smaller share of its assets is financed through borrowed money — a sign of reduced financial risk and stronger balance-sheet resilience.`
    : `${wn} maintains a comparable debt level (${w.debtRatio.toFixed(1)}%) versus ${ln} (${l.debtRatio.toFixed(1)}%), but compensates through stronger liquidity and equity backing.`;

  const liquidityVerdict = w.currentRatio > l.currentRatio
    ? `Its current ratio of ${w.currentRatio.toFixed(2)} comfortably exceeds ${ln}'s ${l.currentRatio.toFixed(2)}, indicating ${wn} can cover short-term obligations more reliably and is far less exposed to liquidity stress in adverse market conditions.`
    : `Liquidity is broadly similar, with ${wn} at ${w.currentRatio.toFixed(2)} versus ${ln} at ${l.currentRatio.toFixed(2)}, but other structural advantages tip the balance.`;

  const equityVerdict = `In capital structure, ${wn} shows an equity ratio of ${w.equityRatio.toFixed(1)}% against ${ln}'s ${l.equityRatio.toFixed(1)}%, and a debt-to-equity multiple of ${w.debtToEquityRatio.toFixed(2)} versus ${l.debtToEquityRatio.toFixed(2)} — reinforcing that ${wn} relies more on owner capital than external creditors, a healthier long-term position.`;

  const weakness = `${ln}, by contrast, displays elevated leverage and tighter liquidity, which raises its sensitivity to interest-rate shocks, refinancing risk, and short-term cash crunches. While not necessarily a poor investment, it warrants closer scrutiny of cash-flow stability and debt servicing capacity before allocating capital.`;

  const conclusion = `Taken together, ${wn} demonstrates a more conservative, well-capitalised, and liquid profile, making it the stronger candidate among the selected peers from a pure balance-sheet quality perspective.`;

  return [debtVerdict, liquidityVerdict, equityVerdict, weakness, conclusion];
}

function getWinner(selected: AnalysisResult[]): AnalysisResult | null {
  if (selected.length < 2) return null;
  let best = selected[0];
  let bestScore = 0;
  for (const a of selected) {
    let score = 0;
    // Higher current ratio = better liquidity
    if (a.ratios.currentRatio === Math.max(...selected.map(s => s.ratios.currentRatio))) score += 2;
    // Lower debt ratio = better
    if (a.ratios.debtRatio === Math.min(...selected.map(s => s.ratios.debtRatio))) score += 2;
    // Lower D/E = better
    if (a.ratios.debtToEquityRatio === Math.min(...selected.map(s => s.ratios.debtToEquityRatio))) score += 1;
    // Higher equity ratio = better
    if (a.ratios.equityRatio === Math.max(...selected.map(s => s.ratios.equityRatio))) score += 1;
    if (score > bestScore) { bestScore = score; best = a; }
  }
  return best;
}

function isBest(values: number[], idx: number, higherIsBetter: boolean): boolean {
  const target = higherIsBetter ? Math.max(...values) : Math.min(...values);
  return values[idx] === target;
}

function isWorst(values: number[], idx: number, higherIsBetter: boolean): boolean {
  const target = higherIsBetter ? Math.min(...values) : Math.max(...values);
  return values[idx] === target;
}

export default function ComparisonPage() {
  const { analyses, loadAnalyses, isLoading } = useAnalysisStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => { loadAnalyses(); }, [loadAnalyses]);

  const selected = useMemo(
    () => analyses.filter(a => selectedIds.includes(a.id)),
    [analyses, selectedIds]
  );

  const winner = useMemo(() => getWinner(selected), [selected]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const ratioRows = [
    { label: 'Debt Ratio', key: 'debtRatio' as const, format: (v: number) => `${v.toFixed(1)}%`, higherIsBetter: false },
    { label: 'Debt-to-Equity', key: 'debtToEquityRatio' as const, format: (v: number) => v.toFixed(2), higherIsBetter: false },
    { label: 'Equity Ratio', key: 'equityRatio' as const, format: (v: number) => `${v.toFixed(1)}%`, higherIsBetter: true },
    { label: 'Current Ratio', key: 'currentRatio' as const, format: (v: number) => v.toFixed(2), higherIsBetter: true },
  ];

  const barData = ratioRows.map(row => {
    const entry: any = { name: row.label };
    selected.forEach((a, i) => { entry[a.balanceSheetData.companyName] = a.ratios[row.key]; });
    return entry;
  });

  const radarData = ratioRows.map(row => {
    const entry: any = { subject: row.label };
    selected.forEach(a => {
      entry[a.balanceSheetData.companyName] = Math.min(a.ratios[row.key], 100);
    });
    return entry;
  });

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-primary" /> Company Comparison
          </h1>
          <p className="text-muted-foreground mt-1">Select up to 4 companies from your history to compare</p>
        </motion.div>

        {/* Company selector */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Select Companies (max 4)</h3>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : analyses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No analyses yet. Perform some analyses first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {analyses.map(a => {
                const isSelected = selectedIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleSelect(a.id)}
                    disabled={!isSelected && selectedIds.length >= 4}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-card-foreground border-border hover:border-primary/50 disabled:opacity-40'
                    }`}
                  >
                    {isSelected && <X className="h-3 w-3" />}
                    {!isSelected && <Plus className="h-3 w-3" />}
                    {a.balanceSheetData.companyName}
                    {a.balanceSheetData.tickerSymbol && ` (${a.balanceSheetData.tickerSymbol})`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selected.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Winner badge */}
            {winner && (
              <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
                <Trophy className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">
                  Overall Winner: {winner.balanceSheetData.companyName}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Based on superior liquidity and lower debt risk</p>
              </div>
            )}

            {/* Side-by-side table */}
            <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground font-medium">Metric</th>
                    {selected.map((a, i) => (
                      <th key={a.id} className="text-center p-4 font-semibold text-card-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          {a.balanceSheetData.companyName}
                          {winner?.id === a.id && <Trophy className="h-4 w-4 text-success" />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ratioRows.map(row => {
                    const values = selected.map(a => a.ratios[row.key]);
                    return (
                      <tr key={row.key} className="border-b border-border last:border-0">
                        <td className="p-4 text-muted-foreground font-medium">{row.label}</td>
                        {selected.map((a, i) => (
                          <td key={a.id} className={`text-center p-4 font-semibold ${
                            isBest(values, i, row.higherIsBetter) ? 'text-success' :
                            isWorst(values, i, row.higherIsBetter) && selected.length > 1 ? 'text-destructive' :
                            'text-card-foreground'
                          }`}>
                            {row.format(values[i])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {/* AI Recommendation row */}
                  <tr className="border-b border-border last:border-0">
                    <td className="p-4 text-muted-foreground font-medium">AI Recommendation</td>
                    {selected.map(a => (
                      <td key={a.id} className="text-center p-4">
                        {a.aiAnalysis?.recommendation ? (
                          <Badge variant="outline" className="text-xs">{a.aiAnalysis.recommendation}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-muted-foreground font-medium">Risk Score</td>
                    {selected.map(a => (
                      <td key={a.id} className="text-center p-4 font-semibold text-card-foreground">
                        {a.aiAnalysis?.riskScore != null ? a.aiAnalysis.riskScore : '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Ratio Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend />
                    {selected.map((a, i) => (
                      <Bar key={a.id} dataKey={a.balanceSheetData.companyName} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Spider Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    {selected.map((a, i) => (
                      <Radar key={a.id} name={a.balanceSheetData.companyName} dataKey={a.balanceSheetData.companyName}
                        stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {selected.length === 1 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Select at least one more company to compare</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
