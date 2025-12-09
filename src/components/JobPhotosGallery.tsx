'use client'

import { useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Photo {
  id: string
  photo_type: 'Before' | 'After'
  file_url: string
  caption?: string
  uploaded_at: string
  uploaded_by_name?: string
}

interface JobPhotosGalleryProps {
  jobId: string
  photos: Photo[]
  onPhotoUploaded?: () => void
  editable?: boolean
}

export default function JobPhotosGallery({ 
  jobId, 
  photos, 
  onPhotoUploaded,
  editable = false 
}: JobPhotosGalleryProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState<'Before' | 'After'>('Before')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, photoType: 'Before' | 'After') => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('Please upload a JPEG or PNG image')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    try {
      setUploading(true)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${jobId}/${photoType.toLowerCase()}_${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('job-photos')
        .getPublicUrl(fileName)

      // Save photo record to database
      const { error: dbError } = await supabase
        .from('job_photos')
        .insert({
          job_id: jobId,
          photo_type: photoType,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          uploaded_at: new Date().toISOString()
        })

      if (dbError) throw dbError

      alert('Photo uploaded successfully!')
      
      // Callback to refresh photos
      if (onPhotoUploaded) {
        onPhotoUploaded()
      }

    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Error uploading photo: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const { error } = await supabase
        .from('job_photos')
        .update({ is_deleted: true })
        .eq('id', photoId)

      if (error) throw error

      alert('Photo deleted successfully!')
      
      if (onPhotoUploaded) {
        onPhotoUploaded()
      }

    } catch (error: any) {
      console.error('Delete error:', error)
      alert('Error deleting photo: ' + error.message)
    }
  }

  const beforePhotos = photos.filter(p => p.photo_type === 'Before')
  const afterPhotos = photos.filter(p => p.photo_type === 'After')

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {editable && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="Before"
                checked={selectedType === 'Before'}
                onChange={(e) => setSelectedType(e.target.value as 'Before' | 'After')}
                className="text-orange-500"
              />
              <span className="text-sm font-medium">Before Photos</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="After"
                checked={selectedType === 'After'}
                onChange={(e) => setSelectedType(e.target.value as 'Before' | 'After')}
                className="text-orange-500"
              />
              <span className="text-sm font-medium">After Photos</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex-1">
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50">
                <Upload className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">
                  {uploading ? 'Uploading...' : `Upload ${selectedType} Photo`}
                </span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => handleFileUpload(e, selectedType)}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Accepted: JPEG, PNG | Max size: 10MB
          </p>
        </div>
      )}

      {/* Photos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before Photos */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Before Photos ({beforePhotos.length})
          </h3>
          {beforePhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {beforePhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.file_url}
                    alt={photo.caption || 'Before photo'}
                    className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  {editable && (
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {photo.caption && (
                    <p className="text-xs text-gray-600 mt-1 truncate">{photo.caption}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(photo.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No before photos</p>
            </div>
          )}
        </div>

        {/* After Photos */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            After Photos ({afterPhotos.length})
          </h3>
          {afterPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {afterPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.file_url}
                    alt={photo.caption || 'After photo'}
                    className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  {editable && (
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {photo.caption && (
                    <p className="text-xs text-gray-600 mt-1 truncate">{photo.caption}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(photo.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No after photos</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedPhoto.file_url}
              alt={selectedPhoto.caption || 'Photo'}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {selectedPhoto.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                <p className="text-sm">{selectedPhoto.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
