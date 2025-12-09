'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, History, Search, Download, TrendingUp, TrendingDown } from 'lucide-react'

interface StockMovement {
  id: string
  product_code: string
  product_name: string
  movement_type: string
  quantity: number
  reference_type: string | null
  reference_number: string | null
  warehouse_location: string
  notes: string | null
  created_at: string
  created_by_name: string | null
}

export default function StockMovementsPage() {
  const router = useRouter()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [movementTypeFilter, setMovementTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Pagination
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0 })

  useEffect(() => {
    fetchMovements()
  }, [searchTerm, movementTypeFilter, dateFrom, dateTo, pagination.page])

  const fetchMovements = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products!inner(
            product_code,
            product_name
          ),
          created_by_team:team_members!created_by(first_name, last_name)
        `, { count: 'exact' })

      // Search
      if (searchTerm) {
        query = query.or(`products.product_code.ilike.%${searchTerm}%,products.product_name.ilike.%${searchTerm}%,reference_number.ilike.%${searchTerm}%`)
      }

      // Movement Type Filter
      if (movementTypeFilter !== 'all') {
        query = query.eq('movement_type', movementTypeFilter)
      }

      // Date Range Filter
      if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString())
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endDate.toISOString())
      }

      // Pagination
      const offset = (pagination.page - 1) * pagination.pageSize
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pagination.pageSize - 1)

      const { data, count, error: fetchError } = await query

      if (fetchError) throw fetchError

      const formattedData = (data || []).map((movement: any) => ({
        id: movement.id,
        product_code: movement.products.product_code,
        product_name: movement.products.product_name,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        reference_type: movement.reference_type,
        reference_number: movement.reference_number,
        warehouse_location: movement.warehouse_location,
        notes: movement.notes,
        created_at: movement.created_at,
        created_by_name: movement.created_by_team
          ? `${movement.created_by_team.first_name} ${movement.created_by_team.last_name}`
          : null
      }))

      setMovements(formattedData)
      setPagination(prev => ({ ...prev, total: count || 0 }))

    } catch (err: any) {
      console.error('Error fetching movements:', err)
      setError(err.message || 'Failed to load stock movements')
    } finally {
      setLoading(false)
    }
  }

  const getMovementTypeIcon = (type: string) => {
    if (type === 'Receipt' || type === 'Adjustment Increase' || type === 'Return') {
      return <TrendingUp className="w-4 h-4 text-green-600" />
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />
  }

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'Receipt': return 'bg-green-100 text-green-800'
      case 'Issue': return 'bg-red-100 text-red-800'
      case 'Adjustment Increase': return 'bg-blue-100 text-blue-800'
      case 'Adjustment Decrease': return 'bg-orange-100 text-orange-800'
      case 'Transfer Out': return 'bg-purple-100 text-purple-800'
      case 'Transfer In': return 'bg-indigo-100 text-indigo-800'
      case 'Return': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Date', 'Product Code', 'Product Name', 'Movement Type', 'Quantity', 'Reference', 'Location', 'Created By', 'Notes']
    const csvRows = [
      headers.join(','),
      ...movements.map(m => [
        formatDateTime(m.created_at),
        m.product_code,
        `"${m.product_name}"`,
        m.movement_type,
        m.quantity,
        m.reference_number || '',
        m.warehouse_location,
        m.created_by_name || '',
        m.notes ? `"${m.notes.replace(/"/g, '""')}"` : ''
      ].join(','))
    ]

    // Download
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stock-movements-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/inventory')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="w-8 h-8 text-[#0066CC]" />
              Stock Movements History
            </h1>
            <p className="text-gray-600 mt-1">View all stock transactions and movements</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={movements.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Product, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Movement Type Filter */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Movement Type</label>
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Receipt">Receipt</option>
              <option value="Issue">Issue</option>
              <option value="Adjustment Increase">Adjustment Increase</option>
              <option value="Adjustment Decrease">Adjustment Decrease</option>
              <option value="Transfer Out">Transfer Out</option>
              <option value="Transfer In">Transfer In</option>
              <option value="Return">Return</option>
            </select>
          </div>

          {/* Date From */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          <div className="lg:col-span-2 flex items-end justify-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setMovementTypeFilter('all')
                setDateFrom('')
                setDateTo('')
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading movements...</div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No stock movements found.</p>
            {(searchTerm || movementTypeFilter !== 'all' || dateFrom || dateTo) && (
              <p className="text-sm mt-2">Try adjusting your filters.</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#0066CC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-40">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-28">
                      Product Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-40">
                      Movement Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-24">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-28">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                      Created By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(movement.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {movement.product_code}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {movement.product_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getMovementTypeColor(movement.movement_type)}`}>
                          {getMovementTypeIcon(movement.movement_type)}
                          {movement.movement_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {movement.movement_type === 'Issue' || movement.movement_type === 'Adjustment Decrease' || movement.movement_type === 'Transfer Out'
                          ? `-${movement.quantity}`
                          : `+${movement.quantity}`
                        }
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {movement.reference_number ? (
                          <span>
                            {movement.reference_type === 'job' && (
                              <Link
                                href={`/jobs/${movement.reference_number}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {movement.reference_number}
                              </Link>
                            )}
                            {movement.reference_type !== 'job' && movement.reference_number}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {movement.warehouse_location}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {movement.created_by_name || <span className="text-gray-400">System</span>}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {movement.notes || <span className="text-gray-400">-</span>}
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
                  <span className="font-medium">{pagination.total}</span> movements
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
