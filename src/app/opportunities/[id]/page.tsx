import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Edit, FileText, CheckCircle, Clock, AlertCircle, Upload } from 'lucide-react'

interface OpportunityDetail {
  id: string
  opp_number: string
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  contact_phone: string
  contact_type: string
  client_type: string
  site_address: string
  site_city: string
  site_postcode: string
  stage: string
  sub_status: string
  recommendation_status: string
  estimated_value: number
  actual_value: number
  due_date: string
  notes: string
  created_at: string
  company_id: string | null
  product_recommendation_id: string | null
  sales_rep_id: string | null
  companies?: {
    company_name: string
    email: string
    phone: string
  } | null
  team_members?: {
    first_name: string
    last_name: string
    email: string
  } | null
  product_recommendations?: {
    recommendation_number: string
    status: string
    section_count: number
    total_area_sqm: number
    total_packs_required: number
    submitted_at: string
  } | null
}

interface Task {
  id: string
  task_description: string
  task_type: string
  status: string
  priority: string
  due_date: string
  completion_percent: number
  notes: string
  assigned_to?: {
    first_name: string
    last_name: string
  }
}

interface Attachment {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  file_category: string
  uploaded_at: string
  uploaded_by?: {
    first_name: string
    last_name: string
  }
}

async function getOpportunity(id: string) {
  const { data, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      companies (company_name, email, phone),
      team_members:sales_rep_id (first_name, last_name, email),
      product_recommendations (
        recommendation_number,
        status,
        section_count,
        total_area_sqm,
        total_packs_required,
        submitted_at
      )
    `)
    .eq('id', id)
    .single()

  return { data, error }
}

async function getTasks(opportunityId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_to:team_members!assigned_to_user_id (first_name, last_name)
    `)
    .eq('opportunity_id', opportunityId)
    .eq('is_active', true)
    .order('due_date', { ascending: true })

  return { data, error }
}

async function getAttachments(opportunityId: string) {
  const { data, error } = await supabase
    .from('opportunity_attachments')
    .select(`
      *,
      uploaded_by:team_members (first_name, last_name)
    `)
    .eq('opportunity_id', opportunityId)
    .eq('is_active', true)
    .order('uploaded_at', { ascending: false })

  return { data, error }
}

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const { data: opportunity, error } = await getOpportunity(params.id)
  const { data: tasks } = await getTasks(params.id)
  const { data: attachments } = await getAttachments(params.id)

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Opportunity Not Found</h2>
          <Link href="/opportunities" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Opportunities
          </Link>
        </div>
      </div>
    )
  }

  const customerName = opportunity.companies?.company_name || 
    `${opportunity.contact_first_name} ${opportunity.contact_last_name}`
  const contactPerson = opportunity.companies?.company_name 
    ? `${opportunity.contact_first_name} ${opportunity.contact_last_name}` 
    : null

  const stageColors: Record<string, string> = {
    'NEW': 'bg-blue-100 text-blue-800',
    'QUALIFIED': 'bg-yellow-100 text-yellow-800',
    'QUOTED': 'bg-purple-100 text-purple-800',
    'WON': 'bg-green-100 text-green-800',
    'LOST': 'bg-red-100 text-red-800'
  }

  const statusColors: Record<string, string> = {
    'Not Started': 'bg-gray-100 text-gray-800',
    'Sent to VA': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Submitted': 'bg-green-100 text-green-800',
    'Converted to Quote': 'bg-purple-100 text-purple-800',
    'Rejected': 'bg-red-100 text-red-800'
  }

  const priorityColors: Record<string, string> = {
    'Low': 'bg-gray-100 text-gray-700',
    'Normal': 'bg-blue-100 text-blue-700',
    'High': 'bg-orange-100 text-orange-700',
    'Urgent': 'bg-red-100 text-red-700'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/opportunities" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">{opportunity.opp_number}</h1>
              <p className="text-sm text-gray-500">{customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageColors[opportunity.stage]}`}>
              {opportunity.stage}
            </span>
            <Link
              href={`/opportunities/${params.id}/edit`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500">Customer Name</label>
                  <p className="text-gray-800 font-medium">{customerName}</p>
                </div>
                {contactPerson && (
                  <div>
                    <label className="text-gray-500">Contact Person</label>
                    <p className="text-gray-800 font-medium">{contactPerson}</p>
                  </div>
                )}
                <div>
                  <label className="text-gray-500">Email</label>
                  <p className="text-gray-800">{opportunity.contact_email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-500">Phone</label>
                  <p className="text-gray-800">{opportunity.contact_phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-500">Client Type</label>
                  <p className="text-gray-800">{opportunity.client_type}</p>
                </div>
                <div>
                  <label className="text-gray-500">Contact Type</label>
                  <p className="text-gray-800">{opportunity.contact_type}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-gray-500">Site Address</label>
                  <p className="text-gray-800">
                    {opportunity.site_address || 'N/A'}
                    {opportunity.site_city && `, ${opportunity.site_city}`}
                    {opportunity.site_postcode && ` ${opportunity.site_postcode}`}
                  </p>
                </div>
              </div>
            </div>

            {/* VA Recommendation Section */}
            {opportunity.product_recommendation_id && opportunity.product_recommendations ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Product Recommendation</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[opportunity.product_recommendations.status]}`}>
                    {opportunity.product_recommendations.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">
                      {opportunity.product_recommendations.section_count}
                    </p>
                    <p className="text-xs text-gray-500">Sections</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-green-600">
                      {opportunity.product_recommendations.total_area_sqm.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">Total m²</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-orange-600">
                      {opportunity.product_recommendations.total_packs_required}
                    </p>
                    <p className="text-xs text-gray-500">Total Packs</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/va-workspace/${opportunity.product_recommendation_id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Recommendation
                  </Link>
                  {opportunity.product_recommendations.status === 'Submitted' && (
                    <Link
                      href={`/quotes/convert-from-recommendation/${opportunity.product_recommendation_id}?opportunityId=${params.id}`}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-center flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Convert to Quote
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">No Product Recommendation Yet</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Send this opportunity to VA to create a product recommendation.
                    </p>
                    <button className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                      Send to VA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Tasks</h2>
              {tasks && tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task: Task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </span>
                            <span className="text-xs text-gray-500">{task.task_type}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">{task.task_description}</p>
                          {task.assigned_to && (
                            <p className="text-xs text-gray-500 mt-1">
                              Assigned to: {task.assigned_to.first_name} {task.assigned_to.last_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Due</p>
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(task.due_date).toLocaleDateString('en-NZ', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      {task.completion_percent > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${task.completion_percent}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{task.completion_percent}% complete</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No tasks yet</p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {opportunity.notes || 'No notes added'}
              </p>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Status</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-gray-500">Pipeline Stage</label>
                  <p className={`mt-1 px-3 py-1 rounded-full inline-block text-xs font-medium ${stageColors[opportunity.stage]}`}>
                    {opportunity.stage}
                  </p>
                </div>
                {opportunity.sub_status && (
                  <div>
                    <label className="text-gray-500">Sub-Status</label>
                    <p className="text-gray-800 mt-1">{opportunity.sub_status}</p>
                  </div>
                )}
                {opportunity.recommendation_status && (
                  <div>
                    <label className="text-gray-500">VA Recommendation</label>
                    <p className={`mt-1 px-3 py-1 rounded-full inline-block text-xs font-medium ${statusColors[opportunity.recommendation_status]}`}>
                      {opportunity.recommendation_status}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Financial</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-gray-500">Estimated Value</label>
                  <p className="text-xl font-bold text-green-600">
                    ${opportunity.estimated_value?.toLocaleString('en-NZ', { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
                {opportunity.actual_value && (
                  <div>
                    <label className="text-gray-500">Actual Value</label>
                    <p className="text-xl font-bold text-blue-600">
                      ${opportunity.actual_value.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Important Dates</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-gray-500">Created</label>
                  <p className="text-gray-800">
                    {new Date(opportunity.created_at).toLocaleDateString('en-NZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {opportunity.due_date && (
                  <div>
                    <label className="text-gray-500">Target Close Date</label>
                    <p className="text-gray-800">
                      {new Date(opportunity.due_date).toLocaleDateString('en-NZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Attachments</h3>
                <button className="text-blue-600 hover:text-blue-700">
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              {attachments && attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((file: Attachment) => (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{file.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No files attached</p>
              )}
            </div>

            {/* Sales Rep */}
            {opportunity.team_members && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Sales Representative</h3>
                <p className="text-sm font-medium text-gray-800">
                  {opportunity.team_members.first_name} {opportunity.team_members.last_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{opportunity.team_members.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
