import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-sm font-medium text-gray-500">Quotes This Month</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">47</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-sm font-medium text-gray-500">Jobs Scheduled</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">23</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">68%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-sm font-medium text-gray-500">Revenue (ex GST)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">$184,320</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link href="/quotes" className="bg-blue-600 text-white text-center py-4 rounded-lg hover:bg-blue-700 font-medium transition">
            New Quote
          </Link>
          <Link href="/jobs" className="bg-green-600 text-white text-center py-4 rounded-lg hover:bg-green-700 font-medium transition">
            New Job
          </Link>
          <Link href="/calendar" className="bg-purple-600 text-white text-center py-4 rounded-lg hover:bg-purple-700 font-medium transition">
            Calendar
          </Link>
          <Link href="/assessments" className="bg-orange-600 text-white text-center py-4 rounded-lg hover:bg-orange-700 font-medium transition">
            Assessment
          </Link>
          <Link href="/customers" className="bg-indigo-600 text-white text-center py-4 rounded-lg hover:bg-indigo-700 font-medium transition">
            Customers
          </Link>
        </div>
      </div>
    </div>
  )
}