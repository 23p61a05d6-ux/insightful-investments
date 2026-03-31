import { supabase } from '@/integrations/supabase/client';

export async function addToWatchlist(analysisId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('watchlist').insert({
    user_id: user.id,
    analysis_id: analysisId,
  } as any);

  if (error) {
    if (error.code === '23505') throw new Error('Already in watchlist');
    throw error;
  }
}

export async function removeFromWatchlist(analysisId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('watchlist').delete().match({
    user_id: user.id,
    analysis_id: analysisId,
  } as any);

  if (error) throw error;
}

export async function fetchWatchlist(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('watchlist')
    .select('analysis_id')
    .eq('user_id', user.id);

  if (error) throw error;
  return (data || []).map((r: any) => r.analysis_id);
}
