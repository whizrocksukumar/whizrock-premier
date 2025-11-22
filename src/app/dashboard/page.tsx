import Link from 'next/link'

export default function DashboardPage() {
  return (
    // Added padding and increased vertical spacing to match the clean, spacious look
    <div className="p-8 space-y-10 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* KPI Cards - Horizontally stacked with enhanced box shadows and clean look */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Quotes This Month</h3>
          <p className="text-4xl font-bold text-gray-900">47</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Jobs Scheduled</h3>
          <p className="text-4xl font-bold text-gray-900">23</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Conversion Rate</h3>
          <p className="text-4xl font-bold text-blue-600">68%</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Revenue (ex GST)</h3>
          <p className="text-4xl font-bold text-gray-900">$184,320</p>
        </div>
      </div>

      {/* Quick Actions - Individual buttons stacked separately with shadows */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="flex gap-4">
          {/* Added shadow-md and transition for a more pronounced button look */}
          <Link href="/quotes" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-shadow duration-300">
            New Quote
          </Link>
          <Link href="/jobs" className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-shadow duration-300">
            New Job
          </Link>
          <Link href="/calendar" className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg shadow-md hover:bg-purple-700 hover:shadow-lg transition-shadow duration-300">
            Calendar
          </Link>
          <Link href="/assessments" className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg shadow-md hover:bg-orange-700 hover:shadow-lg transition-shadow duration-300">
            Assessment
          </Link>
          <Link href="/customers" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-shadow duration-300">
            Customers
          </Link>
        </div>
      </div>
      
      {/* Placeholder for other dashboard content like charts/recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg h-96">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <p className="text-gray-500">Content placeholder...</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg h-96">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Chart</h3>
          <p className="text-gray-500">Content placeholder...</p>
        </div>
      </div>
    </div>
  )
}
