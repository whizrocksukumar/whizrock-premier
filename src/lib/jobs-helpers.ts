import { supabase } from '@/lib/supabase'

export interface Job {
  id: string
  job_number?: string
  quote_id?: string
  customer_first_name?: string
  customer_last_name?: string
  customer_email?: string
  customer_phone?: string
  customer_company?: string
  site_address?: string
  city?: string
  postcode?: string
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  scheduled_date?: string
  start_date?: string
  completion_date?: string
  quoted_amount?: number
  actual_cost?: number
  crew_lead_id?: string
  crew_members?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface JobWithRelations extends Job {
  quote?: {
    id: string
    quote_number?: string
    client_id: string
  }
  client?: {
    id: string
    first_name: string
    last_name: string
    email?: string
    company_name?: string
  }
}

export async function fetchJobWithRelations(jobId: string): Promise<JobWithRelations> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        quote:quotes(id, quote_number, client_id)
      `
      )
      .eq('id', jobId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Job not found')

    // Fetch client data if quote exists
    let client = undefined
    if (data.quote?.client_id) {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, company_name')
        .eq('id', data.quote.client_id)
        .single()
      if (clientError) throw clientError
      client = clientData
    }

    return {
      ...data,
      client,
    } as JobWithRelations
  } catch (error) {
    console.error('Error fetching job with relations:', error)
    throw error
  }
}

export async function fetchJobsByClient(clientId: string): Promise<Job[]> {
  try {
    const { data: quotes, error: quoteError } = await supabase
      .from('quotes')
      .select('id')
      .eq('client_id', clientId)

    if (quoteError) throw quoteError

    const quoteIds = quotes?.map((q) => q.id) || []

    if (quoteIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .in('quote_id', quoteIds)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Job[]
  } catch (error) {
    console.error('Error fetching jobs by client:', error)
    throw error
  }
}

export async function fetchJobsByQuote(quoteId: string): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Job[]
  } catch (error) {
    console.error('Error fetching jobs by quote:', error)
    throw error
  }
}

export async function fetchJobsByStatus(
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', status)
      .order('scheduled_date', { ascending: true })

    if (error) throw error
    return (data || []) as Job[]
  } catch (error) {
    console.error('Error fetching jobs by status:', error)
    throw error
  }
}

export async function fetchJobsByCrewLead(crewLeadId: string): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('crew_lead_id', crewLeadId)
      .neq('status', 'Completed')
      .order('scheduled_date', { ascending: true })

    if (error) throw error
    return (data || []) as Job[]
  } catch (error) {
    console.error('Error fetching jobs by crew lead:', error)
    throw error
  }
}

export async function createJobFromQuote(data: {
  quote_id: string
  scheduled_date?: string
  crew_lead_id?: string
  notes?: string
}): Promise<Job> {
  try {
    const { data: jobData, error } = await supabase
      .from('jobs')
      .insert({
        ...data,
        status: 'Scheduled',
      })
      .select()
      .single()

    if (error) throw error
    if (!jobData) throw new Error('Job creation failed')

    return jobData as Job
  } catch (error) {
    console.error('Error creating job:', error)
    throw error
  }
}

export async function updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Job update failed')

    return data as Job
  } catch (error) {
    console.error('Error updating job:', error)
    throw error
  }
}

export async function updateJobStatus(
  jobId: string,
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
): Promise<Job> {
  try {
    const updates: any = {
      status,
    }

    if (status === 'In Progress') {
      updates.start_date = new Date().toISOString()
    }

    if (status === 'Completed') {
      updates.completion_date = new Date().toISOString()
    }

    return updateJob(jobId, updates)
  } catch (error) {
    console.error('Error updating job status:', error)
    throw error
  }
}

export async function completeJob(jobId: string): Promise<Job> {
  return updateJobStatus(jobId, 'Completed')
}

export async function deleteJob(jobId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'Cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting job:', error)
    throw error
  }
}