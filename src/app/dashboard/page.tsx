"use client";

import { ArrowUp, ArrowDown } from 'lucide-react';

const mockMetrics = { activeQuotes: 12, wonThisMonth: 8, pendingVA: 3 };
const mockRecentQuotes = [
  { id: 1, number: 'Q-2025-001', client: 'John Smith', site: '8 Ulster Rd', status: 'accepted', value: 4850 },
  { id: 2, number: 'Q-2025-002', client: 'BuildCo Ltd', site: '12 High St', status: 'sent', value: 8920 },
  { id: 3, number: 'Q-2025-003', client: 'Jane Doe', site: '45 Beach Rd', status: 'draft', value: 3200 },
];
const mockUpcomingJobs = [
  { id: 1, date: '2025-11-15', site: '8 Ulster Rd', details: 'John Smith • Team A', status: 'scheduled' }
];

const statusStyles: { [key: string]: string } = {
  draft: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  scheduled: 'bg-green-100 text-green-800',
};

export default function Dashboard() {
  return (
    <div className="space-y-8 p-8">
      {/* Page Header */}
      <div className="section-header">
        <h1 className="section-title">Dashboard</h1>
        <p className="section-subtitle">Welcome back! Here's your business overview.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Active Quotes" 
          value={12}
          trend="+2.5%"
          trendDirection="up"
          color="blue"
        />
        <MetricCard 
          title="Won This Month" 
          value={8}
          trend="+8.2%"
          trendDirection="up"
          color="green"
        />
        <MetricCard 
          title="Pending VA" 
          value={3}
          trend="-1.3%"
          trendDirection="down"
          color="amber"
        />
      </div>

      {/* Recent Quotes Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Quotes</h2>
          <a href="/quotes" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </a>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header">Quote #</th>
                <th className="table-header">Client</th>
                <th className="table-header">Site</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {mockRecentQuotes.map((q, idx) => (
                <tr 
                  key={q.id}
                  className={`${idx !== mockRecentQuotes.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50 transition`}
                >
                  <td className="table-cell-header text-blue-600">{q.number}</td>
                  <td className="table-cell">{q.client}</td>
                  <td className="table-cell">{q.site}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${statusStyles[q.status]}`}>
                      {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell-header text-right">${q.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Jobs Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Jobs</h2>
          <a href="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </a>
        </div>

        <div className="space-y-3">
          {mockUpcomingJobs.map((job) => (
            <div 
              key={job.id} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {job.date} • {job.site}
                </p>
                <p className="text-sm text-gray-600 mt-1">{job.details}</p>
              </div>
              <span className={`status-badge ml-4 flex-shrink-0 ${statusStyles[job.status]}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  trend: string;
  trendDirection: 'up' | 'down';
  color?: 'blue' | 'green' | 'amber';
}

function MetricCard({ 
  title, 
  value, 
  trend,
  trendDirection,
  color = 'blue' 
}: MetricCardProps) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
  };

  const trendColor = trendDirection === 'up' ? 'text-green-600' : 'text-red-600';
  const TrendIcon = trendDirection === 'up' ? ArrowUp : ArrowDown;

  return (
    <div className="metric-card">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <div className={`flex items-center gap-1 text-sm font-semibold ${colorMap[color]}`}>
          <TrendIcon className="w-4 h-4" />
          {trend}
        </div>
      </div>
    </div>
  )
}