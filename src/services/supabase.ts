import { createClient } from '@supabase/supabase-js';
import type { Bowl } from '../types';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

export function getOrCreateSyncCode(): string {
  let code = localStorage.getItem('bowl-sync-code');
  if (!code) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('bowl-sync-code', code);
  }
  return code;
}

export async function loadSync(syncCode: string): Promise<{ weekPlan: Bowl[]; savedBowls: Bowl[] } | null> {
  const { data, error } = await supabase
    .from('sync_data')
    .select('week_plan, saved_bowls')
    .eq('sync_code', syncCode)
    .single();

  if (error || !data) return null;
  return { weekPlan: data.week_plan ?? [], savedBowls: data.saved_bowls ?? [] };
}

export async function saveSync(syncCode: string, weekPlan: Bowl[], savedBowls: Bowl[]): Promise<void> {
  await supabase.from('sync_data').upsert({
    sync_code: syncCode,
    week_plan: weekPlan,
    saved_bowls: savedBowls,
    updated_at: new Date().toISOString(),
  });
}
