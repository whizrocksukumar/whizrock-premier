import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Edit, Mail, Phone, Globe, MapPin, Building2 } from 'lucide-react'

interface CompanyDetail {
  id: string
  name: string
  industry: string | null
  website: string | null
  phone: string | null
  email: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  notes: string | null
  created_at: string
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  contact_type: string | null
  created_at: string
}

interface Quote {
  id: string
  quote_number: string
  quote_date: string
  site_address: string | null
  total_amount: number | null
  status: string | null
  client_id: string
  clients: {
    first_name: string
    last_name: string
  } | null
}

interface Quote {
  id: string
  quote_number: string
  quote_date: string
  site_address: string | null
  total_amount: number | null
  status: string | null
  client_id: string
  clients: {
    first_name: string
    last_name: string
  } | null
}

async function getCompany(id: string) {
  try {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (companyError || !company) {
      console.error('Error fetching company:', companyError)
      return { data: null, error: companyError?.message || 'Company not found' }
    }

    return { data: company, error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

async function getCompanyContacts(companyId: string) {
  try {
    const { data: contacts, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, contact_type, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contacts:', error)
      return []
    }

    return contacts || []
  } catch (err) {
    console.error('Unexpected error:', err)
    return []
  }
}

async function getCompanyQuotes(companyId: string) {
  try {
    // Get all clients belonging to this company
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id')
      .eq('company_id', companyId)

    if (clientsError || !clients || clients.length === 0) {
      return []
    }

    const clientIds = clients.map(c => c.id)

    // Get quotes for all those clients
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, quote_number, quote_date, status, total_amount, site_address, client_id')
      .in('client_id', clientIds)
      .order('quote_date', { ascending: false })

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError)
      return []
    }

    // Get client names for the quotes
    const quotesWithClients = await Promise.all(
      (quotes || []).map(async (quote) => {
        const { data: client } = await supabase
          .from('clients')
          .select('first_name, last_name')
          .eq('id', quote.client_id)
          .single()

        return {
          ...quote,
          client_name: client ? `${client.first_name} ${client.last_name}` : 'Unknown'
        }
      })
    )

    return quotesWithClients
  } catch (err) {
    console.error('Unexpected error:', err)
    return []
  }
}

export default async function CompanyDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: company, error } = await getCompany(id)

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Link href="/companies" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Company Not Found</h1>
        </div>
        <div className="p-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Company not found</h2>
            <p className="text-gray-600 mb-4">{error || 'The company you are looking for does not exist.'}</p>
            <Link href="/companies" className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors inline-block">
              Back to Companies
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const contacts = await getCompanyContacts(company.id)
  const quotes = await getCompanyQuotes(company.id)

  const fullAddress = [
    company.address_line_1,
    company.address_line_2,
    company.city,
    company.postal_code,
    company.country
  ].filter(Boolean).join(', ')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount)
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return 'px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700'
    const statusLower = status.toLowerCase()
    if (statusLower === 'active') return 'px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800'
    if (statusLower === 'inactive') return 'px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700'
    if (statusLower === 'prospect') return 'px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800'
    return 'px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HEADER ROW ===== */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/companies" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Companies
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {company.industry || 'No industry specified'} • {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* User Icon */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              U
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-700">user@premier.local</p>
            </div>
            <button className="ml-2 text-xs text-[#0066CC] hover:underline">Logout</button>
          </div>
        </div>
      </div>

      {/* ===== TOOLBAR ROW ===== */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {company.website && (
              <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#0066CC]">
                <Globe className="w-4 h-4" />
                {company.website}
              </a>
            )}
            {company.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {company.phone}
              </span>
            )}
            {company.email && (
              <a href={`mailto:${company.email}`} className="flex items-center gap-1 hover:text-[#0066CC]">
                <Mail className="w-4 h-4" />
                {company.email}
              </a>
            )}
          </div>

          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/customers/new?company_id=${company.id}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              Add Contact
            </Link>
            <Link
              href={`/companies/${company.id}/edit`}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      <div className="p-6">
        {/* Company Information and Activity Summary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Company Information Card - 2 columns width */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Industry</label>
                    <p className="font-medium text-gray-900">
                      {company.industry || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Phone</label>
                    <p className="font-medium text-gray-900">
                      {company.phone || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Email</label>
                    <p className="font-medium text-gray-900">
                      {company.email || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Website</label>
                    <p className="font-medium text-gray-900">
                      {company.website ? (
                        <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-[#0066CC] hover:underline">
                          {company.website}
                        </a>
                      ) : '—'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">City</label>
                    <p className="font-medium text-gray-900">
                      {company.city || '—'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Company Since</label>
                    <p className="font-medium text-gray-900">
                      {formatDate(company.created_at)}
                    </p>
                  </div>

                  <div className="col-span-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Address
                    </label>
                    <p className="font-medium text-gray-900">
                      {fullAddress || '—'}
                    </p>
                  </div>

                  {company.notes && (
                    <div className="col-span-3">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Notes</label>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {company.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary Card - 1 column width */}
          <div>
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Activity Summary</h2>
              </div>
              <div className="p-6 space-y-3">
                <Link href={`/customers?company_id=${company.id}`} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors">
                  <span className="text-gray-600">Contacts</span>
                  <span className="font-semibold text-[#0066CC]">
                    {contacts.length}
                  </span>
                </Link>
                <Link href={`/quotes?company_id=${company.id}`} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors">
                  <span className="text-gray-600">Quotes</span>
                  <span className="font-semibold text-[#0066CC]">
                    {quotes.length}
                  </span>
                </Link>
                <Link href={`/jobs?company_id=${company.id}`} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors">
                  <span className="text-gray-600">Jobs</span>
                  <span className="font-semibold text-[#0066CC]">
                    0
                  </span>
                </Link>
                <div className="flex justify-between items-center p-2">
                  <span className="text-gray-600">Invoices (Xero)</span>
                  <span className="font-semibold text-gray-400">
                    0
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts Table - Full Width */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
            <Link
              href={`/customers/new?company_id=${company.id}`}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
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
                        <Link href={`/customers/${contact.id}`} className="text-[#0066CC] hover:underline font-medium">
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
                          href={`/customers/${contact.id}`}
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
                href={`/customers/new?company_id=${company.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Add First Contact
              </Link>
            </div>
          )}
        </div>

        {/* Quotes Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
          </div>
          {quotes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quote #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {quote.quote_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {quote.clients ? (
                          <Link
                            href={`/customers/${quote.client_id}`}
                            className="text-[#0066CC] hover:underline"
                          >
                            {quote.clients.first_name} {quote.clients.last_name}
                          </Link>
                        ) : '—'}
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
                        <span className={getStatusBadge(quote.status)}>
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
              <p className="text-gray-500 mb-4">No quotes yet</p>
              <Link
                href={`/quotes/new?company_id=${company.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Create First Quote
              </Link>
            </div>
          )}
        </div>

        {/* Quotes Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
          </div>
          {quotes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quote #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {quote.quote_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {quote.clients ? (
                          <Link
                            href={`/customers/${quote.client_id}`}
                            className="text-[#0066CC] hover:underline"
                          >
                            {quote.clients.first_name} {quote.clients.last_name}
                          </Link>
                        ) : '—'}
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
                        <span className={getStatusBadge(quote.status)}>
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
              <p className="text-gray-500 mb-4">No quotes yet</p>
              <Link
                href={`/quotes/new?company_id=${company.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Create First Quote
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
