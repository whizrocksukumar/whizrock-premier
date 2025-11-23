'use client'

import { X, Printer, Mail, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Quote {
  id: string
  number: string
  date: string
  region: string
  quoteSource: string
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Won' | 'Lost' | 'Tender/Jobs - to price'
  jobType: string
  quotedValue: number
  discountPercentage?: number
  marginPercentage: number
  followUpDate?: string
  jobNumber?: string
  customerName: string
  siteAddress: string
  salesRep: string
  scheduledDate?: string
}

const statusOptions = [
  'Draft',
  'Sent',
  'Accepted',
  'Rejected',
  'Won',
  'Lost',
  'Tender/Jobs - to price',
]

const statusColors: Record<string, { bg: string; text: string }> = {
  Draft: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Sent: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Accepted: { bg: 'bg-green-100', text: 'text-green-800' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  Won: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  Lost: { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Tender/Jobs - to price': { bg: 'bg-purple-100', text: 'text-purple-800' },
}

interface QuoteModalProps {
  quote: Quote | null
  isOpen: boolean
  onClose: () => void
  onStatusChange?: (quoteId: string, newStatus: string) => void
  onDelete?: (quoteId: string) => void
}

export default function QuoteModal({
  quote,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
}: QuoteModalProps) {
  const [status, setStatus] = useState(quote?.status || 'Draft')

  if (!isOpen || !quote) {
    return null
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    onStatusChange?.(quote.id, newStatus)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this quote?')) {
      onDelete?.(quote.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{quote.number}</h2>
            <p className="text-sm text-gray-600 mt-1">Quote Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8">
          {/* Quote Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quote Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Number
                </label>
                <p className="text-gray-900">{quote.number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Date
                </label>
                <p className="text-gray-900">{quote.date}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <p className="text-gray-900">{quote.region}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Source
                </label>
                <p className="text-gray-900">{quote.quoteSource}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <p className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                  {quote.customerName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Rep
                </label>
                <p className="text-gray-900">{quote.salesRep}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Address
                </label>
                <p className="text-gray-900">{quote.siteAddress}</p>
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Job Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Type
                </label>
                <p className="text-gray-900">{quote.jobType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Number
                </label>
                <p className="text-gray-900">{quote.jobNumber || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow Up Date
                </label>
                <p className="text-gray-900">{quote.followUpDate || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <p className="text-gray-900">{quote.scheduledDate || '-'}</p>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pricing Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quoted Value
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  ${quote.quotedValue.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount
                </label>
                <p className="text-gray-900">
                  {quote.discountPercentage ? `${quote.discountPercentage}%` : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margin %
                </label>
                <p className="text-lg font-semibold text-green-600">
                  {quote.marginPercentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quote Status
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border font-semibold text-sm ${
                  statusColors[status]?.bg
                } ${statusColors[status]?.text} border-gray-300 focus:ring-2 focus:ring-blue-500`}
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
              <Printer className="w-4 h-4" />
              Print to PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
              <Mail className="w-4 h-4" />
              Email Quote
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
              Edit Quote
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-medium text-sm ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}