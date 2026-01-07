'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ClientOverviewCard from '@/components/client/ClientOverviewCard';
import { fetchClientWithRelations, ClientWithRelations } from '@/lib/utils/clients-helpers';
import { ArrowLeft, Edit, FileText, X, Save, CheckCircle } from 'lucide-react';

interface JobDetail {
  id: string;
  job_number: string;
  quote_id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company: string;
  site_address: string;
  city: string;
  postcode: string;
  status: string;
  scheduled_date: string;
  start_date: string;
  completion_date: string;
  crew_lead_id: string;
  crew_members: any;
  quoted_amount: number;
  actual_amount: number;
  notes: string;
  assessment_id: string;
  opportunity_id: string;
  warranty_period_months: number;
  special_instructions: string;
  created_at: string;
  updated_at: string;
}

interface LineItem {
  id: string;
  product_code: string;
  description: string;
  quantity_quoted: number;
  quantity_actual: number;
  unit: string;
  unit_cost: number;
  line_cost: number;
}

interface LabourItem {
  id: string;
  description: string;
  area_sqm: number;
  quoted_rate: number;
  quoted_hours: number;
  quoted_amount: number;
  actual_hours: number;
  actual_rate: number;
  actual_amount: number;
}

interface StatusHistory {
  id: string;
  old_status: string;
  new_status: string;
  changed_at: string;
}

interface Comment {
  id: string;
  comment_text: string;
  commented_at: string;
  is_internal: boolean;
}

type TabName = 'overview' | 'materials' | 'labour' | 'stock' | 'history' | 'comments';

const formatDate = (dateString: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString('en-NZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '—';

const formatDateDDMMYYYY = (dateString: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString('en-NZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '—';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD'
  }).format(value || 0);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'In Progress':
      return 'bg-orange-100 text-orange-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'Draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = params.id;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [clientOverview, setClientOverview] = useState<ClientWithRelations | null>(null);
  const [quoteNumber, setQuoteNumber] = useState('');
  const [derivedSiteAddress, setDerivedSiteAddress] = useState('');
  const [crewLeadName, setCrewLeadName] = useState('');
  const [installers, setInstallers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [labourItems, setLabourItems] = useState<LabourItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
  const [originalStatus, setOriginalStatus] = useState<string>('');

  useEffect(() => {
    if (!jobId) return;
    fetchJobData();
    fetchInstallers();
  }, [jobId]);

  const fetchInstallers = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('id, first_name, last_name')
      .eq('role', 'Installer')
      .eq('status', 'active')
      .order('first_name');

    if (data) setInstallers(data);
  };

  const fetchJobData = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !jobData) throw jobError;
      setJob(jobData);
      setOriginalStatus(jobData.status); // Track original status for history

      // Fetch quote, client, and site details
      if (jobData.quote_id) {
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .select('id, quote_number, client_id, site_id')
          .eq('id', jobData.quote_id)
          .single();

        if (quoteError) throw quoteError;

        if (quoteData) {
          setQuoteNumber(quoteData.quote_number || '');

          if (quoteData.client_id) {
            const clientData = await fetchClientWithRelations(quoteData.client_id);
            setClientOverview(clientData);
          } else {
            setClientOverview(null);
          }

          if (quoteData.site_id) {
            const { data: siteData, error: siteError } = await supabase
              .from('sites')
              .select('address_line_1, address_line_2, city, postcode')
              .eq('id', quoteData.site_id)
              .single();

            if (siteError) throw siteError;
            if (siteData) {
              const addressParts = [
                siteData.address_line_1,
                siteData.address_line_2,
                siteData.city,
                siteData.postcode
              ].filter(Boolean);
              setDerivedSiteAddress(addressParts.join(', '));
            } else {
              setDerivedSiteAddress('');
            }
          } else {
            setDerivedSiteAddress('');
          }
        }
      } else {
        setQuoteNumber('');
        setClientOverview(null);
        setDerivedSiteAddress('');
      }

      // Fetch crew lead name
      if (jobData.crew_lead_id) {
        const { data: crewData } = await supabase
          .from('team_members')
          .select('first_name, last_name')
          .eq('id', jobData.crew_lead_id)
          .single();
        if (crewData) {
          setCrewLeadName(`${crewData.first_name} ${crewData.last_name}`);
        }
      }

      // Fetch line items
      const { data: itemsData } = await supabase
        .from('job_line_items')
        .select('*')
        .eq('job_id', jobId)
        .order('sort_order');
      setLineItems(itemsData || []);

      // Fetch labour items
      const { data: labourData } = await supabase
        .from('job_labour_items')
        .select('*')
        .eq('job_id', jobId)
        .order('sort_order');
      setLabourItems(labourData || []);

      // Fetch status history
      const { data: historyData } = await supabase
        .from('job_status_history')
        .select('*')
        .eq('job_id', jobId)
        .order('changed_at', { ascending: false });
      setStatusHistory(historyData || []);

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('job_comments')
        .select('*')
        .eq('job_id', jobId)
        .is('parent_comment_id', null)
        .order('commented_at', { ascending: false });
      setComments(commentsData || []);

    } catch (err: any) {
      console.error('Error fetching job:', err);
      setError(err.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm('Mark this job as complete and issue certificate to customer?')) {
      return;
    }

    const completionNotes = prompt('Enter completion notes (optional):');

    setCompleting(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionDate: new Date().toISOString(),
          completionNotes: completionNotes || '',
        }),
      });

      const result = await response.json();

      if (result.ok) {
        alert(`✓ Job completed successfully!\n\nCertificate Number: ${result.certificateNumber}\n✉ Certificate has been emailed to customer.`);
        fetchJobData(); // Refresh
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to complete job');
      console.error(error);
    }
    setCompleting(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Loading job...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8">
        <Link href="/jobs" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Job not found'}
        </div>
      </div>
    );
  }

  const customerFirstName = job.customer_first_name || clientOverview?.first_name || '';
  const customerLastName = job.customer_last_name || clientOverview?.last_name || '';
  const customerName = `${customerFirstName} ${customerLastName}`.trim() || '-';
  const customerEmail = job.customer_email || clientOverview?.email || '-';
  const customerPhone = job.customer_phone || clientOverview?.phone || '-';
  const customerCompany = job.customer_company || clientOverview?.company_name || '';
  const resolvedSiteAddress = job.site_address || derivedSiteAddress || clientOverview?.address || '';
  const displayCompany = customerCompany || '-';
  const displayAddress = resolvedSiteAddress || '-';
  const clientOverviewForJob = clientOverview
    ? { ...clientOverview, address: resolvedSiteAddress || clientOverview.address }
    : null;

  const customerCard = clientOverviewForJob ? (
    <ClientOverviewCard client={clientOverviewForJob} />
  ) : (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-base font-semibold mb-4">Customer Details</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Company</span>
          <span className="font-medium">{displayCompany}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Name</span>
          <span className="font-medium">{customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Email</span>
          <span className="font-medium text-xs">{customerEmail}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Phone</span>
          <span className="font-medium">{customerPhone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Address</span>
          <span className="font-medium text-right text-xs">{displayAddress}</span>
        </div>
      </div>
    </div>
  );

  // Costing calculations
  const materialsQuoted = lineItems?.reduce((s, item) => s + (item.line_cost || 0), 0) || 0;
  const materialsActual =
    lineItems?.reduce(
      (s, item) => s + ((item.quantity_actual || item.quantity_quoted) * item.unit_cost || 0),
      0
    ) || 0;
  const labourQuoted = labourItems?.reduce((s, item) => s + (item.quoted_amount || 0), 0) || 0;
  const labourActual = labourItems?.reduce((s, item) => s + (item.actual_amount || 0), 0) || 0;

  const totalQuoted = materialsQuoted + labourQuoted;
  const totalActual = materialsActual + labourActual;
  const variance = totalActual - totalQuoted;
  const variancePercent = totalQuoted > 0 ? (variance / totalQuoted) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b px-6 py-4">
        <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>

        <h1 className="text-2xl font-bold">{job.job_number}</h1>
        <p className="text-sm text-gray-600">{customerName} • {customerEmail}</p>
      </div>

      {/* STATUS BAR */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(job.status)}`}>
            {job.status}
          </span>

          {quoteNumber && (
            <Link href={`/quotes/${job.quote_id}`} className="text-sm text-blue-600 hover:text-blue-800">
              • Quote {quoteNumber}
            </Link>
          )}
        </div>

        <div className="flex gap-2">
          {/* Show Certificate button only for Completed jobs */}
          {job.status === 'Completed' && (
            <Link
              href={`/jobs/${job.id}/certificate`}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
            >
              <FileText className="w-4 h-4" /> Certificate
            </Link>
          )}

          {/* Toggle Edit Mode */}
          {isEditMode ? (
            <>
              <button
                onClick={() => setIsEditMode(false)}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Update job details in database
                    const { error: updateError } = await supabase
                      .from('jobs')
                      .update({
                        status: job.status,
                        scheduled_date: job.scheduled_date,
                        crew_lead_id: job.crew_lead_id,
                        // Update completion_date when status is changed to Completed
                        completion_date: job.status === 'Completed' && !job.completion_date
                          ? new Date().toISOString()
                          : job.completion_date,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', jobId);

                    if (updateError) {
                      console.error('Error updating job:', updateError);
                      setError('Failed to save changes');
                      return;
                    }

                    // Record status change in history only if status actually changed
                    if (originalStatus !== job.status) {
                      await supabase.from('job_status_history').insert({
                        job_id: jobId,
                        old_status: originalStatus,
                        new_status: job.status,
                        changed_at: new Date().toISOString()
                      });
                    }

                    // Refresh job data
                    await fetchJobData();
                    setIsEditMode(false);
                    setError('');
                  } catch (err) {
                    console.error('Error saving:', err);
                    setError('Failed to save changes');
                  }
                }}
                className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              {job && job.status !== 'Completed' && job.status !== 'Cancelled' && (
                <button
                  onClick={handleMarkComplete}
                  disabled={completing}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  {completing ? 'Completing...' : 'Mark Complete & Issue Certificate'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-6 space-y-6">

        {/* -------- TABS -------- */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          
          {/* TAB NAVIGATION */}
          <div className="border-b border-gray-200 flex px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-[#0066CC] text-white bg-[#0066CC]'
                  : 'border-transparent text-gray-600 bg-gray-50 hover:text-[#0066CC]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'materials'
                  ? 'border-[#0066CC] text-white bg-[#0066CC]'
                  : 'border-transparent text-gray-600 bg-gray-50 hover:text-[#0066CC]'
              }`}
            >
              Products & Labour
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'stock'
                  ? 'border-[#0066CC] text-white bg-[#0066CC]'
                  : 'border-transparent text-gray-600 bg-gray-50 hover:text-[#0066CC]'
              }`}
            >
              Stock Allocation
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-[#0066CC] text-white bg-[#0066CC]'
                  : 'border-transparent text-gray-600 bg-gray-50 hover:text-[#0066CC]'
              }`}
            >
              Status History
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'comments'
                  ? 'border-[#0066CC] text-white bg-[#0066CC]'
                  : 'border-transparent text-gray-600 bg-gray-50 hover:text-[#0066CC]'
              }`}
            >
              Notes & Comments
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="p-6">

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Customer Card */}
                  <div>
                    {customerCard}
                  </div>

                  {/* Job Information Card */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-base font-semibold mb-4">Job Information</h2>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status</span>
                        {isEditMode ? (
                          <select
                            value={job.status}
                            onChange={(e) => setJob({ ...job, status: e.target.value })}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(job.status)}`}>
                            {job.status}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Scheduled</span>
                        {isEditMode ? (
                          <input
                            type="date"
                            value={job.scheduled_date || ''}
                            onChange={(e) => setJob({ ...job, scheduled_date: e.target.value })}
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        ) : (
                          <span className="font-medium">{formatDate(job.scheduled_date)}</span>
                        )}
                      </div>

                      {job.start_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Start</span>
                          <span className="font-medium">{formatDate(job.start_date)}</span>
                        </div>
                      )}

                      {job.completion_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Completed</span>
                          <span className="font-medium">{formatDate(job.completion_date)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Installer</span>
                        {isEditMode ? (
                          <select
                            value={job.crew_lead_id || ''}
                            onChange={(e) => {
                              const newCrewLeadId = e.target.value;
                              setJob({ ...job, crew_lead_id: newCrewLeadId });
                              // Update crew lead name display
                              const selected = installers.find(i => i.id === newCrewLeadId);
                              if (selected) {
                                setCrewLeadName(`${selected.first_name} ${selected.last_name}`);
                              }
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="">-- Select Installer --</option>
                            {installers.map((installer) => (
                              <option key={installer.id} value={installer.id}>
                                {installer.first_name} {installer.last_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-medium">{crewLeadName || '-'}</span>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Site Address</span>
                        <span className="font-medium text-right text-xs">{displayAddress}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Warranty</span>
                        <span className="font-medium">
                          {job.warranty_period_months ? `${job.warranty_period_months} months` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Card */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-base font-semibold mb-4">Quick Stats</h2>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Quoted</span>
                        <span className="font-bold">{formatCurrency(totalQuoted)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Actual</span>
                        <span className="font-bold">{formatCurrency(totalActual)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Variance</span>
                        <span className={`font-bold ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(variance))}
                          <span className="text-xs ml-1">({variancePercent.toFixed(1)}%)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-base font-semibold mb-3">Job Costing Analysis</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500">Materials Quoted</p>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(materialsQuoted)}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500">Materials Actual</p>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(materialsActual)}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500">Labour Quoted</p>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(labourQuoted)}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500">Labour Actual</p>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(labourActual)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* PRODUCTS & LABOUR TAB */}
            {activeTab === 'materials' && (
              <div className="space-y-6">
                {/* Products Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 px-6">Products</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty Quoted</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty Actual</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lineItems?.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                              No products added yet
                            </td>
                          </tr>
                        ) : (
                          lineItems?.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">{item.product_code || '—'}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity_quoted}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity_actual || '—'}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{item.unit || '—'}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(item.unit_cost)}</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.line_cost)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Labour Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 px-6">Labour</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Area (sqm)</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quoted Hours</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual Hours</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quoted Amount</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {labourItems?.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                              No labour items added yet
                            </td>
                          </tr>
                        ) : (
                          labourItems?.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.area_sqm || '—'}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quoted_hours || '—'}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.actual_hours || '—'}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                {formatCurrency(item.actual_rate || item.quoted_rate)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(item.quoted_amount)}</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                {item.actual_amount ? formatCurrency(item.actual_amount) : '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* STOCK ALLOCATION TAB */}
            {activeTab === 'stock' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Stock Allocation</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage stock reservations and allocations for this job
                    </p>
                  </div>
                  <Link
                    href={`/jobs/${jobId}/stock/manage`}
                    className="bg-[#0066CC] text-white px-4 py-2 rounded-lg hover:bg-[#0052a3] flex items-center gap-2"
                  >
                    Manage Stock
                  </Link>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900">About Stock Allocation</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Stock allocation reserves materials for this job. When the job is scheduled, stock moves to "Reserved" status.
                        On completion, record actual usage and return unused stock.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quoted</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allocated</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Used</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Returned</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lineItems?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            No products in this job. Add products first to allocate stock.
                          </td>
                        </tr>
                      ) : (
                        lineItems?.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.description}</div>
                                <div className="text-xs text-gray-500">{item.product_code}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity_quoted}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                              <span className="text-blue-600 font-medium">0</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">-</td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">-</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.unit}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                Pending
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Stock Allocation Workflow</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                      <div>
                        <span className="font-medium">Pending:</span> Job created, no stock reserved yet
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                      <div>
                        <span className="font-medium">Reserved:</span> Job scheduled, stock allocated and reserved
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                      <div>
                        <span className="font-medium">Issued:</span> Job in progress, stock issued to crew
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-200 text-green-700 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                      <div>
                        <span className="font-medium">Completed:</span> Job done, actual usage recorded, unused stock returned
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STATUS HISTORY TAB */}
            {activeTab === 'history' && (
              <div>
                {statusHistory?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No status changes recorded</p>
                ) : (
                  <div className="space-y-3">
                    {statusHistory?.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{item.old_status || 'New'}</span>
                            {' → '}
                            <span className="font-medium">{item.new_status}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateDDMMYYYY(item.changed_at)} at {new Date(item.changed_at).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === 'comments' && (
              <div>
                {job.notes && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">Job Notes</p>
                    <p className="text-sm text-blue-800">{job.notes}</p>
                  </div>
                )}

                {job.special_instructions && (
                  <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm font-medium text-orange-900 mb-2">Special Instructions</p>
                    <p className="text-sm text-orange-800">{job.special_instructions}</p>
                  </div>
                )}

                {comments?.length === 0 && !job.notes && !job.special_instructions ? (
                  <p className="text-gray-500 text-center py-8">No comments yet</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {comments?.map((comment) => (
                      <div key={comment.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <p className="text-sm text-gray-900">{comment.comment_text}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDateDDMMYYYY(comment.commented_at)} at {new Date(comment.commented_at).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                          {comment.is_internal && <span className="ml-2 text-orange-600 font-medium">(Internal)</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
