// src/app/dashboard/page.tsx
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image
                src="/premier-logo.webp"
                alt="Premier Insulation"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-gray-400">|</span>
              <Image
                src="/whizrock-logo.png"
                alt="Whizrock"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            <div className="text-sm text-gray-600">
              Premier West Rodney • Henderson, Auckland
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Quotes This Month</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">47</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Jobs Scheduled</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">23</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">68%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Revenue (ex GST)</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">$184,320</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/quotes" className="bg-blue-600 text-white text-center py-4 rounded-lg hover:bg-blue-700 font-medium">
              New Quote
            </Link>
            <Link href="/jobs" className="bg-green-600 text-white text-center py-4 rounded-lg hover:bg-green-700 font-medium">
              New Job
            </Link>
            <Link href="/calendar" className="bg-purple-600 text-white text-center py-4 rounded-lg hover:bg-purple-700 font-medium">
              Calendar
            </Link>
            <Link href="/assessments" className="bg-orange-600 text-white text-center py-4 rounded-lg hover:bg-orange-700 font-medium">
              Assessment
            </Link>
            <Link href="/customers" className="bg-indigo-600 text-white text-center py-4 rounded-lg hover:bg-indigo-700 font-medium">
              Customers
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}