'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Calendar, ChevronLeft, ChevronRight, Search, Edit, Eye } from 'lucide-react'

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

export default function AssessmentPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAssessments(1)
  }, [searchTerm])

  async function loadAssessments(page: number) {
    try {
      setLoading(true)

      let query = supabase
        .from('assessments')
        .select('*', { count: 'exact' })
        .neq('status', 'Deleted')

      if (searchTerm) {
        query = query.or(
          `reference_number.ilike.%${searchTerm}%,site_address.ilike.%${searchTerm}%`
        )
      }

      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      setAssessments(data || [])
      setTotalCount(count || 0)
      setCurrentPage(page)
    } catch {
      setError('Failed to load assessments')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0066CC]">Assessments</h1>
          <p className="text-sm text-gray-500">Assessment overview (test)</p>
        </div>

        <Link
          href="/test/assessment/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3]"
        >
          <Plus className="w-4 h-4" />
          New Assessment
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white border-b px-6 py-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assessments"
            className="w-full pl-9 pr-3 py-2 border rounded text-sm"
          />
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        <div className="bg-white rounded shadow">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading…</div>
          ) : assessments.length === 0 ? (
            <div className="p-10 text-center">
              <Calendar className="mx-auto mb-4 text-gray-300" size={48} />
              <p className="text-gray-600">No assessments found</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-[#0066CC] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Scheduled</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map(a => (
                    <tr key={a.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#0066CC]">
                        <Link href={`/test/assessment/${a.id}`}>
                          {a.reference_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{a.status}</td>
                      <td className="px-4 py-3">
                        {a.scheduled_date} {a.scheduled_time}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <Link
                          href={`/test/assessment/${a.id}`}
                          className="text-blue-600"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/test/assessment/${a.id}/edit`}
                          className="text-gray-600"
                        >
                          <Edit size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t">
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>

                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => loadAssessments(currentPage - 1)}
                      className="px-3 py-2 border rounded disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => loadAssessments(currentPage + 1)}
                      className="px-3 py-2 border rounded disabled:opacity-50"
                    >
                      <ChevronRight size={16} />
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
