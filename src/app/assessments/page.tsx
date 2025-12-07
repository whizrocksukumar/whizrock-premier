'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/app/components/DataTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Assessment {
  id: string
  reference_number: string
  site_address: string
  scheduled_date: string
  scheduled_time: string
  status: string
  assigned_installer_id: string | null
  client_id: string | null
  clients?: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
    company_id: string | null
    companies?: {
      id: string
      name: string
    } | null
  } | null
  team_members?: {
    first_name: string
    last_name: string
  } | null
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAssessments()
  }, [])

  async function getAssessments() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id,
          reference_number,
          site_address,
          scheduled_date,
          scheduled_time,
          status,
          assigned_installer_id,
          client_id,
          clients!client_id (
            first_name,
            last_name,
            email,
            phone,
            company_id,
            companies (
              id,
              name
            )
          ),
          team_members!assigned_installer_id (
            first_name,
            last_name
          )
        `)
        .neq('status', 'Deleted')
        .order('scheduled_date', { ascending: false })

      console.log('Raw data from DB:', data)
      console.log('Error:', error)

      if (error) {
        console.error('Error fetching assessments:', error)
        setError(error.message)
        return
      }

      setAssessments(data || [])
      setError(null)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

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
      name: 'customer_company',
      label: 'Company Name',
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

  const transformedData = assessments.map((assessment: Assessment) => {
    const clientName = assessment.clients
      ? `${assessment.clients.first_name} ${assessment.clients.last_name}`
      : 'No Client Linked'
    const companyName = assessment.clients?.companies?.name || '—'
    const clientId = assessment.clients?.company_id || null
    const companyId = assessment.clients?.companies?.id || null

    return {
      id: assessment.id,
      reference_number: assessment.reference_number,
      customer_name: clientName,
      customer_name_link: assessment.client_id ? `/customers/${assessment.client_id}` : null,
      customer_company: companyName,
      company_id: companyId,
      site_address: assessment.site_address,
      scheduled_date: assessment.scheduled_date,
      scheduled_time: assessment.scheduled_time,
      installer_name: assessment.team_members
        ? `${assessment.team_members.first_name} ${assessment.team_members.last_name}`
        : 'Unassigned',
      status: assessment.status
    }
  })

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Assessments</h1>
          <p className="page-subtitle">Schedule and manage free assessments</p>
        </div>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading assessments...</p>
          </div>
        </div>
      </div>
    )
  }

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
      subtitle="Schedule and manage free assessments"
      onView={(id) => {
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