'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Building2,
  Search,
  Plus,
  Star,
  Phone,
  Mail,
  MapPin,
  ChevronDown
} from 'lucide-react';

interface Vendor {
  id: string;
  vendor_code: string;
  vendor_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  city: string | null;
  payment_terms: string;
  current_balance: number;
  is_active: boolean;
  is_preferred: boolean;
}

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [preferredOnly, setPreferredOnly] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  useEffect(() => {
    fetchVendors();
  }, [searchTerm, statusFilter, preferredOnly, pagination.page]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('vendors')
        .select('*', { count: 'exact' });

      // Search filter
      if (searchTerm) {
        query = query.or(`vendor_code.ilike.%${searchTerm}%,vendor_name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%`);
      }

      // Status filter
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Preferred filter
      if (preferredOnly) {
        query = query.eq('is_preferred', true);
      }

      // Pagination
      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query
        .order('vendor_code', { ascending: true })
        .range(offset, offset + pagination.pageSize - 1);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setVendors(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      setError(err.message || 'Failed to load vendors');
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

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const activeVendors = vendors.filter(v => v.is_active).length;
  const preferredVendors = vendors.filter(v => v.is_preferred).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8 text-purple-600" />
            Vendor Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage suppliers and track purchase relationships
          </p>
        </div>
        <Link
          href="/inventory/vendors/new"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Vendor
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Vendors</p>
          <p className="text-2xl font-bold">{pagination.total}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active Vendors</p>
          <p className="text-2xl font-bold text-green-600">{activeVendors}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Preferred Suppliers</p>
          <p className="text-2xl font-bold text-purple-600">
            <Star className="w-5 h-5 inline-block mb-1" /> {preferredVendors}
          </p>
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
                placeholder="Code, name, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-1.5 text-sm border rounded appearance-none bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Vendors</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Preferred Filter */}
          <div className="lg:col-span-3 flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferredOnly}
                onChange={(e) => setPreferredOnly(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs font-medium text-gray-700">
                <Star className="w-3 h-3 inline-block mb-0.5" /> Preferred Only
              </span>
            </label>
          </div>

          {/* Clear Filters */}
          <div className="lg:col-span-3 flex items-end justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('active');
                setPreferredOnly(false);
              }}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
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
            Loading vendors...
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No vendors found</p>
            {(searchTerm || statusFilter !== 'active' || preferredOnly) && (
              <p className="text-sm mt-2">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-purple-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Vendor Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Contact Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Payment Terms
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      onClick={() => router.push(`/inventory/vendors/${vendor.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {vendor.vendor_code}
                          </span>
                          {vendor.is_preferred && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {vendor.vendor_name}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {vendor.contact_person || '-'}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div className="space-y-1">
                          {vendor.phone && (
                            <div className="flex items-center gap-1 text-xs">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {vendor.phone}
                            </div>
                          )}
                          {vendor.email && (
                            <div className="flex items-center gap-1 text-xs">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {vendor.email}
                            </div>
                          )}
                          {!vendor.phone && !vendor.email && '-'}
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {vendor.city ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {vendor.city}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {vendor.payment_terms}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        <span className={vendor.current_balance > 0 ? 'font-semibold text-orange-600' : 'text-gray-700'}>
                          {formatCurrency(vendor.current_balance)}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {vendor.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            Inactive
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
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> vendors
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
