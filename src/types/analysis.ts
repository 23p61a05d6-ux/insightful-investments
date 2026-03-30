export interface BalanceSheetData {
  companyName: string;
  tickerSymbol?: string;
  analysisPeriod: string;
  totalAssets: number;
  totalLiabilities: number;
  currentAssets: number;
  currentLiabilities: number;
  totalEquity: number;
  totalDebt: number;
}

export interface CalculatedRatios {
  debtRatio: number;
  debtToEquityRatio: number;
  equityRatio: number;
  currentRatio: number;
}

export interface AIAnalysis {
  recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL';
  riskScore: number;
  confidenceLevel: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  reasoning: string;
}

export interface AnalysisResult {
  id: string;
  balanceSheetData: BalanceSheetData;
  ratios: CalculatedRatios;
  aiAnalysis?: AIAnalysis;
  createdAt: string;
}

export type RatioHealth = 'good' | 'average' | 'poor';

export interface RatioInfo {
  name: string;
  value: number;
  formatted: string;
  health: RatioHealth;
  interpretation: string;
}
