import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Upload, History, Star, TrendingUp, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAnalysisStore } from '@/store/analysisStore';
import { getRecommendationColor } from '@/lib/calculations';

const quickActions = [
  { title: 'New Analysis', icon: PlusCircle, url: '/new-analysis', desc: 'Analyze a company' },
  { title: 'Upload File', icon: Upload, url: '/new-analysis?tab=upload', desc: 'Import Excel/CSV' },
  { title: 'View History', icon: History, url: '/history', desc: 'Past analyses' },
  { title: 'Watchlist', icon: Star, url: '/watchlist', desc: 'Saved companies' },
];

export default function Dashboard() {
  const { analyses } = useAnalysisStore();
  const recentAnalyses = analyses.slice(0, 5);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Welcome back 👋</h1>
          <p className="text-muted-foreground mt-1">Here's your analysis overview</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Analyses', value: analyses.length, icon: BarChart3, color: 'text-primary' },
            { label: 'Strong Buys', value: analyses.filter(a => a.aiAnalysis?.recommendation === 'STRONG BUY').length, icon: TrendingUp, color: 'text-success' },
            { label: 'In Watchlist', value: 0, icon: Star, color: 'text-warning' },
            { label: 'This Month', value: analyses.filter(a => new Date(a.createdAt).getMonth() === new Date().getMonth()).length, icon: History, color: 'text-primary' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.url}>
                <div className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-200 cursor-pointer group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3 group-hover:gradient-electric transition-all">
                    <action.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <p className="text-sm font-medium text-card-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Analyses */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Analyses</h2>
          {recentAnalyses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No analyses yet. Start your first one!</p>
              <Link to="/new-analysis">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> New Analysis
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => (
                <Link key={analysis.id} to={`/results/${analysis.id}`}>
                  <div className="rounded-xl border border-border bg-card p-4 shadow-card hover:border-primary/30 transition-all flex items-center justify-between">
                    <div>
                      <p className="font-medium text-card-foreground">{analysis.balanceSheetData.companyName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(analysis.createdAt).toLocaleDateString()}</p>
                    </div>
                    {analysis.aiAnalysis && (
                      <span className={`text-xs font-bold rounded-full px-3 py-1 ${getRecommendationColor(analysis.aiAnalysis.recommendation)} text-primary-foreground`}>
                        {analysis.aiAnalysis.recommendation}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
