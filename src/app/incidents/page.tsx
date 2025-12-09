'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Plus, Search } from 'lucide-react'

interface Incident {
  id: string
  incident_number: string
  title: string
  incident_type: string
  severity: string
  status: string
  occurred_at: string
  reported_at: string
  resolved_at: string | null
  job_number: string | null
  reported_by_name: string | null
  assigned_to_name: string | null
  estimated_cost: number
}

export default function IncidentsPage() {
  const router = useRouter()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Pagination
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })

  useEffect(() => {
    fetchIncidents()
  }, [searchTerm, statusFilter, severityFilter, typeFilter, pagination.page])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('incidents')
        .select(`
          *,
          jobs!left(job_number),
          reported_by_team:team_members!reported_by(first_name, last_name),
          assigned_to_team:team_members!assigned_to(first_name, last_name)
        `, { count: 'exact' })
        .eq('is_active', true)

      // Search
      if (searchTerm) {
        query = query.or(`incident_number.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      // Filters
      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      if (severityFilter !== 'all') query = query.eq('severity', severityFilter)
      if (typeFilter !== 'all') query = query.eq('incident_type', typeFilter)

      // Pagination
      const offset = (pagination.page - 1) * pagination.pageSize
      query = query
        .order('occurred_at', { ascending: false })
        .range(offset, offset + pagination.pageSize - 1)

      const { data, count, error: fetchError } = await query
      if (fetchError) throw fetchError

      const formattedData = (data || []).map((inc: any) => ({
        id: inc.id,
        incident_number: inc.incident_number,
        title: inc.title,
        incident_type: inc.incident_type,
        severity: inc.severity,
        status: inc.status,
        occurred_at: inc.occurred_at,
        reported_at: inc.reported_at,
        resolved_at: inc.resolved_at,
        job_number: inc.jobs?.job_number || null,
        reported_by_name: inc.reported_by_team 
          ? `${inc.reported_by_team.first_name} ${inc.reported_by_team.last_name}`
          : null,
        assigned_to_name: inc.assigned_to_team
          ? `${inc.assigned_to_team.first_name} ${inc.assigned_to_team.last_name}`
          : null,
        estimated_cost: inc.estimated_cost || 0
      }))

      setIncidents(formattedData)
      setPagination(prev => ({ ...prev, total: count || 0 }))
    } catch (err: any) {
      console.error('Error fetching incidents:', err)
      setError(err.message || 'Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'bg-blue-100 text-blue-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Pending Customer': return 'bg-yellow-100 text-yellow-800'
      case 'Resolved': return 'bg-green-100 text-green-800'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertCircle className="w-8 h-8 text-red-600" />
            Incidents
          </h1>
          <p className="text-gray-600 mt-1">Track and manage job-related incidents</p>
        </div>

        {/* FIXED: lowercase path */}
        <Link
          href="/incidents/new"
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Report Incident
        </Link>
      </div>

      {/* Rest of your file unchanged... */}

      {/* Incidents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading incidents...</div>
        ) : incidents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No incidents found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#0066CC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                      Incident No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-40">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-24">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-28">
                      Job No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-40">
                      Occurred At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-28">
                      Est. Cost
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider w-20">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <tr 
                      key={incident.id}
                      className="hover:bg-gray-50 cursor-pointer"

                      // FIXED: lowercase path
                      onClick={() => router.push(`/incidents/${incident.id}`)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {incident.incident_number}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {incident.title}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {incident.incident_type}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {incident.job_number ? (
                          <Link
                            href={`/jobs/${incident.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {incident.job_number}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(incident.occurred_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {incident.assigned_to_name || <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {incident.estimated_cost > 0 
                          ? `$${incident.estimated_cost.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}`
                          : <span className="text-gray-400">-</span>
                        }
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()

                            // FIXED: lowercase path
                            router.push(`/incidents/${incident.id}`)
                          }}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.pageSize) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> of{' '}
                  <span className="font-medium">{pagination.total}</span> incidents
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === totalPages}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
