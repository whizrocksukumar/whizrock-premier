'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PhotoUploader } from '@/app/components/PhotoUploader-real';
import Link from 'next/link';

interface Assessment {
  id: string;
  reference_number: string;
  customer_first_name: string;
  customer_last_name: string;
  site_address: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
}

interface SiteAssessmentData {
  siteAccess: string;
  existingInsulation: string;
  removalRequired: boolean;
  estimatedArea: string;
  groundCondition: string;
  notes: string;
}

interface CompletionData {
  completionNotes: string;
  completedBy: string;
}

export default function CompleteAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(false);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  // Site Assessment State
  const [siteData, setSiteData] = useState<SiteAssessmentData>({
    siteAccess: '',
    existingInsulation: '',
    removalRequired: false,
    estimatedArea: '',
    groundCondition: '',
    notes: ''
  });

  // Completion State
  const [completionData, setCompletionData] = useState<CompletionData>({
    completionNotes: '',
    completedBy: ''
  });

  useEffect(() => {
    async function fetchAssessment() {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error('Assessment not found');
        }

        // Only allow completion for Scheduled assessments
        if (data.status !== 'Scheduled') {
          setError('Only scheduled assessments can be completed.');
        }

        setAssessment(data);
      } catch (err: any) {
        console.error('Error fetching assessment:', err);
        setError(err.message || 'Failed to load assessment.');
      } finally {
        setLoadingAssessment(false);
      }
    }

    fetchAssessment();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!siteData.siteAccess) {
        throw new Error('Site access information is required.');
      }

      if (!siteData.existingInsulation) {
        throw new Error('Existing insulation information is required.');
      }

      if (!siteData.estimatedArea || parseFloat(siteData.estimatedArea) <= 0) {
        throw new Error('Please enter a valid estimated area.');
      }

      if (!siteData.groundCondition) {
        throw new Error('Ground condition information is required.');
      }

      if (!completionData.completedBy.trim()) {
        throw new Error('Please enter who completed the assessment.');
      }

      // Update assessment with completion data
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          status: 'Completed',
          completed_at: new Date().toISOString(),
          site_access: siteData.siteAccess,
          existing_insulation: siteData.existingInsulation,
          removal_required: siteData.removalRequired,
          estimated_area: parseFloat(siteData.estimatedArea),
          ground_condition: siteData.groundCondition,
          site_notes: siteData.notes || null,
          completion_notes: completionData.completionNotes || null,
          completed_by: completionData.completedBy
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // TODO: Upload photos to storage bucket when implemented
      if (photos.length > 0) {
        console.log(`${photos.length} photos ready for upload when storage is configured`);
        // Future implementation:
        // - Upload to Supabase Storage
        // - Save photo URLs to assessment_photos table
      }

      // Success - redirect to assessment detail page
      router.push(`/assessments/${id}`);

    } catch (err: any) {
      console.error('Error completing assessment:', err);
      setError(err.message || 'Failed to complete assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/assessments/${id}`);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loadingAssessment) {
    return (
      <div className="page-container" style={{ paddingTop: '1rem' }}>
        <div className="card">
          <p className="text-neutral-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment || error) {
    return (
      <div className="page-container" style={{ paddingTop: '1rem' }}>
        <div className="card" style={{ backgroundColor: 'var(--color-error-light)', borderColor: 'var(--color-error)' }}>
          <p style={{ color: 'var(--color-error)' }}>
            {error || 'Assessment not found'}
          </p>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <Link href="/assessments" className="btn-secondary">
            Back to Assessments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
      {/* Mobile-optimized header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link 
          href={`/assessments/${id}`}
          className="btn-secondary"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            marginBottom: '1rem',
            minHeight: '44px',
            padding: '0.75rem 1rem'
          }}
        >
          ← Back to Assessment
        </Link>
        <h1 className="page-title" style={{ fontSize: 'var(--font-size-2xl)' }}>
          Complete Assessment
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="form-layout">
        {error && assessment.status === 'Scheduled' && (
          <div className="card" style={{ backgroundColor: 'var(--color-error-light)', borderColor: 'var(--color-error)' }}>
            <p style={{ color: 'var(--color-error)' }}>{error}</p>
          </div>
        )}

        {/* Assessment Info (Read-only) */}
        <div className="card">
          <h2 className="card-title">Assessment Information</h2>
          <div className="form-grid">
            <div>
              <p className="form-label">Reference Number</p>
              <p className="text-neutral-900" style={{ fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                {assessment.reference_number}
              </p>
            </div>
            <div>
              <p className="form-label">Customer</p>
              <p className="text-neutral-900" style={{ fontSize: 'var(--font-size-base)' }}>
                {assessment.customer_first_name} {assessment.customer_last_name}
              </p>
            </div>
          </div>
          <div className="form-group">
            <p className="form-label">Site Address</p>
            <p className="text-neutral-900" style={{ fontSize: 'var(--font-size-base)' }}>
              {assessment.site_address || 'Not provided'}
            </p>
          </div>
          <div className="form-grid">
            <div>
              <p className="form-label">Scheduled Date</p>
              <p className="text-neutral-900" style={{ fontSize: 'var(--font-size-base)' }}>
                {formatDate(assessment.scheduled_date)}
              </p>
            </div>
            <div>
              <p className="form-label">Scheduled Time</p>
              <p className="text-neutral-900" style={{ fontSize: 'var(--font-size-base)' }}>
                {formatTime(assessment.scheduled_time)}
              </p>
            </div>
          </div>
        </div>

        {/* Site Assessment */}
        <div className="card">
          <h2 className="card-title">Site Assessment</h2>
          
          <div className="form-group">
            <label className="form-label" htmlFor="site_access">
              Site Access <span className="form-required">*</span>
            </label>
            <select
              id="site_access"
              value={siteData.siteAccess}
              onChange={(e) => setSiteData({ ...siteData, siteAccess: e.target.value })}
              className="form-select"
              required
              style={{ minHeight: '44px', fontSize: 'var(--font-size-base)' }}
            >
              <option value="">-- Select Site Access --</option>
              <option value="Easy">Easy - Direct access, no obstacles</option>
              <option value="Moderate">Moderate - Some access restrictions</option>
              <option value="Difficult">Difficult - Limited access, special equipment needed</option>
              <option value="Very Difficult">Very Difficult - Major access challenges</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="existing_insulation">
              Existing Insulation <span className="form-required">*</span>
            </label>
            <select
              id="existing_insulation"
              value={siteData.existingInsulation}
              onChange={(e) => setSiteData({ ...siteData, existingInsulation: e.target.value })}
              className="form-select"
              required
              style={{ minHeight: '44px', fontSize: 'var(--font-size-base)' }}
            >
              <option value="">-- Select Existing Insulation --</option>
              <option value="None">None - No existing insulation</option>
              <option value="Minimal">Minimal - Some old insulation present</option>
              <option value="Partial">Partial - Covers some areas</option>
              <option value="Full">Full - Complete existing coverage</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-checkbox-label" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={siteData.removalRequired}
                onChange={(e) => setSiteData({ ...siteData, removalRequired: e.target.checked })}
                className="form-checkbox"
                style={{ width: '24px', height: '24px' }}
              />
              <span style={{ fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
                Removal of existing insulation required
              </span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="estimated_area">
              Estimated Area (m²) <span className="form-required">*</span>
            </label>
            <input
              type="number"
              id="estimated_area"
              value={siteData.estimatedArea}
              onChange={(e) => setSiteData({ ...siteData, estimatedArea: e.target.value })}
              className="form-input"
              required
              min="0"
              step="0.1"
              placeholder="e.g., 150.5"
              style={{ minHeight: '44px', fontSize: 'var(--font-size-base)' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ground_condition">
              Ground Condition <span className="form-required">*</span>
            </label>
            <select
              id="ground_condition"
              value={siteData.groundCondition}
              onChange={(e) => setSiteData({ ...siteData, groundCondition: e.target.value })}
              className="form-select"
              required
              style={{ minHeight: '44px', fontSize: 'var(--font-size-base)' }}
            >
              <option value="">-- Select Ground Condition --</option>
              <option value="Dry">Dry - Good condition</option>
              <option value="Damp">Damp - Some moisture present</option>
              <option value="Wet">Wet - Standing water or very damp</option>
              <option value="Mixed">Mixed - Varies across site</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="site_notes">
              Site Notes
            </label>
            <textarea
              id="site_notes"
              value={siteData.notes}
              onChange={(e) => setSiteData({ ...siteData, notes: e.target.value })}
              className="form-textarea"
              rows={4}
              placeholder="Any additional observations about the site..."
              style={{ minHeight: '88px', fontSize: 'var(--font-size-base)' }}
            />
          </div>
        </div>

        {/* Photos */}
        <div className="card">
          <h2 className="card-title">Assessment Photos</h2>
          <p className="form-helper" style={{ marginBottom: '1rem' }}>
            Upload photos of the site, insulation areas, and any relevant details.
          </p>
          <PhotoUploader
            photos={photos}
            onPhotosChange={setPhotos}
          />
        </div>

        {/* Completion Details */}
        <div className="card">
          <h2 className="card-title">Completion Details</h2>
          
          <div className="form-group">
            <label className="form-label" htmlFor="completed_by">
              Completed By <span className="form-required">*</span>
            </label>
            <input
              type="text"
              id="completed_by"
              value={completionData.completedBy}
              onChange={(e) => setCompletionData({ ...completionData, completedBy: e.target.value })}
              className="form-input"
              required
              placeholder="Installer name"
              style={{ minHeight: '44px', fontSize: 'var(--font-size-base)' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="completion_notes">
              Completion Notes
            </label>
            <textarea
              id="completion_notes"
              value={completionData.completionNotes}
              onChange={(e) => setCompletionData({ ...completionData, completionNotes: e.target.value })}
              className="form-textarea"
              rows={4}
              placeholder="Any additional notes about the assessment completion..."
              style={{ minHeight: '88px', fontSize: 'var(--font-size-base)' }}
            />
          </div>
        </div>

        {/* Form Actions - Mobile optimized */}
        <div className="form-actions" style={{ gap: '1rem', flexDirection: 'column' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || assessment.status !== 'Scheduled'}
            style={{ 
              width: '100%', 
              minHeight: '44px', 
              fontSize: 'var(--font-size-base)',
              fontWeight: '600'
            }}
          >
            {loading ? 'Completing Assessment...' : 'Complete Assessment'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
            disabled={loading}
            style={{ 
              width: '100%', 
              minHeight: '44px', 
              fontSize: 'var(--font-size-base)' 
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
