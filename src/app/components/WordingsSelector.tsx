'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ResultType, AssessmentWordings, RESULT_TYPE_CONFIG } from '@/types/assessmentWordings'
import { Save, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface WordingsSelectorProps {
  assessmentId: string
  areaId: string
  areaName: string
  currentResultType: ResultType
  onSave?: () => void
}

export default function WordingsSelector({
  assessmentId,
  areaId,
  areaName,
  currentResultType,
  onSave
}: WordingsSelectorProps) {
  const [resultType, setResultType] = useState<ResultType>(currentResultType)
  const [wordings, setWordings] = useState('')
  const [recommendedAction, setRecommendedAction] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Load existing wordings when result type changes
  useEffect(() => {
    loadWordings()
  }, [areaId])

  const loadWordings = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('assessment_wordings')
        .select('*')
        .eq('area_id', areaId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        setResultType(data.result_type as ResultType)
        setWordings(data.wordings || '')
        setRecommendedAction(data.recommended_action || '')
      }
    } catch (err: any) {
      console.error('Error loading wordings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResultTypeChange = async (newResultType: ResultType) => {
    setResultType(newResultType)
    setExpanded(true)

    // Update the assessment_areas table result_type
    try {
      const { error: updateError } = await supabase
        .from('assessment_areas')
        .update({ result_type: newResultType })
        .eq('id', areaId)

      if (updateError) throw updateError
    } catch (err: any) {
      console.error('Error updating area result type:', err)
      setError(err.message)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Check if wordings record exists
      const { data: existing } = await supabase
        .from('assessment_wordings')
        .select('id')
        .eq('area_id', areaId)
        .single()

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('assessment_wordings')
          .update({
            result_type: resultType,
            wordings: wordings || null,
            recommended_action: recommendedAction || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('assessment_wordings')
          .insert({
            assessment_id: assessmentId,
            area_id: areaId,
            result_type: resultType,
            wordings: wordings || null,
            recommended_action: recommendedAction || null
          })

        if (insertError) throw insertError
      }

      // Update the assessment_areas result_type
      const { error: areaUpdateError } = await supabase
        .from('assessment_areas')
        .update({ result_type: resultType })
        .eq('id', areaId)

      if (areaUpdateError) throw areaUpdateError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

      if (onSave) {
        onSave()
      }
    } catch (err: any) {
      console.error('Error saving wordings:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const config = RESULT_TYPE_CONFIG[resultType]

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Header with Result Type Selector */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">{areaName}</h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[#0066CC] hover:underline"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600 mr-2">Result:</span>
          {(['Pass', 'Fail', 'Exempt', 'Pending'] as ResultType[]).map((type) => {
            const typeConfig = RESULT_TYPE_CONFIG[type]
            const isSelected = resultType === type
            return (
              <button
                key={type}
                onClick={() => handleResultTypeChange(type)}
                disabled={loading || saving}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded transition-all
                  ${isSelected 
                    ? `${typeConfig.color} ring-2 ${typeConfig.borderColor}` 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <span className="mr-1">{typeConfig.icon}</span>
                {type}
              </button>
            )
          })}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#0066CC]" />
              <span className="ml-2 text-sm text-gray-600">Loading...</span>
            </div>
          ) : (
            <>
              {/* Wordings Text Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Findings / Wordings
                </label>
                <textarea
                  value={wordings}
                  onChange={(e) => setWordings(e.target.value)}
                  rows={4}
                  placeholder="Enter detailed findings for this area..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC] text-sm"
                />
              </div>

              {/* Recommended Action Text Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommended Action
                </label>
                <textarea
                  value={recommendedAction}
                  onChange={(e) => setRecommendedAction(e.target.value)}
                  rows={3}
                  placeholder="Enter recommended actions based on the assessment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC] text-sm"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Saved successfully!</span>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Wordings
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
