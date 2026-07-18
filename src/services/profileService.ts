import type { Profile } from '../types';
import { supabase } from './supabaseClient';

/**
 * No backend of our own exists — Supabase is queried directly from the client.
 * Throws the raw Supabase `PostgrestError` on failure.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select().eq('id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}
