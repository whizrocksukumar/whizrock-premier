"use client";

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
    <div className="space-y-6 max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Active Quotes" value={mockMetrics.activeQuotes} />
        <MetricCard title="Won This Month" value={mockMetrics.wonThisMonth} color="text-green-600" />
        <MetricCard title="Pending VA" value={mockMetrics.pendingVA} />
      </div>

      {/* Recent Quotes */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Quotes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Quote #', 'Client', 'Site', 'Status', 'Value'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockRecentQuotes.map(q => (
                <tr key={q.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">{q.number}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{q.client}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{q.site}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${statusStyles[q.status] || ''}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">${q.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Jobs */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Upcoming Jobs</h3>
        <div className="space-y-4">
            {mockUpcomingJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p className="font-semibold text-gray-800">{job.date} - {job.site}</p>
                        <p className="text-sm text-gray-600">{job.details}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${statusStyles[job.status] || ''}`}>
                      {job.status}
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color = 'text-gray-900' }: { title: string, value: number, color?: string }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
    )
}