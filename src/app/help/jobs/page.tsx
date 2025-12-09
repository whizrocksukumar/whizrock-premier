import Link from 'next/link'
import { Briefcase, Plus, Calendar, Camera, CheckCircle, FileDown, ArrowRight } from 'lucide-react'

export default function JobsHelpPage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Briefcase className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Jobs</h1>
          <p className="text-lg text-gray-600">
            Learn how to create and manage installation jobs from start to finish
          </p>
        </div>

        <div className="space-y-8">
          {/* Creating Jobs */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Creating Jobs</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">From an Accepted Quote</h3>
                <p className="text-gray-600 mb-3">
                  The easiest way to create a job is from an accepted quote:
                </p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Go to <strong>Quotes</strong> and open the accepted quote</li>
                  <li className="text-gray-600">Click the <strong className="text-green-600">"Create Job"</strong> button (only appears for Accepted/Won quotes)</li>
                  <li className="text-gray-600">System automatically creates job with:
                    <ul className="ml-4 mt-1 space-y-1">
                      <li className="text-sm">• Customer details</li>
                      <li className="text-sm">• Site address</li>
                      <li className="text-sm">• All products and materials</li>
                      <li className="text-sm">• Pricing information</li>
                      <li className="text-sm">• Stock reservations</li>
                    </ul>
                  </li>
                  <li className="text-gray-600">You're redirected to the new job page</li>
                </ol>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tip:</strong> Creating jobs from quotes ensures accuracy and saves time by automatically copying all details.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Stock Validation</h3>
                <p className="text-gray-600 mb-2">
                  Before creating a job, the system checks:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>If enough stock is available for all products</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>Shows warnings for any low stock items</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>Prevents creating duplicate jobs from same quote</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Scheduling Jobs */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Scheduling and Assigning</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Setting Schedule</h3>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Open the job details page</li>
                  <li className="text-gray-600">Click <strong>"Edit Job"</strong></li>
                  <li className="text-gray-600">Set the <strong>Scheduled Date</strong></li>
                  <li className="text-gray-600">Optionally add <strong>Scheduled Time</strong></li>
                  <li className="text-gray-600">Update <strong>Status</strong> to "Scheduled"</li>
                  <li className="text-gray-600">Save changes</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Assigning Installer</h3>
                <p className="text-gray-600 mb-2">
                  Assign the job to an installation team:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Select installer from <strong>"Assigned Installer"</strong> dropdown</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Installer will see this job in their schedule</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Can be reassigned if needed</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Job Statuses</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">Draft</span>
                    <span className="text-sm text-gray-600">Job created but not scheduled yet</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Scheduled</span>
                    <span className="text-sm text-gray-600">Date and installer assigned, ready to start</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">In Progress</span>
                    <span className="text-sm text-gray-600">Work has started on site</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Completed</span>
                    <span className="text-sm text-gray-600">Installation finished, ready for invoicing</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Cancelled</span>
                    <span className="text-sm text-gray-600">Job cancelled by customer or business</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tracking Progress */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Tracking Job Progress</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Uploading Photos</h3>
                <p className="text-gray-600 mb-3">
                  Document the job by uploading Before, During, and After photos:
                </p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Open job details page</li>
                  <li className="text-gray-600">Scroll to <strong>"Job Photos"</strong> section</li>
                  <li className="text-gray-600">Click <strong>"Upload Photo"</strong></li>
                  <li className="text-gray-600">Select photo type (Before/During/After)</li>
                  <li className="text-gray-600">Add optional caption to describe photo</li>
                  <li className="text-gray-600">Upload (max 10MB per photo)</li>
                </ol>
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>✅ Best Practice:</strong> Take Before photos at start, During photos showing work in progress, and After photos when complete.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Adding Comments</h3>
                <p className="text-gray-600 mb-2">
                  Keep a timeline of activities and communications:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2"></span>
                    <span>Document site conditions</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2"></span>
                    <span>Note customer requests or changes</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2"></span>
                    <span>Track progress milestones</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2"></span>
                    <span>Record any issues encountered</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Updating Status</h3>
                <p className="text-gray-600 mb-2">
                  Keep job status current as work progresses:
                </p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Update to <strong>"In Progress"</strong> when work starts</li>
                  <li className="text-gray-600">Add comments to document daily progress</li>
                  <li className="text-gray-600">Upload photos regularly</li>
                  <li className="text-gray-600">Update to <strong>"Completed"</strong> when finished</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Completing Jobs */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Completing Jobs</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Final Steps</h3>
                <p className="text-gray-600 mb-3">
                  Before marking a job as complete:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                    <span>All work completed to standard</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                    <span>After photos uploaded</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                    <span>Customer walkthrough done</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                    <span>Site cleaned up</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                    <span>Any issues documented</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Marking Complete</h3>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Click <strong>"Edit Job"</strong></li>
                  <li className="text-gray-600">Change status to <strong>"Completed"</strong></li>
                  <li className="text-gray-600">Add completion date</li>
                  <li className="text-gray-600">Add final comment summarizing the job</li>
                  <li className="text-gray-600">Save changes</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What Happens Next</h3>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>Stock is marked as used</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>Job appears in completed jobs report</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>Ready for invoicing</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span>Completion certificate can be generated</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Completion Certificate */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileDown className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Job Completion Certificates</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Generating Certificate</h3>
                <p className="text-gray-600 mb-3">
                  Provide customers with a professional completion certificate:
                </p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Open completed job details</li>
                  <li className="text-gray-600">Click <strong>"View Certificate"</strong> button</li>
                  <li className="text-gray-600">Review certificate details</li>
                  <li className="text-gray-600">Use Print/Download/Email options</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What's Included</h3>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span>Job number and completion date</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span>Customer details and site address</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span>Work performed description</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span>Products installed</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span>Warranty information</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span>Company details and contact</span>
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
                <h3 className="font-semibold text-gray-900 mb-1">Can I edit a job after it's completed?</h3>
                <p className="text-gray-600">
                  Yes, but only certain fields like comments and photos. Material and pricing details are locked once completed for audit purposes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">What if I need to cancel a job?</h3>
                <p className="text-gray-600">
                  Change status to "Cancelled" and add a comment explaining why. Reserved stock will be automatically released back to inventory.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Can I reschedule a job?</h3>
                <p className="text-gray-600">
                  Yes! Edit the job and update the scheduled date. The installer will see the updated schedule.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">What if we run out of materials?</h3>
                <p className="text-gray-600">
                  Report an incident for "Material Shortage" to alert the office. They can order more stock or adjust the job scope.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">How do I see all my assigned jobs?</h3>
                <p className="text-gray-600">
                  Go to Jobs page and filter by "Assigned to Me". You'll see all jobs currently assigned to you.
                </p>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Next: Learn About Incidents</h3>
            <p className="text-blue-700 mb-4">
              Learn how to report and track job-related incidents and issues.
            </p>
            <Link
              href="/help/incidents"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Incidents Help Guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
