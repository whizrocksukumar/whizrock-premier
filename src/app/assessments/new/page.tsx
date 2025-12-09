'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import ClientSelector from '@/components/ClientSelector'

export default function NewAssessmentPage() {
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    notes: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedClient) {
      setError('Please select or create a client')
      return
    }

    if (!formData.scheduled_date || !formData.scheduled_time) {
      setError('Please fill in scheduled date and time')
      return
    }

    setSaving(true)

    try {
      // Generate reference number
      const refNumber = `ASS-${Date.now().toString().slice(-8)}`

      const { data, error: insertError } = await supabase
        .from('assessments')
        .insert({
          reference_number: refNumber,
          client_id: selectedClient.id,
          site_address: selectedClient.address_line_1 || '',
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
          status: 'Scheduled',
          notes: formData.notes,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Redirect to assessments list
      router.push('/assessments')
    } catch (err: any) {
      console.error('Error creating assessment:', err)
      setError(err.message || 'Failed to create assessment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/assessments" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[#0066CC]">Schedule New Assessment</h1>
            <p className="text-sm text-gray-500 mt-1">Free site assessment for potential customers</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select or Create Client */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select or Create Client</h2>
            <ClientSelector onClientSelected={setSelectedClient} />
          </div>

          {/* Step 2: Assessment Details */}
          {selectedClient && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Assessment Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="scheduled_date"
                      value={formData.scheduled_date}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="scheduled_time"
                      value={formData.scheduled_time}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Add any additional notes about this assessment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {selectedClient && (
            <div className="flex gap-4 justify-end">
              <Link
                href="/assessments"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {saving ? 'Scheduling...' : 'Schedule Assessment'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}