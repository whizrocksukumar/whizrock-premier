import Link from 'next/link'
import { AlertCircle, Plus, Camera, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react'

export default function IncidentsHelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/help" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to Help
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Incidents</h1>
          <p className="text-lg text-gray-600">
            Learn how to report and track job-related incidents and issues
          </p>
        </div>

        <div className="space-y-8">
          {/* Reporting Incidents */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Reporting an Incident</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">When to Report</h3>
                <p className="text-gray-600 mb-3">
                  Report an incident whenever something unexpected happens that affects the job:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></span>
                    <span><strong>Safety Issue:</strong> Unsafe conditions, near-misses, injuries</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></span>
                    <span><strong>Quality Issue:</strong> Defective materials, installation problems</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></span>
                    <span><strong>Equipment Failure:</strong> Broken tools, vehicle issues</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></span>
                    <span><strong>Material Shortage:</strong> Missing or insufficient stock</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></span>
                    <span><strong>Customer Complaint:</strong> Customer concerns or dissatisfaction</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></span>
                    <span><strong>Weather Delay:</strong> Weather preventing work</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></span>
                    <span><strong>Site Access Issue:</strong> Can't access site as planned</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-900">
                  <strong>⚠️ Important:</strong> Safety incidents should be reported immediately. Don't wait until end of day.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How to Report</h3>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Go to <strong>Incidents</strong> in main menu</li>
                  <li className="text-gray-600">Click <strong className="text-red-600">"Report Incident"</strong> button</li>
                  <li className="text-gray-600">Fill in the form:
                    <ul className="ml-4 mt-1 space-y-1">
                      <li className="text-sm">• Select related job (if applicable)</li>
                      <li className="text-sm">• Choose incident type</li>
                      <li className="text-sm">• Set severity level</li>
                      <li className="text-sm">• Enter when it occurred</li>
                      <li className="text-sm">• Write clear title and description</li>
                      <li className="text-sm">• Add specific location on site</li>
                      <li className="text-sm">• Upload photos if available</li>
                    </ul>
                  </li>
                  <li className="text-gray-600">Click <strong>"Create Incident"</strong></li>
                  <li className="text-gray-600">Incident number is auto-generated (e.g., INC-20241208-001)</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Writing Good Reports */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Writing a Good Incident Report</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Title</h3>
                <p className="text-gray-600 mb-2">
                  Write a clear, brief summary (5-10 words):
                </p>
                <div className="space-y-2">
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-900"><strong>✅ Good:</strong> "Ladder slipped on wet deck causing minor injury"</p>
                  </div>
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-900"><strong>❌ Bad:</strong> "Problem today"</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 mb-2">
                  Include these 5 W's:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span><strong>What:</strong> Exactly what happened</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span><strong>When:</strong> Specific time it occurred</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span><strong>Where:</strong> Exact location on site</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span><strong>Who:</strong> People involved</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span><strong>Why:</strong> Contributing factors (if known)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Severity Levels</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Low</span>
                    <span className="text-sm text-gray-600">Minor issue, no safety risk, minimal delay</span>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Medium</span>
                    <span className="text-sm text-gray-600">Moderate impact, some risk, will cause delays</span>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">High</span>
                    <span className="text-sm text-gray-600">Serious issue, safety concern, major delays</span>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Critical</span>
                    <span className="text-sm text-gray-600">Emergency, injury occurred, stop work immediately</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Adding Photos */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Adding Photos</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">When Reporting</h3>
                <p className="text-gray-600 mb-3">
                  You can upload photos when first creating the incident:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span>Click "Upload Photos" section in report form</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span>Select multiple photos at once</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span>Max 10MB per photo</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span>JPEG, PNG, or PDF formats accepted</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">After Creating Incident</h3>
                <p className="text-gray-600 mb-3">
                  Add more photos later from incident detail page:
                </p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Open the incident</li>
                  <li className="text-gray-600">Scroll to "Photos" section</li>
                  <li className="text-gray-600">Click "Upload Photo"</li>
                  <li className="text-gray-600">Add optional caption to describe what photo shows</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Photo Tips</h3>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <Camera className="w-4 h-4 text-purple-600 mt-1" />
                    <span>Take photos from multiple angles</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <Camera className="w-4 h-4 text-purple-600 mt-1" />
                    <span>Include context (wider shots showing surroundings)</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <Camera className="w-4 h-4 text-purple-600 mt-1" />
                    <span>Close-ups of specific damage or hazards</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <Camera className="w-4 h-4 text-purple-600 mt-1" />
                    <span>Clear, well-lit photos are most helpful</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Tracking Resolution */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Tracking Incident Resolution</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Incident Statuses</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Open</span>
                    <span className="text-sm text-gray-600">Just reported, needs assignment</span>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">In Progress</span>
                    <span className="text-sm text-gray-600">Being investigated or worked on</span>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Pending Customer</span>
                    <span className="text-sm text-gray-600">Waiting for customer response or decision</span>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Resolved</span>
                    <span className="text-sm text-gray-600">Issue fixed, solution implemented</span>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">Closed</span>
                    <span className="text-sm text-gray-600">Fully complete, no further action</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Adding Updates</h3>
                <p className="text-gray-600 mb-3">
                  Keep everyone informed by adding timeline notes:
                </p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Open the incident</li>
                  <li className="text-gray-600">Click "Add Note" in Timeline section</li>
                  <li className="text-gray-600">Choose note type:
                    <ul className="ml-4 mt-1 space-y-1">
                      <li className="text-sm">• <strong>Update</strong> - General progress update</li>
                      <li className="text-sm">• <strong>Investigation</strong> - Findings from investigation</li>
                      <li className="text-sm">• <strong>Resolution</strong> - How issue was fixed</li>
                      <li className="text-sm">• <strong>Customer Contact</strong> - Communication with customer</li>
                      <li className="text-sm">• <strong>Internal</strong> - Internal notes (not shared)</li>
                    </ul>
                  </li>
                  <li className="text-gray-600">Write your note</li>
                  <li className="text-gray-600">Check "Internal Only" if note shouldn't be shared with customer</li>
                  <li className="text-gray-600">Click "Save Note"</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Viewing Your Incidents</h3>
                <p className="text-gray-600 mb-2">
                  Find incidents you've reported or are assigned to:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>Go to Incidents page</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>Filter by status to see Open or In Progress incidents</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>Search by incident number or job number</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>Click any incident to view full details and timeline</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Common Questions */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Questions</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Who can see my incident report?</h3>
                <p className="text-gray-600">
                  Office staff and managers can see all incidents. Installers can see incidents they reported or are assigned to. Notes marked "Internal Only" are hidden from customers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">What if it's an emergency?</h3>
                <p className="text-gray-600">
                  For immediate safety emergencies, call emergency services (111) first, then your supervisor. Report the incident in the system after the situation is under control.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Can I report an incident not related to a specific job?</h3>
                <p className="text-gray-600">
                  Yes! Leave the "Related Job" field empty. This is common for vehicle issues, warehouse incidents, or office problems.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Will reporting incidents affect my performance review?</h3>
                <p className="text-gray-600">
                  No. Reporting incidents helps us improve safety and quality. We encourage honest, timely reporting. Not reporting incidents when they occur is a concern.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">How long does resolution usually take?</h3>
                <p className="text-gray-600">
                  Depends on severity and complexity. Critical incidents are addressed immediately. Others may take several days for investigation and resolution.
                </p>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Next: Learn About Inventory</h3>
            <p className="text-blue-700 mb-4">
              Learn how to check stock levels and manage inventory.
            </p>
            <Link
              href="/help/inventory"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Inventory Help Guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
