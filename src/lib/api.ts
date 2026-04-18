/**
 * API Layer — Data Persistence & AI Integration
 * ===============================================
 * 
 * This file handles all communication between the frontend and the backend (Supabase).
 * 
 * DATA STORAGE:
 * - All analysis data is stored in the `analyses` table in Supabase PostgreSQL
 * - The Supabase JS client (`@supabase/supabase-js`) handles authentication headers automatically
 * - Row Level Security (RLS) ensures each user can only access their own data
 * 
 * FUNCTIONS:
 * - saveAnalysis()       → INSERT into `analyses` table (called after calculating ratios)
 * - updateAnalysisAI()   → UPDATE `analyses` table with AI results (after Gemini responds)
 * - fetchAnalyses()      → SELECT from `analyses` table (loads user's history)
 * - callGeminiAnalysis() → Invokes the `analyze` Edge Function which calls Google Gemini API
 * - getFallbackRecommendation() → Rule-based fallback if Gemini API fails
 */

import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult, AIAnalysis, BalanceSheetData, CalculatedRatios } from '@/types/analysis';

/**
 * Save a new analysis to the database.
 * Called from analysisStore.addAnalysis() after ratio calculation.
 * The user_id is automatically set from the authenticated session.
 */
export async function saveAnalysis(analysis: AnalysisResult): Promise<string> {
  const d = analysis.balanceSheetData;
  const r = analysis.ratios;
  const ai = analysis.aiAnalysis;

  // Get the currently authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  // Insert into the `analyses` table in Supabase PostgreSQL
  const { data, error } = await supabase.from('analyses').insert({
    id: analysis.id,
    user_id: user?.id,
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

/**
 * Update an existing analysis with AI-generated results.
 * Called after Gemini API returns a recommendation.
 */
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

/**
 * Fetch all analyses for the current user from the database.
 * RLS policies automatically filter by user_id = auth.uid().
 * Used by HistoryPage, Dashboard, ComparisonPage, and WatchlistPage.
 */
export async function fetchAnalyses(): Promise<AnalysisResult[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Map database rows to the frontend AnalysisResult type
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

/**
 * Call the Gemini AI analysis via the `analyze` Supabase Edge Function.
 * 
 * FLOW:
 * 1. Client calls supabase.functions.invoke('analyze', { body })
 * 2. Edge Function reads GEMINI_API_KEY from server-side secrets
 * 3. Edge Function sends a structured prompt to Google Gemini API
 * 4. Gemini returns JSON with recommendation, risk score, etc.
 * 5. Edge Function parses and returns the result to the client
 */
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

/**
 * Fallback rule-based recommendation when Gemini API is unavailable.
 * Uses simple threshold logic on the 4 financial ratios.
 * This ensures the app still provides value even without AI.
 */
export function getFallbackRecommendation(ratios: CalculatedRatios): AIAnalysis {
  const { currentRatio, debtToEquityRatio, debtRatio, equityRatio } = ratios;

  let recommendation: AIAnalysis['recommendation'];
  let riskScore: number;
  let confidenceLevel: number;

  if (currentRatio > 1.5 && debtToEquityRatio < 1) {
    recommendation = 'STRONG BUY';
    riskScore = 18;
    confidenceLevel = 88;
  } else if (currentRatio > 1 && debtToEquityRatio < 2) {
    recommendation = 'BUY';
    riskScore = 34;
    confidenceLevel = 80;
  } else if (currentRatio > 0.8 && debtToEquityRatio < 3) {
    recommendation = 'HOLD';
    riskScore = 52;
    confidenceLevel = 74;
  } else if (currentRatio > 0.5 || debtToEquityRatio < 5) {
    recommendation = 'SELL';
    riskScore = 72;
    confidenceLevel = 78;
  } else {
    recommendation = 'STRONG SELL';
    riskScore = 90;
    confidenceLevel = 85;
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Liquidity
  if (currentRatio > 1.5)
    strengths.push(`Strong liquidity with a current ratio of ${currentRatio.toFixed(2)} — comfortably covers short-term obligations.`);
  else if (currentRatio >= 1)
    strengths.push(`Adequate liquidity (current ratio ${currentRatio.toFixed(2)}) — short-term obligations are manageable.`);
  else
    weaknesses.push(`Weak liquidity (current ratio ${currentRatio.toFixed(2)}) — the company may struggle to meet short-term obligations.`);

  // Leverage (D/E)
  if (debtToEquityRatio < 1)
    strengths.push(`Conservative leverage with a debt-to-equity ratio of ${debtToEquityRatio.toFixed(2)} — low reliance on borrowed capital.`);
  else if (debtToEquityRatio <= 2)
    strengths.push(`Moderate leverage (D/E ${debtToEquityRatio.toFixed(2)}) — debt is being used within reasonable limits.`);
  else
    weaknesses.push(`High leverage (D/E ${debtToEquityRatio.toFixed(2)}) — heavy reliance on debt amplifies financial risk.`);

  // Equity base
  if (equityRatio > 50)
    strengths.push(`Strong equity base — ${equityRatio.toFixed(1)}% of assets are funded by shareholders, signaling resilience.`);
  else if (equityRatio < 30)
    weaknesses.push(`Thin equity cushion — only ${equityRatio.toFixed(1)}% of assets are equity-funded, leaving little buffer in downturns.`);

  // Debt burden
  if (debtRatio < 40)
    strengths.push(`Low overall debt burden (${debtRatio.toFixed(1)}%) — preserves financial flexibility for future growth.`);
  else if (debtRatio > 60)
    weaknesses.push(`Elevated debt ratio (${debtRatio.toFixed(1)}%) — limits flexibility and increases interest-rate sensitivity.`);

  // Ensure at least 2-3 each
  while (strengths.length < 2)
    strengths.push('Balance sheet structure is within acceptable industry norms for ongoing operations.');
  while (weaknesses.length < 2)
    weaknesses.push('Continued monitoring is advised as ratio improvements would further strengthen the investment case.');

  const why =
    recommendation === 'STRONG BUY' || recommendation === 'BUY'
      ? `the company demonstrates healthy liquidity, balanced leverage, and a solid equity base — supporting a ${recommendation} stance for investors seeking sustainable growth.`
      : recommendation === 'HOLD'
      ? `the company shows mixed signals — some metrics are healthy while others raise caution, justifying a HOLD stance until clearer trends emerge.`
      : `the company carries elevated financial risk driven by weak liquidity and/or high leverage, warranting a cautious ${recommendation} stance.`;

  const summary =
    `Based on a comprehensive review of the balance sheet, the recommendation is ${recommendation}. ` +
    `The current ratio of ${currentRatio.toFixed(2)} reflects ${currentRatio >= 1.5 ? 'strong' : currentRatio >= 1 ? 'adequate' : 'weak'} short-term liquidity, ` +
    `while a debt-to-equity ratio of ${debtToEquityRatio.toFixed(2)} indicates ${debtToEquityRatio < 1 ? 'a conservative' : debtToEquityRatio <= 2 ? 'a moderate' : 'an aggressive'} capital structure. ` +
    `Overall, ${why}`;

  const reasoning =
    `Debt Ratio (${debtRatio.toFixed(1)}%): ${debtRatio < 40 ? 'A low share of assets is financed through debt, giving the company strong financial flexibility and lower interest exposure.' : debtRatio <= 60 ? 'A moderate portion of assets is debt-financed, which is sustainable but should be monitored.' : 'A large share of assets is debt-financed, which increases insolvency risk during downturns.'} ` +
    `Debt-to-Equity (${debtToEquityRatio.toFixed(2)}): ${debtToEquityRatio < 1 ? 'Equity comfortably exceeds debt, signaling a conservative capital structure with reduced default risk.' : debtToEquityRatio <= 2 ? 'Debt and equity are reasonably balanced — typical of most established firms.' : 'Debt significantly outweighs equity, magnifying both potential returns and financial risk.'} ` +
    `Equity Ratio (${equityRatio.toFixed(1)}%): ${equityRatio > 50 ? 'A majority of assets are funded by shareholders, providing a strong cushion against losses.' : equityRatio >= 30 ? 'Equity funding is adequate but leaves room for improvement in capital strength.' : 'Equity funding is thin, reducing the buffer available to absorb operating shocks.'} ` +
    `Current Ratio (${currentRatio.toFixed(2)}): ${currentRatio > 1.5 ? 'Current assets comfortably exceed current liabilities, indicating strong short-term liquidity.' : currentRatio >= 1 ? 'Current assets cover current liabilities, suggesting acceptable liquidity.' : 'Current liabilities exceed current assets, raising concerns about meeting short-term obligations.'} ` +
    `Taken together, these indicators point to ${recommendation === 'STRONG BUY' || recommendation === 'BUY' ? 'a financially stable company with attractive fundamentals' : recommendation === 'HOLD' ? 'a company with mixed financial signals that justifies a wait-and-watch approach' : 'a company under financial strain where capital preservation should take priority'}, ` +
    `which underpins the final ${recommendation} recommendation.`;

  return {
    recommendation,
    riskScore,
    confidenceLevel,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    summary,
    reasoning,
  };
}
