import { supabase } from '@/lib/supabase';

/**
 * Returns the next version number for a quote.
 *
 * Rules:
 * - Drafts (version 0) are ignored
 * - First final version = 1
 * - Subsequent versions increment by 1
 * - Never throws if no rows exist
 */
export async function getNextQuoteVersion(
  quoteNumber: string
): Promise<number> {
  if (!quoteNumber) {
    throw new Error('quoteNumber is required');
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('version_number')
    .eq('quote_number', quoteNumber)
    .eq('is_draft', false)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const latestVersion =
    typeof data?.version_number === 'number'
      ? data.version_number
      : 0;

  return latestVersion + 1;
}
