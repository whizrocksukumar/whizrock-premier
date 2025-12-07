// Assessment Wordings Types

export type ResultType = 'Pass' | 'Fail' | 'Exempt' | 'Pending'

export interface AssessmentWordings {
  id: string
  assessment_id: string
  area_id: string
  result_type: ResultType
  wordings: string | null
  recommended_action: string | null
  created_at: string
  updated_at: string
}

export interface AssessmentAreaWithResult {
  id: string
  assessment_id: string
  area_name: string
  square_metres: number
  existing_insulation_type: string | null
  recommended_r_value: string | null
  removal_required: boolean
  notes: string | null
  result_type: ResultType
  created_at: string
}

export const RESULT_TYPE_CONFIG = {
  Pass: {
    label: 'Pass',
    color: 'bg-green-100 text-green-800',
    badgeColor: 'bg-green-500',
    borderColor: 'border-green-500',
    icon: '✓'
  },
  Fail: {
    label: 'Fail',
    color: 'bg-red-100 text-red-800',
    badgeColor: 'bg-red-500',
    borderColor: 'border-red-500',
    icon: '✗'
  },
  Exempt: {
    label: 'Exempt',
    color: 'bg-purple-100 text-purple-800',
    badgeColor: 'bg-purple-500',
    borderColor: 'border-purple-500',
    icon: '○'
  },
  Pending: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-800',
    badgeColor: 'bg-gray-500',
    borderColor: 'border-gray-500',
    icon: '◌'
  }
} as const
