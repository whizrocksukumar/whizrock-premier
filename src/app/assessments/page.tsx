'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Calendar, ChevronLeft, ChevronRight, Search, Edit, Trash2, Eye } from 'lucide-react'
import { ImportButton, ExportButton } from '@/components/shared/ActionButtons'

interface Assessment {
  id: string
  reference_number: string
  site_address: string
  scheduled_date: string
  scheduled_time: string
  status: string
  assigned_installer_id: string | null
  client_id: string | null
  created_at: string
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

  useEffect(() => {
    getAssessments(1)
  }, [searchTerm, statusFilter])

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
        .select('*')
        .neq('status', 'Deleted')

      // Apply status filter
      if (statusFilter !== 'ALL') {
        countQuery = countQuery.eq('status', statusFilter)
        dataQuery = dataQuery.eq('status', statusFilter)
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

        return {
          ...assessment,
          contactName,
          companyName,
          installerName
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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Standardized Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="text-gray-600 text-sm mt-1">Schedule and manage free site assessments</p>
          </div>
          <Link
            href="/assessments/new"
            className="inline-flex items-center gap-2 bg-[#0066CC] text-white px-4 py-2 rounded-lg hover:bg-[#0052a3]"
          >
            <Plus className="w-4 h-4" />
            Schedule Assessment
          </Link>
        </div>
      </div>
      
      <div className="p-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex items-center gap-4">
            {/* Search Box - 30% width */}
            <div className="w-[30%] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by reference or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-[#0066CC] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('Scheduled')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  statusFilter === 'Scheduled'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => setStatusFilter('Completed')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  statusFilter === 'Completed'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter('Cancelled')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  statusFilter === 'Cancelled'
                    ? 'bg-gray-100 text-gray-800 border border-gray-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Cancelled
              </button>
            </div>

            {/* Action Buttons - Right aligned */}
            <div className="flex gap-2 ml-auto">
              <ExportButton />
              <ImportButton />
            </div>
          </div>
        </div>

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
                        created date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/assessments/${assessment.id}`}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/assessments/${assessment.id}/edit`}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit"
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
                          {formatDate(assessment.created_at)}
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