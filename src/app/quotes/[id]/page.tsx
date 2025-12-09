import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Edit, FileText, User, Mail, Phone, Building } from 'lucide-react'
import QuoteSendButton from '@/components/QuoteSendButton'
import CreateJobButton from '@/components/CreateJobButton'

interface QuoteDetail {
  id: string
  quote_number: string
  client_id: string | null
  customer_first_name: string | null
  customer_last_name: string | null
  customer_email: string | null
  customer_phone: string | null
  customer_company: string | null
  site_address: string | null
  city: string | null
  postcode: string | null
  region_id: string | null
  job_type: string | null
  status: string
  quote_date: string | null
  valid_until: string | null
  subtotal: number | null
  gst_amount: number | null
  total_amount: number | null
  margin_percentage: number | null
  notes: string | null
  assessment_id: string | null
  created_at: string
  clients?: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
    companies?: {
      name: string
    } | null
  } | null
  regions?: {
    name: string
  } | null
  assessments?: {
    reference_number: string
    scheduled_date: string
  } | null
}

async function getQuote(id: string) {
  try {
    // Get quote with basic data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (quoteError || !quote) {
      console.error('Quote fetch error:', quoteError)
      return { data: null, error: quoteError?.message || 'Quote not found' }
    }

    // Get client info if client_id exists
    let clientData = null
    let companyData = null
    if (quote.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('first_name, last_name, email, phone, company_id')
        .eq('id', quote.client_id)
        .single()
      
      clientData = client

      // Get company if company_id exists
      if (client?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', client.company_id)
          .single()
        companyData = company
      }
    }

    // Get assessment if assessment_id exists
    let assessmentData = null
    if (quote.assessment_id) {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('reference_number, scheduled_date')
        .eq('id', quote.assessment_id)
        .single()
      assessmentData = assessment
    }

    return { 
      data: {
        ...quote,
        clients: clientData,
        company: companyData,
        assessments: assessmentData
      }, 
      error: null 
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

async function getQuoteLineItems(quoteId: string) {
  try {
    // Fetch sections first
    const { data: sections, error: sectionsError } = await supabase
      .from('quote_sections')
      .select('*')
      .eq('quote_id', quoteId)
      .order('sort_order', { ascending: true })

    if (sectionsError) {
      console.error('Sections fetch error:', sectionsError)
      return []
    }

    if (!sections || sections.length === 0) {
      return []
    }

    // Fetch items for each section
    const sectionsWithItems = await Promise.all(
      sections.map(async (section) => {
        const { data: items, error: itemsError } = await supabase
          .from('quote_items')
          .select('*')
          .eq('section_id', section.id)
          .order('sort_order', { ascending: true })

        if (itemsError) {
          console.error('Items fetch error:', itemsError)
          return { ...section, items: [] }
        }

        return { ...section, items: items || [] }
      })
    )

    return sectionsWithItems
  } catch (err) {
    console.error('Error fetching line items:', err)
    return []
  }
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

const getStatusBadge = (status: string | null) => {
  if (!status) return 'badge'
  const s = status.toLowerCase()
  if (s === 'accepted' || s === 'won') return 'status-accepted'
  if (s === 'rejected' || s === 'lost' || s === 'cancelled') return 'badge'
  if (s === 'sent') return 'status-sent'
  if (s === 'draft') return 'status-pending'
  return 'badge'
}

export default async function QuoteDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: quote, error } = await getQuote(id)
  const lineItems = quote ? await getQuoteLineItems(quote.id) : []
  
  if (error || !quote) {
    return (
      <div className="page-content">
        <div className="page-header">
          <Link href="/quotes" className="btn-ghost btn-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Quotes
          </Link>
          <h1 className="page-title">Quote Not Found</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Quote not found</div>
            <p className="empty-state-description">{error || 'The quote you are looking for does not exist.'}</p>
            <Link href="/quotes" className="btn-primary">Back to Quotes</Link>
          </div>
        </div>
      </div>
    )
  }

  const customerName = quote.customer_first_name && quote.customer_last_name
    ? `${quote.customer_first_name} ${quote.customer_last_name}`
    : quote.clients ? `${quote.clients.first_name} ${quote.clients.last_name}` : '—'

  const customerEmail = quote.customer_email || quote.clients?.email || '—'
  const customerPhone = quote.customer_phone || quote.clients?.phone || '—'
  const companyName = quote.customer_company || quote.company?.name || '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/quotes" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" />Back to Quotes
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{quote.quote_number || 'Quote'}</h1>
            <p className="text-sm text-gray-600 mt-1">{customerName} • {customerEmail}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">U</div>
            <div className="text-right"><p className="text-sm text-gray-700">user@premier.local</p></div>
            <button className="ml-2 text-xs text-[#0066CC] hover:underline">Logout</button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={getStatusBadge(quote.status)}>{quote.status}</span>
            {quote.quote_date && (<><span className="text-sm text-gray-600">•</span><span className="text-sm text-gray-600">Created: {formatDate(quote.quote_date)}</span></>)}
            {quote.valid_until && (<><span className="text-sm text-gray-600">•</span><span className="text-sm text-gray-600">Valid Until: {formatDate(quote.valid_until)}</span></>)}
          </div>
          <div className="flex items-center gap-2">
            <CreateJobButton 
              quoteId={quote.id}
              quoteNumber={quote.quote_number || 'Quote'}
              quoteStatus={quote.status}
            />
            <QuoteSendButton quote={{
              ...quote,
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              customer_company: companyName,
              sections: lineItems
            }} />
            <Link href={`/quotes/${quote.id}/edit`} className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" />Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Three Compact Cards in One Row - Equal Height */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {/* Quote Details Card */}
          <div className="card h-full flex flex-col p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Quote Details</h2>
            <div className="space-y-1.5 flex-1 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Quote #:</span><span className="font-medium text-gray-900">{quote.quote_number || '—'}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Status:</span><span className={getStatusBadge(quote.status)}>{quote.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Quote Date:</span><span className="font-medium text-gray-900">{formatDate(quote.quote_date)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Valid Until:</span><span className="font-medium text-gray-900">{formatDate(quote.valid_until)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Job Type:</span><span className="font-medium text-gray-900">{quote.job_type || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">City:</span><span className="font-medium text-gray-900">{quote.city || '—'}</span></div>
              <div className="flex flex-col gap-0.5"><span className="text-gray-500">Site Address:</span><span className="font-medium text-gray-900">{[quote.site_address, quote.city, quote.postcode].filter(Boolean).join(', ') || '—'}</span></div>
              {quote.assessment_id && quote.assessments && (
                <div className="flex flex-col gap-0.5 pt-1"><span className="text-gray-500">Assessment:</span>
                  <Link href={`/assessments/${quote.assessment_id}`} className="text-[#0066CC] hover:underline font-medium flex items-center gap-1">
                    <FileText className="w-3 h-3" />{quote.assessments.reference_number}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="card h-full flex flex-col p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Customer Information</h2>
            <div className="space-y-1.5 flex-1 text-xs">
              <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-gray-400" /><span className="font-medium text-gray-900">{customerName}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /><span className="font-medium text-gray-900">{customerEmail}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /><span className="font-medium text-gray-900">{customerPhone}</span></div>
              <div className="flex items-center gap-2"><Building className="w-3.5 h-3.5 text-gray-400" /><span className="font-medium text-gray-900">{companyName}</span></div>
              {quote.client_id && (
                <div className="mt-auto pt-2 border-t border-gray-200">
                  <Link href={`/customers/${quote.client_id}`} className="text-[#0066CC] hover:underline flex items-center gap-1">
                    View Full Profile →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="card h-full flex flex-col p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Financial Summary</h2>
            <div className="space-y-1.5 flex-1 text-xs">
              <div className="flex justify-between items-center"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-900">{formatCurrency(quote.subtotal)}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">GST (15%)</span><span className="font-medium text-gray-900">{formatCurrency(quote.gst_amount)}</span></div>
              <div className="flex justify-between items-center pt-2 mt-auto border-t border-gray-200"><span className="font-semibold text-gray-900">Total (Inc GST)</span><span className="font-bold text-sm text-[#0066CC]">{formatCurrency(quote.total_amount)}</span></div>
              {quote.margin_percentage !== null && (<div className="flex justify-between items-center pt-1.5 border-t border-gray-200"><span className="text-gray-500">Margin</span><span className="font-medium text-green-600">{quote.margin_percentage.toFixed(1)}%</span></div>)}
            </div>
          </div>
        </div>

        {/* Quote Notes - Full Width */}
        {quote.notes && (
          <div className="card mb-6">
            <h2 className="card-title text-base mb-2">Notes</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Line Items Section - Full Width Below Cards */}
        <div className="card">
          <h2 className="card-title mb-4">Quote Line Items</h2>
          
          {lineItems.length > 0 ? (
            <div className="space-y-4">
              {lineItems.map((section: any) => (
                <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Section Header */}
                  <div 
                    className="px-4 py-3 font-semibold text-sm"
                    style={{ 
                      backgroundColor: section.section_color || '#f3f4f6',
                      color: '#000'
                    }}
                  >
                    {section.custom_name || 'Section'}
                  </div>
                  
                  {/* Section Items */}
                  {section.items && section.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Area (m²)</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Line Total</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {section.items.map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.marker && <span className="font-medium text-gray-600">{item.marker} - </span>}
                                {item.description || '—'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {item.area_sqm ? item.area_sqm.toFixed(2) : '—'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {item.packs_required || '—'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {formatCurrency(item.sell_price)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                {formatCurrency(item.line_sell)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">
                                {item.margin_percent ? `${item.margin_percent.toFixed(1)}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No items in this section
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No line items added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
