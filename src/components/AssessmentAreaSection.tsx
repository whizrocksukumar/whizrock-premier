'use client'

// Update the import path below to the correct relative path based on your project structure.
// For example, if AssessmentArea is defined in src/lib/utils/assessment-helpers.ts:
import { AssessmentArea } from '../lib/utils/assessment-helpers'
// If the path above is incorrect, adjust '../lib/utils/assessment-helpers' to the correct relative path.
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface AssessmentAreaSectionProps {
  area: AssessmentArea
  colorBadge?: string // Hex color for area badge
  editable?: boolean
  onUpdate?: (updatedArea: Partial<AssessmentArea>) => void
  onDelete?: () => void
  showPhotos?: boolean
  photoCount?: number
}

export default function AssessmentAreaSection({
  area,
  colorBadge = '#C27BA0',
  editable = false,
  onUpdate,
  onDelete,
  showPhotos = false,
  photoCount = 0,
}: AssessmentAreaSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    description: area.notes || '',
    result: area.result_type || 'Pending',
    workRequired: '',
  })

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        notes: formData.description,
        result_type: formData.result,
      })
    }
    setIsEditing(false)
  }

  // Color badge for area type
  const areaColorStyle = {
    backgroundColor: colorBadge,
  }

  const resultOptions = ['Pending', 'Pass', 'Fail', 'Exempt', 'Conditional']

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      {/* Header - Collapsible */}
      <div
        className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Color Badge */}
          <div
            className="w-3 h-3 rounded-full"
            style={areaColorStyle}
            title={area.area_name}
          />

          {/* Area Name */}
          <h3 className="text-sm font-semibold text-gray-900">{area.area_name}</h3>

          {/* Area Size */}
          {area.square_metres > 0 && (
            <span className="text-xs text-gray-500">({area.square_metres} m²)</span>
          )}

          {/* Existing Insulation Badge */}
          {area.existing_insulation_type && (
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
              {area.existing_insulation_type}
            </span>
          )}
        </div>

        {/* Status Result Badge + Expand Arrow */}
        <div className="flex items-center gap-3">
          {area.result_type && (
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                area.result_type === 'Pass'
                  ? 'bg-green-100 text-green-800'
                  : area.result_type === 'Fail'
                    ? 'bg-red-100 text-red-800'
                    : area.result_type === 'Exempt'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {area.result_type}
            </span>
          )}

          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="px-4 py-4 bg-white space-y-4">
          {/* Description of Insulation */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description of Insulation
            </label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                rows={3}
                placeholder="e.g., R1.2 bulk insulation, water damaged..."
              />
            ) : (
              <p className="text-sm text-gray-700">{area.notes || 'No description'}</p>
            )}
          </div>

          {/* Result Status - Radio Buttons */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Status</label>
            {isEditing ? (
              <div className="flex items-center gap-4">
                {resultOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`result-${area.id}`}
                      value={option}
                      checked={formData.result === option}
                      onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                      className="w-4 h-4 accent-[#0066CC]"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold px-3 py-1 rounded ${
                    area.result_type === 'Pass'
                      ? 'bg-green-100 text-green-800'
                      : area.result_type === 'Fail'
                        ? 'bg-red-100 text-red-800'
                        : area.result_type === 'Exempt'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {area.result_type || 'Pending'}
                </span>
              </div>
            )}
          </div>

          {/* Work Required (if available) */}
          {(formData.workRequired || editable) && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Description of Work Required
              </label>
              {isEditing ? (
                <textarea
                  value={formData.workRequired}
                  onChange={(e) => setFormData({ ...formData, workRequired: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  rows={3}
                  placeholder="e.g., Remove damaged insulation, install R2.4..."
                />
              ) : (
                <p className="text-sm text-gray-700">
                  {formData.workRequired || 'No work description'}
                </p>
              )}
            </div>
          )}

          {/* Photos Count */}
          {showPhotos && photoCount > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700">
                📸 {photoCount} photo{photoCount !== 1 ? 's' : ''} uploaded
              </p>
            </div>
          )}

          {/* Edit/Save Buttons */}
          {editable && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-3 py-2 bg-[#0066CC] text-white rounded text-sm font-medium hover:bg-[#0052a3]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-3 py-2 border border-[#0066CC] text-[#0066CC] rounded text-sm font-medium hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}