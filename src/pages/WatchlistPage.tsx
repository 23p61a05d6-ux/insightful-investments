import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Loader2, Eye, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAnalysisStore } from '@/store/analysisStore';
import { fetchWatchlist, removeFromWatchlist } from '@/lib/watchlist';
import { getRecommendationColor } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AnalysisResult } from '@/types/analysis';

export default function WatchlistPage() {
  const { analyses, loadAnalyses, setCurrentAnalysis } = useAnalysisStore();
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadAnalyses();
      const ids = await fetchWatchlist();
      setWatchlistIds(ids);
      setLoading(false);
    };
    load();
  }, [loadAnalyses]);

  const watchedAnalyses = analyses.filter((a) => watchlistIds.includes(a.id));

  const handleRemove = async (id: string) => {
    try {
      await removeFromWatchlist(id);
      setWatchlistIds((prev) => prev.filter((wid) => wid !== id));
      toast({ title: 'Removed from watchlist' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Watchlist</h1>
        <p className="text-muted-foreground mb-8">Track companies you're interested in</p>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading watchlist...</p>
          </div>
        ) : watchedAnalyses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Star className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No companies in your watchlist yet. Add them from analysis results.
            </p>
            <Link to="/history">
              <Button variant="outline">Browse History</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {watchedAnalyses.map((analysis, i) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-4 shadow-card hover:border-primary/30 transition-all flex items-center justify-between"
              >
                <Link
                  to={`/results/${analysis.id}`}
                  onClick={() => setCurrentAnalysis(analysis)}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium text-card-foreground truncate">
                    {analysis.balanceSheetData.companyName}
                    {analysis.balanceSheetData.tickerSymbol && (
                      <span className="text-muted-foreground ml-2 text-sm">
                        ({analysis.balanceSheetData.tickerSymbol})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    DR: {analysis.ratios.debtRatio.toFixed(1)}% · CR: {analysis.ratios.currentRatio.toFixed(2)}
                    {analysis.aiAnalysis?.riskScore != null && ` · Risk: ${analysis.aiAnalysis.riskScore}`}
                  </p>
                </Link>
                <div className="flex items-center gap-2 ml-4">
                  {analysis.aiAnalysis?.recommendation && (
                    <span className={`text-xs font-bold rounded-full px-3 py-1 ${getRecommendationColor(analysis.aiAnalysis.recommendation)} text-primary-foreground`}>
                      {analysis.aiAnalysis.recommendation}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.preventDefault(); handleRemove(analysis.id); }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
