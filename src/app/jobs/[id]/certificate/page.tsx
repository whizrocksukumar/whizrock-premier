import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import CertificateActions from './CertificateActions'

interface JobDetail {
  id: string
  job_number: string
  customer_first_name: string
  customer_last_name: string
  customer_company: string
  site_address: string
  city: string
  postcode: string
  scheduled_date: string
  start_date: string
  completion_date: string
  crew_lead_id: string
  notes: string
  warranty_period_months: number
  created_at: string
}

interface LineItem {
  id: string
  product_code: string
  description: string
  quantity_actual: number
  unit: string
}

interface CrewLead {
  first_name: string
  last_name: string
}

async function getJob(id: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}

async function getLineItems(jobId: string) {
  const { data, error } = await supabase
    .from('job_line_items')
    .select('*')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: true })

  return { data, error }
}

async function getCrewLead(crewLeadId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .select('first_name, last_name')
    .eq('id', crewLeadId)
    .single()

  return { data, error }
}

async function getCertificate(jobId: string) {
  const { data, error } = await supabase
    .from('job_completion_certificates')
    .select('*')
    .eq('job_id', jobId)
    .single()

  return { data, error }
}

export default async function JobCertificatePage({ params }: { params: { id: string } }) {
  const { data: job, error: jobError } = await getJob(params.id)

  if (jobError || !job) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800">Job Not Found</h2>
          <Link href="/jobs" className="text-white hover:text-white hover:underline mt-4 inline-block">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  const { data: lineItems } = await getLineItems(params.id)
  const { data: crewLead } = job.crew_lead_id ? await getCrewLead(job.crew_lead_id) : { data: null }
  const { data: certificate } = await getCertificate(params.id)

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-NZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const customerName = job.customer_company 
    ? `${job.customer_company} (${job.customer_first_name} ${job.customer_last_name})`
    : `${job.customer_first_name} ${job.customer_last_name}`

  const crewLeadName = crewLead ? `${crewLead.first_name} ${crewLead.last_name}` : 'Not Assigned'
  
  const warrantyPeriod = job.warranty_period_months || 60 // Default 5 years
  const warrantyYears = Math.floor(warrantyPeriod / 12)
  const warrantyMonths = warrantyPeriod % 12
  const warrantyText = warrantyYears > 0 
    ? `${warrantyYears} year${warrantyYears > 1 ? 's' : ''}${warrantyMonths > 0 ? ` ${warrantyMonths} months` : ''}`
    : `${warrantyMonths} months`

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Action Buttons - Print/Download/Email */}
      <CertificateActions jobId={params.id} />

      {/* Certificate Content - PDF Ready */}
      <div className="max-w-5xl mx-auto bg-white shadow-lg print:shadow-none" id="certificate">
        {/* Page 1: Certificate */}
        <div className="p-12 print:p-8">
          {/* Header with Logo */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-orange-500">
            <div>
              <div className="w-48 h-16 relative mb-2">
                {/* Logo placeholder - replace with actual logo */}
                <div className="bg-orange-500 text-white font-bold text-2xl flex items-center justify-center h-full rounded">
                  PREMIER
                </div>
              </div>
              <p className="text-sm text-gray-600">Quality Insulation Services</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">COMPLETION CERTIFICATE</h1>
              <p className="text-gray-600">Job #{job.job_number}</p>
              <p className="text-sm text-gray-500">Generated: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Customer & Property Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Property Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Customer Name</label>
                <p className="text-base text-gray-900">{customerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Job Number</label>
                <p className="text-base text-gray-900">{job.job_number}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Site Address</label>
                <p className="text-base text-gray-900">
                  {job.site_address}
                  {job.city && `, ${job.city}`}
                  {job.postcode && ` ${job.postcode}`}
                </p>
              </div>
            </div>
          </div>

          {/* Work Dates */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Work Timeline</h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Scheduled Date</label>
                <p className="text-base text-gray-900">{formatDate(job.scheduled_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                <p className="text-base text-gray-900">{formatDate(job.start_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Completion Date</label>
                <p className="text-base text-gray-900 font-semibold">{formatDate(job.completion_date)}</p>
              </div>
            </div>
          </div>

          {/* Work Performed */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Work Specification</h2>
            {lineItems && lineItems.length > 0 ? (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Product Code</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Quantity</th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item: any) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{item.product_code || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{item.description}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                        {item.quantity_actual || item.quantity_quoted} {item.unit}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                        <span className="text-green-600 font-semibold">Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 italic">No line items recorded</p>
            )}
          </div>

          {/* Work Description */}
          {job.notes && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Work Description</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.notes}</p>
              </div>
            </div>
          )}

          {/* Certification Statement */}
          <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Certification Statement</h2>
            <p className="text-sm text-gray-800 leading-relaxed mb-4">
              I certify that the above-mentioned insulation work has been completed in accordance with 
              Premier Insulation standards and all applicable building codes and regulations. All materials 
              have been installed to manufacturer specifications and industry best practices.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Property:</p>
                <p className="text-sm text-gray-900">{job.site_address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Completion Date:</p>
                <p className="text-sm text-gray-900">{formatDate(job.completion_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Inspector/Crew Lead:</p>
                <p className="text-sm text-gray-900">{crewLeadName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Warranty Period:</p>
                <p className="text-sm text-gray-900 font-semibold">{warrantyText}</p>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="border-t-2 border-gray-400 pt-8">
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Completed by (Premier Insulation):</p>
                <p className="text-base mb-8 min-h-[40px]">
                  {certificate?.installer_signature_name || '_________________________________'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Date:</p>
                <p className="text-base">
                  {certificate?.installer_signature_date 
                    ? formatDate(certificate.installer_signature_date)
                    : '_________________________________'
                  }
                </p>
              </div>
            </div>

            <div className="border-t-2 border-gray-400 pt-8">
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Approved by Customer:</p>
                <p className="text-base mb-8 min-h-[40px]">
                  {certificate?.customer_signature_name || '_________________________________'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Date:</p>
                <p className="text-base">
                  {certificate?.customer_signature_date 
                    ? formatDate(certificate.customer_signature_date)
                    : '_________________________________'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Warranty Information */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">Warranty Information</h3>
            <p className="text-sm text-gray-800 mb-3">
              This installation is covered under Premier Insulation's {warrantyText} warranty from the date of completion. 
              This warranty covers defects in workmanship and materials used during installation.
            </p>
            <p className="text-sm text-gray-700">
              <strong>Warranty Conditions:</strong>
            </p>
            <ul className="text-sm text-gray-700 list-disc list-inside mt-2 space-y-1">
              <li>Warranty applies to workmanship and installation quality</li>
              <li>Materials are covered under manufacturer's warranty</li>
              <li>Warranty may be void if modifications are made without authorization</li>
              <li>Regular maintenance and inspections recommended</li>
            </ul>
            <p className="text-xs text-gray-600 mt-4">
              For warranty claims or service inquiries, please contact Premier Insulation with your job number: {job.job_number}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-300 text-center">
            <p className="text-sm text-gray-600">
              Premier Insulation Ltd | www.premierinsulation.co.nz | info@premierinsulation.co.nz
            </p>
            <p className="text-xs text-gray-500 mt-1">
              This certificate confirms installation completion to specification. Job #{job.job_number}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Page 1 of 1 | Generated: {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>

      {/* Print Instructions */}
      <div className="max-w-5xl mx-auto mt-6 px-6 print:hidden">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Print Instructions:</strong> Use your browser's print function (Ctrl+P / Cmd+P) to print or save as PDF. 
            Ensure "Background graphics" is enabled in print settings for best results.
          </p>
        </div>
      </div>
    </div>
  )
}
