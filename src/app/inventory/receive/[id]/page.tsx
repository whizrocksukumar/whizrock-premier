'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  PackagePlus,
  Building2,
  Calendar,
  FileText,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Trash2
} from 'lucide-react';

interface GRNDetail {
  id: string;
  grn_number: string;
  vendor_id: string;
  vendor_invoice_number: string | null;
  vendor_invoice_date: string | null;
  received_date: string;
  received_time: string | null;
  warehouse_location: string;
  purchase_order_number: string | null;
  reference_notes: string | null;
  status: string;
  total_items: number;
  total_cost: number;
  gst_amount: number;
  total_inc_gst: number;
  created_at: string;
  vendors: {
    vendor_code: string;
    vendor_name: string;
    contact_person: string | null;
  } | null;
}

interface LineItem {
  id: string;
  product_id: string;
  quantity_received: number;
  unit: string;
  unit_cost: number;
  gst_rate: number;
  line_total: number;
  products: {
    sku: string;
    product_name: string;
    description: string | null;
  } | null;
}

export default function GRNDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [grn, setGrn] = useState<GRNDetail | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGRN();
    fetchLineItems();
  }, [params.id]);

  const fetchGRN = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('goods_received_notes')
        .select('*, vendors(vendor_code, vendor_name, contact_person)')
        .eq('id', params.id)
        .single();

      if (fetchError) throw fetchError;

      setGrn(data);
    } catch (err: any) {
      console.error('Error fetching GRN:', err);
      setError(err.message || 'Failed to load GRN');
    } finally {
      setLoading(false);
    }
  };

  const fetchLineItems = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('grn_line_items')
        .select('*, products(sku, product_name, description)')
        .eq('grn_id', params.id)
        .order('created_at');

      if (fetchError) throw fetchError;

      setLineItems(data || []);
    } catch (err: any) {
      console.error('Error fetching line items:', err);
    }
  };

  const handlePostGRN = async () => {
    if (!grn) return;

    if (!confirm('Post this GRN? This will update stock levels and cannot be undone.')) {
      return;
    }

    try {
      setPosting(true);
      setError('');

      const { error: postError } = await supabase.rpc('post_grn', {
        grn_id: grn.id
      });

      if (postError) throw postError;

      // Refresh GRN data
      await fetchGRN();
      alert('GRN posted successfully! Stock levels have been updated.');
    } catch (err: any) {
      console.error('Error posting GRN:', err);
      setError(err.message || 'Failed to post GRN');
    } finally {
      setPosting(false);
    }
  };

  const handleCancelGRN = async () => {
    if (!grn) return;

    if (!confirm('Cancel this GRN? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');

      const { error: updateError } = await supabase
        .from('goods_received_notes')
        .update({ status: 'Cancelled' })
        .eq('id', grn.id);

      if (updateError) throw updateError;

      await fetchGRN();
      alert('GRN cancelled successfully.');
    } catch (err: any) {
      console.error('Error cancelling GRN:', err);
      setError(err.message || 'Failed to cancel GRN');
    }
  };

  const handleDeleteGRN = async () => {
    if (!grn) return;

    if (grn.status !== 'Draft') {
      alert('Only draft GRNs can be deleted. Please cancel the GRN instead.');
      return;
    }

    if (!confirm('Delete this GRN? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      setError('');

      // Delete line items first
      const { error: lineItemsError } = await supabase
        .from('grn_line_items')
        .delete()
        .eq('grn_id', grn.id);

      if (lineItemsError) throw lineItemsError;

      // Delete GRN
      const { error: grnError } = await supabase
        .from('goods_received_notes')
        .delete()
        .eq('id', grn.id);

      if (grnError) throw grnError;

      router.push('/inventory/receive');
    } catch (err: any) {
      console.error('Error deleting GRN:', err);
      setError(err.message || 'Failed to delete GRN');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-NZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      Draft: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: Clock
      },
      Received: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: PackagePlus
      },
      Posted: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle
      },
      Cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle
      }
    };

    const config = configs[status as keyof typeof configs] || configs.Draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Loading GRN...</div>
      </div>
    );
  }

  if (error || !grn) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'GRN not found'}
        </div>
        <Link
          href="/inventory/receive"
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Goods Receipts
        </Link>
      </div>
    );
  }

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

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <PackagePlus className="w-8 h-8 text-green-600" />
              {grn.grn_number}
            </h1>
            <p className="text-gray-600 mt-1">
              Goods Received Note
            </p>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(grn.status)}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* GRN Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Vendor Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Vendor</h2>
          </div>

          {grn.vendors && (
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{grn.vendors.vendor_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Code</p>
                <p className="font-medium">{grn.vendors.vendor_code}</p>
              </div>
              {grn.vendors.contact_person && (
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="font-medium">{grn.vendors.contact_person}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Receipt Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Receipt Details</h2>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Received Date</p>
              <p className="font-medium">{formatDate(grn.received_date)}</p>
            </div>
            {grn.received_time && (
              <div>
                <p className="text-sm text-gray-600">Received Time</p>
                <p className="font-medium">{formatTime(grn.received_time)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Warehouse</p>
              <p className="font-medium">{grn.warehouse_location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium">{formatDate(grn.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Invoice Details</h2>
          </div>

          <div className="space-y-2">
            {grn.vendor_invoice_number ? (
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="font-medium">{grn.vendor_invoice_number}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No invoice number</p>
            )}
            {grn.vendor_invoice_date && (
              <div>
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="font-medium">{formatDate(grn.vendor_invoice_date)}</p>
              </div>
            )}
            {grn.purchase_order_number && (
              <div>
                <p className="text-sm text-gray-600">PO Number</p>
                <p className="font-medium">{grn.purchase_order_number}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reference Notes */}
      {grn.reference_notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-blue-900 mb-1">Reference Notes</p>
          <p className="text-sm text-blue-800">{grn.reference_notes}</p>
        </div>
      )}

      {/* Line Items */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">
              Products ({lineItems.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  GST %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Line Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {item.products?.product_name || 'Unknown Product'}
                    </div>
                    <div className="text-xs text-gray-500">
                      SKU: {item.products?.sku || 'N/A'}
                      {item.products?.description && ` • ${item.products.description}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {item.quantity_received}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {formatCurrency(item.unit_cost)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700">
                    {item.gst_rate}%
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(grn.total_cost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST:</span>
                <span className="font-medium">{formatCurrency(grn.gst_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span>Total (inc GST):</span>
                <span className="text-green-600">{formatCurrency(grn.total_inc_gst)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-3 justify-end">
          {grn.status === 'Draft' && (
            <>
              <button
                onClick={handleDeleteGRN}
                disabled={deleting}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>

              <button
                onClick={handlePostGRN}
                disabled={posting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {posting ? 'Posting...' : 'Post GRN'}
              </button>
            </>
          )}

          {grn.status === 'Posted' && (
            <button
              onClick={handleCancelGRN}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel GRN
            </button>
          )}

          {grn.status === 'Cancelled' && (
            <p className="text-red-600 font-medium py-2">
              This GRN has been cancelled
            </p>
          )}
        </div>

        {grn.status === 'Draft' && (
          <p className="text-xs text-gray-500 mt-3 text-right">
            Post GRN to update stock levels. This action cannot be undone.
          </p>
        )}
      </div>
    </div>
  );
}
