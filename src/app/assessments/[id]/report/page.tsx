import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { ArrowLeft, Download, Mail, CheckCircle } from 'lucide-react'
import { ResultType, RESULT_TYPE_CONFIG } from '@/types/assessmentWordings'

interface Assessment {
  id: string
  reference_number: string
  assessment_date: string
  scheduled_date: string
  site_address: string
  postcode: string
  property_type: string | null
  site_access_level: string | null
  notes: string | null
  status: string
  client_id: string
  assigned_installer_id: string | null
  clients: {
    first_name: string
    last_name: string
    email: string
  } | null
  team_members: {
    first_name: string
    last_name: string
  } | null
}

interface AssessmentArea {
  id: string
  area_name: string
  square_metres: number
  existing_insulation_type: string | null
  recommended_r_value: string | null
  removal_required: boolean
  notes: string | null
  result_type: ResultType
}

interface AssessmentWordings {
  id: string
  area_id: string
  result_type: ResultType
  wordings: string | null
  recommended_action: string | null
}

interface AssessmentPhoto {
  id: string
  photo_url: string
  area_name: string | null
  photo_type: string | null
  notes: string | null
}

async function getAssessmentReport(id: string) {
  try {
    // Get assessment with client and installer details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        id,
        reference_number,
        assessment_date,
        scheduled_date,
        site_address,
        postcode,
        property_type,
        site_access_level,
        notes,
        status,
        client_id,
        assigned_installer_id,
        clients!client_id (
          first_name,
          last_name,
          email
        ),
        team_members!assigned_installer_id (
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single()

    if (assessmentError) throw assessmentError

    // Get assessment areas
    const { data: areas, error: areasError } = await supabase
      .from('assessment_areas')
      .select('*')
      .eq('assessment_id', id)
      .order('area_name')

    if (areasError) throw areasError

    // Get assessment wordings for all areas
    const { data: wordings, error: wordingsError } = await supabase
      .from('assessment_wordings')
      .select('*')
      .eq('assessment_id', id)

    if (wordingsError && wordingsError.code !== 'PGRST116') throw wordingsError

    // Get assessment photos
    const { data: photos, error: photosError } = await supabase
      .from('assessment_photos')
      .select('*')
      .eq('assessment_id', id)
      .order('created_at')

    if (photosError) throw photosError

    return {
      assessment,
      areas: areas || [],
      wordings: wordings || [],
      photos: photos || []
    }
  } catch (err) {
    console.error('Error fetching assessment report:', err)
    return null
  }
}

export default async function AssessmentReportPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getAssessmentReport(id)

  if (!data || !data.assessment) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h1>
            <Link href="/assessments" className="text-[#0066CC] hover:underline">
              Back to Assessments
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { assessment, areas, wordings, photos } = data

  // Create a map of area_id to wordings for quick lookup
  const wordingsMap = new Map(wordings.map(w => [w.area_id, w]))

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatReportDate = () => {
    return new Date().toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const totalAreaAssessed = areas.reduce((sum, area) => sum + (area.square_metres || 0), 0)
  const existingInsulationTypes = [...new Set(areas.map(a => a.existing_insulation_type).filter(Boolean))]
  const removalRequired = areas.some(a => a.removal_required)
  
  const getComplexity = () => {
    if (areas.length <= 2) return 'Simple'
    if (areas.length <= 4) return 'Moderate'
    return 'Complex'
  }

  const clientName = assessment.clients 
    ? `${assessment.clients.first_name} ${assessment.clients.last_name}`
    : 'Unknown Client'

  const installerName = assessment.team_members
    ? `${assessment.team_members.first_name} ${assessment.team_members.last_name}`
    : 'Unassigned'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 print:hidden">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link
            href={`/assessments/${id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assessment
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <Link
              href={`/assessments/${id}/send-report`}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send to Client
            </Link>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* TASK 1: Report Header */}
          <div className="border-b border-gray-300 pb-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <Image
                  src="/premier-insulation-logo-orange.svg"
                  alt="Premier Insulation"
                  width={120}
                  height={60}
                  className="h-auto"
                />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-900">Assessment Report</h1>
                <p className="text-sm text-gray-600 mt-1">Generated: {formatReportDate()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Assessment Number</p>
                <p className="text-lg font-semibold text-gray-900">{assessment.reference_number}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Assessment Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(assessment.assessment_date || assessment.scheduled_date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client Name</p>
                <p className="font-semibold text-gray-900">{clientName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Assessed By</p>
                <p className="font-semibold text-gray-900">{installerName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Site Address</p>
                <p className="font-semibold text-gray-900">{assessment.site_address}</p>
              </div>
            </div>
          </div>

          {/* TASK 2: Assessment Summary Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Assessment Summary</h2>
            <div className="bg-gray-50 rounded-lg p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Property Type</p>
                <p className="font-semibold text-gray-900">{assessment.property_type || 'Residential'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Area Assessed</p>
                <p className="font-semibold text-gray-900">{totalAreaAssessed.toFixed(2)} m²</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Existing Insulation</p>
                <p className="font-semibold text-gray-900">
                  {existingInsulationTypes.length > 0 ? existingInsulationTypes.join(', ') : 'None'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Removal Required</p>
                <p className="font-semibold text-gray-900">{removalRequired ? 'Yes' : 'No'}</p>
              </div>
              {assessment.site_access_level && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Access Notes</p>
                  <p className="text-gray-700">{assessment.site_access_level}</p>
                </div>
              )}
            </div>
          </div>

          {/* TASK 3: Results Table by Area */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Assessment Details by Area</h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                      Area Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                      Result
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                      Square Metres
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                      Existing Insulation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                      Recommended R-Value
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                      Removal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area, index) => {
                    const areaWordings = wordingsMap.get(area.id)
                    const resultType: ResultType = (areaWordings?.result_type || area.result_type || 'Pending') as ResultType
                    const resultConfig = RESULT_TYPE_CONFIG[resultType]
                    
                    return (
                      <React.Fragment key={area.id}>
                        <tr className={`border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-300">
                            {area.area_name}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-300">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${resultConfig.color}`}>
                              <span>{resultConfig.icon}</span>
                              {resultType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300">
                            {area.square_metres.toFixed(2)} m²
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300">
                            {area.existing_insulation_type || 'None'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300">
                            {area.recommended_r_value || 'R2.6'}
                          </td>
                          <td className="px-4 py-3 text-center text-lg border-r border-gray-300">
                            {area.removal_required ? (
                              <span className="text-red-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-400">✗</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {area.notes || '—'}
                          </td>
                        </tr>
                        {areaWordings && (areaWordings.wordings || areaWordings.recommended_action) && (
                          <tr className={`border-b border-gray-300 ${index % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100'}`}>
                            <td colSpan={7} className="px-4 py-3">
                              {areaWordings.wordings && (
                                <div className="mb-2">
                                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Findings:</p>
                                  <p className="text-sm text-gray-800">{areaWordings.wordings}</p>
                                </div>
                              )}
                              {areaWordings.recommended_action && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Recommended Action:</p>
                                  <p className="text-sm text-gray-800">{areaWordings.recommended_action}</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TASK 4: Overall Result Section */}
          <div className="mb-8">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Assessment Completed Successfully</h3>
                  <p className="text-gray-700 mb-4">{assessment.notes || 'All areas assessed and recommendations provided.'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-200">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Total Coverage</p>
                  <p className="text-xl font-bold text-gray-900">{totalAreaAssessed.toFixed(2)} m²</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Labour Complexity</p>
                  <p className="text-xl font-bold text-gray-900">{getComplexity()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Areas Assessed</p>
                  <p className="text-xl font-bold text-gray-900">{areas.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* TASK 5: Photos Gallery */}
          {photos.length > 0 && (
            <div className="mb-8 page-break-before">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Assessment Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-100 relative">
                      <Image
                        src={photo.photo_url}
                        alt={photo.area_name || 'Assessment photo'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3 bg-white">
                      <p className="text-xs font-medium text-gray-900">{photo.area_name || 'General'}</p>
                      {photo.notes && (
                        <p className="text-xs text-gray-600 mt-1">{photo.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TASK 6: Signature/Certification Field */}
          <div className="mb-8 border-t border-gray-300 pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Inspector Certification</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-sm text-gray-700 mb-6 italic">
                "I certify this assessment was completed in accordance with Premier Insulation standards"
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Assessed by:</p>
                  <div className="border-b-2 border-gray-400 pb-1">
                    <p className="text-base font-semibold text-gray-900">{installerName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Date:</p>
                  <div className="border-b-2 border-gray-400 pb-1">
                    <p className="text-base font-semibold text-gray-900">{formatDate(assessment.assessment_date || assessment.scheduled_date)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TASK 7: Compliance Statement */}
          <div className="border-t border-gray-300 pt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-xs text-gray-700 leading-relaxed">
                <strong>Important:</strong> This assessment report is valid for 30 days from the assessment date.
                Site conditions may affect final installation. Please contact Premier Insulation for a detailed quote based on this assessment.
              </p>
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Premier Insulation West Auckland | Phone: (09) XXX-XXXX | Email: info@premierinsulation.co.nz</p>
              <p className="mt-1">Page 1 of 1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .page-break-before {
            page-break-before: always;
          }
          
          .bg-white,
          .bg-gray-50,
          .bg-gray-100,
          .bg-green-50,
          .bg-yellow-50 {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
