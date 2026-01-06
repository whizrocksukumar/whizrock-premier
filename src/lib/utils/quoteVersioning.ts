import { supabase } from '@/lib/supabase'

/**
 * Returns the next FINAL version number for a quote_number
 * Drafts (version 0) are ignored
 */
export const getNextQuoteVersion = async (
  quoteNumber: string
): Promise<number> => {
  const { data, error } = await supabase
    .from('quotes')
    .select('version_number')
    .eq('quote_number', quoteNumber)
    .eq('is_draft', false)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (safe to ignore)
    throw error
  }

  return (data?.version_number || 0) + 1
}

/**
 * Marks all current FINAL versions of a quote_number as not current
 */
export const supersedeCurrentFinalQuote = async (
  quoteNumber: string
) => {
  const { error } = await supabase
    .from('quotes')
    .update({
      is_current: false,
      superseded_at: new Date()
    })
    .eq('quote_number', quoteNumber)
    .eq('is_current', true)
    .eq('is_draft', false)

  if (error) {
    throw error
  }
}

/**
 * Freezes the active Terms & Conditions for a final quote
 */
export const snapshotQuoteTerms = async (quoteId: string) => {
  const { data: terms, error } = await supabase
    .from('quote_terms_master')
    .select('title, body')
    .eq('is_active', true)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()

  if (error || !terms) {
    return
  }

  const { error: insertError } = await supabase
    .from('quote_terms_snapshot')
    .insert({
      quote_id: quoteId,
      title: terms.title,
      body: terms.body
    })

  if (insertError) {
    throw insertError
  }
}
