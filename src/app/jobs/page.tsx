'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Types
interface Job {
  id: string;
  job_number: string;
  quote_id: string;
  quote_number: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_company: string;
  site_address: string;
  city: string;
  scheduled_date: string;
  status: string;
  crew_lead_id: string;
  crew_lead_name: string;
  quoted_amount: number;
  actual_cost: number;
  margin_percent: number;
  created_at: string;
}

type SortField = 'job_number' | 'quote_number' | 'customer_last_name' | 'site_address' | 'scheduled_date' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function JobsPage() {
  const router = useRouter();
  
  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [crewLeadFilter, setCrewLeadFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [crewLeads, setCrewLeads] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch crew leads for filter dropdown
  useEffect(() => {
    fetchCrewLeads();
  }, []);

  // Fetch jobs when filters change
  useEffect(() => {
    fetchJobs();
  }, [searchTerm, statusFilter, crewLeadFilter, dateFromFilter, dateToFilter, sortField, sortDirection, pagination.page]);

  const fetchCrewLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, first_name, last_name')
        .eq('role', 'Installer')
        .eq('status', 'Active')
        .order('first_name');

      if (error) throw error;

      setCrewLeads((data || []).map(tm => ({
        id: tm.id,
        name: `${tm.first_name} ${tm.last_name}`
      })));
    } catch (err: any) {
      console.error('Error fetching crew leads:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('jobs')
        .select(`
          *,
          quotes!inner(quote_number)
        `, { count: 'exact' });

      // Search filter (job number, quote number, customer, address)
      if (searchTerm) {
        query = query.or(`job_number.ilike.%${searchTerm}%,customer_first_name.ilike.%${searchTerm}%,customer_last_name.ilike.%${searchTerm}%,customer_company.ilike.%${searchTerm}%,site_address.ilike.%${searchTerm}%`);
      }

      // Status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Crew lead filter
      if (crewLeadFilter !== 'all') {
        query = query.eq('crew_lead_id', crewLeadFilter);
      }

      // Date range filter
      if (dateFromFilter) {
        query = query.gte('scheduled_date', dateFromFilter);
      }
      if (dateToFilter) {
        query = query.lte('scheduled_date', dateToFilter);
      }

      // Sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Pagination
      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query.range(offset, offset + pagination.pageSize - 1);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Fetch crew lead names for each job
      const jobsWithCrewLeads = await Promise.all((data || []).map(async (job: any) => {
        let crewLeadName = '';
        if (job.crew_lead_id) {
          const { data: crewLead } = await supabase
            .from('team_members')
            .select('first_name, last_name')
            .eq('id', job.crew_lead_id)
            .single();
          
          if (crewLead) {
            crewLeadName = `${crewLead.first_name} ${crewLead.last_name}`;
          }
        }

        // Calculate actual cost and margin (would normally call calculate_job_costing function)
        const actual_cost = job.actual_amount || 0;
        const margin_percent = job.quoted_amount > 0 
          ? ((job.quoted_amount - actual_cost) / job.quoted_amount * 100)
          : 0;

        return {
          id: job.id,
          job_number: job.job_number,
          quote_id: job.quote_id,
          quote_number: job.quotes?.quote_number || '',
          customer_first_name: job.customer_first_name || '',
          customer_last_name: job.customer_last_name || '',
          customer_company: job.customer_company || '',
          site_address: job.site_address || '',
          city: job.city || '',
          scheduled_date: job.scheduled_date || '',
          status: job.status,
          crew_lead_id: job.crew_lead_id,
          crew_lead_name: crewLeadName,
          quoted_amount: job.quoted_amount || 0,
          actual_cost: actual_cost,
          margin_percent: margin_percent,
          created_at: job.created_at
        };
      }));

      setJobs(jobsWithCrewLeads);
      setPagination(prev => ({ ...prev, total: count || 0 }));

    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-gray-600 mt-1">Manage installation jobs and schedules</p>
        </div>
        <Link
          href="/jobs/create-from-quote"
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
        >
          Create Job from Quote
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-3">
          {/* Search */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Job #, Quote #, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Crew Lead Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Crew Lead</label>
            <select
              value={crewLeadFilter}
              onChange={(e) => setCrewLeadFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Crew Leads</option>
              {crewLeads.map(lead => (
                <option key={lead.id} value={lead.id}>{lead.name}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setCrewLeadFilter('all');
              setDateFromFilter('');
              setDateToFilter('');
            }}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No jobs found. {searchTerm || statusFilter !== 'all' || crewLeadFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first job from a quote.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#0066CC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-20">
                      Action
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#0052a3] w-32"
                      onClick={() => handleSort('job_number')}
                    >
                      Job No. {sortField === 'job_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#0052a3] w-32"
                      onClick={() => handleSort('quote_number')}
                    >
                      Quote No. {sortField === 'quote_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-40">
                      Company Name
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#0052a3] w-40"
                      onClick={() => handleSort('customer_last_name')}
                    >
                      Contact Name {sortField === 'customer_last_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#0052a3] w-56"
                      onClick={() => handleSort('site_address')}
                    >
                      Site Address {sortField === 'site_address' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#0052a3] w-32"
                      onClick={() => handleSort('scheduled_date')}
                    >
                      Scheduled Date {sortField === 'scheduled_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#0052a3] w-28"
                      onClick={() => handleSort('status')}
                    >
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">
                      Crew Lead
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-32">
                      Quoted Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-32">
                      Actual Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-24">
                      Margin %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr 
                      key={job.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/jobs/${job.id}`);
                          }}
                          className="text-orange-600 hover:text-orange-800 font-medium text-sm"
                        >
                          View
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900 text-sm">
                        {job.job_number}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/quotes/${job.quote_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {job.quote_number}
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.customer_company || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.customer_first_name} {job.customer_last_name}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-gray-900 max-w-xs">{job.site_address}</div>
                        {job.city && <div className="text-gray-500 text-xs mt-0.5">{job.city}</div>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.crew_lead_name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        ${job.quoted_amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {job.actual_cost > 0 
                          ? `$${job.actual_cost.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        {job.actual_cost > 0 ? (
                          <span className={job.margin_percent >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {job.margin_percent.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.pageSize) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> jobs
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || 
                               page === totalPages || 
                               (page >= pagination.page - 1 && page <= pagination.page + 1);
                      })
                      .map((page, idx, arr) => {
                        if (idx > 0 && page !== arr[idx - 1] + 1) {
                          return (
                            <>
                              <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pagination.page
                                    ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.page
                                ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
