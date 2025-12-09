import Link from 'next/link'
import { FileText, Plus, Send, Check, ArrowRight, Search, Filter, Eye } from 'lucide-react'

export default function QuotesHelpPage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quotes</h1>
          <p className="text-lg text-gray-600">
            Learn how to create, manage, and send quotes to your customers
          </p>
        </div>

        <div className="space-y-8">
          {/* Creating a Quote */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Creating a New Quote</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 1: Navigate to Quotes</h3>
                <p className="text-gray-600">
                  Click on <strong>"Quotes"</strong> in the main navigation menu, then click the 
                  <span className="inline-flex items-center mx-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    <Plus className="w-3 h-3 mr-1" /> Create Quote
                  </span> button.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 2: Enter Customer Information</h3>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Select existing customer or create new one</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Enter site address (where installation will occur)</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Add any special notes or requirements</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 3: Add Products and Services</h3>
                <p className="text-gray-600 mb-2">
                  Click <strong>"Add Line Item"</strong> to add products to your quote:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span><strong>Product:</strong> Select from your product catalog</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span><strong>Quantity:</strong> Enter how many units needed</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span><strong>Unit Price:</strong> Price automatically filled from product catalog</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span><strong>Description:</strong> Add any specific details for this line item</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Tip:</strong> You can add multiple line items. The total is calculated automatically.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step 4: Review and Save</h3>
                <p className="text-gray-600 mb-2">Before saving, review:</p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Customer details are correct</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>All products and quantities are accurate</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Total amount is correct</span>
                  </li>
                </ul>
                <p className="text-gray-600 mt-2">
                  Click <strong>"Save Quote"</strong> to create the quote. It will be saved with "Draft" status.
                </p>
              </div>
            </div>
          </section>

          {/* Managing Quotes */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Managing Quotes</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Finding Quotes</h3>
                <p className="text-gray-600 mb-2">Use the search and filter tools to find quotes:</p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <Search className="w-4 h-4 text-gray-400 mt-1" />
                    <span><strong>Search:</strong> Enter quote number or customer name</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <Filter className="w-4 h-4 text-gray-400 mt-1" />
                    <span><strong>Filter by Status:</strong> Draft, Sent, Accepted, Won, Lost, Expired</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quote Statuses</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">Draft</span>
                    <span className="text-sm text-gray-600">Quote is being prepared, not sent to customer yet</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Sent</span>
                    <span className="text-sm text-gray-600">Quote has been sent to customer, awaiting response</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Accepted/Won</span>
                    <span className="text-sm text-gray-600">Customer has accepted the quote, ready to convert to job</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Lost</span>
                    <span className="text-sm text-gray-600">Customer declined or chose competitor</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">Expired</span>
                    <span className="text-sm text-gray-600">Quote validity period has passed</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Editing Quotes</h3>
                <p className="text-gray-600 mb-2">
                  To edit a quote:
                </p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Click on the quote to open details</li>
                  <li className="text-gray-600">Click the <strong>"Edit"</strong> button</li>
                  <li className="text-gray-600">Make your changes</li>
                  <li className="text-gray-600">Click <strong>"Save"</strong> to update</li>
                </ol>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <strong>⚠️ Note:</strong> You can only edit quotes with "Draft" status. Sent quotes cannot be edited.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sending Quotes */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sending Quotes to Customers</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How to Send</h3>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Open the quote you want to send</li>
                  <li className="text-gray-600">Review all details are correct</li>
                  <li className="text-gray-600">Click the <strong>"Send to Customer"</strong> button</li>
                  <li className="text-gray-600">The quote will be emailed as a PDF to the customer</li>
                  <li className="text-gray-600">Status automatically changes to "Sent"</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What the Customer Receives</h3>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Professional PDF with your company branding</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Complete breakdown of products and pricing</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Terms and conditions</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Validity period</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Your contact information</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Following Up</h3>
                <p className="text-gray-600 mb-2">
                  After sending a quote:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Follow up with customer after 2-3 days if no response</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Update status to "Accepted" or "Lost" based on customer decision</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Add notes to track conversations and decisions</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Converting to Job */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Converting Quotes to Jobs</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">When to Convert</h3>
                <p className="text-gray-600 mb-2">
                  Convert a quote to a job when:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Customer has accepted the quote</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>Payment terms have been agreed</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span>You're ready to schedule the installation</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How to Convert</h3>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Open the accepted quote</li>
                  <li className="text-gray-600">Click the <strong className="text-green-600">"Create Job"</strong> button</li>
                  <li className="text-gray-600">System automatically:
                    <ul className="ml-4 mt-1 space-y-1">
                      <li className="text-sm">• Creates new job with all quote details</li>
                      <li className="text-sm">• Copies all line items and pricing</li>
                      <li className="text-sm">• Reserves stock for products</li>
                      <li className="text-sm">• Links job back to original quote</li>
                    </ul>
                  </li>
                  <li className="text-gray-600">You're redirected to the new job page</li>
                  <li className="text-gray-600">Schedule and assign installer from job page</li>
                </ol>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  <strong>✅ Best Practice:</strong> Always update quote status to "Won" before converting to ensure accurate reporting.
                </p>
              </div>
            </div>
          </section>

          {/* Common Questions */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Questions</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Can I delete a quote?</h3>
                <p className="text-gray-600">
                  Quotes cannot be permanently deleted (for audit purposes), but you can archive them or mark them as "Lost" to remove from active view.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Can I resend a quote?</h3>
                <p className="text-gray-600">
                  Yes! Open the quote and click "Send to Customer" again. The customer will receive a fresh copy.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">What if I made a mistake after sending?</h3>
                <p className="text-gray-600">
                  Contact the customer to explain the error. Create a new revised quote with the correct information and send that instead.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">How long are quotes valid?</h3>
                <p className="text-gray-600">
                  Default validity is 30 days, but this can be customized when creating the quote. Expired quotes can be renewed by updating the date.
                </p>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Next: Learn About Jobs</h3>
            <p className="text-blue-700 mb-4">
              Once you've won a quote, learn how to manage the installation job.
            </p>
            <Link
              href="/help/jobs"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Jobs Help Guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
