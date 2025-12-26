type StatusBadgeProps = {
  type: 'quote' | 'job' | 'invoice'
  status: string
  className?: string
}

export default function StatusBadge({
  type,
  status,
  className = '',
}: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase() ?? ''

  const getColor = () => {
    // ---------- QUOTES ----------
    if (type === 'quote') {
      switch (normalizedStatus) {
        case 'draft':
          return 'bg-gray-100 text-gray-800'
        case 'sent':
          return 'bg-blue-100 text-blue-800'
        case 'accepted':
          return 'bg-green-100 text-green-800'
        case 'rejected':
          return 'bg-red-100 text-red-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    // ---------- JOBS ----------
    if (type === 'job') {
      switch (normalizedStatus) {
        case 'scheduled':
          return 'bg-yellow-100 text-yellow-800'
        case 'in progress':
          return 'bg-blue-100 text-blue-800'
        case 'completed':
          return 'bg-green-100 text-green-800'
        case 'cancelled':
          return 'bg-red-100 text-red-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    // ---------- INVOICES ----------
    if (type === 'invoice') {
      switch (normalizedStatus) {
        case 'draft':
          return 'bg-gray-100 text-gray-800'
        case 'sent':
          return 'bg-blue-100 text-blue-800'
        case 'paid':
          return 'bg-green-100 text-green-800'
        case 'overdue':
          return 'bg-red-100 text-red-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    return 'bg-gray-100 text-gray-800'
  }

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getColor()} ${className}`}
    >
      {status}
    </span>
  )
}
