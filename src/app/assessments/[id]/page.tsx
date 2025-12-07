import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, CheckCircle } from 'lucide-react'
import WordingsSelector from '@/app/components/WordingsSelector'
import { ResultType } from '@/types/assessmentWordings'

interface AssessmentDetail {
  id: string
  reference_number: string
  site_address: string
  city: string
  region_id: string
  postcode: string | null
  scheduled_date: string
  scheduled_time: string
  status: string
  notes: string | null
  created_at: string
  assigned_installer_id: string | null
  enquiry_id: string | null
  client_id: string | null
  clients?: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
    company_id: string | null
  } | null
  team_members?: {
    first_name: string
    last_name: string
    email: string
  } | null
}

interface AssessmentArea {
  id: string
  assessment_id: string
  area_name: string
  square_metres: number
  existing_insulation_type: string | null
  recommended_r_value: string | null
  removal_required: boolean
  notes: string | null
  result_type: ResultType
  created_at: string
}

async function getAssessment(id: string) {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        id,
        reference_number,
        site_address,
        city,
        region_id,
        postcode,
        scheduled_date,
        scheduled_time,
        status,
        notes,
        created_at,
        assigned_installer_id,
        enquiry_id,
        client_id,
        clients!client_id (
          first_name,
          last_name,
          email,
          phone,
          company_id
        ),
        team_members!assigned_installer_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching assessment:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

async function getAssessmentAreas(assessmentId: string) {
  try {
    const { data, error } = await supabase
      .from('assessment_areas')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching assessment areas:', error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

export default async function AssessmentDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: assessment, error } = await getAssessment(id)
  const { data: areas } = await getAssessmentAreas(id)

  if (error || !assessment) {
    return (
      <div className="page-content">
        <div className="page-header">
          <Link href="/assessments" className="btn-ghost btn-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Assessments
          </Link>
          <h1 className="page-title">Assessment Not Found</h1>
        </div>

        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Assessment not found</div>
            <p className="empty-state-description">
              {error || 'The assessment you are looking for does not exist.'}
            </p>
            <Link href="/assessments" className="btn-primary">
              Back to Assessments
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const clientData = {
    firstName: assessment.clients?.first_name || '',
    lastName: assessment.clients?.last_name || '',
    email: assessment.clients?.email || '',
    phone: assessment.clients?.phone || '',
    company: '', // Will populate from companies table later
    siteAddress: assessment.site_address,
    region: assessment.region_id,
    postcode: assessment.postcode || ''
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'scheduled') return 'status-sent'
    if (statusLower === 'completed') return 'status-accepted'
    if (statusLower === 'cancelled') return 'badge'
    return 'status-pending'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HEADER ROW ===== */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/assessments" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Assessments
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{assessment.reference_number}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {clientData.firstName} {clientData.lastName} • {assessment.site_address}
            </p>
          </div>
        </div>
      </div>

      {/* ===== TOOLBAR ROW ===== */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={getStatusBadge(assessment.status)}>
              {assessment.status}
            </span>
            <span className="text-sm text-gray-600">•</span>
            <span className="text-sm text-gray-600">{formatDate(assessment.scheduled_date)} at {assessment.scheduled_time}</span>
          </div>

          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-3">
            {assessment.status === 'Scheduled' && (
              <Link
                href={`/assessments/${id}/complete`}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Complete
              </Link>
            )}
            <Link
              href={`/assessments/${id}/edit`}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Customer Details Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">First Name</label>
                  <p className="font-medium text-gray-900">
                    {clientData.firstName || 'No Client Linked'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Last Name</label>
                  <p className="font-medium text-gray-900">
                    {clientData.lastName || '—'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Email</label>
                  <p className="font-medium text-gray-900">
                    {clientData.email || '—'}
                  </p>
                </div>

                {clientData.phone && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Phone</label>
                    <p className="font-medium text-gray-900">
                      {clientData.phone}
                    </p>
                  </div>
              )}

              {clientData.company && (
                <div>
                  <label className="form-label">Company</label>
                  <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                    {clientData.company}
                  </p>
                </div>
              )}

              <div className={clientData.company ? '' : 'md:col-span-2'}>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Site Address</label>
                <p className="font-medium text-gray-900">
                  {assessment.site_address}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Region</label>
                <p className="font-medium text-gray-900">
                  {assessment.region_id}
                </p>
              </div>

              {assessment.postcode && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Postcode</label>
                  <p className="font-medium text-gray-900">
                    {assessment.postcode}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Details Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Assessment Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Scheduled Date</label>
                <p className="font-medium text-gray-900">
                  {formatDate(assessment.scheduled_date)}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Scheduled Time</label>
                <p className="font-medium text-gray-900">
                  {assessment.scheduled_time}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Status</label>
                <div>
                  <span className={getStatusBadge(assessment.status)}>
                    {assessment.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Assigned Installer</label>
                <p className="font-medium text-gray-900">
                  {assessment.team_members
                    ? `${assessment.team_members.first_name} ${assessment.team_members.last_name}`
                    : 'Unassigned'}
                </p>
                {assessment.team_members?.email && (
                  <p className="text-sm text-gray-500">
                    {assessment.team_members.email}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Created Date</label>
                <p className="font-medium text-gray-900">
                  {formatDate(assessment.created_at)}
                </p>
              </div>
            </div>

            {assessment.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Notes</label>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {assessment.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Assessment Areas with Wordings Section */}
        {areas && areas.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Assessment Areas & Results</h2>
              <p className="text-sm text-gray-600 mt-1">
                Set result type and add findings for each area
              </p>
            </div>
            <div className="p-6 space-y-4">
              {areas.map((area) => (
                <WordingsSelector
                  key={area.id}
                  assessmentId={assessment.id}
                  areaId={area.id}
                  areaName={area.area_name}
                  currentResultType={area.result_type || 'Pending'}
                />
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <Link href="/assessments" className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            Back to List
          </Link>
        </div>
      </div>
    </div>
  )
}