import { BarChart3 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function HistoryPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Analysis History</h1>
        <p className="text-muted-foreground mb-8">View all your past analyses</p>
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Your analysis history will appear here.</p>
        </div>
      </div>
    </AppLayout>
  );
}
