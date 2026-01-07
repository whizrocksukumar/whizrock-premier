'use client'

type ClientOverviewProps = {
  client: {
    client_type?: string | null
    company_name?: string | null
    industry?: string | null
    address?: string | null
    region?: string | null
    website?: string | null
    sales_rep_name?: string | null
    created_at?: string | null
    updated_at?: string | null
  }
}

function Row({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="flex items-center gap-4 py-1.5">
      <div className="w-36 text-sm font-semibold text-gray-700 whitespace-nowrap">
        {label}
      </div>
      <div className="text-sm text-gray-900 truncate">
        {value && value.trim() !== '' ? value : '—'}
      </div>
    </div>
  )
}

export default function ClientOverviewCard({ client }: ClientOverviewProps) {
  return (
    <div className="rounded-lg bg-white shadow px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Overview
        </h3>

        <div className="text-sm text-gray-500">
          Last updated:{' '}
          <span className="text-gray-900">
            {client.updated_at?.split('T')[0] ?? '—'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        {/* LEFT */}
        <div>
          <Row label="Client type" value={client.client_type} />
          <Row label="Industry" value={client.industry} />
          <Row label="Region" value={client.region} />
          <Row label="Sales rep" value={client.sales_rep_name} />
        </div>

        {/* RIGHT (shifted left) */}
        <div>
          <Row label="Company name" value={client.company_name} />
          <Row label="Address" value={client.address} />
          <Row label="Website" value={client.website} />
          <Row
            label="Date added"
            value={client.created_at?.split('T')[0]}
          />
        </div>
      </div>
    </div>
  )
}
