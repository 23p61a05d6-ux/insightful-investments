import { TrendingUp, TrendingDown, Minus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendationBadgeProps {
  recommendation: string;
  size?: 'sm' | 'md' | 'lg';
}

const config: Record<string, { bg: string; text: string; icon: typeof TrendingUp; label: string }> = {
  'STRONG BUY': { bg: 'bg-success/15 border-success/30', text: 'text-success', icon: ArrowUpCircle, label: 'Strong Buy' },
  'BUY': { bg: 'bg-success/10 border-success/20', text: 'text-success', icon: TrendingUp, label: 'Buy' },
  'HOLD': { bg: 'bg-warning/10 border-warning/20', text: 'text-warning', icon: Minus, label: 'Hold' },
  'SELL': { bg: 'bg-destructive/10 border-destructive/20', text: 'text-destructive', icon: TrendingDown, label: 'Sell' },
  'STRONG SELL': { bg: 'bg-destructive/15 border-destructive/30', text: 'text-destructive', icon: ArrowDownCircle, label: 'Strong Sell' },
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-lg gap-3',
};

const iconSizes = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-6 w-6' };

export function RecommendationBadge({ recommendation, size = 'md' }: RecommendationBadgeProps) {
  const c = config[recommendation] || config['HOLD'];
  const Icon = c.icon;

  return (
    <div className={cn(
      'inline-flex items-center rounded-full border font-bold transition-all',
      c.bg, c.text, sizes[size]
    )}>
      <Icon className={iconSizes[size]} />
      <span>{c.label}</span>
    </div>
  );
}
