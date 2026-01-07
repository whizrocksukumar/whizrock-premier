'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  PackagePlus,
  Save,
  Plus,
  X,
  Search,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface Vendor {
  id: string;
  vendor_code: string;
  vendor_name: string;
  contact_person: string | null;
}

interface Product {
  id: string;
  sku: string;
  product_name: string;
  description: string | null;
  unit: string;
  current_stock: number;
  unit_cost: number;
}

interface LineItem {
  id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  gst_rate: number;
  line_total: number;
}

export default function NewGRNPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    vendor_id: '',
    vendor_invoice_number: '',
    vendor_invoice_date: '',
    received_date: new Date().toISOString().split('T')[0],
    received_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    warehouse_location: 'Main Warehouse',
    purchase_order_number: '',
    reference_notes: '',
    status: 'Draft'
  });

  // Vendors
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Totals
  const [totals, setTotals] = useState({
    subtotal: 0,
    gst: 0,
    total: 0
  });

  useEffect(() => {
    fetchVendors();
    fetchProducts();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [lineItems]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, vendor_code, vendor_name, contact_person')
        .eq('is_active', true)
        .order('vendor_name');

      if (error) throw error;
      setVendors(data || []);
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, sku, product_name, description, unit, quantity_on_hand, cost_price')
        .eq('is_active', true)
        .order('product_name');

      if (error) throw error;

      const mappedProducts = (data || []).map(p => ({
        id: p.id,
        sku: p.sku,
        product_name: p.product_name,
        description: p.description,
        unit: p.unit,
        current_stock: p.quantity_on_hand || 0,
        unit_cost: p.cost_price || 0
      }));

      setProducts(mappedProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  };

  const filteredVendors = vendors.filter(v =>
    v.vendor_name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.vendor_code.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    (v.contact_person && v.contact_person.toLowerCase().includes(vendorSearch.toLowerCase()))
  );

  const filteredProducts = products.filter(p =>
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData(prev => ({ ...prev, vendor_id: vendor.id }));
    setVendorSearch(vendor.vendor_name);
    setShowVendorDropdown(false);
  };

  const handleAddProduct = (product: Product) => {
    // Check if product already exists
    const exists = lineItems.find(item => item.product_id === product.id);
    if (exists) {
      setError('Product already added to this GRN');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const newItem: LineItem = {
      id: crypto.randomUUID(),
      product_id: product.id,
      product_sku: product.sku,
      product_name: product.product_name,
      description: product.description || '',
      quantity: 1,
      unit: product.unit,
      unit_cost: product.unit_cost,
      gst_rate: 15,
      line_total: product.unit_cost * 1.15
    };

    setLineItems(prev => [...prev, newItem]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleLineItemChange = (id: string, field: string, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      // Recalculate line total
      if (field === 'quantity' || field === 'unit_cost' || field === 'gst_rate') {
        const subtotal = updated.quantity * updated.unit_cost;
        updated.line_total = subtotal * (1 + updated.gst_rate / 100);
      }

      return updated;
    }));
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_cost);
    }, 0);

    const gst = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_cost;
      return sum + (itemSubtotal * item.gst_rate / 100);
    }, 0);

    setTotals({
      subtotal,
      gst,
      total: subtotal + gst
    });
  };

  const handleSubmit = async (e: React.FormEvent, postGRN: boolean = false) => {
    e.preventDefault();

    if (!formData.vendor_id) {
      setError('Please select a vendor');
      return;
    }

    if (lineItems.length === 0) {
      setError('Please add at least one product');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Insert GRN header
      const { data: grnData, error: grnError } = await supabase
        .from('goods_received_notes')
        .insert({
          vendor_id: formData.vendor_id,
          vendor_invoice_number: formData.vendor_invoice_number || null,
          vendor_invoice_date: formData.vendor_invoice_date || null,
          received_date: formData.received_date,
          received_time: formData.received_time || null,
          warehouse_location: formData.warehouse_location,
          purchase_order_number: formData.purchase_order_number || null,
          reference_notes: formData.reference_notes || null,
          status: postGRN ? 'Posted' : 'Draft',
          total_items: lineItems.length,
          total_cost: totals.subtotal,
          gst_amount: totals.gst,
          total_inc_gst: totals.total
        })
        .select()
        .single();

      if (grnError) throw grnError;

      // Insert line items
      const lineItemsData = lineItems.map(item => ({
        grn_id: grnData.id,
        product_id: item.product_id,
        quantity_received: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        gst_rate: item.gst_rate,
        line_total: item.line_total
      }));

      const { error: lineItemsError } = await supabase
        .from('grn_line_items')
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      // If posting GRN, call the post_grn function
      if (postGRN) {
        const { error: postError } = await supabase.rpc('post_grn', {
          grn_id: grnData.id
        });

        if (postError) {
          console.error('Error posting GRN:', postError);
          // Still navigate even if post fails
        }
      }

      // Navigate to GRN detail page
      router.push(`/inventory/receive/${grnData.id}`);
    } catch (err: any) {
      console.error('Error creating GRN:', err);
      setError(err.message || 'Failed to create GRN');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/inventory/receive"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Goods Receipts
        </Link>

        <h1 className="text-3xl font-bold flex items-center gap-2">
          <PackagePlus className="w-8 h-8 text-green-600" />
          New Goods Received Note
        </h1>
        <p className="text-gray-600 mt-1">
          Record incoming stock from vendor
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* GRN Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
            GRN Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor Selection */}
            <div className="md:col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={vendorSearch}
                  onChange={(e) => {
                    setVendorSearch(e.target.value);
                    setShowVendorDropdown(true);
                  }}
                  onFocus={() => setShowVendorDropdown(true)}
                  placeholder="Search vendor by name or code..."
                  className="w-full pl-10 pr-3 py-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Vendor Dropdown */}
              {showVendorDropdown && filteredVendors.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredVendors.map(vendor => (
                    <div
                      key={vendor.id}
                      onClick={() => handleVendorSelect(vendor)}
                      className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{vendor.vendor_name}</div>
                      <div className="text-xs text-gray-500">
                        {vendor.vendor_code}
                        {vendor.contact_person && ` • ${vendor.contact_person}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Vendor Display */}
              {selectedVendor && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                  <div>
                    <span className="font-medium text-green-900">{selectedVendor.vendor_name}</span>
                    <span className="text-sm text-green-700 ml-2">({selectedVendor.vendor_code})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVendor(null);
                      setVendorSearch('');
                      setFormData(prev => ({ ...prev, vendor_id: '' }));
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Invoice Number
              </label>
              <input
                type="text"
                value={formData.vendor_invoice_number}
                onChange={(e) => setFormData(prev => ({ ...prev, vendor_invoice_number: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
                placeholder="INV-12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Invoice Date
              </label>
              <input
                type="date"
                value={formData.vendor_invoice_date}
                onChange={(e) => setFormData(prev => ({ ...prev, vendor_invoice_date: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Received Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={formData.received_date}
                onChange={(e) => setFormData(prev => ({ ...prev, received_date: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Received Time
              </label>
              <input
                type="time"
                value={formData.received_time}
                onChange={(e) => setFormData(prev => ({ ...prev, received_time: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse Location
              </label>
              <input
                type="text"
                value={formData.warehouse_location}
                onChange={(e) => setFormData(prev => ({ ...prev, warehouse_location: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Order Number
              </label>
              <input
                type="text"
                value={formData.purchase_order_number}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_order_number: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
                placeholder="PO-12345"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Notes
              </label>
              <textarea
                value={formData.reference_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
                placeholder="Any additional notes about this receipt..."
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h2 className="text-lg font-semibold">
              Products ({lineItems.length})
            </h2>
          </div>

          {/* Product Search */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Product
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="Search products by SKU or name..."
                className="w-full pl-10 pr-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Product Dropdown */}
            {showProductDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{product.product_name}</div>
                        <div className="text-xs text-gray-500">
                          SKU: {product.sku} • Unit: {product.unit}
                          {product.description && ` • ${product.description}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(product.unit_cost)}</div>
                        <div className="text-xs text-gray-500">Stock: {product.current_stock}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          {lineItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Product
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                      Quantity
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                      Unit
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                      Unit Cost
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                      GST %
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                      Line Total
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-3">
                        <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                        <div className="text-xs text-gray-500">SKU: {item.product_sku}</div>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-24 px-2 py-1 text-sm text-right border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {item.unit}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={item.unit_cost}
                          onChange={(e) => handleLineItemChange(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-28 px-2 py-1 text-sm text-right border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={item.gst_rate}
                          onChange={(e) => handleLineItemChange(item.id, 'gst_rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-20 px-2 py-1 text-sm text-right border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(item.line_total)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PackagePlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p>No products added yet</p>
              <p className="text-sm mt-1">Search and select products above to add them</p>
            </div>
          )}

          {/* Totals */}
          {lineItems.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST:</span>
                    <span className="font-medium">{formatCurrency(totals.gst)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total (inc GST):</span>
                    <span className="text-green-600">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-3 justify-end">
            <Link
              href="/inventory/receive"
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || !formData.vendor_id || lineItems.length === 0}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading || !formData.vendor_id || lineItems.length === 0}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" />
              {loading ? 'Posting...' : 'Post GRN'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-right">
            Save as Draft to review later, or Post GRN to immediately update stock levels
          </p>
        </div>
      </form>
    </div>
  );
}
