import { supabase } from '@/lib/supabase'

export interface Quote {
  id: string
  quote_number?: string
  client_id: string
  enquiry_id?: string
  product_recommendation_id?: string
  opportunity_id?: string
  status: 'draft' | 'sent' | 'accepted' | 'declined'
  quote_date?: string
  validity_days?: number
  valid_until?: string
  total_cost_ex_gst?: number
  total_sell_ex_gst?: number
  gst_amount?: number
  total_inc_gst?: number
  discount_percent?: number
  discount_amount?: number
  margin_percent?: number
  sales_rep_id?: string
  created_by_user_id?: string
  created_at: string
  updated_at: string
  sent_at?: string
  accepted_at?: string
  accepted_by?: string
  notes?: string
  version?: string
}

export interface QuoteWithRelations extends Quote {
  client?: {
    id: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
    company_name?: string
  }
  sales_rep?: {
    id: string
    first_name: string
    last_name: string
    email?: string
  }
}

export async function fetchQuoteWithRelations(
  quoteId: string
): Promise<QuoteWithRelations> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(
        `
        *,
        client:clients(id, first_name, last_name, email, phone, company_name),
        sales_rep:sales_reps(id, first_name, last_name, email)
      `
      )
      .eq('id', quoteId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Quote not found')

    return data as QuoteWithRelations
  } catch (error) {
    console.error('Error fetching quote with relations:', error)
    throw error
  }
}

export async function fetchQuotesByClient(clientId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        sales_rep:team_members!quotes_sales_rep_id_fkey(id, first_name, last_name, email, phone)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as any[]
  } catch (error) {
    console.error('Error fetching quotes by client:', error)
    throw error
  }
}

export async function fetchQuotesByOpportunity(oppId: string): Promise<Quote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('opportunity_id', oppId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Quote[]
  } catch (error) {
    console.error('Error fetching quotes by opportunity:', error)
    throw error
  }
}

export async function fetchQuotesByStatus(status: string): Promise<Quote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Quote[]
  } catch (error) {
    console.error('Error fetching quotes by status:', error)
    throw error
  }
}

export async function fetchQuotesBySalesRep(salesRepId: string): Promise<Quote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('sales_rep_id', salesRepId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Quote[]
  } catch (error) {
    console.error('Error fetching quotes by sales rep:', error)
    throw error
  }
}

export async function createQuote(data: {
  client_id: string
  enquiry_id?: string
  product_recommendation_id?: string
  opportunity_id?: string
  status?: string
  total_cost_ex_gst?: number
  total_sell_ex_gst?: number
  gst_amount?: number
  total_inc_gst?: number
  discount_percent?: number
  discount_amount?: number
  margin_percent?: number
  sales_rep_id?: string
  created_by_user_id: string
  validity_days?: number
  notes?: string
}): Promise<Quote> {
  try {
    const { data: quoteData, error } = await supabase
      .from('quotes')
      .insert({
        ...data,
        status: data.status || 'draft',
      })
      .select()
      .single()

    if (error) throw error
    if (!quoteData) throw new Error('Quote creation failed')

    return quoteData as Quote
  } catch (error) {
    console.error('Error creating quote:', error)
    throw error
  }
}

export async function updateQuote(
  quoteId: string,
  updates: Partial<Quote>
): Promise<Quote> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Quote update failed')

    return data as Quote
  } catch (error) {
    console.error('Error updating quote:', error)
    throw error
  }
}

export async function updateQuoteStatus(
  quoteId: string,
  status: 'draft' | 'sent' | 'accepted' | 'declined',
  acceptedBy?: string
): Promise<Quote> {
  try {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'accepted') {
      updates.accepted_at = new Date().toISOString()
      if (acceptedBy) {
        updates.accepted_by = acceptedBy
      }
    }

    if (status === 'sent') {
      updates.sent_at = new Date().toISOString()
    }

    return updateQuote(quoteId, updates)
  } catch (error) {
    console.error('Error updating quote status:', error)
    throw error
  }
}

export async function acceptQuote(quoteId: string, acceptedBy?: string): Promise<Quote> {
  return updateQuoteStatus(quoteId, 'accepted', acceptedBy)
}

export async function deleteQuote(quoteId: string): Promise<void> {
  try {
    const quote = await fetchQuoteWithRelations(quoteId)
    if (quote.status !== 'draft') {
      throw new Error('Can only delete draft quotes')
    }

    const { error } = await supabase.from('quotes').delete().eq('id', quoteId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting quote:', error)
    throw error
  }
}