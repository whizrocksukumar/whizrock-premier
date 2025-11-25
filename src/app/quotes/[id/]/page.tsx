'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Types
interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  client_name: string;
  company_name: string;
  site_address: string;
  region: string;
  job_number: string;
  scheduled_job_date: string;
  quote_source: string;
  job_type: string;
  status: string;
  created_date: string;
  follow_up_date: string;
  sales_rep: string;
  discount_applied: boolean;
  total_ex_gst: number;
  total_inc_gst: number;
  margin: number;
}

type SortField = 'quote_number' | 'client_name' | 'site_address' | 'region' | 'job_number' | 'scheduled_job_date' | 'quote_source' | 'job_type' | 'status' | 'created_date' | 'follow_up_date' | 'sales_rep' | 'total_ex_gst' | 'margin';
type SortDirection = 'asc' | 'desc';

export default function QuotesPage() {
  const router = useRouter();
  
  // State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });

  // Fetch quotes on mount and when filters change
  useEffect(() => {
    fetchQuotes();
  }, [searchTerm, statusFilter, sortField, sortDirection, pagination.page]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('quotes')
        .select(`
          id, quote_number, client_id, status, created_date, valid_until,
          total_ex_gst, total_inc_gst, site_address, region, job_type,
          follow_up_date, scheduled_job_date, job_number, discount_applied, margin,
          clients(first_name, last_name, companies(company_name)),
          sales_reps(name),
          app_types(name)
        `, { count: 'exact' });

      // Search filter
      if (searchTerm) {
        query = query.or(`quote_number.ilike.%${searchTerm}%,site_address.ilike.%${searchTerm}%`);
      }

      // Status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Pagination
      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query.range(offset, offset + pagination.pageSize - 1);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const transformedData = (data || []).map((quote: any) => ({
        id: quote.id,
        quote_number: quote.quote_number,
        client_id: quote.client_id,
        client_name: quote.clients 
          ? `${quote.clients.first_name || ''} ${quote.clients.last_name || ''}`.trim() 
          : 'Unknown',
        company_name: quote.clients?.companies?.company_name || '',
        site_address: quote.site_address || '',
        region: quote.region || '',
        job_number: quote.job_number || '',
        scheduled_job_date: quote.scheduled_job_date || '',
        quote_source: quote.app_types?.name || '',
        job_type: quote.job_type || '',
        status: quote.status || 'Draft',
        created_date: quote.created_date,
        follow_up_date: quote.follow_up_date || '',
        sales_rep: quote.sales_reps?.name || '',
        discount_applied: quote.discount_applied || false,
        total_ex_gst: quote.total_ex_gst || 0,
        total_inc_gst: quote.total_inc_gst || 0,
        margin: quote.margin || 0,
      }));

      setQuotes(transformedData);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort indicator arrow
  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-blue-200">⇅</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'bg-green-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      case 'draft': return 'bg-orange-500 text-white';
      case 'sent': return 'bg-blue-500 text-white';
      case 'expired': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ===== PAGE HEADER ===== */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0066CC]">
              Quotes
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your quotes and proposals</p>
          </div>
          {/* User Icon and Email - No "User" label */}
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

      {/* ===== TOOLBAR ROW ===== */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Search and Status Filter */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="w-64">
              <input
                type="text"
                placeholder="Search quotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-sm"
              />
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              >
                <option value="all">All</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
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
            <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Print
            </button>
            <Link
              href="/quotes/new"
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors"
            >
              + New Quote
            </Link>
          </div>
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-3 text-sm text-gray-600">
          Showing {quotes.length} of {pagination.total} quotes
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
            <span className="ml-3 text-gray-600">Loading quotes...</span>
          </div>
        ) : (
          <>
            {/* Table with horizontal scroll */}
            <div className="bg-white rounded shadow overflow-x-auto">
              <table className="w-full min-w-[1600px]">
                {/* BLUE HEADER ROW - REORDERED COLUMNS */}
                <thead>
                  <tr className="bg-[#0066CC] text-white">
                    <th className="text-center px-2 py-3 text-xs font-semibold whitespace-nowrap">
                      Action
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('quote_number')}
                    >
                      Quote No <SortArrow field="quote_number" />
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('client_name')}
                    >
                      Customer Name <SortArrow field="client_name" />
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('site_address')}
                    >
                      Site Address <SortArrow field="site_address" />
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('region')}
                    >
                      Region <SortArrow field="region" />
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('job_number')}
                    >
                      Job # <SortArrow field="job_number" />
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('scheduled_job_date')}
                    >
                      Scheduled Date <SortArrow field="scheduled_job_date" />
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('quote_source')}
                    >
                      Quote Source <SortArrow field="quote_source" />
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('job_type')}
                    >
                      Job Type <SortArrow field="job_type" />
                    </th>
                    <th 
                      className="text-center px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('status')}
                    >
                      Status <SortArrow field="status" />
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('created_date')}
                    >
                      Quote Date <SortArrow field="created_date" />
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('follow_up_date')}
                    >
                      Follow Up <SortArrow field="follow_up_date" />
                    </th>
                    <th 
                      className="text-left px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('sales_rep')}
                    >
                      Sales Rep <SortArrow field="sales_rep" />
                    </th>
                    <th className="text-center px-2 py-3 text-xs font-semibold whitespace-nowrap">
                      Discount
                    </th>
                    <th 
                      className="text-right px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('total_ex_gst')}
                    >
                      Total (Ex GST) <SortArrow field="total_ex_gst" />
                    </th>
                    <th 
                      className="text-right px-2 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('margin')}
                    >
                      Margin % <SortArrow field="margin" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quotes.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
                        No quotes found
                      </td>
                    </tr>
                  ) : (
                    quotes.map((quote, index) => (
                      <tr 
                        key={quote.id} 
                        className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        {/* Action buttons */}
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Link 
                              href={`/quotes/${quote.id}`}
                              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                            >
                              View
                            </Link>
                            <Link 
                              href={`/quotes/${quote.id}/edit`}
                              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-sm">
                          <Link 
                            href={`/quotes/${quote.id}`}
                            className="text-[#0066CC] hover:underline font-medium"
                          >
                            {quote.quote_number}
                          </Link>
                        </td>
                        <td className="px-2 py-2 text-sm">
                          <Link 
                            href={`/customers/${quote.client_id}`}
                            className="text-[#0066CC] hover:underline"
                          >
                            {quote.client_name}
                          </Link>
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700 max-w-[200px] truncate" title={quote.site_address}>
                          {quote.site_address}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700">{quote.region}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">
                          {quote.job_number && (
                            <Link 
                              href={`/jobs/${quote.job_number}`}
                              className="text-[#0066CC] hover:underline"
                            >
                              {quote.job_number}
                            </Link>
                          )}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700">{formatDate(quote.scheduled_job_date)}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">{quote.quote_source}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">{quote.job_type}</td>
                        <td className="px-2 py-2 text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(quote.status)}`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700">{formatDate(quote.created_date)}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">{formatDate(quote.follow_up_date)}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">{quote.sales_rep}</td>
                        <td className="px-2 py-2 text-center text-sm">
                          {quote.discount_applied ? '✓' : '-'}
                        </td>
                        <td className="px-2 py-2 text-right text-sm font-medium text-gray-900">
                          ${quote.total_ex_gst.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right text-sm text-gray-700">
                          {quote.margin.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ===== PAGINATION AT BOTTOM ===== */}
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
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - pagination.page) <= 2)
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
  );
}