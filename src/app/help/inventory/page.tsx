import Link from 'next/link'
import { Package, TrendingDown, Settings, History, AlertTriangle, ArrowRight } from 'lucide-react'

export default function InventoryHelpPage() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory</h1>
          <p className="text-lg text-gray-600">
            Learn how to monitor stock levels and manage inventory
          </p>
        </div>

        <div className="space-y-8">
          {/* Checking Stock */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Checking Stock Levels</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Viewing Inventory</h3>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Go to <strong>Inventory</strong> in main menu</li>
                  <li className="text-gray-600">You'll see a table with all products</li>
                  <li className="text-gray-600">Use search to find specific products by code or name</li>
                  <li className="text-gray-600">Filter by warehouse location if needed</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Understanding the Display</h3>
                <p className="text-gray-600 mb-3">
                  Each product shows several quantity numbers:
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm mb-1">On Hand</p>
                    <p className="text-sm text-gray-600">Total physical quantity in warehouse</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm mb-1">Reserved</p>
                    <p className="text-sm text-gray-600">Quantity allocated to scheduled jobs (not available)</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-medium text-green-900 text-sm mb-1">Available (Most Important)</p>
                    <p className="text-sm text-green-800">On Hand minus Reserved = What you can use for new jobs</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm mb-1">Reorder At</p>
                    <p className="text-sm text-gray-600">Threshold - when Available hits this, reorder needed</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Example</h3>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Product:</strong> Insulation Batts R2.6
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• On Hand: 100 units</li>
                    <li>• Reserved: 30 units (for scheduled jobs)</li>
                    <li>• <strong>Available: 70 units</strong> (what you can actually use)</li>
                    <li>• Reorder At: 50 units</li>
                  </ul>
                  <p className="text-sm text-blue-900 mt-2">
                    In this case, stock is OK (70 available is above 50 reorder level)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Stock Alerts */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Understanding Stock Alerts</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Alert Types</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                        <span className="text-green-700 font-bold text-xs">OK</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-green-900 text-sm">Normal Stock</p>
                      <p className="text-sm text-green-800">Available quantity is above reorder level. All good!</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-900 text-sm">Low Stock</p>
                      <p className="text-sm text-orange-800">
                        Available quantity is at or below reorder level. Order more soon.
                        Row highlighted in orange on inventory page.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-red-900 text-sm">Out of Stock</p>
                      <p className="text-sm text-red-800">
                        Available quantity is zero. Cannot accept new jobs requiring this product.
                        Order immediately!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Using the "Low Stock Only" Filter</h3>
                <p className="text-gray-600 mb-2">
                  To quickly see what needs attention:
                </p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Go to Inventory page</li>
                  <li className="text-gray-600">Check the "Low Stock Only" box</li>
                  <li className="text-gray-600">View only products at or below reorder level</li>
                  <li className="text-gray-600">Notify purchasing/manager about low items</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Summary Cards</h3>
                <p className="text-gray-600 mb-2">
                  At the top of Inventory page, three cards show quick stats:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span><strong>Total Products:</strong> How many different products you stock</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2"></span>
                    <span><strong>Low Stock Items:</strong> How many need reordering</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2"></span>
                    <span><strong>Out of Stock:</strong> Critical - no available quantity</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Stock History */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <History className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Viewing Stock Movement History</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Accessing History</h3>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Go to Inventory page</li>
                  <li className="text-gray-600">Click <strong>"Stock History"</strong> button (top right)</li>
                  <li className="text-gray-600">See complete log of all stock movements</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Movement Types</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium text-xs">Receipt</span>
                    <span className="text-gray-600">Stock added from supplier delivery</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium text-xs">Issue</span>
                    <span className="text-gray-600">Stock used for a job</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium text-xs">Adjustment Increase</span>
                    <span className="text-gray-600">Manual increase (stock count correction)</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium text-xs">Adjustment Decrease</span>
                    <span className="text-gray-600">Manual decrease (damaged/lost stock)</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-medium text-xs">Return</span>
                    <span className="text-gray-600">Stock returned from job (unused)</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Searching History</h3>
                <p className="text-gray-600 mb-2">
                  Find specific movements using filters:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2"></span>
                    <span><strong>Search:</strong> Enter product code or job number</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2"></span>
                    <span><strong>Movement Type:</strong> Filter by type (Receipt, Issue, etc.)</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2"></span>
                    <span><strong>Date Range:</strong> Select From/To dates</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Exporting Data</h3>
                <p className="text-gray-600 mb-2">
                  Download movements for reporting or analysis:
                </p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Apply filters to show only movements you want</li>
                  <li className="text-gray-600">Click <strong>"Export CSV"</strong> button</li>
                  <li className="text-gray-600">File downloads to your computer</li>
                  <li className="text-gray-600">Open in Excel or Google Sheets</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Adjusting Stock */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Adjusting Stock Quantities</h2>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  <strong>⚠️ Note:</strong> Stock adjustments are typically done by warehouse staff only. Contact your manager if you need an adjustment made.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">When to Adjust</h3>
                <p className="text-gray-600 mb-3">
                  Manual adjustments are needed for:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span><strong>Physical stock count:</strong> Actual count doesn't match system</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span><strong>Damaged stock:</strong> Items broken or unusable</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span><strong>Found stock:</strong> Discovered items not in system</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></span>
                    <span><strong>Expired stock:</strong> Products past use-by date</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How to Adjust (Authorized Users)</h3>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-gray-600">Go to Inventory page</li>
                  <li className="text-gray-600">Click <strong>"Adjust Stock"</strong> button</li>
                  <li className="text-gray-600">Search for and select the product</li>
                  <li className="text-gray-600">Choose Increase or Decrease</li>
                  <li className="text-gray-600">Enter quantity to adjust</li>
                  <li className="text-gray-600">Write clear reason for adjustment (required)</li>
                  <li className="text-gray-600">Click "Apply Adjustment"</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Important Rules</h3>
                <ul className="space-y-2 ml-4">
                  <li className="text-gray-600 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-1" />
                    <span>Cannot reduce stock below reserved quantity</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-1" />
                    <span>Must provide reason for every adjustment</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-1" />
                    <span>All adjustments are logged and auditable</span>
                  </li>
                  <li className="text-gray-600 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-1" />
                    <span>Large adjustments may require supervisor approval</span>
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
                <h3 className="font-semibold text-gray-900 mb-1">Why is "Available" less than "On Hand"?</h3>
                <p className="text-gray-600">
                  Some stock is reserved for scheduled jobs. Reserved stock is not available for new jobs until those jobs are completed or cancelled.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Can I see which jobs have reserved stock?</h3>
                <p className="text-gray-600">
                  Yes! Go to Stock History and filter by movement type "Issue" to see job allocations. The Reference column shows the job number.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">What happens when I create a job?</h3>
                <p className="text-gray-600">
                  System automatically reserves the required stock. Available quantity decreases but On Hand stays same. When job is completed, stock moves from Reserved to Used.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Who gets notified about low stock?</h3>
                <p className="text-gray-600">
                  Currently you need to manually check and inform purchasing. Future: automatic email alerts when stock hits reorder level.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Can I see stock at different warehouse locations?</h3>
                <p className="text-gray-600">
                  Yes! Use the Location filter on Inventory page to view stock at specific warehouses.
                </p>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Practices</h2>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-700 font-bold text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Check Stock Before Quoting</p>
                  <p className="text-sm text-gray-600">Verify availability before promising delivery dates to customers</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-700 font-bold text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Report Low Stock Early</p>
                  <p className="text-sm text-gray-600">Don't wait until out of stock - inform purchasing when items show low stock warning</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-700 font-bold text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Return Unused Stock</p>
                  <p className="text-sm text-gray-600">If job uses less than planned, return extras to warehouse to free up for other jobs</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-700 font-bold text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Report Damaged Items</p>
                  <p className="text-sm text-gray-600">Notify warehouse immediately so adjustments can be made and replacements ordered</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-700 font-bold text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Regular Stock Takes</p>
                  <p className="text-sm text-gray-600">Physical counts should match system - report discrepancies immediately</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Back to Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Need More Help?</h3>
            <p className="text-blue-700 mb-4">
              Return to the main help page for guides on other topics.
            </p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Help Center
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
