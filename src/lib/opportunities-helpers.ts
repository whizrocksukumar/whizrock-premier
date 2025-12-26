import { supabase } from '@/lib/supabase'

export interface Opportunity {
  id: string
  opp_number: string
  client_id: string
  company_id?: string
  contact_first_name?: string
  contact_last_name?: string
  contact_email?: string
  contact_phone?: string
  contact_type?: string
  client_type?: string
  site_address?: string
  site_city?: string
  site_postcode?: string
  stage: string
  sub_status?: string
  product_recommendation_id?: string
  recommendation_status?: string
  assessment_id?: string
  estimated_value?: number
  actual_value?: number
  sales_rep_id?: string
  created_by_user_id?: string
  created_at: string
  updated_at: string
  due_date?: string
  notes?: string
  is_active: boolean
  job_id?: string
  opportunity_name?: string
  pipeline?: string
  status: string
  opportunity_source?: string
}

export interface OpportunityWithRelations extends Opportunity {
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

export async function fetchOpportunityWithRelations(
  oppId: string
): Promise<OpportunityWithRelations> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select(
        `
        *,
        client:clients(id, first_name, last_name, email, phone, company_name),
        sales_rep:sales_reps(id, first_name, last_name, email)
      `
      )
      .eq('id', oppId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Opportunity not found')

    return data as OpportunityWithRelations
  } catch (error) {
    console.error('Error fetching opportunity with relations:', error)
    throw error
  }
}

export async function fetchOpportunitiesByClient(
  clientId: string
): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Opportunity[]
  } catch (error) {
    console.error('Error fetching opportunities by client:', error)
    throw error
  }
}

export async function fetchOpportunitiesBySalesRep(
  salesRepId: string
): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('sales_rep_id', salesRepId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Opportunity[]
  } catch (error) {
    console.error('Error fetching opportunities by sales rep:', error)
    throw error
  }
}

export async function fetchOpportunitiesByStage(stage: string): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('stage', stage)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Opportunity[]
  } catch (error) {
    console.error('Error fetching opportunities by stage:', error)
    throw error
  }
}

export async function createOpportunity(data: {
  client_id: string
  company_id?: string
  contact_first_name?: string
  contact_last_name?: string
  contact_email?: string
  contact_phone?: string
  site_address?: string
  site_city?: string
  site_postcode?: string
  stage: string
  sub_status?: string
  estimated_value?: number
  sales_rep_id?: string
  created_by_user_id: string
  due_date?: string
  notes?: string
  opportunity_name?: string
  pipeline?: string
  opportunity_source?: string
}): Promise<Opportunity> {
  try {
    const { data: oppData, error } = await supabase
      .from('opportunities')
      .insert({
        ...data,
        is_active: true,
        status: data.stage || 'LEAD',
      })
      .select()
      .single()

    if (error) throw error
    if (!oppData) throw new Error('Opportunity creation failed')

    return oppData as Opportunity
  } catch (error) {
    console.error('Error creating opportunity:', error)
    throw error
  }
}

export async function updateOpportunity(
  oppId: string,
  updates: Partial<Opportunity>
): Promise<Opportunity> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', oppId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Opportunity update failed')

    return data as Opportunity
  } catch (error) {
    console.error('Error updating opportunity:', error)
    throw error
  }
}

export async function updateOpportunityStage(
  oppId: string,
  stage: string,
  subStatus?: string
): Promise<Opportunity> {
  try {
    const updates: any = {
      stage,
      status: stage,
    }

    if (subStatus) {
      updates.sub_status = subStatus
    }

    return updateOpportunity(oppId, updates)
  } catch (error) {
    console.error('Error updating opportunity stage:', error)
    throw error
  }
}

export async function deleteOpportunity(oppId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('opportunities')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', oppId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting opportunity:', error)
    throw error
  }
}