'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Calendar, ChevronLeft, ChevronRight, Search, Edit, Trash2, Eye } from 'lucide-react'
import { ImportButton, ExportButton } from '@/components/shared/ActionButtons'

interface Assessment {
  id: string
  reference_number: string
  site_id: string | null
  site_address: string
  scheduled_date: string
  scheduled_time: string
  status: string
  assigned_installer_id: string | null
  client_id: string | null
  created_at: string
  completed_date: string | null
  contactName: string
  companyName: string
  installerName: string
}

const ITEMS_PER_PAGE = 20

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [installerFilter, setInstallerFilter] = useState('all')
  const [installersList, setInstallersList] = useState<Array<{ id: string; name: string }>>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchInstallers()
  }, [])

  useEffect(() => {
    getAssessments(1)
  }, [searchTerm, statusFilter, installerFilter])

  const fetchInstallers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('id, first_name, last_name')
      .eq('role', 'Installer')
      .order('first_name')

    if (!error && data) {
      const formattedInstallers = data.map(installer => ({
        id: installer.id,
        name: `${installer.first_name} ${installer.last_name}`
      }))
      setInstallersList(formattedInstallers)
    }
  }

  async function getAssessments(page: number) {
    try {
      setLoading(true)
      
      // Build query with filters
      let countQuery = supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'Deleted')

      let dataQuery = supabase
        .from('assessments')
        .select(`
          *,
          sites!site_id (
            address_line_1,
            address_line_2,
            city,
            postcode
          )
        `)
        .neq('status', 'Deleted')

      // Apply status filter
      if (statusFilter !== 'ALL') {
        countQuery = countQuery.eq('status', statusFilter)
        dataQuery = dataQuery.eq('status', statusFilter)
      }

      // Apply installer filter
      if (installerFilter !== 'all') {
        countQuery = countQuery.eq('assigned_installer_id', installerFilter)
        dataQuery = dataQuery.eq('assigned_installer_id', installerFilter)
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        countQuery = countQuery.or(`reference_number.ilike.%${searchLower}%,site_address.ilike.%${searchLower}%`)
        dataQuery = dataQuery.or(`reference_number.ilike.%${searchLower}%,site_address.ilike.%${searchLower}%`)
      }

      // Get total count
      const { count, error: countError } = await countQuery

      if (countError) throw countError
      setTotalCount(count || 0)

      // Get paginated assessments
      const start = (page - 1) * ITEMS_PER_PAGE
      const { data, error } = await dataQuery
        .order('scheduled_date', { ascending: false })
        .range(start, start + ITEMS_PER_PAGE - 1)

      if (error) {
        console.error('Error fetching assessments:', error)
        setError('Unable to load assessments. Please refresh the page or contact support if the issue persists.')
        return
      }

      // Get all client IDs and installer IDs from this page
      const clientIds = [...new Set((data || []).map(a => a.client_id).filter(Boolean))]
      const installerIds = [...new Set((data || []).map(a => a.assigned_installer_id).filter(Boolean))]

      // Fetch all clients at once
      const clientMap: Record<string, any> = {}
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, first_name, last_name, company_id')
          .in('id', clientIds)

        if (clients) {
          clients.forEach(client => {
            clientMap[client.id] = client
          })
        }
      }

      // Fetch all companies at once
      const companyIds = [...new Set(Object.values(clientMap).map(c => c.company_id).filter(Boolean))]
      const companyMap: Record<string, any> = {}
      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, company_name')
          .in('id', companyIds)

        if (companies) {
          companies.forEach(company => {
            companyMap[company.id] = company
          })
        }
      }

      // Fetch all installers at once
      const installerMap: Record<string, any> = {}
      if (installerIds.length > 0) {
        const { data: installers } = await supabase
          .from('team_members')
          .select('id, first_name, last_name')
          .in('id', installerIds)

        if (installers) {
          installers.forEach(installer => {
            installerMap[installer.id] = installer
          })
        }
      }

      // Merge data
      const assessmentsWithDetails = (data || []).map((assessment: any) => {
        let contactName = 'No Client'
        let companyName = '—'
        let installerName = 'Unassigned'
        let site_address = '—'

        if (assessment.client_id && clientMap[assessment.client_id]) {
          const client = clientMap[assessment.client_id]
          contactName = `${client.first_name} ${client.last_name}`

          if (client.company_id && companyMap[client.company_id]) {
            companyName = companyMap[client.company_id].company_name
          }
        }

        if (assessment.assigned_installer_id && installerMap[assessment.assigned_installer_id]) {
          const installer = installerMap[assessment.assigned_installer_id]
          installerName = `${installer.first_name} ${installer.last_name}`
        }

        // Construct site address from joined sites table
        if (assessment.sites) {
          const site = assessment.sites
          const addressParts = [
            site.address_line_1,
            site.address_line_2,
            site.city,
            site.postcode
          ].filter(Boolean)
          site_address = addressParts.join(', ') || '—'
        }

        return {
          ...assessment,
          contactName,
          companyName,
          installerName,
          site_address
        }
      })

      setAssessments(assessmentsWithDetails as Assessment[])
      setCurrentPage(page)
      setError(null)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === assessments.length && assessments.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(assessments.map(a => a.id)))
    }
  }

  const toggleSelectAssessment = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* PAGE HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0066CC]">Assessments</h1>
            <p className="text-sm text-gray-500 mt-1">Schedule and manage site assessments</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              U
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-700">user@premier.local</p>
            </div>
            <button className="ml-2 text-xs text-[#0066CC] hover:underline">Logout</button>
          </div>
        </div>
      </div>

      {/* TOOLBAR ROW */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Search */}
          <div className="w-64">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Export
            </button>
            <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Import
            </button>
            <Link
              href="/assessments/new"
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] hover:shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Assessment
            </Link>
          </div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-6">
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Scheduled')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === 'Scheduled'
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === 'Completed'
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('Cancelled')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === 'Cancelled'
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>

          {/* Installer Filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Installer:</span>
            <select
              value={installerFilter}
              onChange={(e) => setInstallerFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            >
              <option value="all">All Installers</option>
              {installersList.map(installer => (
                <option key={installer.id} value={installer.id}>
                  {installer.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Assessments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading assessments...</div>
          ) : assessments.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No assessments found</h3>
              <p className="text-gray-500 mb-6">Get started by scheduling your first site assessment.</p>
              <Link
                href="/assessments/new"
                className="inline-flex items-center gap-2 bg-[#0066CC] text-white px-6 py-3 rounded-lg hover:bg-[#0052a3]"
              >
                <Plus className="w-5 h-5" />
                Schedule Assessment
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#0066CC]">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === assessments.length && assessments.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        no.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        contact name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        site address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        scheduled date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        assigned installer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        completed date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(assessment.id)}
                            onChange={() => toggleSelectAssessment(assessment.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/assessments/${assessment.id}`}
                              className="p-1 text-blue-600 hover:bg-gray-100 hover:text-blue-800 rounded"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/assessments/${assessment.id}`}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="View Details"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Link
                            href={`/assessments/${assessment.id}`}
                            className="text-[#0066CC] hover:text-[#0052a3] font-medium underline cursor-pointer"
                          >
                            {assessment.reference_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {assessment.client_id ? (
                            <Link
                              href={`/clients/${assessment.client_id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {assessment.contactName}
                            </Link>
                          ) : (
                            assessment.contactName
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {assessment.companyName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {assessment.site_address}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(assessment.scheduled_date)}
                          <br />
                          <span className="text-xs text-gray-400">{assessment.scheduled_time}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                            {assessment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {assessment.installerName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {assessment.completed_date ? formatDate(assessment.completed_date) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls - Bottom */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-4 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    <span className="ml-4 text-gray-500">Total: {totalCount} assessments</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => getAssessments(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <button
                      onClick={() => getAssessments(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}