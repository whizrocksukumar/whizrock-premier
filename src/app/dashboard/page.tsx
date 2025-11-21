import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* KPI Cards - Horizontally stacked with box shadows */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm hover:shadow-md">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Quotes This Month</h3>
          <p className="text-4xl font-bold text-gray-900">47</p>
        </div>
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm hover:shadow-md">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Jobs Scheduled</h3>
          <p className="text-4xl font-bold text-gray-900">23</p>
        </div>
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm hover:shadow-md">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Conversion Rate</h3>
          <p className="text-4xl font-bold text-blue-600">68%</p>
        </div>
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm hover:shadow-md">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Revenue (ex GST)</h3>
          <p className="text-4xl font-bold text-gray-900">$184,320</p>
        </div>
      </div>

      {/* Quick Actions - Individual buttons stacked separately */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="flex gap-4">
          <Link href="/quotes" className="px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700">
            New Quote
          </Link>
          <Link href="/jobs" className="px-6 py-3 bg-green-600 text-white font-medium rounded hover:bg-green-700">
            New Job
          </Link>
          <Link href="/calendar" className="px-6 py-3 bg-purple-600 text-white font-medium rounded hover:bg-purple-700">
            Calendar
          </Link>
          <Link href="/assessments" className="px-6 py-3 bg-orange-600 text-white font-medium rounded hover:bg-orange-700">
            Assessment
          </Link>
          <Link href="/customers" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700">
            Customers
          </Link>
        </div>
      </div>
    </div>
  )
}