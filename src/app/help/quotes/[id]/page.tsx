'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Mail, Printer, Edit, Download, Send, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface QuoteLineItem {
  id: string
  quote_id: string
  product_id: string | null
  product_name: string
  description: string | null
  is_labour: boolean
  quantity: number
  unit_cost: number
  unit_sell_price: number
  gp_percent: number
}

interface QuoteDetail {
  id: string
  quote_number: string
  version: string
  status: string
  client_id: string | null
  company_id: string | null
  quote_date: string
  valid_until: string
  follow_up_date: string | null
  pricing_tier: string
  labour_rate_per_sqm: number
  waste_percent: number
  notes: string | null
  created_at: string
  created_by: string | null

  // Calculated fields
  total_cost_ex_gst: number
  total_sell_ex_gst: number
  gst_amount: number
  total_inc_gst: number
  gross_profit_percent: number

  // Fetched relationships
  client_name?: string
  client_email?: string
  client_phone?: string
  site_address?: string
  company_name?: string
  sales_rep_name?: string
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.id as string

  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuoteDetails()
  }, [quoteId])

  const fetchQuoteDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch quote
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (quoteError) throw quoteError
      if (!quoteData) {
        setError('Quote not found')
        return
      }

      // Fetch client details
      let clientName = 'No Client'
      let clientEmail = ''
      let clientPhone = ''
      let siteAddress = ''
      let companyName = ''

      if (quoteData.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, phone, address_line_1, company_id')
          .eq('id', quoteData.client_id)
          .single()

        if (client) {
          clientName = `${client.first_name} ${client.last_name}`
          clientEmail = client.email || ''
          clientPhone = client.phone || ''
          siteAddress = client.address_line_1 || ''

          // Fetch company name
          if (client.company_id) {
            const { data: company } = await supabase
              .from('companies')
              .select('id, company_name')
              .eq('id', client.company_id)
              .single()

            companyName = company?.company_name || ''
          }
        }
      }

      // Fetch line items
      const { data: itemsData } = await supabase
        .from('quote_line_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('id')

      // Calculate totals
      const items = itemsData || []
      let totalCost = 0
      let totalSell = 0

      items.forEach(item => {
        totalCost += item.quantity * item.unit_cost
        totalSell += item.quantity * item.unit_sell_price
      })

      const gstAmount = totalSell * 0.15
      const totalIncGst = totalSell + gstAmount
      const grossProfit = totalSell - totalCost
      const gpPercent = totalSell > 0 ? (grossProfit / totalSell) * 100 : 0

      setQuote({
        ...quoteData,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        site_address: siteAddress,
        company_name: companyName,
        total_cost_ex_gst: totalCost,
        total_sell_ex_gst: totalSell,
        gst_amount: gstAmount,
        total_inc_gst: totalIncGst,
        gross_profit_percent: gpPercent
      })

      setLineItems(items)
    } catch (err) {
      console.error('Error fetching quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quote')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = () => {
    if (!quote?.client_email) {
      alert('No email address for this client')
      return
    }
    // TODO: Implement email functionality
    alert(`Email functionality to be implemented. Would send to: ${quote.client_email}`)
  }

  const handleDownloadPDF = () => {
    // PDF functionality disabled - will be implemented in future phase
    alert('PDF download will be available in the next phase')
  }

  const handleSendToCustomer = async () => {
    if (!quote) return

    try {
      // Update status to "Sent"
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ status: 'Sent' })
        .eq('id', quoteId)

      if (updateError) throw updateError

      // TODO: Send email to customer

      // Refresh quote
      fetchQuoteDetails()
      alert('Quote marked as sent')
    } catch (err) {
      console.error('Error sending quote:', err)
      alert('Failed to send quote')
    }
  }

  const handleCreateJob = () => {
    // TODO: Implement create job functionality
    alert('Create Job functionality to be implemented')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'Sent':
        return 'bg-blue-100 text-blue-800'
      case 'Accepted':
      case 'Won':
        return 'bg-green-100 text-green-800'
      case 'Lost':
        return 'bg-red-100 text-red-800'
      case 'Expired':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quote details...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Link href="/quotes" className="flex items-center gap-2 text-[#0066CC] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Quotes
          </Link>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Quote not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation and Actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/quotes" className="flex items-center gap-2 text-[#0066CC] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Quotes
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              title="Print quote"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleEmail}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              title="Email quote"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              title="PDF generation - coming soon"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <Link
              href={`/quotes/${quoteId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            {quote.status === 'Draft' && (
              <button
                onClick={handleSendToCustomer}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] text-sm font-medium"
              >
                <Send className="w-4 h-4" />
                Send Quote
              </button>
            )}
            {(quote.status === 'Sent' || quote.status === 'Accepted' || quote.status === 'Won') && (
              <button
                onClick={handleCreateJob}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Create Job
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Printable */}
      <div className="p-6 max-w-7xl mx-auto print:p-0 print:bg-white">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden print:rounded-none print:shadow-none">
          
          {/* Document Header */}
          <div className="border-b border-gray-200 p-8 bg-white print:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-[#0066CC]">QUOTE</h1>
                <p className="text-gray-500 mt-1">Professional Insulation Quote</p>
              </div>
              <div className="text-right">
                <div className="w-24 h-24 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-center text-sm p-2">
                  PREMIER<br/>INSULATION
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Quote Number</h3>
                <p className="text-2xl font-bold text-[#0066CC]">{quote.quote_number}</p>
                <p className="text-sm text-gray-600">v{quote.version}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Quote Date</h3>
                <p className="text-lg font-semibold text-gray-900">{formatDate(quote.quote_date)}</p>
              </div>
              <div className="text-right">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Status</h3>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                  {quote.status}
                </span>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-base text-gray-900">
                Dear <span className="font-semibold">{quote.client_name}</span>,
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Thank you for your interest. Below is our quote for your insulation requirements.
              </p>
            </div>
          </div>

          {/* Client and Quote Info Section */}
          <div className="border-b border-gray-200 p-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Client Details */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Bill To</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Contact</p>
                    <p className="text-sm text-gray-900">{quote.client_name}</p>
                  </div>
                  {quote.company_name && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600">Company</p>
                      <p className="text-sm text-gray-900">{quote.company_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Email</p>
                    <p className="text-sm text-gray-900">{quote.client_email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Phone</p>
                    <p className="text-sm text-gray-900">{quote.client_phone || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Quote Details</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Site Address</p>
                    <p className="text-sm text-gray-900">{quote.site_address || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Valid Until</p>
                    <p className="text-sm text-gray-900">{formatDate(quote.valid_until)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Pricing Tier</p>
                    <p className="text-sm text-gray-900">{quote.pricing_tier}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border-b border-gray-200 p-8">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Cost Each</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Sell Each</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Sell</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">GP %</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.length > 0 ? (
                    lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">
                          <p className="font-medium">{item.product_name}</p>
                          {item.description && <p className="text-xs text-gray-600 mt-1">{item.description}</p>}
                          {item.is_labour && <p className="text-xs text-blue-600 font-semibold mt-1">LABOUR</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.unit_cost)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.unit_sell_price)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(item.quantity * item.unit_sell_price)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">{item.gp_percent.toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No line items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="border-b border-gray-200 p-8">
            <div className="ml-auto w-80">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Total Cost (Ex GST)</span>
                  <span className="text-sm text-gray-900">{formatCurrency(quote.total_cost_ex_gst)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Total Sell (Ex GST)</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(quote.total_sell_ex_gst)}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-4">
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Subtotal (Ex GST)</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(quote.total_sell_ex_gst)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">GST (15%)</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(quote.gst_amount)}</span>
                </div>
              </div>

              <div className="bg-[#0066CC] text-white p-4 rounded-lg">
                <div className="flex justify-between py-2">
                  <span className="text-base font-semibold">TOTAL (Inc GST)</span>
                  <span className="text-xl font-bold">{formatCurrency(quote.total_inc_gst)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-700">Gross Profit</span>
                  <span className="text-sm font-semibold text-gray-900">{quote.gross_profit_percent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {quote.notes && (
            <div className="border-b border-gray-200 p-8">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="border-b border-gray-200 p-8">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Terms & Conditions</h2>
            <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
              <li>Quote valid until {formatDate(quote.valid_until)}</li>
              <li>Payment terms: Net 30 days from invoice date</li>
              <li>Prices include GST unless otherwise stated</li>
              <li>Installation subject to site accessibility and conditions</li>
              <li>Stock availability subject to confirmation</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="bg-orange-500 text-white p-8 text-center">
            <p className="text-2xl font-bold">PREMIER INSULATION</p>
            <p className="text-lg font-semibold mt-1">0800 467 855</p>
            <p className="text-sm mt-3">www.premierinsulation.co.nz</p>
          </div>
        </div>
      </div>
    </div>
  )
}