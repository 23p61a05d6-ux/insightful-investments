import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Sparkles,
  Download, Star, ArrowLeft, Loader2, Shield,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAnalysisStore } from '@/store/analysisStore';
import { getRatioInfos, getHealthColor, getHealthBg, getRecommendationColor } from '@/lib/calculations';
import { RatioHealth, AIAnalysis } from '@/types/analysis';

import { callGeminiAnalysis, getFallbackRecommendation } from '@/lib/api';
import { addToWatchlist } from '@/lib/watchlist';
import { generateAnalysisPDF } from '@/lib/pdf';
import { useToast } from '@/hooks/use-toast';

const CHART_COLORS = {
  good: '#10B981',
  average: '#F59E0B',
  poor: '#EF4444',
  primary: '#3B82F6',
};

function RiskGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180;
  const color = score < 30 ? CHART_COLORS.good : score < 60 ? CHART_COLORS.average : CHART_COLORS.poor;

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Background arc */}
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="hsl(var(--border))" strokeWidth="12" strokeLinecap="round" />
        {/* Score arc */}
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 283} 283`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Needle */}
        <line
          x1="100" y1="100"
          x2={100 + 70 * Math.cos((Math.PI * (180 - angle)) / 180)}
          y2={100 - 70 * Math.sin((Math.PI * (180 - angle)) / 180)}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: 'all 1s ease' }}
        />
        <circle cx="100" cy="100" r="5" fill={color} />
        <text x="100" y="85" textAnchor="middle" className="text-2xl font-bold" fill={color}>{score}</text>
        <text x="100" y="98" textAnchor="middle" className="text-xs" fill="hsl(var(--muted-foreground))">/100</text>
        <text x="15" y="108" className="text-xs" fill="hsl(var(--muted-foreground))">Low</text>
        <text x="170" y="108" className="text-xs" fill="hsl(var(--muted-foreground))">High</text>
      </svg>
      <p className="text-sm font-medium text-muted-foreground mt-1">Risk Score</p>
    </div>
  );
}

export default function AnalysisResults() {
  const navigate = useNavigate();
  const { currentAnalysis, setCurrentAnalysis, updateCurrentAI, isAnalyzing, setIsAnalyzing, analyses, loadAnalyses } = useAnalysisStore();
  const [showAI, setShowAI] = useState(false);
  const { toast } = useToast();
  const { id } = useParams();

  useEffect(() => {
    if (!currentAnalysis && id) {
      // Try to find in store or load from DB
      const found = analyses.find(a => a.id === id);
      if (found) {
        setCurrentAnalysis(found);
      } else {
        loadAnalyses().then(() => {
          const loaded = useAnalysisStore.getState().analyses.find(a => a.id === id);
          if (loaded) setCurrentAnalysis(loaded);
          else navigate('/new-analysis');
        });
      }
    } else if (!currentAnalysis && !id) {
      navigate('/new-analysis');
    }
  }, [currentAnalysis, id, navigate, analyses, setCurrentAnalysis, loadAnalyses]);

  if (!currentAnalysis) return null;

  const ratioInfos = getRatioInfos(currentAnalysis.ratios);

  const barData = ratioInfos.map((r) => ({
    name: r.name,
    value: r.value,
    fill: CHART_COLORS[r.health],
  }));

  const radarData = ratioInfos.map((r) => ({
    subject: r.name,
    value: Math.min(r.value, 100),
    fullMark: 100,
  }));

  const pieData = [
    { name: 'Equity', value: currentAnalysis.balanceSheetData.totalEquity },
    { name: 'Debt', value: currentAnalysis.balanceSheetData.totalDebt },
    { name: 'Other Liabilities', value: Math.max(0, currentAnalysis.balanceSheetData.totalLiabilities - currentAnalysis.balanceSheetData.totalDebt) },
  ];

  const generateAI = async () => {
    setIsAnalyzing(true);
    setShowAI(true);
    try {
      const ai = await callGeminiAnalysis(
        currentAnalysis.balanceSheetData.companyName,
        currentAnalysis.ratios
      );
      await updateCurrentAI(ai);
      toast({ title: 'AI Analysis Complete', description: `Recommendation: ${ai.recommendation}` });
    } catch (e: any) {
      console.error('AI analysis failed, using fallback:', e);
      const fallback = getFallbackRecommendation(currentAnalysis.ratios);
      await updateCurrentAI(fallback);
      toast({
        title: 'AI Unavailable — Using Rule-Based Analysis',
        description: e?.message || 'Gemini API failed. Showing fallback recommendation.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ai = currentAnalysis.aiAnalysis;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/new-analysis')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{currentAnalysis.balanceSheetData.companyName}</h1>
              <p className="text-sm text-muted-foreground">
                {currentAnalysis.balanceSheetData.tickerSymbol && `${currentAnalysis.balanceSheetData.tickerSymbol} · `}
                {currentAnalysis.balanceSheetData.analysisPeriod || new Date(currentAnalysis.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Star className="mr-1 h-4 w-4" /> Watchlist</Button>
            <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" /> PDF</Button>
          </div>
        </div>

        {/* Ratio Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ratioInfos.map((ratio, i) => (
            <motion.div
              key={ratio.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl border p-5 ${getHealthBg(ratio.health)}`}
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">{ratio.name}</p>
              <p className={`text-2xl font-bold ${getHealthColor(ratio.health)}`}>{ratio.formatted}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{ratio.interpretation}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Financial Ratios</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Asset Composition</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill={CHART_COLORS.primary} />
                  <Cell fill={CHART_COLORS.average} />
                  <Cell fill={CHART_COLORS.poor} />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Analysis */}
        {!showAI && !ai && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center"
          >
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">AI-Powered Recommendation</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Get an AI analysis with buy/sell/hold recommendation, risk scoring, and detailed insights.
            </p>
            <Button onClick={generateAI} className="gradient-electric text-primary-foreground border-0">
              <Sparkles className="mr-2 h-4 w-4" /> Generate AI Recommendation
            </Button>
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
            <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-foreground font-medium">Analyzing financial data...</p>
            <p className="text-sm text-muted-foreground mt-1">Our AI is evaluating ratios and market context</p>
          </motion.div>
        )}

        <AnimatePresence>
          {ai && !isAnalyzing && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Recommendation + Risk */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-card flex flex-col items-center justify-center">
                  <p className="text-xs text-muted-foreground mb-3">Recommendation</p>
                  <div className={`text-xl font-extrabold rounded-full px-6 py-3 ${getRecommendationColor(ai.recommendation)} text-primary-foreground`}>
                    {ai.recommendation}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6 shadow-card flex flex-col items-center justify-center">
                  <RiskGauge score={ai.riskScore} />
                </div>
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <p className="text-xs text-muted-foreground mb-3">Confidence Level</p>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-3xl font-bold text-primary">{ai.confidenceLevel}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="h-3 rounded-full gradient-electric transition-all duration-1000" style={{ width: `${ai.confidenceLevel}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Based on available financial data</p>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Executive Summary
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ai.summary}</p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> Strengths
                  </h3>
                  <ul className="space-y-3">
                    {ai.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" /> Weaknesses
                  </h3>
                  <ul className="space-y-3">
                    {ai.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Detailed Reasoning */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="text-sm font-semibold text-card-foreground mb-3">Detailed Reasoning</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ai.reasoning}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
