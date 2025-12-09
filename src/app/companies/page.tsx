'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit, Eye } from 'lucide-react'

interface Company {
  id: string
  name: string
  industry: string | null
  website: string | null
  phone: string | null
  email: string | null
  city: string | null
  country: string | null
  created_at: string
}

type SortField = 'name' | 'industry' | 'city' | 'phone' | 'email' | 'created_at'
type SortDirection = 'asc' | 'desc'

export default function CompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCompanies()
  }, [searchTerm, sortField, sortDirection, pagination.page])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        // .order(sortField, { ascending: sortDirection === 'asc' })

      if (fetchError) throw fetchError

      let filtered = data || []

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        filtered = filtered.filter(company =>
          company.name?.toLowerCase().includes(searchLower) ||
          company.industry?.toLowerCase().includes(searchLower) ||
          company.email?.toLowerCase().includes(searchLower) ||
          company.phone?.includes(searchTerm) ||
          company.city?.toLowerCase().includes(searchLower)
        )
      }

      setCompanies(filtered)
      setPagination(prev => ({ ...prev, total: filtered.length }))
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch companies')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-blue-200">⇅</span>
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === companies.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(companies.map(c => c.id)))
    }
  }

  const toggleSelectCompany = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const filteredCompanies = companies

  return (
    <div className="min-h-screen bg-gray-100">
      {/* PAGE HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0066CC]">Companies</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your company database</p>
          </div>
          {/* User Icon and Email */}
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
                placeholder="Search companies..."
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
              href="/companies/new"
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Company
            </Link>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-600 mb-4">
          Showing {filteredCompanies.length} of {companies.length} companies
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
            <span className="ml-3 text-gray-600">Loading companies...</span>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded shadow overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0066CC] text-white">
                    <th className="text-center px-4 py-3 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === companies.length && companies.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold whitespace-nowrap">
                      Action
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('name')}
                    >
                      Company Name <SortArrow field="name" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('industry')}
                    >
                      Industry <SortArrow field="industry" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('phone')}
                    >
                      Phone <SortArrow field="phone" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('email')}
                    >
                      Email <SortArrow field="email" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('city')}
                    >
                      City <SortArrow field="city" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('created_at')}
                    >
                      Created <SortArrow field="created_at" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No companies found
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company, index) => (
                      <tr
                        key={company.id}
                        className={`hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="text-center px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(company.id)}
                            onChange={() => toggleSelectCompany(company.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/companies/${company.id}`}
                              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Link>
                            <Link
                              href={`/companies/${company.id}/edit`}
                              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/companies/${company.id}`}
                            className="text-[#0066CC] hover:underline font-medium"
                          >
                            {company.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {company.industry || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {company.phone || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {company.email || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {company.city || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(company.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 rounded shadow">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      page =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - pagination.page) <= 2
                    )
                    .map((page, index, array) => (
                      <span key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded text-sm ${
                            pagination.page === page
                              ? 'bg-[#0066CC] text-white'
                              : 'border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    ))}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}