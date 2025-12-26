import { supabase } from '@/lib/supabase'

export interface Assessment {
  id: string
  assessment_number?: string
  client_id?: string
  reference_number?: string
  status: 'Scheduled' | 'Completed' | 'Cancelled'
  scheduled_date?: string
  completed_at?: string
  site_address?: string
  city?: string
  created_at: string
  updated_at: string
}

export async function fetchAssessmentsByClient(clientId: string): Promise<Assessment[]> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select(
        'id, assessment_number, reference_number, status, scheduled_date, completed_at, site_address, city, created_at, updated_at'
      )
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false })

    if (error) throw error
    return (data || []) as Assessment[]
  } catch (error) {
    console.error('Error fetching assessments by client:', error)
    throw error
  }
}