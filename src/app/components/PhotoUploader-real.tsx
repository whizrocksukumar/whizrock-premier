'use client';

import { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface PhotoUploaderProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export const PhotoUploader = ({ 
  photos, 
  onPhotosChange, 
  maxFiles = 10, 
  maxSizeMB = 10 
}: PhotoUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return `${file.name} is not an image file`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `${file.name} is larger than ${maxSizeMB}MB`;
    }

    return null;
  };

  const generatePreview = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({
        ...prev,
        [file.name]: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    setError(null);
    const newPhotos = [...photos];
    const filesArray = Array.from(files);

    // Check max files limit
    if (newPhotos.length + filesArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} photos allowed`);
      return;
    }

    // Validate and add each file
    for (const file of filesArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Check for duplicates
      if (!newPhotos.some(p => p.name === file.name && p.size === file.size)) {
        newPhotos.push(file);
        generatePreview(file);
      }
    }

    onPhotosChange(newPhotos);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const removedPhoto = photos[index];
    
    // Remove preview
    setPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[removedPhoto.name];
      return newPreviews;
    });

    onPhotosChange(newPhotos);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-primary bg-primary-light' : 'border-neutral-300'}
          ${photos.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          borderColor: dragActive ? 'var(--color-primary)' : 'var(--color-neutral-300)',
          backgroundColor: dragActive ? 'var(--color-primary-light)' : 'transparent'
        }}
      >
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleChange}
          disabled={photos.length >= maxFiles}
          className="hidden"
        />
        <label
          htmlFor="photo-upload"
          className={`flex flex-col items-center gap-3 ${
            photos.length >= maxFiles ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)'
            }}
          >
            <Upload size={32} />
          </div>
          <div>
            <p className="text-lg font-medium" style={{ color: 'var(--color-neutral-900)' }}>
              {dragActive ? 'Drop photos here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-neutral-600)' }}>
              PNG, JPG up to {maxSizeMB}MB (Max {maxFiles} photos)
            </p>
          </div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-error-light)',
            borderLeft: '4px solid var(--color-error)'
          }}
        >
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>
            {error}
          </p>
        </div>
      )}

      {/* Photo Count */}
      {photos.length > 0 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-neutral-600)' }}>
          <ImageIcon size={16} />
          <span>
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} selected
          </span>
        </div>
      )}

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={`${photo.name}-${index}`}
              className="relative group rounded-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--color-neutral-100)',
                aspectRatio: '1'
              }}
            >
              {/* Preview Image */}
              {previews[photo.name] ? (
                <img
                  src={previews[photo.name]}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={48} style={{ color: 'var(--color-neutral-400)' }} />
                </div>
              )}

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white'
                }}
                aria-label="Remove photo"
              >
                <X size={16} />
              </button>

              {/* File Name */}
              <div
                className="absolute bottom-0 left-0 right-0 p-2 text-xs truncate"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white'
                }}
              >
                {photo.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
