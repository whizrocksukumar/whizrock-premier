'use client'

import { X, Mail, Phone } from 'lucide-react'

interface Quote {
  id: string
  number: string
  date: string
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Won' | 'Lost' | 'Tender/Jobs - to price'
  jobType: string
  quotedValue: number
  marginPercentage: number
}

interface Customer {
  name: string
  email?: string
  phone?: string
  address: string
  region: string
  quotes: Quote[]
}

const statusColors: Record<string, string> = {
  Draft: 'bg-yellow-100 text-yellow-800',
  Sent: 'bg-blue-100 text-blue-800',
  Accepted: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Won: 'bg-emerald-100 text-emerald-800',
  Lost: 'bg-orange-100 text-orange-800',
  'Tender/Jobs - to price': 'bg-purple-100 text-purple-800',
}

const mockCustomers: Record<string, Customer> = {
  'John Smith': {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '021 234 5678',
    address: '8 Ulster Rd, Auckland 1010',
    region: 'Auckland',
    quotes: [
      {
        id: '1',
        number: 'Q-2025-001',
        date: '2025-11-18',
        status: 'Accepted',
        jobType: 'EECA 50%',
        quotedValue: 4850,
        marginPercentage: 42,
      },
    ],
  },
  'BuildCo Ltd': {
    name: 'BuildCo Ltd',
    email: 'info@buildco.co.nz',
    phone: '09 555 1234',
    address: '12 High St, Auckland 1010',
    region: 'Auckland',
    quotes: [
      {
        id: '2',
        number: 'Q-2025-002',
        date: '2025-11-19',
        status: 'Sent',
        jobType: 'New Build',
        quotedValue: 8920,
        marginPercentage: 35,
      },
      {
        id: '7',
        number: 'Q-2025-007',
        date: '2025-10-15',
        status: 'Won',
        jobType: 'Fit-Out',
        quotedValue: 15600,
        marginPercentage: 40,
      },
    ],
  },
  'Jane Doe': {
    name: 'Jane Doe',
    email: 'jane.doe@email.com',
    phone: '027 123 4567',
    address: '45 Beach Rd, Hamilton 3015',
    region: 'Waikato',
    quotes: [
      {
        id: '3',
        number: 'Q-2025-003',
        date: '2025-11-20',
        status: 'Draft',
        jobType: 'Reclad',
        quotedValue: 3200,
        marginPercentage: 55,
      },
    ],
  },
  'Sarah Wilson': {
    name: 'Sarah Wilson',
    email: 'sarah.w@email.com',
    phone: '021 987 6543',
    address: '27 Park Ave, Auckland 1021',
    region: 'Auckland',
    quotes: [
      {
        id: '4',
        number: 'Q-2025-004',
        date: '2025-11-17',
        status: 'Won',
        jobType: 'Extension',
        quotedValue: 12500,
        marginPercentage: 38,
      },
      {
        id: '8',
        number: 'Q-2025-008',
        date: '2025-09-20',
        status: 'Won',
        jobType: 'EECA',
        quotedValue: 6700,
        marginPercentage: 45,
      },
    ],
  },
  'Mike Johnson': {
    name: 'Mike Johnson',
    email: 'mike.j@email.com',
    phone: '027 555 8901',
    address: '33 Ocean Lane, Tauranga 3110',
    region: 'Bay of Plenty',
    quotes: [
      {
        id: '5',
        number: 'Q-2025-005',
        date: '2025-11-16',
        status: 'Rejected',
        jobType: 'Finish Off',
        quotedValue: 5600,
        marginPercentage: 28,
      },
    ],
  },
  'Emma Davis': {
    name: 'Emma Davis',
    email: 'emma.d@email.com',
    phone: '021 654 3210',
    address: '56 Elm St, Auckland 1041',
    region: 'Auckland',
    quotes: [
      {
        id: '6',
        number: 'Q-2025-006',
        date: '2025-11-15',
        status: 'Tender/Jobs - to price',
        jobType: 'EECA',
        quotedValue: 7200,
        marginPercentage: 45,
      },
    ],
  },
}

interface CustomerModalProps {
  customerName: string | null
  isOpen: boolean
  onClose: () => void
  onQuoteClick?: (quoteNumber: string) => void
}

export default function CustomerModal({
  customerName,
  isOpen,
  onClose,
  onQuoteClick,
}: CustomerModalProps) {
  if (!isOpen || !customerName) return null

  const customer = mockCustomers[customerName]

  if (!customer) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Customer Not Found</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <p className="text-gray-600">No customer data found</p>
        </div>
      </div>
    )
  }

  const totalValue = customer.quotes.reduce((sum, q) => sum + q.quotedValue, 0)
  const wonQuotes = customer.quotes.filter((q) => q.status === 'Won')
  const wonValue = wonQuotes.reduce((sum, q) => sum + q.quotedValue, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
            <p className="text-sm text-gray-600 mt-1">Customer 360° View</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <p className="text-gray-900 font-medium">{customer.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <p className="text-gray-900">{customer.region}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <a
                  href={`mailto:${customer.email || ''}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {customer.email || '-'}
                </a>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <a
                  href={`tel:${customer.phone || ''}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {customer.phone || '-'}
                </a>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <p className="text-gray-900">{customer.address}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Statistics
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 font-medium">Total Quotes</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {customer.quotes.length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 font-medium">Won Quotes</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {wonQuotes.length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 font-medium">Total Value</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <p className="text-sm text-gray-600 font-medium">Won Value</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  ${wonValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Related Quotes ({customer.quotes.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Quote
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Job Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Value
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Margin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customer.quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                        <button
                          onClick={() => onQuoteClick?.(quote.number)}
                          className="hover:underline"
                        >
                          {quote.number}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {quote.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {quote.jobType}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full inline-flex ${
                            statusColors[quote.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        ${quote.quotedValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                        {quote.marginPercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
              <Mail className="w-4 h-4" />
              Send Email
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
              <Phone className="w-4 h-4" />
              Call Customer
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
              Edit Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}