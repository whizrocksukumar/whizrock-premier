'use client'
import { Calendar, ChevronRight, Clock, MapPin, User } from 'lucide-react'
import { Assessment } from '../lib/utils/assessment-helpers'
import Link from 'next/link'

interface AssessmentCardProps {
  assessment: Assessment
  showActions?: boolean
  onReschedule?: () => void
  onDelete?: () => void
  onView?: () => void
}

export default function AssessmentCard({
  assessment,
  showActions = true,
  onReschedule,
  onDelete,
  onView,
}: AssessmentCardProps) {
  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header with assessment number and status */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {assessment.assessment_number || assessment.reference_number}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{assessment.customer_name}</p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
            assessment.status
          )}`}
        >
          {assessment.status}
        </span>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        {/* Site Address */}
        {assessment.site_address && (
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{assessment.site_address}</p>
          </div>
        )}

        {/* Date and Time */}
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-700">{formatDate(assessment.scheduled_date)}</p>
          {assessment.scheduled_time && (
            <>
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-700">{assessment.scheduled_time}</p>
            </>
          )}
        </div>

        {/* Installer/Assigned */}
        {assessment.assigned_installer_id && (
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              {assessment.customer_company || 'Installer assigned'}
            </p>
          </div>
        )}

        {/* Assessment Type */}
        {assessment.assessment_type && (
          <div className="pt-1">
            <span className="inline-block px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-700">
              {assessment.assessment_type}
            </span>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      {showActions && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <Link
            href={`/assessments/${assessment.id}`}
            className="text-sm font-medium text-[#0066CC] hover:underline flex items-center gap-1"
          >
            View Details
            <ChevronRight className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            {onReschedule && assessment.status === 'Scheduled' && (
              <button
                onClick={onReschedule}
                className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-50 rounded border border-gray-200"
              >
                Reschedule
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded border border-red-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}