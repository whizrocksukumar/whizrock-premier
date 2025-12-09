'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Package,
  Search,
  AlertTriangle,
  TrendingDown,
  Settings,
  History,
  ChevronDown
} from 'lucide-react'

interface StockLevel {
  id: string
  product_id: string
  sku: string
  product_name: string
  warehouse_location: string
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  reorder_level: number
  reorder_quantity: number
  last_stock_take_date: string | null
}

export default function InventoryPage() {
  const [allStocks, setAllStocks] = useState<StockLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Filters
  const [locationFilter, setLocationFilter] = useState('all')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  })

  // Unique locations
  const [locations, setLocations] = useState<string[]>([])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchAllStocks()
  }, [])

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchTerm, locationFilter, showLowStockOnly])

  const fetchAllStocks = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('stock_levels')
        .select(
          `
          id,
          product_id,
          warehouse_location,
          quantity_on_hand,
          quantity_reserved,
          quantity_available,
          reorder_level,
          reorder_quantity,
          last_stock_take_date,
          products(
            id,
            sku,
            product_description
          )
        `
        )

      if (fetchError) throw fetchError

      const formatted = (data || []).map((row: any) => ({
        id: row.id,
        product_id: row.product_id,
        sku: row.products?.sku || '',
        product_name: row.products?.product_description || '',
        warehouse_location: row.warehouse_location,
        quantity_on_hand: row.quantity_on_hand || 0,
        quantity_reserved: row.quantity_reserved || 0,
        quantity_available: row.quantity_available || 0,
        reorder_level: row.reorder_level || 0,
        reorder_quantity: row.reorder_quantity || 0,
        last_stock_take_date: row.last_stock_take_date
      }))

      setAllStocks(formatted)

      // Extract unique locations
      const unique = Array.from(
        new Set(formatted.map(s => s.warehouse_location))
      )
      setLocations(unique.sort())
    } catch (err: any) {
      console.error('Error fetching stock levels:', err)
      setError(err.message || 'Failed to load stock levels')
    } finally {
      setLoading(false)
    }
  }

  // Client-side filtering
  const filteredStocks = allStocks.filter(item => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matches =
        item.sku.toLowerCase().includes(searchLower) ||
        item.product_name.toLowerCase().includes(searchLower)
      if (!matches) return false
    }

    // Location filter
    if (locationFilter !== 'all' && item.warehouse_location !== locationFilter) {
      return false
    }

    // Low stock filter
    if (showLowStockOnly && item.quantity_available > item.reorder_level) {
      return false
    }

    return true
  })

  // Search dropdown suggestions
  const searchSuggestions = searchTerm
    ? filteredStocks.slice(0, 8)
    : []

  const isLowStock = (item: StockLevel) =>
    item.quantity_available <= item.reorder_level

  const getStockStatusColor = (item: StockLevel) => {
    if (item.quantity_available === 0) return 'text-red-600 font-bold'
    if (isLowStock(item)) return 'text-orange-600 font-semibold'
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

  const totalPages = Math.ceil(filteredStocks.length / pagination.pageSize)
  const displayedStocks = filteredStocks.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  )

  const lowStockCount = allStocks.filter(isLowStock).length
  const outOfStockCount = allStocks.filter(s => s.quantity_available === 0).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8 text-[#0066CC]" />
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor stock levels and product availability
          </p>
        </div>
        <div className="flex gap-3">
          <button disabled title="Coming Soon - Phase 2" className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed flex items-center gap-2 border border-gray-300">
            <History className="w-5 h-5" />
            Stock History
          </button>
          <button disabled title="Coming Soon - Phase 2" className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed flex items-center gap-2 border border-gray-300">
            <Settings className="w-5 h-5" />
            Adjust Stock
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold">{allStocks.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Low Stock Items</p>
          <p className="text-2xl font-bold text-orange-600">
            {lowStockCount}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">
            {outOfStockCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-3">
          {/* Search with dropdown */}
          <div className="lg:col-span-3 relative" ref={searchRef}>
            <label className="block text-xs font-medium mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="SKU or product name..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  setShowSearchDropdown(true)
                }}
                onFocus={() => searchTerm && setShowSearchDropdown(true)}
                className="w-full pl-10 pr-3 py-1.5 text-sm border rounded"
              />
            </div>

            {/* Dropdown */}
            {showSearchDropdown && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {searchSuggestions.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSearchTerm(`${item.sku}`)
                      setShowSearchDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 text-sm"
                  >
                    <div className="font-medium text-gray-900">{item.sku}</div>
                    <div className="text-xs text-gray-600">{item.product_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-medium mb-1">Location</label>
            <div className="relative">
              <select
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded appearance-none bg-white"
              >
                <option value="all">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="lg:col-span-2 flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={e => setShowLowStockOnly(e.target.checked)}
              />
              <span className="text-xs font-medium">Low Stock Only</span>
            </label>
          </div>

          <div className="lg:col-span-3 flex justify-end items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setLocationFilter('all')
                setShowLowStockOnly(false)
              }}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading inventory...
          </div>
        ) : displayedStocks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No stock records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#0066CC] text-white text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Product Name</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-right">On Hand</th>
                    <th className="px-4 py-3 text-right">Reserved</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 text-right">Reorder</th>
                    <th className="px-4 py-3 text-left">Last Count</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-sm">
                  {displayedStocks.map(item => (
                    <tr
                      key={item.id}
                      className={isLowStock(item) ? 'bg-orange-50' : ''}
                    >
                      <td className="px-4 py-4 font-medium">{item.sku}</td>
                      <td className="px-4 py-4">{item.product_name}</td>
                      <td className="px-4 py-4">{item.warehouse_location}</td>
                      <td className="px-4 py-4 text-right">
                        {item.quantity_on_hand}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {item.quantity_reserved}
                      </td>
                      <td
                        className={`px-4 py-4 text-right ${getStockStatusColor(
                          item
                        )}`}
                      >
                        {item.quantity_available}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {item.reorder_level}
                      </td>
                      <td className="px-4 py-4 text-xs">
                        {formatDate(item.last_stock_take_date)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.quantity_available === 0 ? (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Out
                          </span>
                        ) : isLowStock(item) ? (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs inline-flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> Low
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
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
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t">
              <p className="text-sm text-gray-600">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.pageSize,
                    filteredStocks.length
                  )}
                </span>{' '}
                of{' '}
                <span className="font-medium">{filteredStocks.length}</span>
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <button
                  onClick={() =>
                    setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page >= totalPages}
                  className="px-4 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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