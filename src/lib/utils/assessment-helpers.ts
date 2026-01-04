export const RESULT_TYPE_CONFIG = {
  Pass: {
    label: 'Pass',
    color: 'bg-green-100 text-green-800',
    badgeColor: 'bg-green-500',
    borderColor: 'border-green-500',
    icon: '✓'
  },
  Fail: {
    label: 'Fail',
    color: 'bg-red-100 text-red-800',
    badgeColor: 'bg-red-500',
    borderColor: 'border-red-500',
    icon: '✗'
  },
  Exempt: {
    label: 'Exempt',
    color: 'bg-purple-100 text-purple-800',
    badgeColor: 'bg-purple-500',
    borderColor: 'border-purple-500',
    icon: '○'
  },
  Pending: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-800',
    badgeColor: 'bg-gray-500',
    borderColor: 'border-gray-500',
    icon: '◌'
  }
} as const
// ============================================================================
// ASSESSMENT HELPERS - Database queries and operations
// Location: src/lib/assessment-helpers.ts
// ============================================================================

import { supabase } from '@/lib/supabase'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AssessmentArea {
  id: string
  assessment_id: string
  app_type_id: string
  square_metres: number
  existing_insulation_type?: string
  notes?: string
  result_type?: 'Pass' | 'Fail' | 'Exempt' | 'Conditional' | 'Pending'
  wording_id?: string
  created_at?: string
  updated_at?: string
}

export interface AssessmentPhoto {
  id: string
  assessment_id: string
  assessment_area_id?: string
  file_name: string
  file_path: string
  file_url: string
  file_size: number
  photo_type?: 'Before' | 'After' | 'General'
  created_at?: string
  updated_at?: string
}

export interface AssessmentWording {
  id: string
  wording_text: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Assessment {
  id: string
  assessment_number: string
  reference_number?: string
  site_id: string
  client_id: string
  opportunity_id?: string
  enquiry_id?: string
  assigned_installer_id?: string
  scheduled_date: string
  scheduled_time: string
  status: 'Draft' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  time_estimate_hours?: number
  property_type?: string
  year_built?: number
  estimated_size_sqm?: number
  site_access_difficulty?: string
  crawl_space_height_cm?: number
  existing_insulation_type?: string
  removal_required?: boolean
  hazards_present?: string
  notes?: string
  created_by_user_id?: string
  created_at: string
  completed_at?: string
  completed_by_user_id?: string
  updated_at: string
}

export interface AssessmentWithRelations extends Assessment {
  areas?: AssessmentArea[]
  photos?: AssessmentPhoto[]
  site?: {
    id: string
    site_name: string
    address_line_1: string
    address_line_2?: string
    city: string
    region_id?: string
    postcode: string
    company_id?: string
    client_id?: string
  }
  client?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    company_id?: string
  }
  opportunity?: {
    id: string
    opp_number: string
    stage: string
    sub_status?: string
  }
  assigned_installer?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
}

// ============================================================================
// HELPER FUNCTIONS - Assessment Number Generation
// ============================================================================

/**
 * Generate assessment number in format ASS-DDMMYY-NNN
 * e.g., ASS-071225-001
 */
export async function generateAssessmentNumber(): Promise<string> {
  try {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = String(now.getFullYear()).slice(-2)
    const datePrefix = `ASS-${day}${month}${year}`

    // Query to find highest sequential number for today
    const { data, error } = await supabase
      .from('assessments')
      .select('assessment_number')
      .ilike('assessment_number', `${datePrefix}-%`)
      .order('assessment_number', { ascending: false })
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastNumber = data[0].assessment_number
      const match = lastNumber.match(/-(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    return `${datePrefix}-${String(nextNumber).padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating assessment number:', error)
    throw error
  }
}

// ============================================================================
// CREATE FUNCTIONS
// ============================================================================

/**
 * Create a new assessment with all related data
 */
export async function createAssessment(data: {
  site_id: string
  client_id: string
  opportunity_id?: string
  assigned_installer_id?: string
  scheduled_date: string
  scheduled_time: string
  time_estimate_hours?: number
  property_type?: string
  year_built?: number
  estimated_size_sqm?: number
  site_access_difficulty?: string
  crawl_space_height_cm?: number
  existing_insulation_type?: string
  removal_required?: boolean
  hazards_present?: string
  notes?: string
  created_by_user_id: string
}): Promise<Assessment> {
  try {
    // Generate assessment number
    const assessment_number = await generateAssessmentNumber()

    // Insert assessment
    const { data: assessmentData, error } = await supabase
      .from('assessments')
      .insert({
        assessment_number,
        ...data,
        status: 'Scheduled',
      })
      .select()
      .single()

    if (error) throw error
    if (!assessmentData) throw new Error('Assessment creation failed')

    return assessmentData as Assessment
  } catch (error) {
    console.error('Error creating assessment:', error)
    throw error
  }
}

/**
 * Create assessment areas (multiple)
 */
export async function createAssessmentAreas(
  assessmentId: string,
  areas: Array<{
    app_type_id: string
    square_metres: number
    existing_insulation_type?: string
    notes?: string
    result_type?: 'Pass' | 'Fail' | 'Exempt' | 'Conditional' | 'Pending'
    wording_id?: string
  }>
): Promise<AssessmentArea[]> {
  try {
    const areasWithMetadata = areas.map((area, index) => ({
      ...area,
      assessment_id: assessmentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('assessment_areas')
      .insert(areasWithMetadata)
      .select()

    if (error) throw error
    if (!data) throw new Error('Area creation failed')

    return data as AssessmentArea[]
  } catch (error) {
    console.error('Error creating assessment areas:', error)
    throw error
  }
}

/**
 * Create assessment photos (multiple)
 */
export async function createAssessmentPhotos(
  assessmentId: string,
  photos: Array<{
    file_name: string
    file_path: string
    file_url: string
    file_size: number
    assessment_area_id?: string
    photo_type?: 'Before' | 'After' | 'General'
  }>
): Promise<AssessmentPhoto[]> {
  try {
    const photosWithMetadata = photos.map(photo => ({
      ...photo,
      assessment_id: assessmentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('assessment_photos')
      .insert(photosWithMetadata)
      .select()

    if (error) throw error
    if (!data) throw new Error('Photo creation failed')

    return data as AssessmentPhoto[]
  } catch (error) {
    console.error('Error creating assessment photos:', error)
    throw error
  }
}

// ============================================================================
// READ FUNCTIONS
// ============================================================================

/**
 * Fetch complete assessment with all relations
 */
export async function fetchAssessmentWithRelations(
  assessmentId: string
): Promise<AssessmentWithRelations> {
  try {
    // Fetch assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (assessmentError) throw assessmentError
    if (!assessment) throw new Error('Assessment not found')

    // Fetch areas
    const { data: areas } = await supabase
      .from('assessment_areas')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at')

    // Fetch photos
    const { data: photos } = await supabase
      .from('assessment_photos')
      .select('*')
      .eq('assessment_id', assessmentId)

    // Fetch site details
    let site = null
    if (assessment.site_id) {
      const { data: siteData } = await supabase
        .from('sites')
        .select('*')
        .eq('id', assessment.site_id)
        .single()
      site = siteData
    }

    // Fetch client details
    let client = null
    if (assessment.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, company_id')
        .eq('id', assessment.client_id)
        .single()
      client = clientData
    }

    // Fetch opportunity details if opportunity_id exists
    let opportunity = null
    if (assessment.opportunity_id) {
      const { data: oppData } = await supabase
        .from('opportunities')
        .select('id, opp_number, stage, sub_status')
        .eq('id', assessment.opportunity_id)
        .single()
      opportunity = oppData
    }

    // Fetch assigned installer details
    let assigned_installer = null
    if (assessment.assigned_installer_id) {
      const { data: installerData } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, email, phone')
        .eq('id', assessment.assigned_installer_id)
        .single()
      assigned_installer = installerData
    }

    return {
      ...assessment,
      areas: areas || [],
      photos: photos || [],
      site: site || undefined,
      client: client || undefined,
      opportunity: opportunity || undefined,
      assigned_installer: assigned_installer || undefined,
    } as AssessmentWithRelations
  } catch (error) {
    console.error('Error fetching assessment with relations:', error)
    throw error
  }
}

/**
 * Fetch list of assessments with pagination
 */
export async function fetchAssessmentsList(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: string
    client_id?: string
    opportunity_id?: string
  }
): Promise<{ data: Assessment[]; total: number }> {
  try {
    let query = supabase.from('assessments').select('*', { count: 'exact' })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id)
    }
    if (filters?.opportunity_id) {
      query = query.eq('opportunity_id', filters.opportunity_id)
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order('scheduled_date', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: (data || []) as Assessment[],
      total: count || 0,
    }
  } catch (error) {
    console.error('Error fetching assessments list:', error)
    throw error
  }
}

/**
 * Fetch assessment by assessment_number
 */
export async function fetchAssessmentByNumber(
  assessmentNumber: string
): Promise<Assessment | null> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('assessment_number', assessmentNumber)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return (data as Assessment) || null
  } catch (error) {
    console.error('Error fetching assessment by number:', error)
    throw error
  }
}

/**
 * Fetch assessment areas for an assessment
 */
export async function fetchAssessmentAreas(
  assessmentId: string
): Promise<AssessmentArea[]> {
  try {
    const { data, error } = await supabase
      .from('assessment_areas')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at')

    if (error) throw error
    return (data || []) as AssessmentArea[]
  } catch (error) {
    console.error('Error fetching assessment areas:', error)
    throw error
  }
}

/**
 * Fetch photos for assessment
 */
export async function fetchAssessmentPhotos(
  assessmentId: string
): Promise<AssessmentPhoto[]> {
  try {
    const { data, error } = await supabase
      .from('assessment_photos')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at')

    if (error) throw error
    return (data || []) as AssessmentPhoto[]
  } catch (error) {
    console.error('Error fetching assessment photos:', error)
    throw error
  }
}

/**
 * Fetch assessment wordings (dropdown options)
 */
export async function fetchAssessmentWordings(): Promise<AssessmentWording[]> {
  try {
    const { data, error } = await supabase
      .from('assessment_wordings')
      .select('*')
      .eq('is_active', true)
      .order('wording_text')

    if (error) throw error
    return (data || []) as AssessmentWording[]
  } catch (error) {
    console.error('Error fetching assessment wordings:', error)
    throw error
  }
}

/**
 * Fetch assessments by client
 */
export async function fetchAssessmentsByClient(
  clientId: string
): Promise<Assessment[]> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false })

    if (error) throw error
    return (data || []) as Assessment[]
  } catch (error) {
    console.error('Error fetching assessments by client:', error)
    throw error
  }
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Update assessment status
 */
export async function updateAssessmentStatus(
  assessmentId: string,
  status: 'Draft' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled',
  completedByUserId?: string
): Promise<Assessment> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'Completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.completed_by_user_id = completedByUserId
    }

    const { data, error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('id', assessmentId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Assessment update failed')

    return data as Assessment
  } catch (error) {
    console.error('Error updating assessment status:', error)
    throw error
  }
}

/**
 * Update assessment details
 */
export async function updateAssessment(
  assessmentId: string,
  updates: Partial<Assessment>
): Promise<Assessment> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assessmentId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Assessment update failed')

    return data as Assessment
  } catch (error) {
    console.error('Error updating assessment:', error)
    throw error
  }
}

/**
 * Update assessment area
 */
export async function updateAssessmentArea(
  areaId: string,
  updates: Partial<AssessmentArea>
): Promise<AssessmentArea> {
  try {
    const { data, error } = await supabase
      .from('assessment_areas')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', areaId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Area update failed')

    return data as AssessmentArea
  } catch (error) {
    console.error('Error updating assessment area:', error)
    throw error
  }
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete assessment area
 */
export async function deleteAssessmentArea(areaId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('assessment_areas')
      .delete()
      .eq('id', areaId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting assessment area:', error)
    throw error
  }
}

/**
 * Delete assessment photo
 */
export async function deleteAssessmentPhoto(photoId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('assessment_photos')
      .delete()
      .eq('id', photoId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting assessment photo:', error)
    throw error
  }
}

/**
 * Delete assessment (soft delete by setting status to Cancelled)
 */
export async function deleteAssessment(assessmentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('assessments')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', assessmentId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting assessment:', error)
    throw error
  }
}

// ============================================================================
// WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Complete assessment and trigger workflow
 * - Update assessment status to Completed
 * - Update opportunity stage to QUALIFIED (if linked)
 */
export async function completeAssessment(
  assessmentId: string,
  completedByUserId: string
): Promise<{
  assessment: Assessment
  opportunityUpdated: boolean
}> {
  try {
    // Update assessment status
    const assessment = await updateAssessmentStatus(
      assessmentId,
      'Completed',
      completedByUserId
    )

    let opportunityUpdated = false

    // If linked to opportunity, update it
    if (assessment.opportunity_id) {
      const { error: oppError } = await supabase
        .from('opportunities')
        .update({
          stage: 'QUALIFIED',
          sub_status: 'Assessment Complete',
          assessment_id: assessmentId,
        })
        .eq('id', assessment.opportunity_id)

      opportunityUpdated = !oppError
    }

    return {
      assessment,
      opportunityUpdated,
    }
  } catch (error) {
    console.error('Error completing assessment:', error)
    throw error
  }
}

// ============================================================================
// END OF FILE
// ============================================================================