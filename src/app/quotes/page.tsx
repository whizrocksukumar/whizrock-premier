// Enhanced Quotes Table with Filters and Actions
import { useState } from 'react';

const mockQuotes = [ // From prototype
  { id: 1, number: 'Q-2025-184', date: '2025-11-18', customer: 'John Smith', status: 'Sent', jobType: 'Residential New Build', salesRep: 'Pam', total: 5420, margin: 42 },
  // ... more
];

const statusStyles = {
  draft: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
};

export default function Quotes() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterJobType, setFilterJobType] = useState('All');

  const filteredQuotes = mockQuotes.filter(q => 
    q.number.includes(search) && (filterStatus === 'All' || q.status === filterStatus) && (filterJobType === 'All' || q.jobType === filterJobType)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quote Management</h1>
        <div className="flex space-x-2">
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">New Client</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Create New Quote</button>
        </div>
      </div>

      {/* Filters - From Specs */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Quote # or Customer"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
            <option>All Status</option>
            <option>Draft</option>
            <option>Sent</option>
            <option>Accepted</option>
          </select>
          <select value={filterJobType} onChange={e => setFilterJobType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
            <option>All Job Types</option>
            <option>Residential New Build</option>
            {/* ... more */}
          </select>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg">Export</button>
        </div>
      </div>

      {/* Quotes Table - Enhanced with Hover/Badges */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Quote #', 'Quote Date', 'Customer', 'Status', 'Job Type', 'Sales Rep', 'Total (ex GST)', 'Margin %', 'Actions'].map(header => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-orange-500">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredQuotes.map(quote => (
              <tr key={quote.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quote.number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[quote.status]}`}>
                    {quote.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.jobType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.salesRep}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${quote.total.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.margin}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-orange-600 hover:text-orange-900">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}