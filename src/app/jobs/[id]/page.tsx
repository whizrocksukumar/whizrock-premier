'use client'

import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, User, FileText, AlertTriangle, TrendingDown, Package } from 'lucide-react'

// -------------------- Interfaces --------------------
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
}

// -------------------- Helpers --------------------
const formatDate = (dateString: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString('en-NZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '—'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD'
  }).format(value || 0)

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'In Progress':
      return 'bg-orange-100 text-orange-800'
    case 'Completed':
      return 'bg-green-100 text-green-800'
    case 'Cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// ------------------------- PAGE -------------------------

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: job } = await supabase.from('jobs').select('*').eq('id', id).single()
  if (!job) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Job Not Found</h1>
      </div>
    )
  }

  const { data: quoteData } = await supabase
    .from('quotes')
    .select('quote_number')
    .eq('id', job.quote_id)
    .single()
  const quoteNumber = quoteData?.quote_number || null

  const { data: crewLead } = await supabase
    .from('team_members')
    .select('first_name, last_name')
    .eq('id', job.crew_lead_id)
    .single()
  const crewLeadName = crewLead ? `${crewLead.first_name} ${crewLead.last_name}` : null

  const { data: lineItems } = await supabase
    .from('job_line_items')
    .select('*')
    .eq('job_id', job.id)
    .order('sort_order')

  const { data: labourItems } = await supabase
    .from('job_labour_items')
    .select('*')
    .eq('job_id', job.id)
    .order('sort_order')

  const { data: statusHistory } = await supabase
    .from('job_status_history')
    .select('*')
    .eq('job_id', job.id)
    .order('changed_at', { ascending: false })

  const { data: comments } = await supabase
    .from('job_comments')
    .select('*')
    .eq('job_id', job.id)
    .is('parent_comment_id', null)
    .order('commented_at', { ascending: false })

  const customerName =
    `${job.customer_first_name || ''} ${job.customer_last_name || ''}`.trim() || '—'

  // Costing calculations
  const materialsQuoted = lineItems?.reduce((s, item) => s + (item.line_cost || 0), 0) || 0
  const materialsActual =
    lineItems?.reduce(
      (s, item) => s + ((item.quantity_actual || item.quantity_quoted) * item.unit_cost || 0),
      0
    ) || 0
  const labourQuoted = labourItems?.reduce((s, item) => s + (item.quoted_amount || 0), 0) || 0
  const labourActual = labourItems?.reduce((s, item) => s + (item.actual_amount || 0), 0) || 0

  const totalQuoted = materialsQuoted + labourQuoted
  const totalActual = materialsActual + labourActual
  const variance = totalActual - totalQuoted
  const variancePercent = totalQuoted > 0 ? (variance / totalQuoted) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b px-6 py-4">
        <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>

        <h1 className="text-2xl font-bold">{job.job_number}</h1>
        <p className="text-sm text-gray-600">{customerName} • {job.customer_email}</p>
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
          <Link
            href={`/jobs/${job.id}/certificate`}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
          >
            <FileText className="w-4 h-4" /> Certificate
          </Link>

          <button className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* -------------------- MAIN CONTENT -------------------- */}
      <div className="p-6 space-y-6">

        {/* ---------------- TOP 3 CARDS (COMPACT STYLE) ---------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* CUSTOMER CARD */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              Customer Details
            </h2>

            <div className="space-y-2 text-sm">
              {job.customer_company && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Company</span>
                  <span className="font-medium">{job.customer_company}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{job.customer_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{job.customer_phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-right">{job.site_address || '—'}</span>
              </div>
            </div>
          </div>

          {/* JOB INFO CARD */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Job Information
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(job.status)}`}>
                  {job.status}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Scheduled</span>
                <span className="font-medium">{formatDate(job.scheduled_date)}</span>
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

              <div className="flex justify-between">
                <span className="text-gray-500">Crew Lead</span>
                <span className="font-medium">{crewLeadName || '—'}</span>
              </div>

              {job.warranty_period_months && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Warranty</span>
                  <span className="font-medium">{job.warranty_period_months} months</span>
                </div>
              )}
            </div>
          </div>

          {/* QUICK STATS CARD */}
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

        {/* -------------------- JOB COSTING -------------------- */}
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

        {/* -------------------- MATERIALS TABLE -------------------- */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Materials & Products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Qty Quoted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Qty Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lineItems?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No materials added yet
                    </td>
                  </tr>
                ) : (
                  lineItems?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{item.product_code || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity_quoted}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {item.quantity_actual || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.unit || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unit_cost)}
                      </td>
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

        {/* -------------------- LABOUR TABLE -------------------- */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Labour</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Area (sqm)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Quoted Hours
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actual Hours
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Quoted Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actual Amount
                  </th>
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
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(item.quoted_amount)}
                      </td>
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

        {/* -------------------- STATUS HISTORY -------------------- */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Status History</h2>
          {statusHistory?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No status changes recorded</p>
          ) : (
            <div className="space-y-3">
              {statusHistory?.map((item) => (
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

        {/* -------------------- COMMENTS -------------------- */}
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

          {comments?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {comments?.map((comment) => (
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
