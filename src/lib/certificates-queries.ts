import { supabase } from '@/lib/supabase'

export interface Certificate {
  id: string
  job_id: string
  certificate_number?: string
  certificate_url?: string
  generated_at?: string
  customer_signed_at?: string
  installer_signed_at?: string
  customer_name?: string
  work_completed_date?: string
  warranty_period_months?: number
  created_at: string
  updated_at: string
}

export async function fetchCertificatesByClient(clientId: string): Promise<Certificate[]> {
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

    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .in('quote_id', quoteIds)

    if (jobError) throw jobError

    const jobIds = jobs?.map((j) => j.id) || []

    if (jobIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('job_completion_certificates')
      .select('*')
      .in('job_id', jobIds)
      .order('generated_at', { ascending: false })

    if (error) throw error
    return (data || []) as Certificate[]
  } catch (error) {
    console.error('Error fetching certificates by client:', error)
    throw error
  }
}

export async function fetchCertificatesByJob(jobId: string): Promise<Certificate[]> {
  try {
    const { data, error } = await supabase
      .from('job_completion_certificates')
      .select('*')
      .eq('job_id', jobId)
      .order('generated_at', { ascending: false })

    if (error) throw error
    return (data || []) as Certificate[]
  } catch (error) {
    console.error('Error fetching certificates by job:', error)
    throw error
  }
}