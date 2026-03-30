import { Star } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function WatchlistPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Watchlist</h1>
        <p className="text-muted-foreground mb-8">Track companies you're interested in</p>
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Star className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Add companies from analysis results to track them here.</p>
        </div>
      </div>
    </AppLayout>
  );
}
