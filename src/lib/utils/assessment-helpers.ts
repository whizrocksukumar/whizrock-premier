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
  area_name: string
  square_metres: number
  existing_insulation_type?: string
  recommended_r_value?: string
  removal_required?: boolean
  notes?: string
  result_type?: string
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export interface AssessmentInstaller {
  id: string
  assessment_id: string
  installer_id: string
  role: 'Lead' | 'Support' | 'Apprentice'
  sequence: number
  created_at?: string
}

export interface AssessmentPhoto {
  id: string
  assessment_id: string
  area_id?: string
  photo_url: string
  photo_key: string
  photo_type?: string
  description?: string
  uploaded_by?: string
  uploaded_at?: string
}

export interface Assessment {
  id: string
  assessment_number: string
  reference_number?: string
  client_id: string
  opportunity_id?: string
  enquiry_id?: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  customer_company?: string
  site_address: string
  city?: string
  region_id?: string
  postcode?: string
  scheduled_date: string // DATE
  scheduled_time: string // TIME
  assigned_installer_id?: string
  assessment_type?: string
  time_estimate_hours?: number
  property_type?: string
  year_built?: number
  estimated_size_sqm?: number
  site_access_difficulty?: string
  crawl_space_height_cm?: number
  existing_insulation_type?: string
  removal_required?: boolean
  hazards_present?: string // JSON or comma-separated
  opportunity_source?: string
  status: 'Scheduled' | 'Completed' | 'Cancelled'
  notes?: string
  created_by_premier_user_id?: string
  created_by_user_id?: string
  created_at: string
  completed_at?: string
  completed_by_user_id?: string
  updated_at: string
}

export interface AssessmentWithRelations extends Assessment {
  areas?: AssessmentArea[]
  installers?: AssessmentInstaller[]
  photos?: AssessmentPhoto[]
  client?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  opportunity?: {
    id: string
    opp_number: string
    stage: string
    sub_status?: string
  }
  primary_installer?: {
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
      // PGRST116 is "no rows" which is fine
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
  client_id: string
  opportunity_id?: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  customer_company?: string
  site_address: string
  city?: string
  region_id?: string
  postcode?: string
  scheduled_date: string
  scheduled_time: string
  assessment_type: string
  time_estimate_hours: number
  property_type?: string
  year_built?: number
  estimated_size_sqm?: number
  site_access_difficulty?: string
  crawl_space_height_cm?: number
  existing_insulation_type?: string
  removal_required?: boolean
  hazards_present?: string
  opportunity_source?: string
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
    area_name: string
    square_metres: number
    existing_insulation_type?: string
    notes?: string
  }>
): Promise<AssessmentArea[]> {
  try {
    const areasWithMetadata = areas.map((area, index) => ({
      ...area,
      assessment_id: assessmentId,
      sort_order: index,
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
 * Assign installers to assessment
 */
export async function assignInstallersToAssessment(
  assessmentId: string,
  installers: Array<{
    installer_id: string
    role: 'Lead' | 'Support' | 'Apprentice'
  }>
): Promise<AssessmentInstaller[]> {
  try {
    const installersWithMetadata = installers.map((installer, index) => ({
      ...installer,
      assessment_id: assessmentId,
      sequence: index,
    }))

    const { data, error } = await supabase
      .from('assessment_installers')
      .insert(installersWithMetadata)
      .select()

    if (error) throw error
    if (!data) throw new Error('Installer assignment failed')

    return data as AssessmentInstaller[]
  } catch (error) {
    console.error('Error assigning installers:', error)
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
      .order('sort_order')

    // Fetch installers
    const { data: installers } = await supabase
      .from('assessment_installers')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('sequence')

    // Fetch photos
    const { data: photos } = await supabase
      .from('assessment_photos')
      .select('*')
      .eq('assessment_id', assessmentId)

    // Fetch client details if client_id exists
    let client = null
    if (assessment.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone')
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

    // Fetch primary installer details
    let primary_installer = null
    if (assessment.assigned_installer_id) {
      const { data: installerData } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, email, phone')
        .eq('id', assessment.assigned_installer_id)
        .single()
      primary_installer = installerData
    }

    return {
      ...assessment,
      areas: areas || [],
      installers: installers || [],
      photos: photos || [],
      client: client || undefined,
      opportunity: opportunity || undefined,
      primary_installer: primary_installer || undefined,
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
      .order('sort_order')

    if (error) throw error
    return (data || []) as AssessmentArea[]
  } catch (error) {
    console.error('Error fetching assessment areas:', error)
    throw error
  }
}

/**
 * Fetch installers assigned to assessment
 */
export async function fetchAssessmentInstallers(
  assessmentId: string
): Promise<AssessmentInstaller[]> {
  try {
    const { data, error } = await supabase
      .from('assessment_installers')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('sequence')

    if (error) throw error
    return (data || []) as AssessmentInstaller[]
  } catch (error) {
    console.error('Error fetching assessment installers:', error)
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

    if (error) throw error
    return (data || []) as AssessmentPhoto[]
  } catch (error) {
    console.error('Error fetching assessment photos:', error)
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
  status: 'Scheduled' | 'Completed' | 'Cancelled',
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
      .update(updates)
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

/**
 * Reassign installers to assessment
 */
export async function reassignInstallersToAssessment(
  assessmentId: string,
  installers: Array<{
    installer_id: string
    role: 'Lead' | 'Support' | 'Apprentice'
  }>
): Promise<AssessmentInstaller[]> {
  try {
    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('assessment_installers')
      .delete()
      .eq('assessment_id', assessmentId)

    if (deleteError) throw deleteError

    // Create new assignments
    return assignInstallersToAssessment(assessmentId, installers)
  } catch (error) {
    console.error('Error reassigning installers:', error)
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
 * - Create task for sales rep (if opportunity has sales_rep_id)
 */
export async function completeAssessment(
  assessmentId: string,
  completedByUserId: string
): Promise<{
  assessment: Assessment
  opportunityUpdated: boolean
  taskCreated: boolean
}> {
  try {
    // Update assessment status
    const assessment = await updateAssessmentStatus(
      assessmentId,
      'Completed',
      completedByUserId
    )

    let opportunityUpdated = false
    let taskCreated = false

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

      if (!oppError) {
        opportunityUpdated = true

        // Get opportunity to find sales rep
        const { data: opportunity } = await supabase
          .from('opportunities')
          .select('sales_rep_id')
          .eq('id', assessment.opportunity_id)
          .single()

        // Create task for sales rep if one exists
        if (opportunity?.sales_rep_id) {
          const taskResult = await createTaskForAssessmentReview(
            assessmentId,
            assessment.opportunity_id,
            opportunity.sales_rep_id,
            completedByUserId
          )
          taskCreated = taskResult.success
        }
      }
    }

    return {
      assessment,
      opportunityUpdated,
      taskCreated,
    }
  } catch (error) {
    console.error('Error completing assessment:', error)
    throw error
  }
}

/**
 * Create task for sales rep to review assessment
 */
async function createTaskForAssessmentReview(
  assessmentId: string,
  opportunityId: string,
  assignedToUserId: string,
  createdByUserId: string
): Promise<{ success: boolean }> {
  try {
    const assessment = await fetchAssessmentByNumber(assessmentId)
    const assessment_number = assessment?.assessment_number || assessmentId

    const { error } = await supabase.from('tasks').insert({
      opportunity_id: opportunityId,
      task_type: 'Review Assessment & Create Recommendation',
      task_description: `Assessment ${assessment_number} completed for client. Review findings and create product recommendation.`,
      assigned_to_user_id: assignedToUserId,
      created_by_user_id: createdByUserId,
      status: 'Not Started',
      priority: 'High',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // Tomorrow
    })

    return { success: !error }
  } catch (error) {
    console.error('Error creating assessment review task:', error)
    return { success: false }
  }
}

// ============================================================================
// END OF FILE
// ============================================================================