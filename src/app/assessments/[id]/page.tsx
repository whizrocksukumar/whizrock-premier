'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Mail, Printer, Edit, Download } from 'lucide-react'
import Link from 'next/link'

interface AssessmentDetail {
  id: string
  reference_number: string
  site_address: string
  scheduled_date: string
  scheduled_time: string
  status: string
  assigned_installer_id: string | null
  client_id: string | null
  created_at: string
  notes: string | null
  
  // Fetched relationships
  client_name?: string
  client_email?: string
  client_phone?: string
  company_name?: string
  installer_name?: string
  installer_email?: string
  
  // Assessment details
  assessment_date?: string
  assessor_name?: string
  existing_insulation?: string
  site_access?: string
  removal_required?: boolean
  
  // Areas assessed - would be from separate table in full implementation
  areas_assessed?: Array<{
    area_type: string
    description: string
    result: 'PASS' | 'FAIL' | 'EXEMPT' | 'NOT_ASSESSED'
  }>
}

interface AssessmentArea {
  id: string
  assessment_id: string
  area_type: string
  description: string
  result: string
}

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null)
  const [areas, setAreas] = useState<AssessmentArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAssessmentDetails()
  }, [assessmentId])

  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single()

      if (assessmentError) throw assessmentError
      if (!assessmentData) {
        setError('Assessment not found')
        return
      }

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

      setAssessment({
        ...assessmentData,
        client_name: clientData ? `${clientData.first_name} ${clientData.last_name}` : 'No Client',
        client_email: clientData?.email || '',
        client_phone: clientData?.phone || '',
        company_name: companyName || '—',
        installer_name: installerData ? `${installerData.first_name} ${installerData.last_name}` : 'Unassigned',
        installer_email: installerData?.email || ''
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

  const getResultBadgeColor = (result: string) => {
    switch (result) {
      case 'PASS':
        return 'bg-green-100 text-green-800'
      case 'FAIL':
        return 'bg-red-100 text-red-800'
      case 'EXEMPT':
        return 'bg-gray-100 text-gray-800'
      case 'NOT_ASSESSED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
        <div className="bg-white border-b border-gray-200 px-6 py-4">
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
      {/* Header with Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/assessments" className="flex items-center gap-2 text-[#0066CC] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Assessments
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              title="Print assessment"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleEmail}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              title="Email assessment"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] text-sm font-medium"
              title="Download as PDF"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <Link
              href={`/assessments/${assessmentId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] text-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Printable */}
      <div className="p-6 max-w-7xl mx-auto print:p-0 print:bg-white">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden print:rounded-none print:shadow-none">
          
          {/* Document Header */}
          <div className="border-b border-gray-200 p-8 bg-white print:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Statement of Insulation</h1>
                <p className="text-gray-500 mt-1">Assessment Report</p>
              </div>
              <div className="text-right">
                <div className="w-24 h-24 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-center text-sm p-2">
                  PREMIER<br/>INSULATION
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Assessment Reference</h3>
                <p className="text-2xl font-bold text-[#0066CC]">{assessment.reference_number}</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Assessment Date</h3>
                <p className="text-2xl font-bold text-gray-900">{formatDate(assessment.scheduled_date)}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-lg text-gray-900">
                Dear <span className="font-semibold">{assessment.client_name}</span>,
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Re: <span className="font-semibold">Independent Insulation Assessment – {assessment.site_address}</span>
              </p>
            </div>
          </div>

          {/* Assessment Information Section */}
          <div className="border-b border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Details</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Site Address</p>
                  <p className="text-sm text-gray-900 mt-1">{assessment.site_address}</p>
                </div>
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Client Name</p>
                  <p className="text-sm text-gray-900 mt-1">{assessment.client_name}</p>
                </div>
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Client Phone</p>
                  <p className="text-sm text-gray-900 mt-1">{assessment.client_phone || '—'}</p>
                </div>
              </div>
              <div>
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Company</p>
                  <p className="text-sm text-gray-900 mt-1">{assessment.company_name}</p>
                </div>
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Assessor</p>
                  <p className="text-sm text-gray-900 mt-1">{assessment.installer_name}</p>
                </div>
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Assessment Status</p>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      assessment.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : assessment.status === 'Scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {assessment.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Areas Assessed Table */}
          <div className="border-b border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Areas Assessed</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Area Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.length > 0 ? (
                    areas.map((area) => (
                      <tr key={area.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{area.area_type}</td>
                        <td className="px-4 py-3 text-gray-700">{area.description}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getResultBadgeColor(area.result)}`}>
                            {area.result}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        [Assessment areas will be populated here]
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Assessment Result */}
          <div className="border-b border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Assessment Result</h2>
            <div className="bg-blue-50 border-l-4 border-[#0066CC] p-4">
              <p className="text-sm text-gray-900">
                <span className="font-semibold">This property meets the Residential Tenancies Act Regulations for insulation.</span> No further work is required.
              </p>
            </div>
          </div>

          {/* Compliance Statement */}
          <div className="border-b border-gray-200 p-8">
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

          {/* Notes Section */}
          {assessment.notes && (
            <div className="border-b border-gray-200 p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments/Notes</h2>
              <p className="text-sm text-gray-700">{assessment.notes}</p>
            </div>
          )}

          {/* Photos Section */}
          <div className="border-b border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Photos</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded aspect-video flex items-center justify-center border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">[Before Photo]</p>
              </div>
              <div className="bg-gray-100 rounded aspect-video flex items-center justify-center border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">[After Photo]</p>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="border-b border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Assessor Declaration</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="h-20 border-b-2 border-gray-300 mb-2"></div>
                <p className="text-xs font-semibold text-gray-600">Assessor Signature</p>
              </div>
              <div>
                <p className="text-sm text-gray-900 font-semibold">{assessment.installer_name}</p>
                <p className="text-sm text-gray-600">Premier RTA Assessors</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-orange-500 text-white p-8 text-center">
            <p className="text-2xl font-bold">PREMIER INSULATION</p>
            <p className="text-lg font-semibold mt-1">0800 467 855</p>
            <p className="text-sm mt-3">www.premierinsulation.co.nz</p>
          </div>
        </div>
      </div>
    </div>
  )
}