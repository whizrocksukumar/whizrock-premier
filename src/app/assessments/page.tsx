import { supabase } from '@/lib/supabase'
import { DataTable } from '@/app/components/DataTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Assessment {
  id: string
  reference_number: string
  customer_name: string
  site_address: string
  scheduled_date: string
  scheduled_time: string
  status: string
  assigned_installer_id: string | null
  team_members?: Array<{
    name: string
  }> | null
}

async function getAssessments() {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        id,
        reference_number,
        customer_name,
        site_address,
        scheduled_date,
        scheduled_time,
        status,
        assigned_installer_id,
        team_members:assigned_installer_id (
          name
        )
      `)
      .neq('status', 'Deleted')
      .order('scheduled_date', { ascending: false })

    if (error) {
      console.error('Error fetching assessments:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

export default async function AssessmentsPage() {
  const { data: assessments, error } = await getAssessments()

  const columns = [
    {
      name: 'reference_number',
      label: 'Reference #',
      sortable: true,
      type: 'string' as const
    },
    {
      name: 'customer_name',
      label: 'Customer Name',
      sortable: true,
      type: 'string' as const
    },
    {
      name: 'site_address',
      label: 'Site Address',
      sortable: true,
      type: 'string' as const
    },
    {
      name: 'scheduled_date',
      label: 'Scheduled Date',
      sortable: true,
      type: 'date' as const
    },
    {
      name: 'scheduled_time',
      label: 'Scheduled Time',
      sortable: true,
      type: 'string' as const
    },
    {
      name: 'installer_name',
      label: 'Assigned Installer',
      sortable: true,
      type: 'string' as const
    },
    {
      name: 'status',
      label: 'Status',
      sortable: true,
      type: 'status' as const
    }
  ]

  const transformedData = assessments?.map((assessment: Assessment) => ({
    id: assessment.id,
    reference_number: assessment.reference_number,
    customer_name: assessment.customer_name,
    site_address: assessment.site_address,
    scheduled_date: assessment.scheduled_date,
    scheduled_time: assessment.scheduled_time,
    installer_name: assessment.team_members?.[0]?.name || 'Unassigned',
    status: assessment.status
  })) || []

  if (error) {
    return (
      <div className="page-content">
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Assessments</h1>
              <p className="page-subtitle">Schedule and manage free assessments</p>
            </div>
            <Link href="/assessments/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              Schedule New Assessment
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Error loading assessments</div>
            <p className="empty-state-description">
              {error || 'Please try again later.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DataTable
      data={transformedData}
      columns={columns}
      title="Assessments"
      onView={(id) => {
        // Client-side navigation will be handled by DataTable
        window.location.href = `/assessments/${id}`
      }}
      onEdit={(id) => {
        window.location.href = `/assessments/${id}`
      }}
      onDelete={async (id) => {
        try {
          const { error } = await supabase
            .from('assessments')
            .update({
              status: 'Deleted',
              deleted_at: new Date().toISOString()
            })
            .eq('id', id)

          if (error) {
            alert('Error deleting assessment: ' + error.message)
            return
          }

          window.location.reload()
        } catch (err) {
          alert('An unexpected error occurred')
        }
      }}
      onNew={() => {
        window.location.href = '/assessments/new'
      }}
      onExport={() => {
        alert('Export functionality coming soon')
      }}
      onPrint={() => {
        alert('Print functionality coming soon')
      }}
    />
  )
}