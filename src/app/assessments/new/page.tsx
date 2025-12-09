'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

// Temporarily disabled due to missing component - will be re-enabled in Phase 2
// import ClientSelector from '@/components/ClientSelector'

interface AssessmentArea {
  id: string
  area_type: string
  length: number
  width: number
  notes: string
}

export default function NewAssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Client info
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [siteAddress, setSiteAddress] = useState('')

  // Assessment details
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0])
  const [assessmentType, setAssessmentType] = useState('residential')
  
  // Areas
  const [areas, setAreas] = useState<AssessmentArea[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddArea = () => {
    const newArea: AssessmentArea = {
      id: Date.now().toString(),
      area_type: 'wall',
      length: 0,
      width: 0,
      notes: ''
    }
    setAreas([...areas, newArea])
  }

  const handleRemoveArea = (id: string) => {
    setAreas(areas.filter(a => a.id !== id))
  }

  const handleSaveAssessment = async () => {
    try {
      setLoading(true)
      setError('')

      if (!clientName || !siteAddress) {
        setError('Please fill in required fields')
        return
      }

      // Create assessment record
      const { data, error: insertError } = await supabase
        .from('assessments')
        .insert([
          {
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            site_address: siteAddress,
            assessment_type: assessmentType,
            assessment_date: assessmentDate,
            status: 'draft'
          }
        ])
        .select()

      if (insertError) throw insertError

      setSuccess('Assessment saved successfully!')
      setTimeout(() => {
        router.push('/assessments')
      }, 1500)
    } catch (err) {
      console.error('Error saving assessment:', err)
      setError(err instanceof Error ? err.message : 'Failed to save assessment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">New Assessment</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Client Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Client Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Client Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Site Address"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg col-span-2"
              required
            />
          </div>
        </div>

        {/* Assessment Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Assessment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Assessment Date</label>
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assessment Type</label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Areas */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Areas to Assess</h2>
            <button
              onClick={handleAddArea}
              className="flex items-center gap-2 px-3 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3]"
            >
              <Plus className="w-4 h-4" />
              Add Area
            </button>
          </div>

          {areas.length === 0 ? (
            <p className="text-gray-500 text-sm">No areas added yet. Click "Add Area" to get started.</p>
          ) : (
            <div className="space-y-3">
              {areas.map((area) => (
                <div key={area.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Area type (e.g., Exterior Wall, Attic)"
                      value={area.area_type}
                      onChange={(e) => {
                        setAreas(areas.map(a => a.id === area.id ? {...a, area_type: e.target.value} : a))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Length (m)"
                        value={area.length}
                        onChange={(e) => {
                          setAreas(areas.map(a => a.id === area.id ? {...a, length: parseFloat(e.target.value)} : a))
                        }}
                        className="px-3 py-2 border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Width (m)"
                        value={area.width}
                        onChange={(e) => {
                          setAreas(areas.map(a => a.id === area.id ? {...a, width: parseFloat(e.target.value)} : a))
                        }}
                        className="px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                    <textarea
                      placeholder="Notes"
                      value={area.notes}
                      onChange={(e) => {
                        setAreas(areas.map(a => a.id === area.id ? {...a, notes: e.target.value} : a))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveArea(area.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-6 border-t">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAssessment}
            disabled={loading}
            className="px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>

      {/* Note about Phase 2 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is the Phase 1 basic assessment form. Phase 2 will include photo uploads, 
          client selector integration, and advanced assessment features.
        </p>
      </div>
    </div>
  )
}