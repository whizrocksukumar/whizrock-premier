"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Calendar,
  Users,
  ClipboardCheck,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

interface DashboardMetrics {
  totalAssessments: number;
  scheduledAssessments: number;
  completedAssessments: number;
  totalQuotes: number;
  draftQuotes: number;
  sentQuotes: number;
  acceptedQuotes: number;
  totalQuoteValue: number;
  wonQuoteValue: number;
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
}

interface RecentAssessment {
  id: string;
  reference_number: string;
  customer_name: string;
  site_address: string;
  city: string;
  scheduled_date: string;
  status: string;
}

interface RecentQuote {
  id: string;
  quote_number: string;
  customer_first_name: string;
  customer_last_name: string;
  site_address: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface UpcomingJob {
  id: string;
  job_number: string;
  customer_first_name: string;
  customer_last_name: string;
  site_address: string;
  scheduled_date: string;
  status: string;
  quoted_amount: number;
}

const statusStyles: { [key: string]: string } = {
  Scheduled: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-100 text-gray-800',
  Draft: 'bg-yellow-100 text-yellow-800',
  Sent: 'bg-blue-100 text-blue-800',
  Accepted: 'bg-green-100 text-green-800',
  Won: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Lost: 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-purple-100 text-purple-800',
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<RecentAssessment[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch assessments metrics
      const { data: assessments } = await supabase
        .from('assessments')
        .select('status');

      const scheduledCount = assessments?.filter(a => a.status === 'Scheduled').length || 0;
      const completedCount = assessments?.filter(a => a.status === 'Completed').length || 0;

      // Fetch quotes metrics
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('status, total_amount');

      console.log('Quotes data:', quotes);
      console.log('Quotes error:', quotesError);

      const draftQuotesCount = quotes?.filter(q => q.status === 'Draft').length || 0;
      const sentQuotesCount = quotes?.filter(q => q.status === 'Sent').length || 0;
      const acceptedQuotesCount = quotes?.filter(q => q.status === 'Accepted' || q.status === 'Won').length || 0;
      const totalQuoteValue = quotes?.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0) || 0;
      const wonQuoteValue = quotes?.filter(q => q.status === 'Accepted' || q.status === 'Won')
        .reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0) || 0;
      
      console.log('Accepted quotes count:', acceptedQuotesCount);
      console.log('Won quote value:', wonQuoteValue);
      console.log('Total quote value:', totalQuoteValue);

      // Fetch jobs metrics
      const { data: jobs } = await supabase
        .from('jobs')
        .select('status, quoted_amount, actual_cost');

      const activeJobsCount = jobs?.filter(j => j.status === 'Scheduled' || j.status === 'In Progress').length || 0;
      const completedJobsCount = jobs?.filter(j => j.status === 'Completed').length || 0;
      const totalRevenue = jobs?.filter(j => j.status === 'Completed')
        .reduce((sum, j) => sum + (j.actual_cost || j.quoted_amount || 0), 0) || 0;

      setMetrics({
        totalAssessments: assessments?.length || 0,
        scheduledAssessments: scheduledCount,
        completedAssessments: completedCount,
        totalQuotes: quotes?.length || 0,
        draftQuotes: draftQuotesCount,
        sentQuotes: sentQuotesCount,
        acceptedQuotes: acceptedQuotesCount,
        totalQuoteValue,
        wonQuoteValue,
        activeJobs: activeJobsCount,
        completedJobs: completedJobsCount,
        totalRevenue,
      });

      // Fetch recent assessments (last 5)
      const { data: recentAssessmentsData } = await supabase
        .from('assessments')
        .select('id, reference_number, customer_name, site_address, city, scheduled_date, status')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentAssessments(recentAssessmentsData || []);

      // Fetch recent quotes (last 5)
      const { data: recentQuotesData } = await supabase
        .from('quotes')
        .select('id, quote_number, customer_first_name, customer_last_name, site_address, status, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentQuotes(recentQuotesData || []);

      // Fetch upcoming jobs (next 7 days)
      const { data: upcomingJobsData } = await supabase
        .from('jobs')
        .select('id, job_number, customer_first_name, customer_last_name, site_address, scheduled_date, status, quoted_amount')
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .limit(5);

      setUpcomingJobs(upcomingJobsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  const conversionRate = metrics.totalQuotes > 0 
    ? ((metrics.acceptedQuotes / metrics.totalQuotes) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
        <p className="text-gray-600 mt-2">Real-time overview of your insulation business</p>
      </div>

      {/* Key Metrics Grid - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Revenue" 
          value={`$${(metrics.totalRevenue / 1000).toFixed(1)}k`}
          subtitle={`${metrics.completedJobs} completed jobs`}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          trend="+12.5%"
          trendDirection="up"
        />
        <MetricCard 
          title="Pipeline Value" 
          value={`$${(metrics.wonQuoteValue / 1000).toFixed(1)}k`}
          subtitle={`${metrics.acceptedQuotes} accepted quotes`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="blue"
          trend="+8.2%"
          trendDirection="up"
        />
        <MetricCard 
          title="Active Jobs" 
          value={metrics.activeJobs}
          subtitle={`${metrics.completedJobs} completed this month`}
          icon={<Briefcase className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard 
          title="Conversion Rate" 
          value={`${conversionRate}%`}
          subtitle={`${metrics.acceptedQuotes} of ${metrics.totalQuotes} quotes`}
          icon={<CheckCircle className="w-6 h-6" />}
          color="indigo"
          trend="+3.1%"
          trendDirection="up"
        />
      </div>

      {/* Assessment & Quote Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment Pipeline */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              Assessment Pipeline
            </h2>
            <Link href="/assessments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.scheduledAssessments}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.completedAssessments}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalAssessments}</p>
              </div>
              <Users className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Quote Pipeline */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Quote Pipeline
            </h2>
            <Link href="/quotes" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.draftQuotes}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <p className="text-sm font-medium text-gray-600">Sent to Customer</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.sentQuotes}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted/Won</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.acceptedQuotes}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assessments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Assessments</h2>
            <Link href="/assessments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentAssessments.length > 0 ? (
              recentAssessments.map((assessment) => (
                <Link
                  key={assessment.id}
                  href={`/assessments/${assessment.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {assessment.reference_number}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{assessment.customer_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{assessment.city}</p>
                    </div>
                    <span className={`status-badge ml-4 flex-shrink-0 ${statusStyles[assessment.status]}`}>
                      {assessment.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No assessments yet</p>
                <Link href="/assessments/new" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                  Create your first assessment
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Quotes</h2>
            <Link href="/quotes" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentQuotes.length > 0 ? (
              recentQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {quote.quote_number}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {quote.customer_first_name} {quote.customer_last_name}
                      </p>
                      <p className="text-lg font-bold text-green-600 mt-2">
                        ${quote.total_amount?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <span className={`status-badge ml-4 flex-shrink-0 ${statusStyles[quote.status]}`}>
                      {quote.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No quotes yet</p>
                <Link href="/quotes/new" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                  Create your first quote
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Jobs */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Upcoming Jobs
          </h2>
          <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingJobs.length > 0 ? (
            upcomingJobs.map((job) => (
              <div 
                key={job.id} 
                className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`status-badge ${statusStyles[job.status]}`}>
                    {job.status}
                  </span>
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <p className="font-bold text-gray-900 text-lg mb-1">{job.job_number}</p>
                <p className="text-sm text-gray-700 mb-1">
                  {job.customer_first_name} {job.customer_last_name}
                </p>
                <p className="text-xs text-gray-600 mb-3 line-clamp-1">{job.site_address}</p>
                <div className="flex items-center justify-between pt-3 border-t border-purple-200">
                  <p className="text-xs text-gray-600">
                    {new Date(job.scheduled_date).toLocaleDateString('en-NZ', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm font-bold text-purple-700">
                    ${job.quoted_amount?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No upcoming jobs scheduled</p>
              <p className="text-sm mt-2">Jobs will appear here once quotes are accepted</p>
            </div>
          )}
        </div>
      </div>

      {/* Sales Summary Bar Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Sales Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Quotes</span>
              <span className="text-lg font-bold text-gray-900">${(metrics.totalQuoteValue / 1000).toFixed(1)}k</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: '100%' }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{metrics.totalQuotes} quotes</p>
          </div>

          <div className="relative">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Won Pipeline</span>
              <span className="text-lg font-bold text-green-700">${(metrics.wonQuoteValue / 1000).toFixed(1)}k</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ 
                  width: `${metrics.totalQuoteValue > 0 ? (metrics.wonQuoteValue / metrics.totalQuoteValue * 100) : 0}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{metrics.acceptedQuotes} accepted</p>
          </div>

          <div className="relative">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Revenue</span>
              <span className="text-lg font-bold text-purple-700">${(metrics.totalRevenue / 1000).toFixed(1)}k</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ 
                  width: `${metrics.wonQuoteValue > 0 ? (metrics.totalRevenue / metrics.wonQuoteValue * 100) : 0}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{metrics.completedJobs} completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down';
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'indigo';
}

function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon,
  trend,
  trendDirection,
  color = 'blue' 
}: MetricCardProps) {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
  };

  const bgColorMap = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    amber: 'bg-amber-50',
    purple: 'bg-purple-50',
    indigo: 'bg-indigo-50',
  };

  const textColorMap = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    amber: 'text-amber-700',
    purple: 'text-purple-700',
    indigo: 'text-indigo-700',
  };

  const TrendIcon = trendDirection === 'up' ? ArrowUp : ArrowDown;
  const trendColor = trendDirection === 'up' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
          {trend && trendDirection && (
            <div className={`flex items-center gap-1 mt-3 text-sm font-semibold ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              {trend}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bgColorMap[color]}`}>
          <div className={textColorMap[color]}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}