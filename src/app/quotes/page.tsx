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
  Draft: "bg-gray-100 text-gray-800",
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

  return (
    <div className="space-y-8">
      {/* BLUE Header Section */}
      <div className="bg-blue-600 text-white p-8 rounded">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quotes Management</h1>
            <p className="text-blue-100 mt-2">Manage and track all customer quotes</p>
          </div>
          <button className="px-6 py-3 bg-white text-blue-600 font-medium rounded hover:bg-blue-50 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Quote
          </button>
        </div>
      </div>

      {/* Search Bar - 40% width, centered top */}
      <div className="flex gap-4 items-start">
        <div className="w-2/5">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Quote #, Customer, Site Address..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>All Status</option>
          <option>Draft</option>
          <option>Sent</option>
          <option>Accepted</option>
        </select>
        <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                {['quoteNo', 'region', 'source', 'jobType', 'status', 'quoteDate', 'followUp', 'salesRep', 'customer', 'site', 'total', 'margin'].map((key) => (
                  <th 
                    key={key} 
                    className="px-4 py-3 text-left font-semibold text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => ['region', 'customer', 'jobType', 'salesRep'].includes(key) && handleSort(key as keyof Quote)}
                  >
                    <div className="flex items-center gap-2">
                      {key === 'quoteNo' ? 'Quote No' : 
                       key === 'total' ? 'Total (ex GST)' :
                       key === 'margin' ? 'Margin %' :
                       key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      {['region', 'customer', 'jobType', 'salesRep'].includes(key) && (
                        sortConfig?.key === key ? (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        ) : <ChevronUp className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3"><a href={`/quotes/${q.id}`} className="text-blue-600 font-medium">{q.quoteNo}</a></td>
                  <td className="px-4 py-3 text-sm">{q.region}</td>
                  <td className="px-4 py-3 text-sm">{q.source}</td>
                  <td className="px-4 py-3 text-sm">{q.jobType}</td>
                  <td className="px-4 py-3"><span className={`px-3 py-1 rounded text-xs font-medium ${statusColors[q.status]}`}>{q.status}</span></td>
                  <td className="px-4 py-3 text-sm">{q.quoteDate}</td>
                  <td className="px-4 py-3 text-sm">{q.followUp}</td>
                  <td className="px-4 py-3 text-sm">{q.salesRep}</td>
                  <td className="px-4 py-3 text-sm">{q.customer}</td>
                  <td className="px-4 py-3 text-sm">{q.site}</td>
                  <td className="px-4 py-3 text-sm font-medium">${q.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">{q.margin}%</td>
                  <td className="px-4 py-3 text-sm"><a href={`/quotes/${q.id}`} className="text-blue-600">View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}