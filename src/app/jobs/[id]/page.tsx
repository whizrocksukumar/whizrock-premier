import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, User, Building, Mail, Phone, MapPin, FileText } from 'lucide-react'

interface JobDetail {
  id: string
  job_number: string
  quote_id: string
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string
  customer_company: string
  site_address: string
  city: string
  postcode: string
  status: string
  scheduled_date: string
  start_date: string
  completion_date: string
  crew_lead_id: string
  crew_members: any
  quoted_amount: number
  actual_amount: number
  notes: string
  assessment_id: string
  opportunity_id: string
  warranty_period_months: number
  special_instructions: string
  created_at: string
  updated_at: string
}

interface LineItem {
  id: string
  product_code: string
  description: string
  quantity_quoted: number
  quantity_actual: number
  unit: string
  unit_cost: number
  line_cost: number
  installed_by: string
  installation_date: string
  notes: string
}

interface LabourItem {
  id: string
  description: string
  area_sqm: number
  quoted_rate: number
  quoted_hours: number
  quoted_amount: number
  actual_hours: number
  actual_rate: number
  actual_amount: number
  performed_by: string
  labour_date: string
  notes: string
}

interface StatusHistoryItem {
  id: string
  old_status: string
  new_status: string
  changed_by: string
  changed_at: string
  notes: string
}

interface Comment {
  id: string
  comment_text: string
  comment_type: string
  is_internal: boolean
  commented_by: string
  commented_at: string
}

async function getJob(id: string) {
  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !job) {
      return { data: null, error: error?.message || 'Job not found' }
    }

    return { data: job, error: null }
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' }
  }
}

async function getQuoteNumber(quoteId: string) {
  if (!quoteId) return null
  const { data } = await supabase
    .from('quotes')
    .select('quote_number')
    .eq('id', quoteId)
    .single()
  return data?.quote_number || null
}

async function getCrewLeadName(crewLeadId: string) {
  if (!crewLeadId) return null
  const { data } = await supabase
    .from('team_members')
    .select('first_name, last_name')
    .eq('id', crewLeadId)
    .single()
  return data ? `${data.first_name} ${data.last_name}` : null
}

async function getJobLineItems(jobId: string) {
  const { data, error } = await supabase
    .from('job_line_items')
    .select('*')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: true })

  return data || []
}

async function getJobLabourItems(jobId: string) {
  const { data, error } = await supabase
    .from('job_labour_items')
    .select('*')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: true })

  return data || []
}

async function getJobStatusHistory(jobId: string) {
  const { data, error } = await supabase
    .from('job_status_history')
    .select('*')
    .eq('job_id', jobId)
    .order('changed_at', { ascending: false })

  return data || []
}

async function getJobComments(jobId: string) {
  const { data, error } = await supabase
    .from('job_comments')
    .select('*')
    .eq('job_id', jobId)
    .is('parent_comment_id', null)
    .order('commented_at', { ascending: false })

  return data || []
}

// Helper functions
const formatDate = (dateString: string | null) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatCurrency = (amount: number | null | undefined) => {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(amount)
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Draft': return 'bg-gray-100 text-gray-800'
    case 'Scheduled': return 'bg-blue-100 text-blue-800'
    case 'In Progress': return 'bg-orange-100 text-orange-800'
    case 'Completed': return 'bg-green-100 text-green-800'
    case 'Cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default async function JobDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: job, error } = await getJob(id)
  
  if (error || !job) {
    return (
      <div className="page-content">
        <div className="page-header">
          <Link href="/jobs" className="btn-ghost btn-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
          <h1 className="page-title">Job Not Found</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Job not found</div>
            <p className="empty-state-description">{error || 'The job you are looking for does not exist.'}</p>
            <Link href="/jobs" className="btn-primary">Back to Jobs</Link>
          </div>
        </div>
      </div>
    )
  }

  const quoteNumber = await getQuoteNumber(job.quote_id)
  const crewLeadName = await getCrewLeadName(job.crew_lead_id)
  const lineItems = await getJobLineItems(job.id)
  const labourItems = await getJobLabourItems(job.id)
  const statusHistory = await getJobStatusHistory(job.id)
  const comments = await getJobComments(job.id)

  const customerName = `${job.customer_first_name || ''} ${job.customer_last_name || ''}`.trim() || '—'

  // Calculate costing
  const materialsQuoted = lineItems.reduce((sum, item) => sum + (item.line_cost || 0), 0)
  const materialsActual = lineItems.reduce((sum, item) => sum + ((item.quantity_actual || item.quantity_quoted) * item.unit_cost || 0), 0)
  const labourQuoted = labourItems.reduce((sum, item) => sum + (item.quoted_amount || 0), 0)
  const labourActual = labourItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0)
  const totalQuoted = materialsQuoted + labourQuoted
  const totalActual = materialsActual + labourActual
  const variance = totalActual - totalQuoted
  const variancePercent = totalQuoted > 0 ? (variance / totalQuoted * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" />Back to Jobs
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{job.job_number}</h1>
            <p className="text-sm text-gray-600 mt-1">{customerName} • {job.customer_email || '—'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">U</div>
            <div className="text-right"><p className="text-sm text-gray-700">user@premier.local</p></div>
            <button className="ml-2 text-xs text-[#0066CC] hover:underline">Logout</button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(job.status)}`}>
              {job.status}
            </span>
            {quoteNumber && (
              <>
                <span className="text-sm text-gray-600">•</span>
                <Link href={`/quotes/${job.quote_id}`} className="text-sm text-blue-600 hover:text-blue-800">
                  Quote: {quoteNumber}
                </Link>
              </>
            )}
            {job.scheduled_date && (
              <>
                <span className="text-sm text-gray-600">•</span>
                <span className="text-sm text-gray-600">Scheduled: {formatDate(job.scheduled_date)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
              Change Status
            </button>
            <Link
              href={`/jobs/${job.id}/certificate`}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Certificate
            </Link>
            <button className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Customer & Job Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              Customer Details
            </h2>
            <div className="space-y-2 text-sm">
              {job.customer_company && (
                <div>
                  <p className="text-gray-500">Company</p>
                  <p className="font-medium">{job.customer_company}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Contact Name</p>
                <p className="font-medium">{customerName}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{job.customer_email || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{job.customer_phone || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Site Address</p>
                <p className="font-medium">{job.site_address || '—'}</p>
                {(job.city || job.postcode) && (
                  <p className="text-gray-600">
                    {job.city}{job.city && job.postcode ? ', ' : ''}{job.postcode}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Job Information
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-500">Status</p>
                <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Scheduled Date</p>
                <p className="font-medium">{formatDate(job.scheduled_date)}</p>
              </div>
              {job.start_date && (
                <div>
                  <p className="text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(job.start_date)}</p>
                </div>
              )}
              {job.completion_date && (
                <div>
                  <p className="text-gray-500">Completion Date</p>
                  <p className="font-medium">{formatDate(job.completion_date)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Crew Lead</p>
                <p className="font-medium">{crewLeadName || '—'}</p>
              </div>
              {job.warranty_period_months && (
                <div>
                  <p className="text-gray-500">Warranty Period</p>
                  <p className="font-medium">{job.warranty_period_months} months</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-base font-semibold mb-3">Quick Stats</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-500">Total Quoted</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalQuoted)}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Actual</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalActual)}</p>
              </div>
              <div>
                <p className="text-gray-500">Variance</p>
                <p className={`text-lg font-bold ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(variance))}
                  <span className="text-xs ml-1">({variancePercent.toFixed(1)}%)</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Costing */}
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

        {/* Job Line Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Materials & Products</h2>
          </div>
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
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No materials added yet
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{item.product_code || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity_quoted}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {item.quantity_actual || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.unit || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(item.unit_cost)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.line_cost)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Labour Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Labour</h2>
          </div>
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
                {labourItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No labour items added yet
                    </td>
                  </tr>
                ) : (
                  labourItems.map((item: any) => (
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

        {/* Status History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Status History</h2>
          {statusHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No status changes recorded</p>
          ) : (
            <div className="space-y-3">
              {statusHistory.map((item: any) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{item.old_status || 'New'}</span>
                      {' → '}
                      <span className="font-medium">{item.new_status}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.changed_at).toLocaleString('en-NZ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Notes & Comments</h2>
          {job.notes && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Job Notes</p>
              <p className="text-sm text-blue-800">{job.notes}</p>
            </div>
          )}
          {job.special_instructions && (
            <div className="mb-4 p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-900 mb-1">Special Instructions</p>
              <p className="text-sm text-orange-800">{job.special_instructions}</p>
            </div>
          )}
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <div key={comment.id} className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-900">{comment.comment_text}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(comment.commented_at).toLocaleString('en-NZ')}
                    {comment.is_internal && <span className="ml-2 text-orange-600">(Internal)</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
