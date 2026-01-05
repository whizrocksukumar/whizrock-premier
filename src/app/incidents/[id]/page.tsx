'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  AlertCircle, ArrowLeft, Edit2, CheckCircle, XCircle, 
  Plus, Upload, Trash2, MessageSquare, DollarSign, Clock,
  MapPin, User, Briefcase, Calendar
} from 'lucide-react'

interface IncidentDetails {
  id: string
  incident_number: string
  job_id: string | null
  job_number: string | null
  job_address: string | null
  title: string
  description: string
  location: string
  incident_type: string
  severity: string
  status: string
  occurred_at: string
  reported_at: string
  resolved_at: string | null
  closed_at: string | null
  resolution_notes: string | null
  root_cause: string | null
  corrective_action: string | null
  estimated_cost: number
  actual_cost: number
  reported_by_name: string | null
  assigned_to_name: string | null
}

interface IncidentPhoto {
  id: string
  file_name: string
  file_url: string
  caption: string | null
  taken_at: string
  uploaded_by_name: string | null
}

interface IncidentNote {
  id: string
  note_text: string
  note_type: string
  is_internal: boolean
  created_at: string
  created_by_name: string | null
}

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const incidentId = params.id
  const router = useRouter()
  const [incident, setIncident] = useState<IncidentDetails | null>(null)
  const [photos, setPhotos] = useState<IncidentPhoto[]>([])
  const [notes, setNotes] = useState<IncidentNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // New Note Form
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [newNote, setNewNote] = useState({ note_text: '', note_type: 'Update', is_internal: false })
  const [uploadingNote, setUploadingNote] = useState(false)

  // Photo Upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    fetchIncidentDetails()
    fetchPhotos()
    fetchNotes()
  }, [incidentId])

  const fetchIncidentDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('incidents')
        .select(`
          *,
          jobs!left(job_number, site_address),
          reported_by_team:team_members!reported_by(first_name, last_name),
          assigned_to_team:team_members!assigned_to(first_name, last_name)
        `)
        .eq('id', incidentId)
        .single()

      if (fetchError) throw fetchError

      setIncident({
        id: data.id,
        incident_number: data.incident_number,
        job_id: data.job_id,
        job_number: data.jobs?.job_number || null,
        job_address: data.jobs?.site_address || null,
        title: data.title,
        description: data.description,
        location: data.location,
        incident_type: data.incident_type,
        severity: data.severity,
        status: data.status,
        occurred_at: data.occurred_at,
        reported_at: data.reported_at,
        resolved_at: data.resolved_at,
        closed_at: data.closed_at,
        resolution_notes: data.resolution_notes,
        root_cause: data.root_cause,
        corrective_action: data.corrective_action,
        estimated_cost: data.estimated_cost || 0,
        actual_cost: data.actual_cost || 0,
        reported_by_name: data.reported_by_team 
          ? `${data.reported_by_team.first_name} ${data.reported_by_team.last_name}`
          : null,
        assigned_to_name: data.assigned_to_team
          ? `${data.assigned_to_team.first_name} ${data.assigned_to_team.last_name}`
          : null
      })

    } catch (err: any) {
      console.error('Error fetching incident:', err)
      setError(err.message || 'Failed to load incident details')
    } finally {
      setLoading(false)
    }
  }

  const fetchPhotos = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('incident_photos')
        .select(`
          *,
          uploaded_by_team:team_members!uploaded_by(first_name, last_name)
        `)
        .eq('incident_id', incidentId)
        .is('deleted_at', null)
        .order('taken_at', { ascending: false })

      if (fetchError) throw fetchError

      setPhotos((data || []).map((photo: any) => ({
        id: photo.id,
        file_name: photo.file_name,
        file_url: photo.file_url,
        caption: photo.caption,
        taken_at: photo.taken_at,
        uploaded_by_name: photo.uploaded_by_team
          ? `${photo.uploaded_by_team.first_name} ${photo.uploaded_by_team.last_name}`
          : null
      })))

    } catch (err: any) {
      console.error('Error fetching photos:', err)
    }
  }

  const fetchNotes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('incident_notes')
        .select(`
          *,
          created_by_team:team_members!created_by(first_name, last_name)
        `)
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setNotes((data || []).map((note: any) => ({
        id: note.id,
        note_text: note.note_text,
        note_type: note.note_type,
        is_internal: note.is_internal,
        created_at: note.created_at,
        created_by_name: note.created_by_team
          ? `${note.created_by_team.first_name} ${note.created_by_team.last_name}`
          : null
      })))

    } catch (err: any) {
      console.error('Error fetching notes:', err)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.note_text.trim()) return

    try {
      setUploadingNote(true)

      const { error: insertError } = await supabase
        .from('incident_notes')
        .insert({
          incident_id: incidentId,
          note_text: newNote.note_text,
          note_type: newNote.note_type,
          is_internal: newNote.is_internal,
          created_by: 'current-user-id' // TODO: Replace with actual user ID
        })

      if (insertError) throw insertError

      setNewNote({ note_text: '', note_type: 'Update', is_internal: false })
      setShowNoteForm(false)
      fetchNotes()

    } catch (err: any) {
      console.error('Error adding note:', err)
      alert('Failed to add note: ' + err.message)
    } finally {
      setUploadingNote(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploadingPhoto(true)

      for (const file of Array.from(files)) {
        // Validate file
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`)
          continue
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
          alert(`File ${file.name} is not a supported type. Use JPEG, PNG, or PDF.`)
          continue
        }

        // Upload to Storage
        const fileName = `${incidentId}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('incident-photos')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('incident-photos')
          .getPublicUrl(fileName)

        // Insert record
        const { error: insertError } = await supabase
          .from('incident_photos')
          .insert({
            incident_id: incidentId,
            file_name: file.name,
            file_url: publicUrl,
            uploaded_by: 'current-user-id' // TODO: Replace with actual user ID
          })

        if (insertError) throw insertError
      }

      fetchPhotos()

    } catch (err: any) {
      console.error('Error uploading photo:', err)
      alert('Failed to upload photo: ' + err.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Change incident status to "${newStatus}"?`)) return

    try {
      const { error: updateError } = await supabase
        .from('incidents')
        .update({ status: newStatus })
        .eq('id', incidentId)

      if (updateError) throw updateError

      fetchIncidentDetails()

    } catch (err: any) {
      console.error('Error updating status:', err)
      alert('Failed to update status: ' + err.message)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'bg-blue-100 text-blue-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Pending Customer': return 'bg-yellow-100 text-yellow-800'
      case 'Resolved': return 'bg-green-100 text-green-800'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Loading incident...</div>
      </div>
    )
  }

  if (error || !incident) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Incident not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/incidents')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              {incident.incident_number}
            </h1>
            <p className="text-xl text-gray-700 mt-2">{incident.title}</p>
            <div className="flex gap-3 mt-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                {incident.severity}
              </span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                {incident.status}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/incidents/${incident.id}/edit`)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            {incident.status !== 'Resolved' && incident.status !== 'Closed' && (
              <button
                onClick={() => handleStatusChange('Resolved')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Resolved
              </button>
            )}
            {incident.status === 'Resolved' && (
              <button
                onClick={() => handleStatusChange('Closed')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Close Incident
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Incident Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Incident Type</label>
                <p className="text-sm text-gray-900">{incident.incident_type}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {incident.location}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Occurred At</label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDateTime(incident.occurred_at)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Reported At</label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDateTime(incident.reported_at)}
                </p>
              </div>

              {incident.resolved_at && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Resolved At</label>
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {formatDateTime(incident.resolved_at)}
                  </p>
                </div>
              )}

              {incident.closed_at && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Closed At</label>
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-gray-600" />
                    {formatDateTime(incident.closed_at)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{incident.description}</p>
            </div>

            {incident.resolution_notes && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <label className="block text-xs font-medium text-green-700 mb-1">Resolution Notes</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{incident.resolution_notes}</p>
              </div>
            )}

            {incident.root_cause && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Root Cause</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{incident.root_cause}</p>
              </div>
            )}

            {incident.corrective_action && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Corrective Action</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{incident.corrective_action}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Photos</h2>
              <label className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>

            {photos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No photos uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    {photo.file_url.endsWith('.pdf') ? (
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-600">PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={photo.file_url}
                        alt={photo.caption || photo.file_name}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    )}
                    <div className="mt-2">
                      {photo.caption && (
                        <p className="text-xs text-gray-700">{photo.caption}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDateTime(photo.taken_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Timeline</h2>
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>

            {showNoteForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <textarea
                  value={newNote.note_text}
                  onChange={(e) => setNewNote({ ...newNote, note_text: e.target.value })}
                  placeholder="Enter note..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-red-500 mb-3"
                />
                <div className="flex gap-4 mb-3">
                  <select
                    value={newNote.note_type}
                    onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value })}
                    className="px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Update">Update</option>
                    <option value="Investigation">Investigation</option>
                    <option value="Resolution">Resolution</option>
                    <option value="Customer Contact">Customer Contact</option>
                    <option value="Internal">Internal</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newNote.is_internal}
                      onChange={(e) => setNewNote({ ...newNote, is_internal: e.target.checked })}
                      className="rounded"
                    />
                    Internal Only
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNote}
                    disabled={uploadingNote || !newNote.note_text.trim()}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm disabled:opacity-50"
                  >
                    {uploadingNote ? 'Saving...' : 'Save Note'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNoteForm(false)
                      setNewNote({ note_text: '', note_type: 'Update', is_internal: false })
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {notes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No notes yet.</p>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-red-600 pl-4 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-red-600">{note.note_type}</span>
                        {note.is_internal && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Internal
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatDateTime(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.note_text}</p>
                    {note.created_by_name && (
                      <p className="text-xs text-gray-500 mt-1">by {note.created_by_name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Job */}
          {incident.job_id && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                Related Job
              </h3>
              <Link
                href={`/jobs/${incident.job_id}`}
                className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <p className="text-sm font-medium text-blue-600">{incident.job_number}</p>
                {incident.job_address && (
                  <p className="text-xs text-gray-600 mt-1">{incident.job_address}</p>
                )}
              </Link>
            </div>
          )}

          {/* People */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              People
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Reported By</label>
                <p className="text-sm text-gray-900">{incident.reported_by_name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Assigned To</label>
                <p className="text-sm text-gray-900">{incident.assigned_to_name || 'Unassigned'}</p>
              </div>
            </div>
          </div>

          {/* Cost */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Cost Impact
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Estimated Cost</label>
                <p className="text-lg font-bold text-gray-900">
                  {incident.estimated_cost > 0 
                    ? `$${incident.estimated_cost.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}`
                    : '-'
                  }
                </p>
              </div>
              {incident.actual_cost > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Actual Cost</label>
                  <p className="text-lg font-bold text-red-600">
                    ${incident.actual_cost.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
