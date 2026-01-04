'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// If your project uses the '@' alias for 'src', try this import:
// import ClientOverviewCard from '@/components/client/ClientOverviewCard';
import ClientOverviewCard from '@/components/client/ClientOverviewCard'
import { fetchClientWithRelations, fetchClientActivitySummary, ClientWithRelations, ActivitySummary } from '@/lib/clients-helpers'
import { fetchOpportunitiesByClient } from '@/lib/opportunities-helpers'
import { fetchQuotesByClient } from '@/lib/quotes-helpers'
import { fetchJobsByClient } from '@/lib/jobs-helpers'
import { fetchInvoicesByClient } from '@/lib/invoices-helpers'
import { fetchAssessmentsByClient } from '@/lib/assessments-queries'
import { fetchCertificatesByClient } from '@/lib/certificates-queries'
import StatusBadge from '@/components/StatusBadge'

type TabType = 'opportunities' | 'quotes' | 'jobs' | 'assessments' | 'invoices' | 'certificates' | 'notes'

interface TabData {
  opportunities: any[]
  quotes: any[]
  jobs: any[]
  assessments: any[]
  invoices: any[]
  certificates: any[]
  notes: any[]
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<ClientWithRelations | null>(null)
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null)
  const [tabData, setTabData] = useState<TabData>({
    opportunities: [],
    quotes: [],
    jobs: [],
    assessments: [],
    invoices: [],
    certificates: [],
    notes: [],
  })
  const [activeTab, setActiveTab] = useState<TabType>('opportunities')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const clientData = await fetchClientWithRelations(clientId)
        setClient(clientData)

        const summary = await fetchClientActivitySummary(clientId)
        setActivitySummary(summary)

        const [opportunities, quotes, jobs, assessments, invoices, certificates] = await Promise.all([
          fetchOpportunitiesByClient(clientId),
          fetchQuotesByClient(clientId),
          fetchJobsByClient(clientId),
          fetchAssessmentsByClient(clientId),
          fetchInvoicesByClient(clientId),
          fetchCertificatesByClient(clientId),
        ])

        setTabData({
          opportunities,
          quotes,
          jobs,
          assessments,
          invoices,
          certificates,
          notes: [],
        })
      } catch (err) {
        console.error('Error loading client detail:', err)
        setError(err instanceof Error ? err.message : 'Failed to load client')
      } finally {
        setLoading(false)
      }
    }

    if (clientId) {
      fetchData()
    }
  }, [clientId])

  const handleEditClick = () => {
    console.log('Edit client:', clientId)
  }

  const handleDeleteClick = () => {
    console.log('Delete client:', clientId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC]"></div>
          <p className="mt-4 text-gray-600">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-800">Error Loading Client</h2>
        <p className="text-red-700 mt-2">{error || 'Client not found'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Go Back
        </button>
      </div>
    )
  }

  const primaryContactName = client.is_primary_contact
    ? client.company_name
    : `${client.first_name} ${client.last_name}`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {client.first_name} {client.last_name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {primaryContactName} • {client.is_primary_contact ? 'Primary Contact' : 'Contact'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] flex items-center gap-2"
                >
                  <span>✎</span> Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                >
                  <span>🗑</span> Delete
                </button>
              </div>
            </div>

            {(client.email || client.phone) && (
              <div className="flex items-center gap-6 text-sm mt-4">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="text-[#0066CC] hover:underline flex items-center gap-2">
                    <span>✉</span>
                    {client.email}
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="text-[#0066CC] hover:underline flex items-center gap-2">
                    <span>☎</span>
                    {client.phone}
                  </a>
                )}
              </div>
            )}

            <hr className="my-6" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ClientOverviewCard client={client} />
              </div>

              {activitySummary && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Summary</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Quotes</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {activitySummary.quotes_total} ({activitySummary.quotes_accepted} accepted)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Assessments</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {activitySummary.assessments_total} ({activitySummary.assessments_completed} complete)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Jobs</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {activitySummary.jobs_total} ({activitySummary.jobs_in_progress} in progress)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Invoices</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {activitySummary.invoices_total} Balance: ${activitySummary.invoices_unpaid_amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Total Revenue</span>
                      <span className="text-sm font-bold text-green-600">
                        ${activitySummary.total_revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200 flex px-6 overflow-x-auto">
            {(['opportunities', 'quotes', 'jobs', 'assessments', 'invoices', 'certificates', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-[#0066CC] text-[#0066CC] bg-[#0066CC] text-white'
                    : 'border-transparent text-gray-600 bg-gray-50 hover:text-[#0066CC]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tabData[tab].length})
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'opportunities' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Opportunities</h3>
                  <button className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] text-sm font-medium">
                    + New Opportunity
                  </button>
                </div>
                {tabData.opportunities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0066CC] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Opportunity #</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Site Address</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Estimated Value</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Stage</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.opportunities.map((opp) => (
                          <tr key={opp.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              <Link href={`/opportunities/${opp.id}`} className="text-[#0066CC] hover:underline">
                                {opp.opp_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{opp.site_address || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">${opp.estimated_value?.toFixed(2) || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{opp.stage || '—'}</td>
                            <td className="px-4 py-3 text-sm">
                              <Link href={`/opportunities/${opp.id}`} className="text-[#0066CC] hover:underline">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No opportunities yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quotes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Quotes</h3>
                  <Link href={`/clients/new?client_id=${clientId}`} className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] text-sm font-medium">
                    + New Quote
                  </Link>
                </div>
                {tabData.quotes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0066CC] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Quote #</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Sales Rep</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.quotes.map((quote) => (
                          <tr key={quote.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              <Link href={`/quotes/${quote.id}`} className="text-[#0066CC] hover:underline">
                                {quote.quote_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {quote.quote_date ? new Date(quote.quote_date).toLocaleDateString('en-NZ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              ${quote.total_inc_gst?.toFixed(2) || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <StatusBadge type="quote" status={quote.status} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {quote.sales_rep ? `${quote.sales_rep.first_name} ${quote.sales_rep.last_name}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Link href={`/quotes/${quote.id}`} className="text-[#0066CC] hover:underline">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No quotes yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Jobs</h3>
                  <button className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] text-sm font-medium">
                    + New Job
                  </button>
                </div>
                {tabData.jobs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0066CC] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Job #</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Scheduled Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Completion Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Value</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.jobs.map((job) => (
                          <tr key={job.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              <Link href={`/jobs/${job.id}`} className="text-[#0066CC] hover:underline">
                                {job.job_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <StatusBadge type="job" status={job.status} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString('en-NZ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {job.completion_date ? new Date(job.completion_date).toLocaleDateString('en-NZ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              ${job.quoted_amount?.toFixed(2) || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Link href={`/jobs/${job.id}`} className="text-[#0066CC] hover:underline">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No jobs yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'assessments' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Assessments</h3>
                  <button className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] text-sm font-medium">
                    + New Assessment
                  </button>
                </div>
                {tabData.assessments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0066CC] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Assessment #</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Scheduled Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Completed Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.assessments.map((assessment) => (
                          <tr key={assessment.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              <Link href={`/assessments/${assessment.id}`} className="text-[#0066CC] hover:underline">
                                {assessment.assessment_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {assessment.scheduled_date ? new Date(assessment.scheduled_date).toLocaleDateString('en-NZ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <StatusBadge type="job" status={assessment.status} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {assessment.completed_at ? new Date(assessment.completed_at).toLocaleDateString('en-NZ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Link href={`/assessments/${assessment.id}`} className="text-[#0066CC] hover:underline">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No assessments yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Invoices</h3>
                  <button className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] text-sm font-medium">
                    + New Invoice
                  </button>
                </div>
                {tabData.invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0066CC] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Invoice #</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Due Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.invoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              <Link href={`/invoices/${invoice.id}`} className="text-[#0066CC] hover:underline">
                                {invoice.invoice_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-NZ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-NZ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              ${invoice.total_inc_gst?.toFixed(2) || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <StatusBadge type="invoice" status={invoice.status} />
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Link href={`/invoices/${invoice.id}`} className="text-[#0066CC] hover:underline">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No invoices yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'certificates' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Certificates</h3>
                  <button className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] text-sm font-medium">
                    + New Certificate
                  </button>
                </div>
                {tabData.certificates.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0066CC] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Certificate #</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Work Completed Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Generated Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Warranty (months)</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.certificates.map((cert) => (
                          <tr key={cert.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {cert.certificate_number}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {cert.work_completed_date ? new Date(cert.work_completed_date).toLocaleDateString('en-NZ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {cert.generated_at ? new Date(cert.generated_at).toLocaleDateString('en-NZ') : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {cert.warranty_period_months || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {cert.certificate_url ? (
                                <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="text-[#0066CC] hover:underline">
                                  Download
                                </a>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No certificates yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Notes</h3>
                  <button className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] text-sm font-medium">
                    + Add Note
                  </button>
                </div>
                <div className="text-center py-12">
                  <p className="text-gray-500">No notes yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}