'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Package, Search, AlertTriangle, TrendingDown, Settings, History } from 'lucide-react'

interface StockLevel {
  id: string
  product_id: string
  product_code: string
  product_name: string
  warehouse_location: string
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  reorder_level: number
  reorder_quantity: number
  unit_cost: number
  last_counted_at: string | null
  last_counted_by_name: string | null
}

export default function InventoryPage() {
  const router = useRouter()
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  
  // Pagination
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })

  // Unique locations for filter
  const [locations, setLocations] = useState<string[]>([])

  useEffect(() => {
    fetchStockLevels()
  }, [searchTerm, locationFilter, showLowStockOnly, pagination.page])

  const fetchStockLevels = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('stock_levels')
        .select(`
          *,
          products!inner(
            product_code,
            product_name
          ),
          last_counted_by_team:team_members!last_counted_by(first_name, last_name)
        `, { count: 'exact' })

      // Search
      if (searchTerm) {
        query = query.or(`products.product_code.ilike.%${searchTerm}%,products.product_name.ilike.%${searchTerm}%`)
      }

      // Location Filter
      if (locationFilter !== 'all') {
        query = query.eq('warehouse_location', locationFilter)
      }

      // Low Stock Filter
      if (showLowStockOnly) {
        query = query.lt('quantity_available', supabase.rpc('reorder_level'))
      }

      // Pagination
      const offset = (pagination.page - 1) * pagination.pageSize
      query = query
        .order('products(product_code)', { ascending: true })
        .range(offset, offset + pagination.pageSize - 1)

      const { data, count, error: fetchError } = await query

      if (fetchError) throw fetchError

      const formattedData = (data || []).map((stock: any) => ({
        id: stock.id,
        product_id: stock.product_id,
        product_code: stock.products.product_code,
        product_name: stock.products.product_name,
        warehouse_location: stock.warehouse_location,
        quantity_on_hand: stock.quantity_on_hand,
        quantity_reserved: stock.quantity_reserved,
        quantity_available: stock.quantity_available,
        reorder_level: stock.reorder_level,
        reorder_quantity: stock.reorder_quantity,
        unit_cost: stock.unit_cost,
        last_counted_at: stock.last_counted_at,
        last_counted_by_name: stock.last_counted_by_team
          ? `${stock.last_counted_by_team.first_name} ${stock.last_counted_by_team.last_name}`
          : null
      }))

      setStockLevels(formattedData)
      setPagination(prev => ({ ...prev, total: count || 0 }))

      // Extract unique locations
      const uniqueLocations = Array.from(new Set(formattedData.map(s => s.warehouse_location)))
      setLocations(uniqueLocations.sort())

    } catch (err: any) {
      console.error('Error fetching stock levels:', err)
      setError(err.message || 'Failed to load stock levels')
    } finally {
      setLoading(false)
    }
  }

  const isLowStock = (stock: StockLevel) => {
    return stock.quantity_available <= stock.reorder_level
  }

  const getStockStatusColor = (stock: StockLevel) => {
    if (stock.quantity_available === 0) return 'text-red-600 font-bold'
    if (isLowStock(stock)) return 'text-orange-600 font-semibold'
    return 'text-green-600'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)
  const lowStockCount = stockLevels.filter(isLowStock).length
  const outOfStockCount = stockLevels.filter(s => s.quantity_available === 0).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8 text-[#0066CC]" />
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">Monitor stock levels and product availability</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/inventory/movements"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <History className="w-5 h-5" />
            Stock History
          </Link>
          <Link
            href="/inventory/adjust"
            className="bg-[#0066CC] text-white px-4 py-2 rounded-lg hover:bg-[#0052a3] flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Adjust Stock
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-3">
          {/* Search */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Product code, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Filter */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle */}
          <div className="lg:col-span-2 flex items-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="font-medium text-gray-700">Low Stock Only</span>
            </label>
          </div>

          {/* Clear Filters */}
          <div className="lg:col-span-3 flex items-end justify-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setLocationFilter('all')
                setShowLowStockOnly(false)
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All Filters
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

      {/* Stock Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading inventory...</div>
        ) : stockLevels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No stock records found.</p>
            {(searchTerm || locationFilter !== 'all' || showLowStockOnly) && (
              <p className="text-sm mt-2">Try adjusting your filters.</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#0066CC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                      Product Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                      Location
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-24">
                      On Hand
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-24">
                      Reserved
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-24">
                      Available
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-24">
                      Reorder At
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-28">
                      Unit Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                      Last Counted
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider w-24">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockLevels.map((stock) => (
                    <tr 
                      key={stock.id}
                      className={`hover:bg-gray-50 ${isLowStock(stock) ? 'bg-orange-50' : ''}`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stock.product_code}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {stock.product_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {stock.warehouse_location}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {stock.quantity_on_hand}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {stock.quantity_reserved}
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${getStockStatusColor(stock)}`}>
                        {stock.quantity_available}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {stock.reorder_level}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        ${stock.unit_cost.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600">
                        {formatDate(stock.last_counted_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {stock.quantity_available === 0 ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Out
                          </span>
                        ) : isLowStock(stock) ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 flex items-center justify-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            Low
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            OK
                          </span>
                        )}
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
                  <span className="font-medium">{pagination.total}</span> products
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
