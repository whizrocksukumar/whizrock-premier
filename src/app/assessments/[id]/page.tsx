import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, CheckCircle } from 'lucide-react'

interface AssessmentDetail {
  id: string
  reference_number: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_company: string | null
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
  team_members?: {
    name: string
    email: string
  }[] | null
  enquiries?: {
    enquiry_number: string
  }[] | null
}

async function getAssessment(id: string) {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        id,
        reference_number,
        customer_name,
        customer_email,
        customer_phone,
        customer_company,
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
        team_members:assigned_installer_id (
          name,
          email
        ),
        enquiries:enquiry_id (
          enquiry_number
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

export default async function AssessmentDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { data: assessment, error } = await getAssessment(params.id)

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

  const nameParts = assessment.customer_name.split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  const clientData = {
    firstName,
    lastName,
    email: assessment.customer_email,
    phone: assessment.customer_phone || '',
    company: assessment.customer_company || '',
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
    <div className="page-content">
      {/* Header Section */}
      <div className="page-header">
        <Link href="/assessments" className="btn-ghost btn-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Assessments
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">{assessment.reference_number}</h1>
            <p className="page-subtitle">{assessment.customer_name}</p>
          </div>
          
          <div className="flex gap-3">
            {assessment.status === 'Scheduled' && (
              <Link 
                href={`/assessments/${params.id}/complete`}
                className="btn-primary"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Complete
              </Link>
            )}
            <button
              disabled
              className="btn-secondary"
              title="Edit functionality coming in Phase 1B"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              disabled
              className="btn-danger"
              title="Delete functionality coming in Phase 1B"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Customer Details Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Customer Details</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">First Name</label>
                <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                  {firstName}
                </p>
              </div>

              <div>
                <label className="form-label">Last Name</label>
                <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                  {lastName}
                </p>
              </div>

              <div>
                <label className="form-label">Email</label>
                <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                  {assessment.customer_email}
                </p>
              </div>

              {assessment.customer_phone && (
                <div>
                  <label className="form-label">Phone</label>
                  <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                    {assessment.customer_phone}
                  </p>
                </div>
              )}

              {assessment.customer_company && (
                <div>
                  <label className="form-label">Company</label>
                  <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                    {assessment.customer_company}
                  </p>
                </div>
              )}

              <div className={assessment.customer_company ? '' : 'md:col-span-2'}>
                <label className="form-label">Site Address</label>
                <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                  {assessment.site_address}
                </p>
              </div>

              <div>
                <label className="form-label">Region</label>
                <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                  {assessment.region_id}
                </p>
              </div>

              {assessment.postcode && (
                <div>
                  <label className="form-label">Postcode</label>
                  <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                    {assessment.postcode}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Details Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Assessment Details</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Scheduled Date</label>
                <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                  {formatDate(assessment.scheduled_date)}
                </p>
              </div>

              <div>
                <label className="form-label">Scheduled Time</label>
                <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                  {assessment.scheduled_time}
                </p>
              </div>

              <div>
                <label className="form-label">Status</label>
                <div>
                  <span className={getStatusBadge(assessment.status)}>
                    {assessment.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label">Assigned Installer</label>
                <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                  {assessment.team_members?.[0]?.name || 'Unassigned'}
                </p>
                {assessment.team_members?.[0]?.email && (
                  <p className="text-sm" style={{ color: 'var(--color-neutral-500)' }}>
                    {assessment.team_members[0].email}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Created Date</label>
                <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                  {formatDate(assessment.created_at)}
                </p>
              </div>

              {assessment.enquiries?.[0] && (
                <div>
                  <label className="form-label">Linked Enquiry</label>
                  <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                    {assessment.enquiries[0].enquiry_number}
                  </p>
                </div>
              )}
            </div>

            {assessment.notes && (
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-neutral-200)' }}>
                <label className="form-label">Notes</label>
                <p style={{ color: 'var(--color-neutral-700)', whiteSpace: 'pre-wrap' }}>
                  {assessment.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Link href="/assessments" className="btn-secondary">
            Back to List
          </Link>
        </div>
      </div>
    </div>
  )
}