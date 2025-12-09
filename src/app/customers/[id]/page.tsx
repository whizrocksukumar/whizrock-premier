import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, FileText, Briefcase, DollarSign, Plus } from 'lucide-react'

interface CustomerDetail {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  company_id: string | null
  contact_type: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  postcode: string | null
  region_id: string | null
  status: string | null
  follow_up_date: string | null
  client_type_id: string | null
  created_at: string
  companies?: {
    company_name: string
    address_line_1: string | null
    address_line_2: string | null
    city: string | null
    postal_code: string | null
    phone: string | null
    email: string | null
    website: string | null
  } | null
  client_types?: {
    type_name: string
  } | null
  regions?: {
    name: string
  } | null
}

interface RelatedRecord {
  id: string
  reference_number: string
  date: string
  status: string
  amount?: number
  site_address?: string
}

async function getCustomer(id: string) {
  try {
    // First get basic customer data
    const { data: customer, error: customerError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (customerError || !customer) {
      console.error('Error fetching customer:', customerError)
      return { data: null, error: customerError?.message || 'Customer not found' }
    }

    // Try to get company details if company_id exists
    let companyData = null
    if (customer.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('company_name, address_line_1, address_line_2, city, postal_code, phone, email, website')
        .eq('id', customer.company_id)
        .single()
      companyData = company || null
    }

    // Try to get client type if client_type_id exists
    let clientTypeName = null
    if (customer.client_type_id) {
      const { data: clientType } = await supabase
        .from('client_types')
        .select('type_name')
        .eq('id', customer.client_type_id)
        .single()
      clientTypeName = clientType?.type_name || null
    }

    // Try to get region if region_id exists
    let regionData = null
    if (customer.region_id) {
      const { data: region } = await supabase
        .from('regions')
        .select('name')
        .eq('id', customer.region_id)
        .single()
      regionData = region || null
    }

    // Combine all data
    const enrichedCustomer = {
      ...customer,
      companies: companyData,
      client_types: clientTypeName ? { type_name: clientTypeName } : null,
      regions: regionData
    }

    return { data: enrichedCustomer, error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

async function getCustomerRelatedData(clientId: string) {
  try {
    // Get assessments
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, reference_number, scheduled_date, status')
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false })
      .limit(5)

    // Get quotes
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, quote_number, quote_date, status, total_amount, site_address')
      .eq('client_id', clientId)
      .order('quote_date', { ascending: false })
      .limit(5)

    // Get jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, job_number, scheduled_date, status')
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false })
      .limit(5)

    // Get invoices (if table exists)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, status, total_amount')
      .eq('client_id', clientId)
      .order('invoice_date', { ascending: false })
      .limit(5)
      .then(res => res.error ? { data: [] } : res)

    return {
      assessments: (assessments || []).map(a => ({
        id: a.id,
        reference_number: a.reference_number,
        date: a.scheduled_date,
        status: a.status
      })),
      quotes: (quotes || []).map(q => ({
        id: q.id,
        reference_number: q.quote_number,
        date: q.quote_date,
        status: q.status,
        amount: q.total_amount,
        site_address: q.site_address
      })),
      jobs: (jobs || []).map(j => ({
        id: j.id,
        reference_number: j.job_number,
        date: j.scheduled_date,
        status: j.status
      })),
      invoices: (invoices || []).map(i => ({
        id: i.id,
        reference_number: i.invoice_number,
        date: i.invoice_date,
        status: i.status,
        amount: i.total_amount
      }))
    }
  } catch (err) {
    console.error('Error fetching related data:', err)
    return {
      assessments: [],
      quotes: [],
      jobs: [],
      invoices: []
    }
  }
}

export default async function CustomerDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: customer, error } = await getCustomer(id)
  
  if (error || !customer) {
    return (
      <div className="page-content">
        <div className="page-header">
          <Link href="/customers" className="btn-ghost btn-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </Link>
          <h1 className="page-title">Customer Not Found</h1>
        </div>

        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Customer not found</div>
            <p className="empty-state-description">
              {error || 'The customer you are looking for does not exist.'}
            </p>
            <Link href="/customers" className="btn-primary">
              Back to Customers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const relatedData = await getCustomerRelatedData(customer.id)
  
  const fullName = `${customer.first_name} ${customer.last_name}`
  const companyName = customer.companies?.company_name || '—'
  const clientType = customer.client_types?.type_name || '—'
  const contactType = customer.contact_type || '—'
  
  // Display company address if available, otherwise fall back to client's own address
  const displayAddress = customer.companies ? 
    [
      customer.companies.address_line_1,
      customer.companies.address_line_2,
      customer.companies.city,
      customer.companies.postal_code
    ].filter(Boolean).join(', ') || '' 
    : 
    [
      customer.address_line_1,
      customer.address_line_2,
      customer.city,
      customer.postcode
    ].filter(Boolean).join(', ') || ''

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount)
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return 'badge'
    const statusLower = status.toLowerCase()
    if (statusLower === 'active' || statusLower === 'scheduled' || statusLower === 'accepted') return 'status-accepted'
    if (statusLower === 'inactive' || statusLower === 'cancelled') return 'badge'
    if (statusLower === 'prospect' || statusLower === 'pending' || statusLower === 'draft') return 'status-pending'
    if (statusLower === 'sent') return 'status-sent'
    return 'badge'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HEADER ROW ===== */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/customers" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Customers
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {customer.email} • {customer.phone || '—'} • {customer.companies ? (
                <Link href={`/companies/${customer.company_id}`} className="text-[#0066CC] hover:underline">
                  {customer.companies.company_name}
                </Link>
              ) : 'No Company'}
            </p>
          </div>
          {/* User Icon and Email */}
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
          <div className="flex items-center gap-2">
            <span className={getStatusBadge(customer.status)}>
              {customer.status || 'Active'}
            </span>
            <span className="text-sm text-gray-600">•</span>
            <span className="text-sm text-gray-600">{clientType}</span>
            <span className="text-sm text-gray-600">•</span>
            <span className="text-sm text-gray-600">{contactType}</span>
          </div>

          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/assessments/new?client_id=${customer.id}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule Assessment
            </Link>
            <Link
              href={`/quotes/new?client_id=${customer.id}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Create Quote
            </Link>
            <Link
              href={`/jobs/new?client_id=${customer.id}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Create Job
            </Link>
            <Link
              href={`/customers/${customer.id}/edit`}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      <div className="p-6">
        {/* Contact Information and Activity Summary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information Card - 2 columns width */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="card-title">Contact Information</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Email</label>
                  <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                    {customer.email}
                  </p>
                </div>

                <div>
                  <label className="form-label">Phone</label>
                  <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                    {customer.phone || '—'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Company</label>
                  <p className="font-medium text-gray-900">
                    {customer.companies ? (
                      <Link href={`/companies/${customer.company_id}`} className="text-[#0066CC] hover:underline">
                        {customer.companies.company_name}
                      </Link>
                    ) : '—'}
                  </p>
                </div>

                <div>
                  <label className="form-label">Contact Type</label>
                  <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                    {contactType}
                  </p>
                </div>

                <div>
                  <label className="form-label">Client Type</label>
                  <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                    {clientType}
                  </p>
                </div>

                <div>
                  <label className="form-label">Status</label>
                  <span className={getStatusBadge(customer.status)}>
                    {customer.status || 'Active'}
                  </span>
                </div>

                <div className="col-span-3">
                  <label className="form-label">
                    Address {customer.companies && <span className="text-xs text-gray-500">(Company Address)</span>}
                  </label>
                  <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                    {displayAddress || '—'}
                  </p>
                </div>

                <div>
                  <label className="form-label">Region</label>
                  <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                    {customer.regions?.name || '—'}
                  </p>
                </div>

                {customer.follow_up_date && (
                  <div>
                    <label className="form-label">Follow-up Date</label>
                    <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                      {formatDate(customer.follow_up_date)}
                    </p>
                  </div>
                )}

                {!customer.follow_up_date && (
                  <div>
                    <label className="form-label">Customer Since</label>
                    <p className="font-medium" style={{ color: 'var(--color-neutral-900)' }}>
                      {formatDate(customer.created_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Summary Card - 1 column width */}
          <div>
            <div className="card">
              <h2 className="card-title">Activity Summary</h2>
              <div className="space-y-3">
                <Link href="/assessments" className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors">
                  <span style={{ color: 'var(--color-neutral-600)' }}>Assessments</span>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                    {relatedData.assessments.length}
                  </span>
                </Link>
                <Link href="/quotes" className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors">
                  <span style={{ color: 'var(--color-neutral-600)' }}>Quotes</span>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                    {relatedData.quotes.length}
                  </span>
                </Link>
                <Link href="/jobs" className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors">
                  <span style={{ color: 'var(--color-neutral-600)' }}>Jobs</span>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                    {relatedData.jobs.length}
                  </span>
                </Link>
                <div className="flex justify-between items-center p-2">
                  <span style={{ color: 'var(--color-neutral-600)' }}>Invoices (Xero)</span>
                  <span className="font-semibold" style={{ color: 'var(--color-neutral-400)' }}>
                    {relatedData.invoices.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessments Section */}
        {relatedData.assessments.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">Recent Assessments</h2>
              <FileText className="w-5 h-5" style={{ color: 'var(--color-neutral-400)' }} />
            </div>
            <div className="space-y-3">
              {relatedData.assessments.map((assessment: RelatedRecord) => (
                <Link
                  key={assessment.id}
                  href={`/assessments/${assessment.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                        {assessment.reference_number}
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-neutral-600)' }}>
                        {formatDate(assessment.date)}
                      </p>
                    </div>
                    <span className={getStatusBadge(assessment.status)}>{assessment.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quotes Section - Full Width */}
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
            <Link
              href={`/quotes/new?client_id=${customer.id}`}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Quote
            </Link>
          </div>
          
          {relatedData.quotes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatedData.quotes.map((quote: RelatedRecord) => (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/quotes/${quote.id}`} className="text-[#0066CC] hover:underline font-medium">
                          {quote.reference_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(quote.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {quote.site_address || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(quote.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(quote.status)}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="text-[#0066CC] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-4">No quotes yet</p>
              <Link
                href={`/quotes/new?client_id=${customer.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Create First Quote
              </Link>
            </div>
          )}
        </div>

        {/* Jobs Section */}
        {relatedData.jobs.length > 0 && (
          <div className="card mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">Recent Jobs</h2>
              <Briefcase className="w-5 h-5" style={{ color: 'var(--color-neutral-400)' }} />
            </div>
            <div className="space-y-3">
              {relatedData.jobs.map((job: RelatedRecord) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                        {job.reference_number}
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-neutral-600)' }}>
                        {formatDate(job.date)}
                      </p>
                    </div>
                    <span className={getStatusBadge(job.status)}>{job.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}