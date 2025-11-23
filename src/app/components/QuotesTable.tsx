'use client'

import { useState } from 'react'
import { Eye, Edit2 } from 'lucide-react'

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

const statusColors: Record<string, { bg: string; text: string }> = {
  Draft: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Sent: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Accepted: { bg: 'bg-green-100', text: 'text-green-800' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  Won: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  Lost: { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Tender/Jobs - to price': { bg: 'bg-purple-100', text: 'text-purple-800' },
}

const mockQuotes: Quote[] = [
  {
    id: '1',
    number: 'Q-2025-001',
    date: '2025-11-18',
    region: 'Auckland',
    quoteSource: 'EECA 50%',
    status: 'Accepted',
    jobType: 'EECA 50%',
    quotedValue: 4850,
    discountPercentage: 13.43,
    marginPercentage: 42,
    followUpDate: '2025-12-15',
    jobNumber: 'J-2025-001',
    customerName: 'John Smith',
    siteAddress: '8 Ulster Rd, Auckland',
    salesRep: 'Pam',
    scheduledDate: '2025-12-01',
  },
  {
    id: '2',
    number: 'Q-2025-002',
    date: '2025-11-19',
    region: 'Auckland',
    quoteSource: 'Web',
    status: 'Sent',
    jobType: 'New Build',
    quotedValue: 8920,
    marginPercentage: 35,
    followUpDate: '2025-12-10',
    customerName: 'BuildCo Ltd',
    siteAddress: '12 High St, Auckland',
    salesRep: 'John',
    scheduledDate: '2025-12-05',
  },
  {
    id: '3',
    number: 'Q-2025-003',
    date: '2025-11-20',
    region: 'Waikato',
    quoteSource: 'Phone',
    status: 'Draft',
    jobType: 'Reclad',
    quotedValue: 3200,
    marginPercentage: 55,
    followUpDate: '2025-11-25',
    customerName: 'Jane Doe',
    siteAddress: '45 Beach Rd, Hamilton',
    salesRep: 'Pam',
  },
  {
    id: '4',
    number: 'Q-2025-004',
    date: '2025-11-17',
    region: 'Auckland',
    quoteSource: 'Referral',
    status: 'Won',
    jobType: 'Extension',
    quotedValue: 12500,
    discountPercentage: 8.5,
    marginPercentage: 38,
    followUpDate: '2025-12-20',
    jobNumber: 'J-2025-002',
    customerName: 'Sarah Wilson',
    siteAddress: '27 Park Ave, Auckland',
    salesRep: 'John',
    scheduledDate: '2025-12-10',
  },
  {
    id: '5',
    number: 'Q-2025-005',
    date: '2025-11-16',
    region: 'Bay of Plenty',
    quoteSource: 'Web',
    status: 'Rejected',
    jobType: 'Finish Off',
    quotedValue: 5600,
    marginPercentage: 28,
    customerName: 'Mike Johnson',
    siteAddress: '33 Ocean Lane, Tauranga',
    salesRep: 'Pam',
  },
  {
    id: '6',
    number: 'Q-2025-006',
    date: '2025-11-15',
    region: 'Auckland',
    quoteSource: 'EECA',
    status: 'Tender/Jobs - to price',
    jobType: 'EECA',
    quotedValue: 7200,
    discountPercentage: 20,
    marginPercentage: 45,
    followUpDate: '2025-12-01',
    customerName: 'Emma Davis',
    siteAddress: '56 Elm St, Auckland',
    salesRep: 'John',
  },
]

interface QuotesTableProps {
  onQuoteClick?: (quote: Quote) => void
  onCustomerClick?: (customerName: string) => void
  selectedQuotes: string[]
  onSelectionChange: (quoteIds: string[]) => void
  searchQuery?: string
}

export default function QuotesTable({
  onQuoteClick,
  onCustomerClick,
  selectedQuotes,
  onSelectionChange,
  searchQuery = '',
}: QuotesTableProps) {
  const [quotes] = useState<Quote[]>(mockQuotes)

  // Filter quotes based on search
  const filteredQuotes = quotes.filter((quote) =>
    quote.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.siteAddress.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCheckboxChange = (quoteId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedQuotes, quoteId])
    } else {
      onSelectionChange(selectedQuotes.filter((id) => id !== quoteId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredQuotes.map((q) => q.id))
    } else {
      onSelectionChange([])
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    filteredQuotes.length > 0 &&
                    selectedQuotes.length === filteredQuotes.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Quote #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Region
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Job Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Disc %
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Margin %
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Follow Up
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Job #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Site Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Sales Rep
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Scheduled
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedQuotes.includes(quote.id)}
                      onChange={(e) =>
                        handleCheckboxChange(quote.id, e.target.checked)
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                    <button
                      onClick={() => onQuoteClick?.(quote)}
                      className="hover:underline"
                    >
                      {quote.number}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {quote.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {quote.region}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {quote.quoteSource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex ${
                        statusColors[quote.status]?.bg
                      } ${statusColors[quote.status]?.text}`}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {quote.jobType}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    ${quote.quotedValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {quote.discountPercentage
                      ? `${quote.discountPercentage}%`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600 whitespace-nowrap">
                    {quote.marginPercentage}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {quote.followUpDate || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {quote.jobNumber || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap">
                    <button
                      onClick={() => onCustomerClick?.(quote.customerName)}
                      className="hover:underline"
                    >
                      {quote.customerName}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {quote.siteAddress}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {quote.salesRep}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {quote.scheduledDate || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onQuoteClick?.(quote)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition"
                        title="View Quote"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-gray-100 text-gray-600 rounded transition"
                        title="Edit Quote"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={17} className="px-6 py-12 text-center">
                  <p className="text-gray-500 font-medium">No quotes found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your search filters
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        Showing {filteredQuotes.length} of {quotes.length} quotes
      </div>
    </div>
  )
}