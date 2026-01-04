import { supabase } from '@/lib/supabase'
import { fetchClientInvoiceSummary } from '@/lib/invoices-helpers'

export interface Client {
  id: string
  ghl_contact_id?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  postcode?: string
  region_id?: string
  property_type?: string
  notes?: string
  company_id?: string
  title?: string
  contact_type?: string
  status?: string
  contact_tags?: string[]
  do_not_contact?: boolean
  preferred_contact_method?: string
  client_type_id?: string
  company_name?: string
  industry?: string
  website?: string
  sales_rep_id?: string
  is_primary_contact?: boolean
  created_at: string
  updated_at: string
}

export interface ClientWithRelations extends Client {
  client_type?: {
    id: string
    name: string
    color?: string
    icon?: string
  }
  sales_rep?: {
    id: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
  region?: {
    id: string
    name: string
    code: string
  }
}

export interface ActivitySummary {
  quotes_total: number
  quotes_accepted: number
  assessments_total: number
  assessments_completed: number
  jobs_total: number
  jobs_in_progress: number
  invoices_total: number
  invoices_unpaid_amount: number
  invoices_overdue_amount: number
  invoices_revenue_total: number
  total_revenue: number
}

export async function fetchClientWithRelations(
  clientId: string
): Promise<ClientWithRelations> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select(
        `
        *,
        client_types(id, name, color, icon),
        sales_reps(id, first_name, last_name, email, phone),
        regions(id, name, code)
      `
      )
      .eq('id', clientId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Client not found')

    return data as ClientWithRelations
  } catch (error) {
    console.error('Error fetching client with relations:', error)
    throw error
  }
}

export async function fetchClient(clientId: string): Promise<Client> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Client not found')

    return data as Client
  } catch (error) {
    console.error('Error fetching client:', error)
    throw error
  }
}

export async function searchClients(
  query: string,
  limit: number = 20
): Promise<Client[]> {
  try {
    if (!query || query.trim().length === 0) {
      return []
    }

    const searchTerm = `%${query}%`

    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, company_name, region_id, status, client_type_id')
      .or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},company_name.ilike.${searchTerm}`
      )
      .eq('status', 'Active')
      .limit(limit)

    if (error) throw error
    return (data || []) as Client[]
  } catch (error) {
    console.error('Error searching clients:', error)
    throw error
  }
}

export async function fetchAllClients(
  page: number = 1,
  pageSize: number = 20,
  status?: string
): Promise<{ data: Client[]; count: number }> {
  try {
    let query = supabase.from('clients').select('*', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error
    return { data: (data || []) as Client[], count: count || 0 }
  } catch (error) {
    console.error('Error fetching all clients:', error)
    throw error
  }
}

export async function createClient(data: {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  postcode?: string
  region_id?: string
  property_type?: string
  company_name?: string
  industry?: string
  website?: string
  client_type_id?: string
  sales_rep_id?: string
  is_primary_contact?: boolean
  status?: string
  notes?: string
}): Promise<Client> {
  try {
    const { data: clientData, error } = await supabase
      .from('clients')
      .insert({
        ...data,
        status: data.status || 'Active',
      })
      .select()
      .single()

    if (error) throw error
    if (!clientData) throw new Error('Client creation failed')

    return clientData as Client
  } catch (error) {
    console.error('Error creating client:', error)
    throw error
  }
}

export async function updateClient(
  clientId: string,
  updates: Partial<Client>
): Promise<Client> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Client update failed')

    return data as Client
  } catch (error) {
    console.error('Error updating client:', error)
    throw error
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('clients')
      .update({
        status: 'Inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting client:', error)
    throw error
  }
}

export async function fetchClientActivitySummary(
  clientId: string
): Promise<ActivitySummary> {
  try {
    // Fetch quotes data
    const { count: quotesTotal } = await supabase
      .from('quotes')
      .select('id', { count: 'exact' })
      .eq('client_id', clientId)

    const { count: quotesAccepted } = await supabase
      .from('quotes')
      .select('id', { count: 'exact' })
      .eq('client_id', clientId)
      .eq('status', 'Accepted')

    // Fetch assessments data
    const { count: assessmentsTotal } = await supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('client_id', clientId)

    const { count: assessmentsCompleted } = await supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('client_id', clientId)
      .eq('status', 'Completed')

    // Fetch jobs data
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('id, status')
      .in(
        'quote_id',
        (
          await supabase
            .from('quotes')
            .select('id')
            .eq('client_id', clientId)
        ).data?.map((q) => q.id) || []
      )

    const jobsTotal = jobsData?.length || 0
    const jobsInProgress = jobsData?.filter((j) => j.status === 'In Progress').length || 0

    // Fetch invoice summary using new helper function
    const invoiceSummary = await fetchClientInvoiceSummary(clientId)

    // Calculate total revenue (sum of paid invoices)
    const totalRevenue = invoiceSummary.invoices_revenue_total

    return {
      quotes_total: quotesTotal || 0,
      quotes_accepted: quotesAccepted || 0,
      assessments_total: assessmentsTotal || 0,
      assessments_completed: assessmentsCompleted || 0,
      jobs_total: jobsTotal,
      jobs_in_progress: jobsInProgress,
      invoices_total: invoiceSummary.invoices_total,
      invoices_unpaid_amount: invoiceSummary.invoices_unpaid_amount,
      invoices_overdue_amount: invoiceSummary.invoices_overdue_amount,
      invoices_revenue_total: invoiceSummary.invoices_revenue_total,
      total_revenue: totalRevenue,
    }
  } catch (error) {
    console.error('Error fetching activity summary:', error)
    return {
      quotes_total: 0,
      quotes_accepted: 0,
      assessments_total: 0,
      assessments_completed: 0,
      jobs_total: 0,
      jobs_in_progress: 0,
      invoices_total: 0,
      invoices_unpaid_amount: 0,
      invoices_overdue_amount: 0,
      invoices_revenue_total: 0,
      total_revenue: 0,
    }
  }
}