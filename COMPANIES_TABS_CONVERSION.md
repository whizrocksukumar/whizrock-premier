# Companies Detail Page - Convert to Tabs

## Overview

Convert the companies detail page from separate sections to tabs like the clients detail page, with an additional "Invoices" tab for future implementation.

---

## Step 1: Add Tab State (Around line 88)

**Find this line (around line 88):**
```tsx
const [jobs, setJobs] = useState<Job[]>([]);
```

**Add these lines right after:**
```tsx
type TabType = 'contacts' | 'quotes' | 'assessments' | 'jobs' | 'invoices';
const [activeTab, setActiveTab] = useState<TabType>('contacts');
```

---

## Step 2: Replace the Content Section (Lines 539-812)

**Find this section (starts around line 539):**
```tsx
{/* Contacts Table */}
<div className="bg-white rounded-lg shadow mb-6">
```

**Replace EVERYTHING from line 539 to line 812 (just before the EDIT DRAWER comment) with:**

```tsx
{/* TABS SECTION */}
<div className="bg-white rounded-lg shadow">
  {/* Tab Headers */}
  <div className="border-b border-gray-200">
    <div className="flex overflow-x-auto">
      {(['contacts', 'quotes', 'assessments', 'jobs', 'invoices'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === tab
              ? 'border-[#0066CC] text-[#0066CC]'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}{' '}
          ({tab === 'contacts' ? contacts.length :
            tab === 'quotes' ? quotes.length :
            tab === 'assessments' ? assessments.length :
            tab === 'jobs' ? jobs.length :
            0})
        </button>
      ))}
    </div>
  </div>

  {/* Tab Content */}
  <div className="p-6">
    {/* CONTACTS TAB */}
    {activeTab === 'contacts' && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
          <Link
            href={`/clients/new?company_id=${company.id}`}
            className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </Link>
        </div>

        {contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Since</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact: Contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/clients/${contact.id}`} className="text-[#0066CC] hover:underline font-medium">
                        {contact.first_name} {contact.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <a href={`mailto:${contact.email}`} className="hover:text-[#0066CC]">
                        {contact.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {contact.phone || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {contact.contact_type || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(contact.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/clients/${contact.id}`}
                        className="text-[#0066CC] hover:underline"
                      >
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
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">No contacts yet</p>
            <Link
              href={`/clients/new?company_id=${company.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Add First Contact
            </Link>
          </div>
        )}
      </div>
    )}

    {/* QUOTES TAB */}
    {activeTab === 'quotes' && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
          <Link
            href={`/quotes/add-new-quote?company_id=${company.id}`}
            className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Quote
          </Link>
        </div>

        {quotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quote.quote_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(quote.quote_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {quote.site_address || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(quote.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(quote.status)}`}>
                        {quote.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="text-[#0066CC] hover:underline"
                      >
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
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">No quotes yet</p>
            <Link
              href={`/quotes/add-new-quote?company_id=${company.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Create First Quote
            </Link>
          </div>
        )}
      </div>
    )}

    {/* ASSESSMENTS TAB */}
    {activeTab === 'assessments' && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Assessments</h2>
          <Link
            href={`/assessments/new?company_id=${company.id}`}
            className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </Link>
        </div>

        {assessments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {assessment.reference_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(assessment.scheduled_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(assessment.status)}`}>
                        {assessment.status || 'Scheduled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/assessments/${assessment.id}`}
                        className="text-[#0066CC] hover:underline"
                      >
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
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">No assessments yet</p>
            <Link
              href={`/assessments/new?company_id=${company.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Schedule First Assessment
            </Link>
          </div>
        )}
      </div>
    )}

    {/* JOBS TAB */}
    {activeTab === 'jobs' && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Jobs</h2>
          <Link
            href={`/jobs/new?company_id=${company.id}`}
            className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Job
          </Link>
        </div>

        {jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.job_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(job.scheduled_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(job.status)}`}>
                        {job.status || 'Scheduled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-[#0066CC] hover:underline"
                      >
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
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">No jobs yet</p>
            <Link
              href={`/jobs/new?company_id=${company.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Create First Job
            </Link>
          </div>
        )}
      </div>
    )}

    {/* INVOICES TAB - Placeholder for future */}
    {activeTab === 'invoices' && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
          <button
            disabled
            className="px-4 py-2 text-sm bg-gray-400 text-white rounded cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Invoice (Coming Soon)
          </button>
        </div>

        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-2">Invoices feature coming soon</p>
          <p className="text-sm text-gray-400">This tab will display all invoices for this company</p>
        </div>
      </div>
    )}
  </div>
</div>
```

---

## Summary of Changes

### What Changed:
1. **Added tab state** - `activeTab` and `TabType`
2. **Replaced 4 separate sections** with a single tabbed interface
3. **Added Invoices tab** as placeholder for future development
4. **Better UX** - User can switch between sections without scrolling
5. **Consistent with clients page** - Same tab design pattern

### Tab Structure:
- **Contacts** (existing data)
- **Quotes** (existing data)
- **Assessments** (existing data)
- **Jobs** (existing data)
- **Invoices** (placeholder - shows "Coming Soon")

### Hover States Fixed:
- Tab headers use `hover:text-gray-900 hover:border-gray-300`
- Active tab uses `text-[#0066CC] border-[#0066CC]`
- No blue text on blue backgrounds!

---

## Before & After

### Before:
- 4 separate card sections stacked vertically
- Lots of scrolling required
- Each section has its own shadow/border

### After:
- Single card with tab navigation
- Click to switch between sections
- Cleaner, more professional look
- Matches clients detail page design
- Ready for invoices feature

---

## Testing

After making changes, test:
1. ✅ All 5 tabs are visible
2. ✅ Tab counts show correctly
3. ✅ Active tab is highlighted
4. ✅ Hover states work on tabs (no blue text issue)
5. ✅ Each tab shows correct data
6. ✅ Add buttons work in each tab
7. ✅ "View" links work for all items
8. ✅ Invoices tab shows placeholder message
