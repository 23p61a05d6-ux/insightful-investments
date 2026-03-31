import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult, AIAnalysis, BalanceSheetData, CalculatedRatios } from '@/types/analysis';

export async function saveAnalysis(analysis: AnalysisResult): Promise<string> {
  const d = analysis.balanceSheetData;
  const r = analysis.ratios;
  const ai = analysis.aiAnalysis;

  const { data, error } = await supabase.from('analyses').insert({
    id: analysis.id,
    company_name: d.companyName,
    ticker_symbol: d.tickerSymbol || null,
    analysis_period: d.analysisPeriod || null,
    total_assets: d.totalAssets,
    total_liabilities: d.totalLiabilities,
    current_assets: d.currentAssets,
    current_liabilities: d.currentLiabilities,
    total_equity: d.totalEquity,
    total_debt: d.totalDebt,
    debt_ratio: r.debtRatio,
    debt_to_equity_ratio: r.debtToEquityRatio,
    equity_ratio: r.equityRatio,
    current_ratio: r.currentRatio,
    ai_recommendation: ai?.recommendation || null,
    ai_risk_score: ai?.riskScore || null,
    ai_confidence_level: ai?.confidenceLevel || null,
    ai_strengths: ai?.strengths || null,
    ai_weaknesses: ai?.weaknesses || null,
    ai_summary: ai?.summary || null,
    ai_reasoning: ai?.reasoning || null,
  } as any).select('id').single();

  if (error) throw error;
  return data?.id || analysis.id;
}

export async function updateAnalysisAI(id: string, ai: AIAnalysis): Promise<void> {
  const { error } = await supabase.from('analyses').update({
    ai_recommendation: ai.recommendation,
    ai_risk_score: ai.riskScore,
    ai_confidence_level: ai.confidenceLevel,
    ai_strengths: ai.strengths,
    ai_weaknesses: ai.weaknesses,
    ai_summary: ai.summary,
    ai_reasoning: ai.reasoning,
  } as any).eq('id', id);

  if (error) throw error;
}

export async function fetchAnalyses(): Promise<AnalysisResult[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    balanceSheetData: {
      companyName: row.company_name,
      tickerSymbol: row.ticker_symbol,
      analysisPeriod: row.analysis_period,
      totalAssets: Number(row.total_assets),
      totalLiabilities: Number(row.total_liabilities),
      currentAssets: Number(row.current_assets),
      currentLiabilities: Number(row.current_liabilities),
      totalEquity: Number(row.total_equity),
      totalDebt: Number(row.total_debt),
    },
    ratios: {
      debtRatio: Number(row.debt_ratio),
      debtToEquityRatio: Number(row.debt_to_equity_ratio),
      equityRatio: Number(row.equity_ratio),
      currentRatio: Number(row.current_ratio),
    },
    aiAnalysis: row.ai_recommendation ? {
      recommendation: row.ai_recommendation,
      riskScore: row.ai_risk_score,
      confidenceLevel: row.ai_confidence_level,
      strengths: row.ai_strengths || [],
      weaknesses: row.ai_weaknesses || [],
      summary: row.ai_summary || '',
      reasoning: row.ai_reasoning || '',
    } : undefined,
    createdAt: row.created_at,
  }));
}

export async function callGeminiAnalysis(
  companyName: string,
  ratios: CalculatedRatios
): Promise<AIAnalysis> {
  const { data, error } = await supabase.functions.invoke('analyze', {
    body: {
      companyName,
      debtRatio: ratios.debtRatio.toFixed(1),
      debtToEquityRatio: ratios.debtToEquityRatio.toFixed(2),
      equityRatio: ratios.equityRatio.toFixed(1),
      currentRatio: ratios.currentRatio.toFixed(2),
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return {
    recommendation: data.recommendation,
    riskScore: data.riskScore,
    confidenceLevel: data.confidenceLevel,
    strengths: data.strengths,
    weaknesses: data.weaknesses,
    summary: data.summary,
    reasoning: data.reasoning,
  };
}

// Fallback rule-based recommendation
export function getFallbackRecommendation(ratios: CalculatedRatios): AIAnalysis {
  const { currentRatio, debtToEquityRatio, debtRatio, equityRatio } = ratios;

  let recommendation: AIAnalysis['recommendation'];
  let riskScore: number;

  if (currentRatio > 1.5 && debtToEquityRatio < 1) {
    recommendation = 'STRONG BUY';
    riskScore = 20;
  } else if (currentRatio > 1 && debtToEquityRatio < 2) {
    recommendation = 'BUY';
    riskScore = 35;
  } else if (currentRatio > 0.8 && debtToEquityRatio < 3) {
    recommendation = 'HOLD';
    riskScore = 50;
  } else if (currentRatio > 0.5 || debtToEquityRatio < 5) {
    recommendation = 'SELL';
    riskScore = 70;
  } else {
    recommendation = 'STRONG SELL';
    riskScore = 90;
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (currentRatio > 1.5) strengths.push('Strong liquidity position');
  else if (currentRatio < 1) weaknesses.push('Low liquidity — may struggle with short-term obligations');

  if (debtToEquityRatio < 1) strengths.push('Conservative debt levels');
  else if (debtToEquityRatio > 2) weaknesses.push('High leverage increases financial risk');

  if (equityRatio > 50) strengths.push('Well-capitalized with strong equity base');
  else if (equityRatio < 30) weaknesses.push('Low equity base — vulnerable to downturns');

  if (debtRatio < 40) strengths.push('Low overall debt burden');
  else if (debtRatio > 60) weaknesses.push('High debt ratio limits financial flexibility');

  return {
    recommendation,
    riskScore,
    confidenceLevel: 60,
    strengths: strengths.length ? strengths : ['Adequate financial metrics'],
    weaknesses: weaknesses.length ? weaknesses : ['Limited data for comprehensive assessment'],
    summary: `Rule-based analysis: ${recommendation} recommendation based on current ratio of ${currentRatio.toFixed(2)} and debt-to-equity of ${debtToEquityRatio.toFixed(2)}.`,
    reasoning: 'This is a fallback analysis based on financial ratio thresholds. For a more detailed AI-powered analysis, please ensure your Gemini API key is configured.',
  };
}
