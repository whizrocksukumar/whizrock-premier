// ============================================================================
// OPPORTUNITY HELPERS - Database queries and operations
// Location: src/lib/opportunity-helpers.ts
// ============================================================================

import { supabase } from '@/lib/supabase'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Opportunity {
  id: string
  opp_number: string
  client_id: string
  company_id?: string
  contact_first_name: string
  contact_last_name: string
  contact_email?: string
  contact_phone?: string
  contact_type?: string
  client_type?: string
  site_address?: string
  site_city?: string
  site_postcode?: string
  stage: string // NEW, QUALIFIED, WON, LOST
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
  status?: string
  opportunity_source?: string
}

export interface OpportunityWithDetails extends Opportunity {
  client?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  company?: {
    id: string
    name: string
    address_line_1?: string
  }
  sales_rep?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  assessments?: Array<{
    id: string
    assessment_number: string
    status: string
    scheduled_date: string
    assigned_installer_id?: string
  }>
  job?: {
    id: string
    job_number?: string
    status: string
  }
  crew?: Array<{
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    role: string
  }>
}

// ============================================================================
// HELPER FUNCTIONS - Opportunity Number Generation
// ============================================================================

/**
 * Generate opportunity number in format OPP-YYYY-NNN
 * e.g., OPP-2025-001
 */
export async function generateOpportunityNumber(): Promise<string> {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const yearPrefix = `OPP-${year}`

    // Query to find highest sequential number for this year
    const { data, error } = await supabase
      .from('opportunities')
      .select('opp_number')
      .ilike('opp_number', `${yearPrefix}-%`)
      .order('opp_number', { ascending: false })
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows" which is fine
      throw error
    }

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastNumber = data[0].opp_number
      const match = lastNumber.match(/-(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    return `${yearPrefix}-${String(nextNumber).padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating opportunity number:', error)
    throw error
  }
}

// ============================================================================
// CREATE FUNCTIONS
// ============================================================================

/**
 * Create a new opportunity
 */
export async function createOpportunity(data: {
  client_id?: string
  company_id?: string
  contact_first_name: string
  contact_last_name: string
  contact_email?: string
  contact_phone?: string
  contact_type?: string
  client_type?: string
  site_address?: string
  site_city?: string
  site_postcode?: string
  estimated_value?: number
  sales_rep_id?: string
  created_by_user_id: string
  due_date?: string
  notes?: string
  opportunity_name?: string
  pipeline?: string
  status?: string
  opportunity_source?: string
}): Promise<Opportunity> {
  try {
    // Generate opportunity number
    const opp_number = await generateOpportunityNumber()

    // Insert opportunity
    const { data: opportunityData, error } = await supabase
      .from('opportunities')
      .insert({
        opp_number,
        stage: 'NEW',
        sub_status: 'Awaiting Contact',
        is_active: true,
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    if (!opportunityData) throw new Error('Opportunity creation failed')

    return opportunityData as Opportunity
  } catch (error) {
    console.error('Error creating opportunity:', error)
    throw error
  }
}

// ============================================================================
// READ FUNCTIONS
// ============================================================================

/**
 * Fetch opportunity with all details
 */
export async function fetchOpportunityWithDetails(
  opportunityId: string
): Promise<OpportunityWithDetails> {
  try {
    // Fetch opportunity
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()

    if (oppError) throw oppError
    if (!opportunity) throw new Error('Opportunity not found')

    // Fetch client details if client_id exists
    let client = null
    if (opportunity.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone')
        .eq('id', opportunity.client_id)
        .single()
      client = clientData
    }

    // Fetch company details if company_id exists
    let company = null
    if (opportunity.company_id) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name, address_line_1')
        .eq('id', opportunity.company_id)
        .single()
      company = companyData
    }

    // Fetch sales rep details if sales_rep_id exists
    let sales_rep = null
    if (opportunity.sales_rep_id) {
      const { data: repData } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, email, phone')
        .eq('id', opportunity.sales_rep_id)
        .single()
      sales_rep = repData
    }

    // Fetch linked assessments
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, assessment_number, status, scheduled_date, assigned_installer_id')
      .eq('opportunity_id', opportunityId)
      .order('scheduled_date', { ascending: false })

    // Fetch job details if job_id exists
    let job = null
    if (opportunity.job_id) {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('id, job_number, status')
        .eq('id', opportunity.job_id)
        .single()
      job = jobData
    }

    // Fetch crew if job exists
    let crew = null
    if (opportunity.job_id) {
      const { data: crewData } = await supabase
        .from('job_installers')
        .select(
          `
          id,
          role,
          team_members (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .eq('job_id', opportunity.job_id)
        .order('sequence')

      if (crewData) {
        crew = crewData.map((item: any) => ({
          ...item.team_members,
          role: item.role,
        }))
      }
    }

    return {
      ...opportunity,
      client: client || undefined,
      company: company || undefined,
      sales_rep: sales_rep || undefined,
      assessments: assessments || [],
      job: job || undefined,
      crew: crew || undefined,
    } as OpportunityWithDetails
  } catch (error) {
    console.error('Error fetching opportunity with details:', error)
    throw error
  }
}

/**
 * Fetch list of opportunities with pagination
 */
export async function fetchOpportunitiesList(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    stage?: string
    client_id?: string
    sales_rep_id?: string
  }
): Promise<{ data: Opportunity[]; total: number }> {
  try {
    let query = supabase
      .from('opportunities')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    // Apply filters
    if (filters?.stage) {
      query = query.eq('stage', filters.stage)
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id)
    }
    if (filters?.sales_rep_id) {
      query = query.eq('sales_rep_id', filters.sales_rep_id)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: (data || []) as Opportunity[],
      total: count || 0,
    }
  } catch (error) {
    console.error('Error fetching opportunities list:', error)
    throw error
  }
}

/**
 * Fetch opportunities for a specific client
 */
export async function fetchOpportunitiesForClient(
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
    console.error('Error fetching opportunities for client:', error)
    throw error
  }
}

/**
 * Fetch opportunity by opp_number
 */
export async function fetchOpportunityByNumber(
  oppNumber: string
): Promise<Opportunity | null> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('opp_number', oppNumber)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return (data as Opportunity) || null
  } catch (error) {
    console.error('Error fetching opportunity by number:', error)
    throw error
  }
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Update opportunity stage
 */
export async function updateOpportunityStage(
  opportunityId: string,
  stage: string,
  subStatus?: string
): Promise<Opportunity> {
  try {
    const updateData: any = {
      stage,
      updated_at: new Date().toISOString(),
    }

    if (subStatus) {
      updateData.sub_status = subStatus
    }

    const { data, error } = await supabase
      .from('opportunities')
      .update(updateData)
      .eq('id', opportunityId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Opportunity update failed')

    return data as Opportunity
  } catch (error) {
    console.error('Error updating opportunity stage:', error)
    throw error
  }
}

/**
 * Update opportunity details
 */
export async function updateOpportunity(
  opportunityId: string,
  updates: Partial<Opportunity>
): Promise<Opportunity> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', opportunityId)
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

/**
 * Link assessment to opportunity
 */
export async function linkAssessmentToOpportunity(
  assessmentId: string,
  opportunityId: string
): Promise<Opportunity> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .update({
        assessment_id: assessmentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', opportunityId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Link assessment failed')

    return data as Opportunity
  } catch (error) {
    console.error('Error linking assessment to opportunity:', error)
    throw error
  }
}

/**
 * Unlink assessment from opportunity
 */
export async function unlinkAssessmentFromOpportunity(
  opportunityId: string
): Promise<Opportunity> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .update({
        assessment_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', opportunityId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Unlink assessment failed')

    return data as Opportunity
  } catch (error) {
    console.error('Error unlinking assessment from opportunity:', error)
    throw error
  }
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete opportunity (soft delete by setting is_active to false)
 */
export async function deleteOpportunity(opportunityId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('opportunities')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', opportunityId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting opportunity:', error)
    throw error
  }
}

// ============================================================================
// END OF FILE
// ============================================================================