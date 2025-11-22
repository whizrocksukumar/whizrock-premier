'use client'

import { useState } from 'react'
import { Search, Download, Plus, ChevronUp, ChevronDown } from 'lucide-react'

interface Quote {
  id: number
  quoteNo: string
  region: string
  source: string
  jobType: string
  status: string
  quoteDate: string
  followUp: string
  salesRep: string
  customer: string
  site: string
  total: number
  margin: number
}

const mockQuotes: Quote[] = [
  {
    id: 1,
    quoteNo: "Q-2025-184",
    region: "Auckland",
    source: "Phone",
    jobType: "Residential New Build",
    status: "Sent",
    quoteDate: "2025-11-18",
    followUp: "2025-11-25",
    salesRep: "Pam",
    customer: "John Smith",
    site: "8 Ulster Road, Blockhouse Bay",
    total: 5420.00,
    margin: 42,
  },
]

const statusColors: Record<string, string> = {
  Draft: "bg-yellow-100 text-yellow-800", // Adjusted to match reference style
  Sent: "bg-blue-100 text-blue-800",
  Accepted: "bg-green-100 text-green-800",
  "Not Accepted": "bg-red-100 text-red-800",
}

export default function QuotesPage() {
  const [quotes] = useState(mockQuotes)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Quote; direction: 'asc' | 'desc' } | null>(null)

  const handleSort = (key: keyof Quote) => {
    setSortConfig(current => 
      current?.key === key 
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    )
  }

  // Helper to format table headers
  const formatHeader = (key: string) => {
    if (key === 'quoteNo') return 'QUOTE #'
    if (key === 'total') return 'TOTAL (EX GST)'
    if (key === 'margin') return 'MARGIN %'
    return key.replace(/([A-Z])/g, ' $1').toUpperCase()
  }

  return (
    // Main container with padding and background to match the clean look
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Main Card Container - Matches the clean, rounded look from the reference image */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header Section - Matches the clean, white background style */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quote Management</h1>
            <p className="text-gray-500 mt-1">View, edit, and create new quotes.</p>
          </div>
          <div className="flex gap-3">
            {/* New Client Button - Green */}
            <button className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md">
              New Client
            </button>
            {/* Create New Quote Button - Blue */}
            <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Create New Quote
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 items-center mb-8">
          {/* Search Bar - 40% width as requested */}
          <div className="w-2/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client or quote #"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {/* Status Filter */}
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700">
            <option>All Statuses</option>
            <option>Draft</option>
            <option>Sent</option>
            <option>Accepted</option>
          </select>
          {/* Export Button */}
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                {['quoteNo', 'quoteDate', 'customer', 'status', 'jobType', 'salesRep', 'total', 'margin'].map((key) => (
                  <th 
                    key={key} 
                    // Increased padding and adjusted text size/color to match reference
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => ['region', 'customer', 'jobType', 'salesRep'].includes(key) && handleSort(key as keyof Quote)}
                  >
                    <div className="flex items-center gap-1">
                      {formatHeader(key)}
                      {['region', 'customer', 'jobType', 'salesRep'].includes(key) && (
                        sortConfig?.key === key ? (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        ) : <ChevronUp className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                  {/* Quote No - Blue link, font-medium */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600"><a href={`/quotes/${q.id}`}>{q.quoteNo}</a></td>
                  {/* Quote Date */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{q.quoteDate}</td>
                  {/* Customer */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{q.customer}</td>
                  {/* Status - Pill style */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${statusColors[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                  {/* Job Type */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{q.jobType}</td>
                  {/* Sales Rep */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{q.salesRep}</td>
                  {/* Total */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">${q.total.toFixed(2)}</td>
                  {/* Margin */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{q.margin}%</td>
                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <a href={`/quotes/${q.id}`} className="text-blue-600 hover:text-blue-800">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
