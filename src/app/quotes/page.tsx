'use client'

import { useState } from 'react'
import { Search, Filter, Download, Plus, ChevronUp, ChevronDown } from 'lucide-react'

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Quotes Management</h1>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Quote
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-4 items-center bg-gray-50">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Quote #, Customer, Site Address..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <select className="px-4 py-3 border rounded-lg">
            <option>All Status</option>
            <option>Draft</option>
            <option>Sent</option>
            <option>Accepted</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-100">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-900 text-white text-sm font-bold uppercase tracking-wider">
              <tr>
                {['quoteNo', 'region', 'source', 'jobType', 'status', 'quoteDate', 'followUp', 'salesRep', 'customer', 'site', 'total', 'margin'].map((key) => (
                  <th key={key} className="px-4 py-4 text-left font-bold uppercase tracking-wider cursor-pointer hover:bg-blue-800"
                      onClick={() => ['region', 'customer', 'jobType', 'salesRep'].includes(key) && handleSort(key as keyof Quote)}>
                    <div className="flex items-center gap-1">
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
                <th className="px-4 py-4 text-left font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <a href={`/quotes/${q.id}`} className="text-blue-600 font-medium hover:underline">
                      {q.quoteNo}
                    </a>
                  </td>
                  <td className="px-4 py-4 text-sm">{q.region}</td>
                  <td className="px-4 py-4 text-sm">{q.source}</td>
                  <td className="px-4 py-4 text-sm">{q.jobType}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[q.status] || 'bg-gray-100 text-gray-800'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">{q.quoteDate}</td>
                  <td className="px-4 py-4 text-sm">{q.followUp || "-"}</td>
                  <td className="px-4 py-4 text-sm">{q.salesRep}</td>
                  <td className="px-4 py-4 text-sm">{q.customer}</td>
                  <td className="px-4 py-4 text-sm">{q.site}</td>
                  <td className="px-4 py-4 text-sm font-medium">${q.total.toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm">{q.margin}%</td>
                  <td className="px-4 py-4 text-sm">
                    <a href={`/quotes/${q.id}`} className="text-blue-600 hover:underline mr-3">View</a>
                    <button className="text-gray-600 hover:underline">Edit</button>
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