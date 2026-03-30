import { BalanceSheetData, CalculatedRatios, RatioHealth, RatioInfo } from '@/types/analysis';

export function calculateRatios(data: BalanceSheetData): CalculatedRatios {
  return {
    debtRatio: (data.totalDebt / data.totalAssets) * 100,
    debtToEquityRatio: data.totalDebt / data.totalEquity,
    equityRatio: (data.totalEquity / data.totalAssets) * 100,
    currentRatio: data.currentAssets / data.currentLiabilities,
  };
}

export function getDebtRatioHealth(value: number): RatioHealth {
  if (value < 40) return 'good';
  if (value < 60) return 'average';
  return 'poor';
}

export function getDebtToEquityHealth(value: number): RatioHealth {
  if (value < 1) return 'good';
  if (value < 2) return 'average';
  return 'poor';
}

export function getEquityRatioHealth(value: number): RatioHealth {
  if (value > 50) return 'good';
  if (value > 30) return 'average';
  return 'poor';
}

export function getCurrentRatioHealth(value: number): RatioHealth {
  if (value > 1.5) return 'good';
  if (value > 1) return 'average';
  return 'poor';
}

export function getRatioInfos(ratios: CalculatedRatios): RatioInfo[] {
  return [
    {
      name: 'Debt Ratio',
      value: ratios.debtRatio,
      formatted: `${ratios.debtRatio.toFixed(1)}%`,
      health: getDebtRatioHealth(ratios.debtRatio),
      interpretation: ratios.debtRatio < 40
        ? 'Low leverage — strong financial position'
        : ratios.debtRatio < 60
        ? 'Moderate leverage — acceptable but monitor'
        : 'High leverage — elevated financial risk',
    },
    {
      name: 'Debt-to-Equity',
      value: ratios.debtToEquityRatio,
      formatted: ratios.debtToEquityRatio.toFixed(2),
      health: getDebtToEquityHealth(ratios.debtToEquityRatio),
      interpretation: ratios.debtToEquityRatio < 1
        ? 'More equity than debt — conservative financing'
        : ratios.debtToEquityRatio < 2
        ? 'Balanced mix of debt and equity'
        : 'Heavily debt-financed — higher risk',
    },
    {
      name: 'Equity Ratio',
      value: ratios.equityRatio,
      formatted: `${ratios.equityRatio.toFixed(1)}%`,
      health: getEquityRatioHealth(ratios.equityRatio),
      interpretation: ratios.equityRatio > 50
        ? 'Strong equity base — well-capitalized'
        : ratios.equityRatio > 30
        ? 'Adequate equity cushion'
        : 'Low equity — vulnerable to downturns',
    },
    {
      name: 'Current Ratio',
      value: ratios.currentRatio,
      formatted: ratios.currentRatio.toFixed(2),
      health: getCurrentRatioHealth(ratios.currentRatio),
      interpretation: ratios.currentRatio > 1.5
        ? 'Strong liquidity — can easily meet short-term obligations'
        : ratios.currentRatio > 1
        ? 'Adequate liquidity — meets obligations with some margin'
        : 'Liquidity concern — may struggle with short-term debts',
    },
  ];
}

export function getRecommendationColor(rec: string): string {
  switch (rec) {
    case 'STRONG BUY': return 'gradient-success';
    case 'BUY': return 'bg-success';
    case 'HOLD': return 'gradient-warning';
    case 'SELL': return 'bg-warning';
    case 'STRONG SELL': return 'gradient-danger';
    default: return 'bg-muted';
  }
}

export function getHealthColor(health: RatioHealth): string {
  switch (health) {
    case 'good': return 'text-success';
    case 'average': return 'text-warning';
    case 'poor': return 'text-destructive';
  }
}

export function getHealthBg(health: RatioHealth): string {
  switch (health) {
    case 'good': return 'bg-success/10 border-success/20';
    case 'average': return 'bg-warning/10 border-warning/20';
    case 'poor': return 'bg-destructive/10 border-destructive/20';
  }
}
