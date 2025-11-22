"use client";

import { useState } from 'react';

const mockQuotes = [
    { id: 1, number: 'Q-2025-184', date: '2025-11-18', customer: 'John Smith', status: 'Sent', jobType: 'Residential New Build', salesRep: 'Pam', total: 5420, margin: 42 },
    { id: 2, number: 'Q-2025-185', date: '2025-11-19', customer: 'BuildCo Ltd', status: 'Accepted', jobType: 'Commercial Fitout', salesRep: 'John', total: 12500, margin: 35 },
    { id: 3, number: 'Q-2025-186', date: '2025-11-20', customer: 'Jane Doe', status: 'Draft', jobType: 'Residential Retrofit', salesRep: 'Pam', total: 3200, margin: 55 },
];

const statusStyles: { [key: string]: string } = {
  Draft: 'bg-yellow-100 text-yellow-800',
  Sent: 'bg-blue-100 text-blue-800',
  Accepted: 'bg-green-100 text-green-800',
};

export default function Quotes() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredQuotes = mockQuotes.filter(q => 
    q.number.toLowerCase().includes(search.toLowerCase()) || q.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Quotes</h1>
            <p className="text-gray-600">View, edit, and create new quotes.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Create New Quote</button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Search by Quote # or Customer"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[250px]"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Draft</option>
            <option>Sent</option>
            <option>Accepted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Quote #', 'Date', 'Customer', 'Status', 'Job Type', 'Sales Rep', 'Total', 'Margin %', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredQuotes.map(q => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{q.number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{q.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{q.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${statusStyles[q.status] || 'bg-gray-100 text-gray-800'}`}>
                    {q.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{q.jobType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{q.salesRep}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${q.total.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{q.margin}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">View</button>
                  <button className="text-gray-600 hover:text-gray-800">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}