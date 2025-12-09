interface JobStatusBadgeProps {
  status: string
  className?: string
}

export default function JobStatusBadge({ status, className = '' }: JobStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'In Progress':
        return 'bg-orange-100 text-orange-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span 
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)} ${className}`}
    >
      {status}
    </span>
  )
}
