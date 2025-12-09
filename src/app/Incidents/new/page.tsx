'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AlertCircle, ArrowLeft, Upload, X } from 'lucide-react'

interface Job {
  id: string
  job_number: string
  site_address: string
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
}

export default function NewIncidentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [photos, setPhotos] = useState<File[]>([])

  const [formData, setFormData] = useState({
    job_id: '',
    title: '',
    description: '',
    location: '',
    incident_type: 'Other',
    severity: 'Medium',
    occurred_at: new Date().toISOString().slice(0, 16),
    assigned_to: '',
    estimated_cost: ''
  })

  useEffect(() => {
    fetchJobs()
    fetchTeamMembers()
  }, [])

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_number, site_address')
        .in('status', ['Scheduled', 'In Progress'])
        .order('job_number', { ascending: false })

      if (error) throw error
      setJobs(data || [])
    } catch (err: any) {
      console.error('Error fetching jobs:', err)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name')

      if (error) throw error
      setTeamMembers(data || [])
    } catch (err: any) {
      console.error('Error fetching team members:', err)
    }
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos: File[] = []
    for (const file of Array.from(files)) {
      // Validate
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`)
        continue
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} is not a supported type. Use JPEG, PNG, or PDF.`)
        continue
      }

      newPhotos.push(file)
    }

    setPhotos([...photos, ...newPhotos])
  }

  const handlePhotoRemove = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    if (!formData.description.trim()) {
      setError('Description is required')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Create incident
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .insert({
          job_id: formData.job_id || null,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          incident_type: formData.incident_type,
          severity: formData.severity,
          status: 'Open',
          occurred_at: formData.occurred_at,
          reported_at: new Date().toISOString(),
          reported_by: 'current-user-id', // TODO: Replace with actual user ID
          assigned_to: formData.assigned_to || null,
          estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : 0
        })
        .select()
        .single()

      if (incidentError) throw incidentError

      // Upload photos
      if (photos.length > 0) {
        for (const photo of photos) {
          const fileName = `${incident.id}/${Date.now()}_${photo.name}`
          
          const { error: uploadError } = await supabase.storage
            .from('incident-photos')
            .upload(fileName, photo)

          if (uploadError) {
            console.error('Error uploading photo:', uploadError)
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from('incident-photos')
            .getPublicUrl(fileName)

          await supabase
            .from('incident_photos')
            .insert({
              incident_id: incident.id,
              file_name: photo.name,
              file_url: publicUrl,
              uploaded_by: 'current-user-id' // TODO: Replace with actual user ID
            })
        }
      }

      // Create initial note
      await supabase
        .from('incident_notes')
        .insert({
          incident_id: incident.id,
          note_text: 'Incident reported',
          note_type: 'Update',
          is_internal: false,
          created_by: 'current-user-id' // TODO: Replace with actual user ID
        })

      router.push(`/incidents/${incident.id}`)

    } catch (err: any) {
      console.error('Error creating incident:', err)
      setError(err.message || 'Failed to create incident')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/incidents')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents
        </button>

        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertCircle className="w-8 h-8 text-red-600" />
          Report New Incident
        </h1>
        <p className="text-gray-600 mt-1">Document an incident that occurred on a job site</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Job Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Job <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={formData.job_id}
                onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select a job...</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.job_number} - {job.site_address}
                  </option>
                ))}
              </select>
            </div>

            {/* Occurred At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When Did It Occur? <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.occurred_at}
                onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Incident Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Type <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.incident_type}
                onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-red-500"
              >
                <option value="Safety Issue">Safety Issue</option>
                <option value="Quality Issue">Quality Issue</option>
                <option value="Equipment Failure">Equipment Failure</option>
                <option value="Material Shortage">Material Shortage</option>
                <option value="Customer Complaint">Customer Complaint</option>
                <option value="Weather Delay">Weather Delay</option>
                <option value="Site Access Issue">Site Access Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-red-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-red-500"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Incident Details</h2>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Brief summary of the incident"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Specific location where incident occurred"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              placeholder="Detailed description of what happened..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={6}
              className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Photos */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Photos</h2>
          
          <div className="mb-4">
            <label className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-gray-300">
              <Upload className="w-4 h-4" />
              Upload Photos (Max 10MB each)
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,application/pdf"
                onChange={handlePhotoAdd}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: JPEG, PNG, PDF
            </p>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {photo.type === 'application/pdf' ? (
                      <span className="text-xs text-gray-600">PDF</span>
                    ) : (
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePhotoRemove(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">{photo.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Incident...' : 'Create Incident'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/incidents')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
