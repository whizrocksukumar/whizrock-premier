'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  PackagePlus,
  Search,
  Plus,
  ArrowLeft,
  ChevronDown,
  Calendar
} from 'lucide-react';

interface GRN {
  id: string;
  grn_number: string;
  received_date: string;
  vendor_id: string;
  vendor_invoice_number: string | null;
  total_items: number;
  total_inc_gst: number;
  status: string;
  vendors: {
    vendor_code: string;
    vendor_name: string;
  } | null;
}

export default function GoodsReceiptPage() {
  const router = useRouter();
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  useEffect(() => {
    fetchGRNs();
  }, [searchTerm, statusFilter, pagination.page]);

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('goods_received_notes')
        .select('*, vendors(vendor_code, vendor_name)', { count: 'exact' });

      // Search filter
      if (searchTerm) {
        query = query.or(`grn_number.ilike.%${searchTerm}%,vendor_invoice_number.ilike.%${searchTerm}%`);
      }

      // Status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Pagination
      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query
        .order('received_date', { ascending: false })
        .order('grn_number', { ascending: false })
        .range(offset, offset + pagination.pageSize - 1);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setGrns(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (err: any) {
      console.error('Error fetching GRNs:', err);
      setError(err.message || 'Failed to load goods receipts');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      Draft: 'bg-gray-100 text-gray-800',
      Received: 'bg-blue-100 text-blue-800',
      Posted: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges] || badges.Draft}`}>
        {status}
      </span>
    );
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const draftCount = grns.filter(g => g.status === 'Draft').length;
  const postedThisMonth = grns.filter(g => {
    const date = new Date(g.received_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link
            href="/inventory"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inventory
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PackagePlus className="w-8 h-8 text-green-600" />
            Goods Received Notes (GRN)
          </h1>
          <p className="text-gray-600 mt-1">
            Record incoming stock from vendors
          </p>
        </div>
        <Link
          href="/inventory/receive/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New GRN
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total GRNs</p>
          <p className="text-2xl font-bold">{pagination.total}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Draft GRNs</p>
          <p className="text-2xl font-bold text-orange-600">{draftCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Received This Month</p>
          <p className="text-2xl font-bold text-green-600">{postedThisMonth}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="GRN number or invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded appearance-none bg-white focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Received">Received</option>
                <option value="Posted">Posted</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="lg:col-span-5 flex items-end justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="text-xs text-green-600 hover:text-green-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading GRNs...
          </div>
        ) : grns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <PackagePlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No goods receipts found</p>
            <p className="text-sm mt-2">Click "New GRN" to record incoming stock</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      GRN Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                      Total (inc GST)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {grns.map((grn) => (
                    <tr
                      key={grn.id}
                      onClick={() => router.push(`/inventory/receive/${grn.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">
                          {grn.grn_number}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(grn.received_date)}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-900">
                        {grn.vendors ? (
                          <div>
                            <div className="font-medium">{grn.vendors.vendor_name}</div>
                            <div className="text-xs text-gray-500">{grn.vendors.vendor_code}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {grn.vendor_invoice_number || '-'}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {grn.total_items}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(grn.total_inc_gst)}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(grn.status)}
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
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> GRNs
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
                  disabled={pagination.page >= totalPages}
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
  );
}
