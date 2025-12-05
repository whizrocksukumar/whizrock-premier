'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClientDetailsForm } from '@/app/components/PhotoUploader'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

interface ClientData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  siteAddress: string
  region: string
  postcode?: string
}

interface Installer {
  id: string
  name: string
}

interface Enquiry {
  id: string
  enquiry_number: string
  customer_name: string
}

export default function NewAssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [installers, setInstallers] = useState<Installer[]>([])
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [error, setError] = useState<string | null>(null)

  const [clientData, setClientData] = useState<ClientData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    siteAddress: '',
    region: '',
    postcode: ''
  })

  const [assessmentData, setAssessmentData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    assignedInstallerId: '',
    notes: '',
    enquiryId: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadInstallers()
    loadEnquiries()
  }, [])

  const loadInstallers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name')
        .eq('role', 'Installer')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setInstallers(data || [])
    } catch (err) {
      console.error('Error loading installers:', err)
    }
  }

  const loadEnquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('enquiries')
        .select('id, enquiry_number, customer_name')
        .neq('status', 'Completed')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEnquiries(data || [])
    } catch (err) {
      console.error('Error loading enquiries:', err)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Client details validation handled by ClientDetailsForm
    if (!clientData.firstName) newErrors.firstName = 'First name is required'
    if (!clientData.lastName) newErrors.lastName = 'Last name is required'
    if (!clientData.email) newErrors.email = 'Email is required'
    if (!clientData.siteAddress) newErrors.siteAddress = 'Site address is required'
    if (!clientData.region) newErrors.region = 'Region is required'

    // Assessment details validation
    if (!assessmentData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required'
    } else {
      const selectedDate = new Date(assessmentData.scheduledDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.scheduledDate = 'Date cannot be in the past'
      }
    }

    if (!assessmentData.scheduledTime) {
      newErrors.scheduledTime = 'Scheduled time is required'
    } else {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!timeRegex.test(assessmentData.scheduledTime)) {
        newErrors.scheduledTime = 'Invalid time format (use HH:MM)'
      }
    }

    if (!assessmentData.assignedInstallerId) {
      newErrors.assignedInstallerId = 'Please assign an installer'
    }

    if (assessmentData.notes && assessmentData.notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateReferenceNumber = async (): Promise<string> => {
    const year = new Date().getFullYear()
    
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('reference_number')
        .like('reference_number', `ASS-${year}%`)
        .order('reference_number', { ascending: false })
        .limit(1)

      if (error) throw error

      let nextNumber = 1
      if (data && data.length > 0) {
        const lastRef = data[0].reference_number
        const lastNum = parseInt(lastRef.split('-')[2])
        nextNumber = lastNum + 1
      }

      return `ASS-${year}-${String(nextNumber).padStart(4, '0')}`
    } catch (err) {
      console.error('Error generating reference number:', err)
      return `ASS-${year}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fix all validation errors before submitting')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const referenceNumber = await generateReferenceNumber()

      const { error: insertError } = await supabase
        .from('assessments')
        .insert({
          reference_number: referenceNumber,
          customer_name: `${clientData.firstName} ${clientData.lastName}`,
          customer_email: clientData.email,
          customer_phone: clientData.phone || null,
          customer_company: clientData.company || null,
          site_address: clientData.siteAddress,
          city: clientData.region,
          region_id: clientData.region,
          postcode: clientData.postcode || null,
          scheduled_date: assessmentData.scheduledDate,
          scheduled_time: assessmentData.scheduledTime,
          assigned_installer_id: assessmentData.assignedInstallerId,
          status: 'Scheduled',
          notes: assessmentData.notes || null,
          enquiry_id: assessmentData.enquiryId || null,
          created_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      router.push('/assessments')
    } catch (err: any) {
      console.error('Error scheduling assessment:', err)
      setError(`Error scheduling assessment: ${err.message || 'Unknown error'}`)
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <Link href="/assessments" className="btn-ghost btn-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Assessments
        </Link>
        <h1 className="page-title">Schedule New Assessment</h1>
        <p className="page-subtitle">Create a free assessment for a potential customer</p>
      </div>

      {error && (
        <div className="card mb-6" style={{ backgroundColor: 'var(--color-accent-error)', color: 'white', padding: 'var(--space-4)' }}>
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Client Details */}
        <ClientDetailsForm
          data={clientData}
          onChange={setClientData}
          readOnly={false}
          title="Client Details"
        />

        {/* Section 2: Assessment Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Assessment Details</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label form-label-required">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={assessmentData.scheduledDate}
                  onChange={(e) => setAssessmentData({ ...assessmentData, scheduledDate: e.target.value })}
                  className={`form-input ${errors.scheduledDate ? 'error' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.scheduledDate && (
                  <span className="form-error">{errors.scheduledDate}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">
                  Scheduled Time
                </label>
                <input
                  type="time"
                  value={assessmentData.scheduledTime}
                  onChange={(e) => setAssessmentData({ ...assessmentData, scheduledTime: e.target.value })}
                  className={`form-input ${errors.scheduledTime ? 'error' : ''}`}
                />
                {errors.scheduledTime && (
                  <span className="form-error">{errors.scheduledTime}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">
                Assigned Installer
              </label>
              <select
                value={assessmentData.assignedInstallerId}
                onChange={(e) => setAssessmentData({ ...assessmentData, assignedInstallerId: e.target.value })}
                className={`form-select ${errors.assignedInstallerId ? 'error' : ''}`}
              >
                <option value="">Select an installer...</option>
                {installers.map((installer) => (
                  <option key={installer.id} value={installer.id}>
                    {installer.name}
                  </option>
                ))}
              </select>
              {errors.assignedInstallerId && (
                <span className="form-error">{errors.assignedInstallerId}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Notes
              </label>
              <textarea
                value={assessmentData.notes}
                onChange={(e) => setAssessmentData({ ...assessmentData, notes: e.target.value })}
                className={`form-textarea ${errors.notes ? 'error' : ''}`}
                placeholder="Add any additional notes or special instructions..."
                rows={4}
                maxLength={500}
              />
              <span className="form-help">
                {assessmentData.notes.length}/500 characters
              </span>
              {errors.notes && (
                <span className="form-error">{errors.notes}</span>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Link to Enquiry (Optional) */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Link to Enquiry (Optional)</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">
                Related Enquiry
              </label>
              <select
                value={assessmentData.enquiryId}
                onChange={(e) => setAssessmentData({ ...assessmentData, enquiryId: e.target.value })}
                className="form-select"
              >
                <option value="">None - New customer</option>
                {enquiries.map((enquiry) => (
                  <option key={enquiry.id} value={enquiry.id}>
                    {enquiry.enquiry_number} - {enquiry.customer_name}
                  </option>
                ))}
              </select>
              <span className="form-help">
                Link this assessment to an existing enquiry if applicable
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Link href="/assessments" className="btn-secondary">
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                Scheduling...
              </>
            ) : (
              'Schedule Assessment'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}