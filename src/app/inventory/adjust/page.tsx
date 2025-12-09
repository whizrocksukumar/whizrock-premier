'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Settings, AlertCircle, TrendingUp, TrendingDown, History } from 'lucide-react'

interface Product {
  id: string
  product_code: string
  product_name: string
  current_quantity: number
  quantity_reserved: number
  quantity_available: number
  warehouse_location: string
}

interface RecentAdjustment {
  id: string
  product_code: string
  product_name: string
  movement_type: string
  quantity: number
  notes: string | null
  created_at: string
  created_by_name: string | null
}

export default function StockAdjustmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [recentAdjustments, setRecentAdjustments] = useState<RecentAdjustment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({
    adjustment_type: 'increase',
    quantity: '',
    reason: ''
  })

  useEffect(() => {
    fetchProducts()
    fetchRecentAdjustments()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_levels')
        .select(`
          product_id,
          warehouse_location,
          quantity_on_hand,
          quantity_reserved,
          quantity_available,
          products!inner(
            id,
            product_code,
            product_name
          )
        `)
        .order('products(product_code)')

      if (error) throw error

      const formattedProducts = (data || []).map((stock: any) => ({
        id: stock.products.id,
        product_code: stock.products.product_code,
        product_name: stock.products.product_name,
        current_quantity: stock.quantity_on_hand,
        quantity_reserved: stock.quantity_reserved,
        quantity_available: stock.quantity_available,
        warehouse_location: stock.warehouse_location
      }))

      setProducts(formattedProducts)
    } catch (err: any) {
      console.error('Error fetching products:', err)
    }
  }

  const fetchRecentAdjustments = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products!inner(product_code, product_name),
          created_by_team:team_members!created_by(first_name, last_name)
        `)
        .in('movement_type', ['Adjustment Increase', 'Adjustment Decrease'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const formatted = (data || []).map((adj: any) => ({
        id: adj.id,
        product_code: adj.products.product_code,
        product_name: adj.products.product_name,
        movement_type: adj.movement_type,
        quantity: adj.quantity,
        notes: adj.notes,
        created_at: adj.created_at,
        created_by_name: adj.created_by_team
          ? `${adj.created_by_team.first_name} ${adj.created_by_team.last_name}`
          : null
      }))

      setRecentAdjustments(formatted)
    } catch (err: any) {
      console.error('Error fetching recent adjustments:', err)
    }
  }

  const filteredProducts = products.filter(p =>
    p.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct) {
      setError('Please select a product')
      return
    }

    const adjustmentQty = parseInt(formData.quantity)
    if (isNaN(adjustmentQty) || adjustmentQty <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for the adjustment')
      return
    }

    // Validate: Cannot reduce below reserved quantity
    if (formData.adjustment_type === 'decrease') {
      const newQuantity = selectedProduct.current_quantity - adjustmentQty
      if (newQuantity < selectedProduct.quantity_reserved) {
        setError(`Cannot reduce stock below reserved quantity (${selectedProduct.quantity_reserved}). Current: ${selectedProduct.current_quantity}`)
        return
      }
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // Call manual_stock_adjustment function
      const { data, error: adjustError } = await supabase.rpc('manual_stock_adjustment', {
        p_product_id: selectedProduct.id,
        p_warehouse_location: selectedProduct.warehouse_location,
        p_adjustment_type: formData.adjustment_type,
        p_quantity: adjustmentQty,
        p_reason: formData.reason,
        p_created_by: 'current-user-id' // TODO: Replace with actual user ID
      })

      if (adjustError) throw adjustError

      setSuccess(`Successfully ${formData.adjustment_type === 'increase' ? 'increased' : 'decreased'} stock by ${adjustmentQty} units.`)
      
      // Reset form
      setFormData({ adjustment_type: 'increase', quantity: '', reason: '' })
      setSelectedProduct(null)
      setSearchTerm('')

      // Refresh data
      fetchProducts()
      fetchRecentAdjustments()

    } catch (err: any) {
      console.error('Error adjusting stock:', err)
      setError(err.message || 'Failed to adjust stock')
    } finally {
      setLoading(false)
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/inventory')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </button>

        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8 text-[#0066CC]" />
          Stock Adjustment
        </h1>
        <p className="text-gray-600 mt-1">Manually adjust stock levels for inventory corrections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adjustment Form */}
        <div className="lg:col-span-2">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Product Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Select Product</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Product
                </label>
                <input
                  type="text"
                  placeholder="Search by code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {searchTerm && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No products found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleProductSelect(product)}
                          className={`w-full p-3 text-left hover:bg-gray-50 ${
                            selectedProduct?.id === product.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{product.product_code}</p>
                              <p className="text-xs text-gray-600">{product.product_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {product.current_quantity} units
                              </p>
                              <p className="text-xs text-gray-500">
                                Available: {product.quantity_available}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedProduct && !searchTerm && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedProduct.product_code}</p>
                      <p className="text-xs text-gray-600">{selectedProduct.product_name}</p>
                      <p className="text-xs text-gray-500 mt-1">Location: {selectedProduct.warehouse_location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{selectedProduct.current_quantity}</p>
                      <p className="text-xs text-gray-600">On Hand</p>
                      <p className="text-xs text-gray-500">Reserved: {selectedProduct.quantity_reserved}</p>
                      <p className="text-xs text-green-600 font-medium">Available: {selectedProduct.quantity_available}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null)
                      setSearchTerm('')
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Change Product
                  </button>
                </div>
              )}
            </div>

            {/* Adjustment Details */}
            {selectedProduct && (
              <>
                <div>
                  <h2 className="text-lg font-semibold mb-4">Adjustment Details</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Adjustment Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adjustment Type <span className="text-red-600">*</span>
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, adjustment_type: 'increase' })}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                            formData.adjustment_type === 'increase'
                              ? 'border-green-600 bg-green-50 text-green-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <TrendingUp className="w-5 h-5" />
                          <span className="font-medium">Increase</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, adjustment_type: 'decrease' })}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                            formData.adjustment_type === 'decrease'
                              ? 'border-red-600 bg-red-50 text-red-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <TrendingDown className="w-5 h-5" />
                          <span className="font-medium">Decrease</span>
                        </button>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Enter quantity"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                      />
                      {formData.quantity && (
                        <p className="text-xs text-gray-500 mt-1">
                          New quantity will be:{' '}
                          <span className="font-semibold">
                            {formData.adjustment_type === 'increase'
                              ? selectedProduct.current_quantity + parseInt(formData.quantity || '0')
                              : selectedProduct.current_quantity - parseInt(formData.quantity || '0')
                            }
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Adjustment <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    placeholder="Explain why this adjustment is needed..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: Stock count correction, damaged goods, expired stock, etc.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#0066CC] text-white px-6 py-2 rounded-lg hover:bg-[#0052a3] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Apply Adjustment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null)
                      setSearchTerm('')
                      setFormData({ adjustment_type: 'increase', quantity: '', reason: '' })
                      setError('')
                      setSuccess('')
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Recent Adjustments Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-gray-500" />
              Recent Adjustments
            </h3>

            {recentAdjustments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No recent adjustments</p>
            ) : (
              <div className="space-y-4">
                {recentAdjustments.map((adj) => (
                  <div key={adj.id} className="border-l-4 border-blue-600 pl-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      {adj.movement_type === 'Adjustment Increase' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-semibold ${
                        adj.movement_type === 'Adjustment Increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {adj.movement_type === 'Adjustment Increase' ? '+' : '-'}{adj.quantity}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-900">{adj.product_code}</p>
                    <p className="text-xs text-gray-600 truncate">{adj.product_name}</p>
                    {adj.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{adj.notes}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(adj.created_at)}</p>
                    {adj.created_by_name && (
                      <p className="text-xs text-gray-500">by {adj.created_by_name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Important Notes</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Stock cannot be reduced below reserved quantity</li>
              <li>• All adjustments are logged and auditable</li>
              <li>• Always provide a clear reason for adjustments</li>
              <li>• Contact supervisor for large adjustments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
