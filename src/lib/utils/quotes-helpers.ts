import { supabase } from '@/lib/supabase';

export interface Quote {
  id: string
  quote_number: string
  version_number: number
  client_id: string
  company_id?: string
  opportunity_id?: string
  quote_date: string
  valid_until: string
  subtotal: number
  gst_amount: number
  total_amount: number
  status: string
  is_draft: boolean
  sales_rep_id?: string
  created_at: string
  updated_at: string
  notes?: string
}

/**
 * Fetch all quotes for a specific client
 */
export async function fetchQuotesByClient(clientId: string): Promise<Quote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Quote[]
  } catch (error) {
    console.error('Error fetching quotes by client:', error)
    throw error
  }
}

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
