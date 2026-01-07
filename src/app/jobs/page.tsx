'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Eye, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  certificate_issued_date?: string | null;
  certificate_number?: string | null;
}

type SortField = 'job_number' | 'quote_number' | 'customer_last_name' | 'site_address' | 'scheduled_date' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function JobsPage() {
  const router = useRouter();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [installerFilter, setInstallerFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [installers, setInstallers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchInstallers();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [searchTerm, statusFilter, installerFilter, dateFromFilter, dateToFilter, sortField, sortDirection, pagination.page]);

  const fetchInstallers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, first_name, last_name')
        .eq('role', 'Installer')
        .eq('status', 'Active')
        .order('first_name');

      if (error) throw error;

      setInstallers((data || []).map(tm => ({
        id: tm.id,
        name: `${tm.first_name} ${tm.last_name}`
      })));
    } catch (err: any) {
      console.error('Error fetching installers:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`job_number.ilike.%${searchTerm}%,customer_first_name.ilike.%${searchTerm}%,customer_last_name.ilike.%${searchTerm}%,customer_company.ilike.%${searchTerm}%,site_address.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (installerFilter !== 'all') {
        query = query.eq('crew_lead_id', installerFilter);
      }

      if (dateFromFilter) {
        query = query.gte('scheduled_date', dateFromFilter);
      }
      if (dateToFilter) {
        query = query.lte('scheduled_date', dateToFilter);
      }

      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query.range(offset, offset + pagination.pageSize - 1);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const quoteIds = [...new Set((data || []).map((job: any) => job.quote_id).filter(Boolean))];
      const quoteMap: Record<string, any> = {};
      if (quoteIds.length > 0) {
        const { data: quotesData, error: quotesError } = await supabase
          .from('quotes')
          .select('id, quote_number, client_id, site_id')
          .in('id', quoteIds);

        if (quotesError) throw quotesError;
        (quotesData || []).forEach((quote: any) => {
          quoteMap[quote.id] = quote;
        });
      }

      const clientIds = [...new Set(Object.values(quoteMap).map((quote: any) => quote.client_id).filter(Boolean))];
      const clientMap: Record<string, any> = {};
      if (clientIds.length > 0) {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, first_name, last_name, company_id')
          .in('id', clientIds);

        if (clientsError) throw clientsError;
        (clientsData || []).forEach((client: any) => {
          clientMap[client.id] = client;
        });
      }

      const companyIds = [...new Set(Object.values(clientMap).map((client: any) => client.company_id).filter(Boolean))];
      const companyMap: Record<string, any> = {};
      if (companyIds.length > 0) {
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, company_name')
          .in('id', companyIds);

        if (companiesError) throw companiesError;
        (companiesData || []).forEach((company: any) => {
          companyMap[company.id] = company.company_name;
        });
      }

      const siteIds = [...new Set(Object.values(quoteMap).map((quote: any) => quote.site_id).filter(Boolean))];
      const siteMap: Record<string, any> = {};
      if (siteIds.length > 0) {
        const { data: sitesData, error: sitesError } = await supabase
          .from('sites')
          .select('id, address_line_1, address_line_2, city, postcode')
          .in('id', siteIds);

        if (sitesError) throw sitesError;
        (sitesData || []).forEach((site: any) => {
          siteMap[site.id] = site;
        });
      }

      const buildSiteAddress = (site: any) => {
        if (!site) return '';
        const parts = [site.address_line_1, site.address_line_2, site.city, site.postcode].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '';
      };

      const jobsWithDetails = await Promise.all((data || []).map(async (job: any) => {
        let crewLeadName = '';
        if (job.crew_lead_id) {
          const { data: installer } = await supabase
            .from('team_members')
            .select('first_name, last_name')
            .eq('id', job.crew_lead_id)
            .single();

          if (installer) {
            crewLeadName = `${installer.first_name} ${installer.last_name}`;
          }
        }

        // Fetch certificate data
        let certificateData = null;
        const { data: certificate } = await supabase
          .from('job_completion_certificates')
          .select('certificate_number, issued_date')
          .eq('job_id', job.id)
          .single();

        if (certificate) {
          certificateData = certificate;
        }

        const quote = job.quote_id ? quoteMap[job.quote_id] : null;
        const client = quote?.client_id ? clientMap[quote.client_id] : null;
        const companyName = client?.company_id ? companyMap[client.company_id] : '';
        const site = quote?.site_id ? siteMap[quote.site_id] : null;
        const derivedAddress = buildSiteAddress(site);

        const actual_cost = job.actual_amount || 0;
        const margin_percent = job.quoted_amount > 0
          ? ((job.quoted_amount - actual_cost) / job.quoted_amount * 100)
          : 0;

        return {
          id: job.id,
          job_number: job.job_number,
          quote_id: job.quote_id,
          quote_number: quote?.quote_number || '',
          customer_first_name: job.customer_first_name || client?.first_name || '',
          customer_last_name: job.customer_last_name || client?.last_name || '',
          customer_company: job.customer_company || companyName || '',
          site_address: job.site_address || derivedAddress || '',
          city: job.city || site?.city || '',
          scheduled_date: job.scheduled_date || '',
          status: job.status,
          crew_lead_id: job.crew_lead_id,
          crew_lead_name: crewLeadName,
          quoted_amount: job.quoted_amount || 0,
          actual_cost: actual_cost,
          margin_percent: margin_percent,
          created_at: job.created_at,
          certificate_issued_date: certificateData?.issued_date || null,
          certificate_number: certificateData?.certificate_number || null
        };
      }));

      setJobs(jobsWithDetails);
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

  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-blue-200">-</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '^' : 'v'}</span>;
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ===== PAGE HEADER ===== */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0066CC]">Jobs</h1>
            <p className="text-sm text-gray-500 mt-1">Manage installation jobs and schedules</p>
          </div>
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
        <div className="flex items-center justify-between gap-4">
          <div className="w-64">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/jobs/new"
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] hover:shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Schedule a New Job
            </Link>
          </div>
        </div>
      </div>

      {/* ===== FILTER ROW ===== */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Installer:</span>
            <select
              value={installerFilter}
              onChange={(e) => setInstallerFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            >
              <option value="all">All Installers</option>
              {installers.map(installer => (
                <option key={installer.id} value={installer.id}>{installer.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Date From:</span>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Date To:</span>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setInstallerFilter('all');
              setDateFromFilter('');
              setDateToFilter('');
            }}
            className="ml-auto text-xs text-[#0066CC] hover:underline font-medium"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-600 mb-4">
          Showing {jobs.length} of {pagination.total} jobs
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
            <span className="ml-3 text-gray-600">Loading jobs...</span>
          </div>
        ) : (
          <>
            <div className="bg-white rounded shadow overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0066CC] text-white">
                    <th className="text-center px-4 py-3 text-xs font-semibold whitespace-nowrap">
                      Action
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('job_number')}
                    >
                      Job No. <SortArrow field="job_number" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('quote_number')}
                    >
                      Quote No. <SortArrow field="quote_number" />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">
                      Company Name
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('customer_last_name')}
                    >
                      Contact Name <SortArrow field="customer_last_name" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('site_address')}
                    >
                      Site Address <SortArrow field="site_address" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('scheduled_date')}
                    >
                      Scheduled Date <SortArrow field="scheduled_date" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('status')}
                    >
                      Status <SortArrow field="status" />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">
                      Installer
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">
                      Certificate
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold whitespace-nowrap">
                      Quoted Amount
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold whitespace-nowrap">
                      Actual Cost
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold whitespace-nowrap">
                      Margin %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                        No jobs found
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job, index) => (
                      <tr
                        key={job.id}
                        className={`hover:bg-blue-50 transition-colors cursor-pointer ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                        onClick={() => router.push(`/jobs/${job.id}`)}
                      >
                        <td className="text-center px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/jobs/${job.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/jobs/${job.id}?edit=true`);
                              }}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Link
                            href={`/jobs/${job.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {job.job_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Link
                            href={`/quotes/${job.quote_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#0066CC] hover:underline"
                          >
                            {job.quote_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {job.customer_company || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {job.customer_first_name} {job.customer_last_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="text-gray-900 max-w-xs">{job.site_address}</div>
                          {job.city && <div className="text-gray-500 text-xs mt-0.5">{job.city}</div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {job.crew_lead_name || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {job.certificate_issued_date ? (
                            <div className="flex flex-col">
                              <span className="text-green-600 font-medium">Issued</span>
                              <span className="text-xs text-gray-500">
                                {new Date(job.certificate_issued_date).toLocaleDateString('en-NZ', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-medium">
                          ${job.quoted_amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-medium">
                          {job.actual_cost > 0
                            ? `$${job.actual_cost.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                          {job.actual_cost > 0 ? (
                            <span className={job.margin_percent >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {job.margin_percent.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
                    .filter(
                      page =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - pagination.page) <= 2
                    )
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
