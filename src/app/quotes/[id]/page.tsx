'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Mail, Printer, Edit, Download, Send, CheckCircle } from 'lucide-react'

interface QuoteLineItem {
  id: string
  quote_id: string
  product_id: string | null
  product_code: string
  description: string
  quantity: number
  unit: string
  unit_cost: number
  unit_price: number
  line_total: number
  sort_order: number
}

interface QuoteDetail {
  id: string
  quote_number: string
  status: string
  client_id: string | null
  quote_date: string
  valid_until: string
  total_cost: number
  total_sell: number
  gst_amount: number
  total_amount: number
  gross_profit: number
  gp_percent: number
  notes: string | null
  
  // Denormalized fields
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string
  customer_company: string
  site_address: string
  city: string
  postcode: string
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

      setQuote(quoteData)

      // Fetch line items
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_line_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order')

      if (itemsError) throw itemsError
      setLineItems(itemsData || [])
    } catch (err) {
      console.error('Error fetching quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quote')
    } finally {
      setLoading(false)
    }
  }

  const handleSendToCustomer = async () => {
    if (!quote) return
    try {
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ status: 'Sent' })
        .eq('id', quoteId)

      if (updateError) throw updateError
      fetchQuoteDetails()
      alert('Quote marked as sent')
    } catch (err) {
      console.error('Error sending quote:', err)
      alert('Failed to send quote')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Sent': 'bg-blue-100 text-blue-800',
      'Accepted': 'bg-green-100 text-green-800',
      'Won': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Expired': 'bg-orange-100 text-orange-800',
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC]"></div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Link href="/quotes" className="flex items-center gap-2 text-[#0066CC] hover:underline text-sm">
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/quotes" className="flex items-center gap-2 text-[#0066CC] hover:underline text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Quotes
          </Link>

          <div className="flex items-center gap-2">
            <button disabled title="Coming Soon - Phase 2" className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-600 bg-gray-100 cursor-not-allowed">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button disabled title="Coming Soon - Phase 2" className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-600 bg-gray-100 cursor-not-allowed">
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button disabled title="Coming Soon - Phase 2" className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-600 bg-gray-100 cursor-not-allowed">
              <Download className="w-4 h-4" />
              PDF
            </button>
            <Link href={`/quotes/${quoteId}/edit`} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50">
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            {quote.status === 'Draft' && (
              <button onClick={handleSendToCustomer} className="inline-flex items-center gap-2 px-3 py-2 bg-[#0066CC] text-white rounded text-xs font-medium hover:bg-[#0052a3]">
                <Send className="w-4 h-4" />
                Send
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Compact Header Card */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Quote #</p>
              <p className="text-lg font-bold text-[#0066CC]">{quote.quote_number}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Status</p>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(quote.status)}`}>
                {quote.status}
              </span>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Quote Date</p>
              <p className="font-medium">{formatDate(quote.quote_date)}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Valid Until</p>
              <p className="font-medium">{formatDate(quote.valid_until)}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Client</p>
              <p className="font-medium">{quote.customer_first_name} {quote.customer_last_name}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Email</p>
              <p className="font-medium text-sm">{quote.customer_email || '—'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Phone</p>
              <p className="font-medium">{quote.customer_phone || '—'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Address</p>
              <p className="font-medium text-sm">{quote.site_address || '—'}</p>
            </div>
          </div>
          {quote.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600 font-medium mb-1">Notes</p>
              <p className="text-sm text-gray-700">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">LINE ITEMS</h2>

            {lineItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Description</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-700">Qty</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-700">Unit</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Unit Cost</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Unit Price</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-900">{item.description}</p>
                          <p className="text-xs text-gray-500">{item.product_code}</p>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700">{item.quantity}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{item.unit}</td>
                        <td className="px-3 py-2 text-right text-gray-700">${item.unit_cost.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-gray-700">${item.unit_price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">${item.line_total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No line items added</p>
              </div>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-end">
            <div className="w-72">
              <div className="space-y-2 mb-3">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-sm text-gray-700">Total Cost (Ex GST)</span>
                  <span className="text-sm font-semibold">${(quote.total_cost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-sm text-gray-700">Total Sell (Ex GST)</span>
                  <span className="text-sm font-semibold">${(quote.total_sell || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded space-y-2 mb-3">
                <div className="flex justify-between py-1">
                  <span className="text-sm font-medium text-gray-700">Subtotal</span>
                  <span className="text-sm font-semibold">${(quote.total_sell || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">GST (15%)</span>
                  <span className="text-sm font-semibold">${(quote.gst_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#0066CC] text-white p-3 rounded mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">TOTAL</span>
                  <span className="text-xl font-bold">${(quote.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Gross Profit</span>
                  <span className="font-semibold text-green-600">${(quote.gross_profit || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">GP %</span>
                  <span className="font-semibold text-green-600">{(quote.gp_percent || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}