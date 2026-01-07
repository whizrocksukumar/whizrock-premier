'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Mail, Printer, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface AssessmentDetail {
  id: string
  reference_number: string
  site_id: string | null
  scheduled_date: string
  scheduled_time: string
  status: string
  assigned_installer_id: string | null
  client_id: string | null
  created_at: string
  notes: string | null
  completed_date: string | null
  completed_at: string | null

  // Fetched relationships
  client_name?: string
  client_email?: string
  client_phone?: string
  company_name?: string
  installer_name?: string
  installer_email?: string
  site_address?: string

  // Assessment details
  assessment_date?: string
  assessor_name?: string
  existing_insulation?: string
  site_access?: string
  removal_required?: boolean
}

interface AssessmentArea {
  id: string
  assessment_id: string
  area_name: string
  existing_insulation_type: string
  result_type: string
  notes: string
  square_metres: number
}

export default function AssessmentDetailPage() {
  const params = useParams()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null)
  const [areas, setAreas] = useState<AssessmentArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    fetchAssessmentDetails()
  }, [assessmentId])

  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching assessment with ID:', assessmentId)

      // Try fetching without relationships first to isolate the issue
      const { data: basicData, error: basicError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single()

      console.log('Basic assessment query:', { data: basicData, error: basicError })

      if (basicError || !basicData) {
        console.error('Assessment not found with ID:', assessmentId)
        setError('Assessment not found. Please check the assessment ID.')
        setLoading(false)
        return
      }

      // Now fetch site separately if exists
      let siteData = null
      if (basicData.site_id) {
        const { data: site } = await supabase
          .from('sites')
          .select('address_line_1, address_line_2, city, postcode')
          .eq('id', basicData.site_id)
          .single()
        siteData = site
      }

      const assessmentData = {
        ...basicData,
        sites: siteData
      }

      console.log('Successfully loaded assessment:', assessmentData.reference_number)

      // Fetch client details
      let clientData = null
      if (assessmentData.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, phone, company_id')
          .eq('id', assessmentData.client_id)
          .single()

        clientData = client
      }

      // Fetch company details
      let companyName = ''
      if (clientData?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('id, company_name')
          .eq('id', clientData.company_id)
          .single()

        companyName = company?.company_name || ''
      }

      // Fetch installer details
      let installerData = null
      if (assessmentData.assigned_installer_id) {
        const { data: installer } = await supabase
          .from('team_members')
          .select('id, first_name, last_name, email')
          .eq('id', assessmentData.assigned_installer_id)
          .single()

        installerData = installer
      }

      // Fetch assessment areas
      const { data: areasData } = await supabase
        .from('assessment_areas')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('id')

      // Construct site address
      let site_address = '—'
      if (assessmentData.sites) {
        const site = assessmentData.sites
        const addressParts = [
          site.address_line_1,
          site.address_line_2,
          site.city,
          site.postcode
        ].filter(Boolean)
        site_address = addressParts.join(', ') || '—'
      }

      setAssessment({
        ...assessmentData,
        client_name: clientData ? `${clientData.first_name} ${clientData.last_name}` : 'No Client',
        client_email: clientData?.email || '',
        client_phone: clientData?.phone || '',
        company_name: companyName || '—',
        installer_name: installerData ? `${installerData.first_name} ${installerData.last_name}` : 'Unassigned',
        installer_email: installerData?.email || '',
        site_address
      })

      setAreas(areasData || [])
    } catch (err) {
      console.error('Error fetching assessment:', err)
      setError(err instanceof Error ? err.message : 'Failed to load assessment')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = () => {
    if (!assessment?.client_email) {
      alert('No email address for this client')
      return
    }
    // TODO: Implement email functionality
    alert(`Email functionality to be implemented. Would send to: ${assessment.client_email}`)
  }

  const handleDownloadPDF = () => {
    // TODO: Generate and download PDF
    alert('PDF download functionality to be implemented')
  }

  const handleMarkComplete = async () => {
    if (!confirm('Mark this assessment as complete and notify VA to create product recommendation?')) {
      return
    }

    setCompleting(true)
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/complete`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.ok) {
        alert('✓ Assessment marked complete!\n✉ VA has been notified via email to create product recommendation.')
        fetchAssessmentDetails() // Refresh the page
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert('Failed to mark assessment complete')
      console.error(error)
    }
    setCompleting(false)
  }

  const getResultBadgeColor = (result: string) => {
    switch (result) {
      case 'Pass':
        return 'bg-green-100 text-green-800'
      case 'Fail':
        return 'bg-red-100 text-red-800'
      case 'Exempt':
        return 'bg-blue-100 text-blue-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />
      case 'Cancelled':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment details...</p>
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
          <Link href="/assessments" className="flex items-center gap-2 text-[#0066CC] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Assessments
          </Link>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Assessment not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER - Hidden on print */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <Link href="/assessments" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Assessments
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{assessment.reference_number}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {assessment.client_name} • {assessment.site_address}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleEmail}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            {assessment.status !== 'Completed' && (
              <button
                onClick={handleMarkComplete}
                disabled={completing}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                {completing ? 'Completing...' : 'Mark Complete & Notify VA'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATUS BAR - Hidden on print */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-sm font-semibold rounded-full flex items-center gap-2 ${getStatusColor(assessment.status)}`}>
            {getStatusIcon(assessment.status)}
            {assessment.status}
          </span>

          {assessment.scheduled_date && (
            <span className="text-sm text-gray-600">
              Scheduled: {formatDate(assessment.scheduled_date)} at {assessment.scheduled_time}
            </span>
          )}

          {assessment.completed_date && (
            <span className="text-sm text-gray-600">
              Completed: {formatDate(assessment.completed_date)}
            </span>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-6 space-y-6 print:p-8">

        {/* KEY INFO CARDS - Screen view only */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">

          {/* CLIENT CARD */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Client Details</h3>
            <div className="space-y-2 text-sm">
              {assessment.company_name && assessment.company_name !== '—' && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Company</span>
                  <span className="font-medium">{assessment.company_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{assessment.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-xs">{assessment.client_email || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{assessment.client_phone || '—'}</span>
              </div>
            </div>
          </div>

          {/* SITE CARD */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Site Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-right text-xs">{assessment.site_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scheduled Date</span>
                <span className="font-medium">{formatDate(assessment.scheduled_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scheduled Time</span>
                <span className="font-medium">{assessment.scheduled_time}</span>
              </div>
              {assessment.completed_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed Date</span>
                  <span className="font-medium">{formatDate(assessment.completed_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ASSESSMENT CARD */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Assessment Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-medium">{assessment.reference_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Installer</span>
                <span className="font-medium">{assessment.installer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                  {assessment.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">{formatDate(assessment.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ASSESSMENT AREAS - Both screen and print */}
        <div className="bg-white rounded-lg shadow overflow-hidden print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Areas Assessed</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Area</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Existing Insulation</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Result</th>
                </tr>
              </thead>
              <tbody>
                {areas.length > 0 ? (
                  areas.map((area) => (
                    <tr key={area.id} className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
                      <td className="px-4 py-3 text-gray-900 font-medium">{area.area_name}</td>
                      <td className="px-4 py-3 text-gray-700">{area.existing_insulation_type}</td>
                      <td className="px-4 py-3 text-gray-700 text-sm">{area.notes || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getResultBadgeColor(area.result_type)}`}>
                          {area.result_type}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No assessment areas recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* NOTES SECTION */}
        {assessment.notes && (
          <div className="bg-white rounded-lg shadow p-6 print:shadow-none">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{assessment.notes}</p>
          </div>
        )}

        {/* COMPLIANCE STATEMENT - Print only */}
        <div className="hidden print:block bg-white p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Statement</h2>
          <div className="text-sm text-gray-700 space-y-3">
            <p>
              The Residential Tenancies Act Amendment requires all Landlords to make a statement in the tenancy agreement on the details about the insulation installed in their residential property and sets out minimum standards for insulation to be met by the July 2019 Residential Tenancies Regulations and the Healthy Homes Standards Regulations.
            </p>
            <p>
              As requested, we have completed an insulation quality assessment on the property and provide the following report for your consideration.
            </p>
          </div>
        </div>

        {/* FOOTER - Print only */}
        <div className="hidden print:block bg-orange-500 text-white p-6 text-center mt-8">
          <p className="text-2xl font-bold">PREMIER INSULATION</p>
          <p className="text-lg font-semibold mt-1">0800 467 855</p>
          <p className="text-sm mt-2">www.premierinsulation.co.nz</p>
        </div>
      </div>
    </div>
  )
}
