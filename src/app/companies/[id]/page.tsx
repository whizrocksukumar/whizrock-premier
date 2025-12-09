import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"

interface Company {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

interface Quote {
  id: string
  quote_number: string
  quote_date: string
  status: string
  total_amount: number
  site_address: string | null
  client_id: string | null
  client_name: string | null
}

async function getCompany(id: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single()

  return { data, error }
}

async function getCompanyQuotes(companyId: string) {
  const { data, error } = await supabase
    .from("quotes")
    .select(`
      id,
      quote_number,
      quote_date,
      status,
      total_amount,
      site_address,
      client_id,
      client_name
    `)
    .eq("company_id", companyId)
    .order("quote_date", { ascending: false })

  return { data: data as Quote[] | null, error }
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatCurrency(amount: number | null) {
  if (!amount) return "$0.00"
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(amount)
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Draft":
      return "px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
    case "Sent":
      return "px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
    case "Accepted":
      return "px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
    case "Declined":
      return "px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
    default:
      return "px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
  }
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: company, error } = await getCompany(id)
  const { data: quotes } = await getCompanyQuotes(id)

  if (error || !company) {
    return (
      <div className="p-6">
        <Link
          href="/companies"
          className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </Link>

        <h1 className="text-xl font-semibold mt-4">Company Not Found</h1>
        <p className="text-gray-600 mt-2">{error || "Invalid company ID."}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/companies"
          className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </Link>

        <h1 className="text-2xl font-bold mt-3">{company.name}</h1>

        <p className="text-gray-600 mt-1">
          {company.email || "—"} • {company.phone || "—"}
        </p>

        {company.address && (
          <p className="text-gray-700 mt-1">{company.address}</p>
        )}
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Quotes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quote #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Site Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {(!quotes || quotes.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                    No quotes found for this company.
                  </td>
                </tr>
              )}

              {quotes?.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {quote.quote_number}
                  </td>

                  {/* FIXED CLIENT COLUMN */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {quote.client_name ? (
                      <Link
                        href={`/customers/${quote.client_id}`}
                        className="text-[#0066CC] hover:underline"
                      >
                        {quote.client_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(quote.quote_date)}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {quote.site_address || "—"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {formatCurrency(quote.total_amount)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={getStatusBadge(quote.status)}>
                      {quote.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
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
      </div>
    </div>
  )
}
