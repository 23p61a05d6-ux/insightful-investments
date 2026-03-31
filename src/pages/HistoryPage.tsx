import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Loader2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAnalysisStore } from '@/store/analysisStore';
import { getRecommendationColor } from '@/lib/calculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
  const { analyses, isLoading, loadAnalyses, setCurrentAnalysis } = useAnalysisStore();

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Analysis History</h1>
        <p className="text-muted-foreground mb-8">View all your past analyses</p>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading analyses...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No analyses yet. Start your first one!</p>
            <Link to="/new-analysis">
              <Button>New Analysis</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis, i) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/results/${analysis.id}`}
                  onClick={() => setCurrentAnalysis(analysis)}
                  className="block"
                >
                  <div className="rounded-xl border border-border bg-card p-4 shadow-card hover:border-primary/30 transition-all flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-card-foreground truncate">
                        {analysis.balanceSheetData.companyName}
                        {analysis.balanceSheetData.tickerSymbol && (
                          <span className="text-muted-foreground ml-2 text-sm">
                            ({analysis.balanceSheetData.tickerSymbol})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(analysis.createdAt).toLocaleDateString()} · DR: {analysis.ratios.debtRatio.toFixed(1)}% · CR: {analysis.ratios.currentRatio.toFixed(2)}
                        {analysis.aiAnalysis?.riskScore != null && ` · Risk: ${analysis.aiAnalysis.riskScore}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {analysis.aiAnalysis?.recommendation && (
                        <span className={`text-xs font-bold rounded-full px-3 py-1 ${getRecommendationColor(analysis.aiAnalysis.recommendation)} text-primary-foreground`}>
                          {analysis.aiAnalysis.recommendation}
                        </span>
                      )}
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
