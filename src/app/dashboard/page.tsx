'use client';

import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { TrendingUp, Users, FileText, Zap, ArrowUpRight, ArrowDownRight, Calendar, MapPin, AlertCircle, CheckCircle, Wrench } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  // KPI data - expanded with tasks and installations
  const kpis = [
    { label: 'Revenue', value: '$284.5K', change: '+12.5%', trend: 'up', icon: TrendingUp, color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' },
    { label: 'Quotes', value: '24', change: '+3', trend: 'up', icon: FileText, color: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' },
    { label: 'Conversion', value: '68.5%', change: '+2.1%', trend: 'up', icon: Zap, color: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' },
    { label: 'Tasks Due Today', value: '5', subtitle: 'Action Required', trend: 'neutral', icon: Calendar, color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' },
    { label: 'Overdue Tasks', value: '2', subtitle: 'Urgent', trend: 'down', icon: AlertCircle, color: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' },
    { label: 'Installations Today', value: '3', subtitle: 'Scheduled', trend: 'up', icon: Wrench, color: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' },
    { label: 'Installations This Week', value: '12', subtitle: 'Scheduled', trend: 'up', icon: CheckCircle, color: 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200' }
  ];

  // Regional data
  const regionalData = [
    { name: 'West Auckland', revenue: 52, quotes: 8, margin: 35.2 },
    { name: 'Rodney', revenue: 48.5, quotes: 7, margin: 33.8 },
    { name: 'North Shore', revenue: 61.2, quotes: 9, margin: 36.4 },
    { name: 'Central', revenue: 55.8, quotes: 8, margin: 32.1 },
    { name: 'South', revenue: 42.3, quotes: 6, margin: 31.9 },
    { name: 'East', revenue: 24.7, quotes: 4, margin: 28.7 }
  ];

  // Revenue trend
  const revenueTrend = [
    { month: 'Aug', revenue: 45, target: 50 },
    { month: 'Sep', revenue: 52, target: 55 },
    { month: 'Oct', revenue: 48.5, target: 55 },
    { month: 'Nov', revenue: 61.2, target: 60 },
    { month: 'Dec', revenue: 77.8, target: 70 }
  ];

  // Conversion funnel
  const conversionFunnel = [
    { stage: 'Enquiries', value: 145, percentage: 100 },
    { stage: 'Assessments', value: 98, percentage: 67.6 },
    { stage: 'Quotes', value: 67, percentage: 46.2 },
    { stage: 'Converted', value: 46, percentage: 31.7 }
  ];

  const recentQuotes = [
    { id: 'Q-001', client: 'Acme Corp', amount: '$8,500', date: '2 hours ago', status: 'Pending' },
    { id: 'Q-002', client: 'BuildRight Ltd', amount: '$12,300', date: '5 hours ago', status: 'Accepted' },
    { id: 'Q-003', client: 'Property Pros', amount: '$6,200', date: '1 day ago', status: 'Pending' }
  ];

  const upcomingAssessments = [
    { client: 'John Smith', date: 'Today 9:00 AM', address: '15 Queen St, Auckland' },
    { client: 'Jane Doe', date: 'Tomorrow 2:00 PM', address: '42 King Ave, Rodney' },
    { client: 'Bob Wilson', date: 'Dec 10, 10:00 AM', address: '88 Shore Rd, North Shore' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Demo Banner */}
      <div className="bg-amber-50 border-b-2 border-amber-300 px-6 py-3">
        <div className="max-w-7xl mx-auto">
         <p className="text-amber-900 text-sm font-medium">
           📊 <strong>Demo Mode:</strong> This dashboard displays sample data to demonstrate capabilities. Production version will display live business metrics.
         </p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
         <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
         <p className="text-gray-600">Strategic overview of your business performance</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* KPI Cards - 7 columns, responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 mb-8">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className={`${kpi.color} border rounded-lg p-4 shadow-sm hover:shadow-md transition-all`}>
                <div className="flex items-start justify-between mb-3">
                  {Icon && <Icon className="w-5 h-5 text-gray-700 opacity-60" />}
                  {kpi.trend !== 'neutral' && (
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {kpi.change}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-xs font-medium mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                {kpi.subtitle && <p className="text-xs text-gray-500 mt-1">{kpi.subtitle}</p>}
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: ValueType) => {
                    const num = typeof value === 'number' ? value : Number(value);
                    return [num, 'Revenue'];
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#0066CC" name="Actual" strokeWidth={2} dot={{ fill: '#0066CC' }} />
                <Line type="monotone" dataKey="target" stroke="#ccc" name="Target" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Regional Revenue Chart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Regional Revenue Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(1)}K`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#0066CC" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Margin by Region - FIXED LINE 144 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Profit Margin by Region</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Margin']} />
                <Bar dataKey="margin" fill="#8b5cf6" name="Margin %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion Funnel */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Conversion Funnel</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={100} />
                  <Tooltip formatter={(value: any) => [Number(value), 'Count']} />
                  <Bar dataKey="value" fill="#0066CC" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Bottom Section - Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Quotes */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Recent Quotes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Quote ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Client</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map((quote, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-[#0066CC]">{quote.id}</td>
                      <td className="px-6 py-3 text-gray-900">{quote.client}</td>
                      <td className="px-6 py-3 font-semibold text-gray-900">{quote.amount}</td>
                      <td className="px-6 py-3 text-gray-600 text-xs">{quote.date}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${quote.status === 'Accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {quote.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Assessments */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Upcoming Assessments</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {upcomingAssessments.map((assessment, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50">
                 <p className="font-semibold text-gray-900 text-sm mb-1">{assessment.client}</p>
                 <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                   <Calendar className="w-3 h-3" />
                   {assessment.date}
                 </p>
                 <p className="text-xs text-gray-500 flex items-center gap-1">
                   <MapPin className="w-3 h-3" />
                   {assessment.address}
                 </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
