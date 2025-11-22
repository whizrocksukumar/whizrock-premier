// Enhanced Dashboard with MYCS-style cards and charts
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'; // Add recharts: npm i recharts

const mockMetrics = { quotes: 47, jobs: 9, conversion: 88, revenue: 184320 };
const mockChartData = [
  { name: 'Jan', quotes: 30, won: 20 },
  { name: 'Feb', quotes: 35, won: 25 },
  // ... more from salesByRep in prototype
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Premier Branding */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-500">Premier West Rodney | Henderson, Auckland</div>
      </div>

      {/* Metrics Cards - Mockup Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Quotes This Month</p>
              <p className="text-3xl font-bold text-gray-800">{mockMetrics.quotes}</p>
            </div>
            <i className="fas fa-file-invoice text-3xl text-orange-500"></i>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Jobs Scheduled</p>
              <p className="text-3xl font-bold text-green-600">{mockMetrics.jobs}</p>
            </div>
            <i className="fas fa-calendar-check text-3xl text-green-500"></i>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-3xl font-bold text-blue-600">{mockMetrics.conversion}%</p>
            </div>
            <i className="fas fa-chart-line text-3xl text-blue-500"></i>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Revenue (ex GST)</p>
              <p className="text-3xl font-bold text-orange-600">${mockMetrics.revenue.toLocaleString()}</p>
            </div>
            <i className="fas fa-dollar-sign text-3xl text-orange-500"></i>
          </div>
        </div>
      </div>

      {/* Quick Actions - From Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <i className="fas fa-bolt mr-2 text-orange-500"></i> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {['New Quote', 'New Job', 'Calendar', 'Assessment'].map(action => (
              <button key={action} className="bg-orange-50 hover:bg-orange-100 p-3 rounded-lg text-left transition">
                <i className="fas fa-plus text-orange-500"></i> {action}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="quotes" fill="#F97316" />
              <Bar dataKey="won" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Navigation Sidebar Placeholder - Pin/Unpin from Specs */}
      <aside className="fixed left-0 top-20 h-full w-64 bg-gray-800 text-white p-4 overflow-y-auto"> {/* Sidebar content from specs: Quotes, Jobs, etc. */} </aside>
    </div>
  );
}