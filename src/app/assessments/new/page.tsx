'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  createAssessment,
  createAssessmentAreas,
  createAssessmentPhotos,
  generateAssessmentNumber,
  fetchAssessmentWordings,
  type Assessment,
  type AssessmentArea,
  type AssessmentWording,
  RESULT_TYPE_CONFIG,
} from '@/lib/utils/assessment-helpers'
import SiteSelector from '@/components/SiteSelector'
import { X, Upload, AlertCircle } from 'lucide-react'

interface Site {
  id: string
  site_name: string
  address_line_1: string
  address_line_2?: string
  city: string
  region_id?: string
  postcode: string
  company_id?: string
  client_id?: string
  company_name?: string
  client_name?: string
  property_type?: string
}

interface FormAssessmentArea {
  id: string
  area_id: string
  area_name: string
  area_color: string
  square_metres: number
  result_type: 'Pass' | 'Fail' | 'Exempt' | 'Pending'
  wording_id?: string
  notes: string
  photos: File[]
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
}

interface AppType {
  id: string
  name: string
  color_hex: string
}

interface Opportunity {
  id: string
  opp_number: string
}

interface Region {
  id: string
  name: string
}

export default function CreateAssessmentPage() {
  const router = useRouter()

  // Site and Client
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [showSiteSelector, setShowSiteSelector] = useState(true)

  // Lookups
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [appTypes, setAppTypes] = useState<AppType[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [wordings, setWordings] = useState<AssessmentWording[]>([])
  const [regions, setRegions] = useState<Region[]>([])

  // Form state
  const [form, setForm] = useState({
    opportunity_id: '',
    assigned_installer_id: '',
    scheduled_date: '',
    scheduled_time: '',
    property_type: '',
    year_built: '',
    estimated_size_sqm: '',
    site_access_difficulty: '',
    crawl_space_height_cm: '',
    existing_insulation_type: '',
    removal_required: false,
    hazards_present: '',
    notes: '',
    overall_result: 'Pending' as 'Pass' | 'Fail' | 'Exempt' | 'Pending',
  })

  const [assessmentAreas, setAssessmentAreas] = useState<FormAssessmentArea[]>([])
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])
  const [noPhotosConfirmed, setNoPhotosConfirmed] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lookupError, setLookupError] = useState<string | null>(null)

  // Initialize
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        await loadLookupData()
        if (isMounted) {
          setLookupError(null)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load lookup data'
        if (isMounted) {
          setLookupError(message)
        }
      }
    }

    void init()

    return () => {
      isMounted = false
    }
  }, [])

  // Auto-populate property type from site
  useEffect(() => {
    if (selectedSite?.property_type) {
      setForm(prev => ({
        ...prev,
        property_type: selectedSite.property_type || '',
      }))
    }
  }, [selectedSite])

  const loadLookupData = async () => {
    try {
      const teamRes = await supabase
        .from('team_members')
        .select('id, first_name, last_name')
        .eq('role', 'Installer')

      if (teamRes.error) {
        console.error('team_members error:', teamRes.error)
      } else {
        setTeamMembers(teamRes.data || [])
      }

      const appTypesRes = await supabase
        .from('app_types')
        .select('id, name, color_hex')

      if (appTypesRes.error) {
        console.error('app_types error:', appTypesRes.error)
      } else {
        setAppTypes(appTypesRes.data || [])
      }

      const oppRes = await supabase
        .from('opportunities')
        .select('id, opp_number')

      if (oppRes.data) setOpportunities(oppRes.data)

      const wordingsRes = await fetchAssessmentWordings()
      console.log('Loaded wordings:', wordingsRes.length)
      setWordings(wordingsRes)

      const regionsRes = await supabase
        .from('regions')
        .select('id, name')

      if (regionsRes.data) setRegions(regionsRes.data)
    } catch (err) {
      console.error('lookup load crash:', err)
      throw err
    }
  }


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedSite) newErrors.site = 'Site selection required'
    if (!form.assigned_installer_id) newErrors.installer = 'Installer selection required'
    if (!form.scheduled_date) newErrors.date = 'Scheduled date required'
    if (!form.scheduled_time) newErrors.time = 'Scheduled time required'
    if (assessmentAreas.length === 0) newErrors.areas = 'At least one assessment area required'
    if (!noPhotosConfirmed && uploadedPhotos.length === 0) {
      newErrors.photos = 'Please upload photos or confirm no photos to upload'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddArea = () => {
    const newArea: FormAssessmentArea = {
      id: `temp-${Date.now()}`,
      area_id: '',
      area_name: '',
      area_color: '',
      square_metres: 0,
      result_type: 'Pending',
      notes: '',
      photos: [],
    }
    setAssessmentAreas([...assessmentAreas, newArea])
  }

  const handleUpdateArea = (id: string, updates: Partial<FormAssessmentArea>) => {
    setAssessmentAreas(
      assessmentAreas.map(area =>
        area.id === id
          ? {
            ...area,
            ...updates,
          }
          : area
      )
    )
  }

  const handleDeleteArea = (id: string) => {
    setAssessmentAreas(assessmentAreas.filter(area => area.id !== id))
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedPhotos([...uploadedPhotos, ...Array.from(e.target.files)])
    }
  }

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index))
  }

  const handleCreateAssessment = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // 1. Create assessment
      const assessment = await createAssessment({
        site_id: selectedSite!.id,
        client_id: selectedSite!.client_id || '',
        opportunity_id: form.opportunity_id || undefined,
        assigned_installer_id: form.assigned_installer_id,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time,
        property_type: form.property_type || undefined,
        year_built: form.year_built ? parseInt(form.year_built) : undefined,
        estimated_size_sqm: form.estimated_size_sqm
          ? parseFloat(form.estimated_size_sqm)
          : undefined,
        site_access_difficulty: form.site_access_difficulty || undefined,
        crawl_space_height_cm: form.crawl_space_height_cm
          ? parseFloat(form.crawl_space_height_cm)
          : undefined,
        existing_insulation_type: form.existing_insulation_type || undefined,
        removal_required: form.removal_required,
        hazards_present: form.hazards_present || undefined,
        notes: form.notes || undefined,
      })

      // 2. Create assessment areas
      if (assessmentAreas.length > 0) {
        const areasToCreate = assessmentAreas.map(area => ({
          app_type_id: area.area_id,
          area_name: area.area_name,
          square_metres: area.square_metres,
          result_type: area.result_type,
          wording_id: area.wording_id || undefined,
          notes: area.notes,
        }))

        await createAssessmentAreas(assessment.id, areasToCreate)
      }

      // 3. Upload photos if any
      if (uploadedPhotos.length > 0) {
        const photosToCreate = []

        for (const file of uploadedPhotos) {
          const fileName = `${assessment.id}/${Date.now()}_${file.name}`

          const { error: uploadError } = await supabase.storage
            .from('assessment-photos')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from('assessment-photos')
            .getPublicUrl(fileName)

          photosToCreate.push({
            file_name: file.name,
            file_path: fileName,
            file_url: urlData.publicUrl,
            file_size: file.size,
            photo_type: 'General' as const,
          })
        }

        if (photosToCreate.length > 0) {
          await createAssessmentPhotos(assessment.id, photosToCreate)
        }
      }

      // Redirect to assessment detail
      router.push(`/assessments/${assessment.id}`)
    } catch (err: any) {
      console.error('Error creating assessment:', err)
      setErrors({ submit: err.message || 'Failed to create assessment' })
    } finally {
      setLoading(false)
    }
  }

  // RENDER SITE SELECTOR
  if (showSiteSelector) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Assessment</h1>
          <SiteSelector
            onSiteSelected={site => {
              setSelectedSite(site as Site)
              setShowSiteSelector(false)
            }}
          />
        </div>
      </div>
    )
  }

  // RENDER ASSESSMENT FORM
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create New Assessment</h1>
            <button
              onClick={() => setShowSiteSelector(true)}
              className="text-sm text-[#0066CC] hover:underline"
            >
              Change Site
            </button>
          </div>

          {/* Site Details Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-600 mb-1">Selected Site</p>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {selectedSite!.address_line_1}
              {selectedSite!.address_line_2 ? `, ${selectedSite!.address_line_2}` : ''}
            </h2>
            <p className="text-sm text-gray-700">
              {selectedSite!.city} {selectedSite!.postcode}
            </p>
            {(selectedSite!.client_name || selectedSite!.company_name) && (
              <div className="mt-2 pt-2 border-t border-blue-200 space-y-1">
                {selectedSite!.client_name && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Contact:</span> {selectedSite!.client_name}
                  </p>
                )}
                {selectedSite!.company_name && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Company:</span> {selectedSite!.company_name}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Lookup Load Error */}
          {lookupError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {Object.values(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              {Object.entries(errors).map(([key, error]) => (
                <div key={key} className="flex items-start gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-8">
            {/* Assessment Details Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Details</h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Opportunity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opportunity <span className="text-gray-500">(optional)</span>
                  </label>
                  <select
                    value={form.opportunity_id}
                    onChange={e => setForm({ ...form, opportunity_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  >
                    <option value="">Select opportunity</option>
                    {opportunities.map(opp => (
                      <option key={opp.id} value={opp.id}>
                        {opp.opp_number}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Installer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Installer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.assigned_installer_id}
                    onChange={e => setForm({ ...form, assigned_installer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  >
                    <option value="">Select installer</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </option>
                    ))}
                  </select>
                  {errors.installer && <p className="text-red-600 text-sm mt-1">{errors.installer}</p>}
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.scheduled_date}
                    onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  />
                  {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
                </div>

                {/* Scheduled Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.scheduled_time}
                    onChange={e => setForm({ ...form, scheduled_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  />
                  {errors.time && <p className="text-red-600 text-sm mt-1">{errors.time}</p>}
                </div>

                {/* Property Type - Pre-populated */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.property_type}
                    onChange={e => setForm({ ...form, property_type: e.target.value })}
                    placeholder="e.g., Residential"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  />
                </div>

                {/* Year Built */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Built <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="number"
                    value={form.year_built}
                    onChange={e => setForm({ ...form, year_built: e.target.value })}
                    placeholder="2020"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  />
                </div>

                {/* Estimated Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Size <span className="text-gray-500">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.estimated_size_sqm}
                      onChange={e => setForm({ ...form, estimated_size_sqm: e.target.value })}
                      placeholder="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500 text-sm">m²</span>
                  </div>
                </div>

                {/* Site Access Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Access Difficulty <span className="text-gray-500">(optional)</span>
                  </label>
                  <select
                    value={form.site_access_difficulty}
                    onChange={e => setForm({ ...form, site_access_difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  >
                    <option value="">Select difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Difficult">Difficult</option>
                    <option value="Very Difficult">Very Difficult</option>
                  </select>
                </div>

                {/* Crawl Space Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crawl Space Height <span className="text-gray-500">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.crawl_space_height_cm}
                      onChange={e => setForm({ ...form, crawl_space_height_cm: e.target.value })}
                      placeholder="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500 text-sm">cm</span>
                  </div>
                </div>
              </div>

              {/* Existing Insulation Type (multiline) */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Existing Insulation Type <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={form.existing_insulation_type}
                  onChange={e => setForm({ ...form, existing_insulation_type: e.target.value })}
                  placeholder="Describe existing insulation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>

              {/* Removal Required */}
              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.removal_required}
                    onChange={e => setForm({ ...form, removal_required: e.target.checked })}
                    className="w-4 h-4 text-[#0066CC] rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Removal Required</span>
                </label>
              </div>

              {/* Hazards Present */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hazards Present <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={form.hazards_present}
                  onChange={e => setForm({ ...form, hazards_present: e.target.value })}
                  placeholder="Describe any hazards..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
            </div>

            {/* Assessment Areas Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Assessment Areas</h2>
                <button
                  onClick={handleAddArea}
                  className="text-sm text-[#0066CC] hover:underline font-medium"
                >
                  + Add Assessment Area
                </button>
              </div>

              {errors.areas && <p className="text-red-600 text-sm mb-4">{errors.areas}</p>}

              <div className="space-y-4">
                {assessmentAreas.map((area, index) => (
                  <AssessmentAreaForm
                    key={area.id}
                    area={area}
                    appTypes={appTypes}
                    wordings={wordings}
                    onUpdate={updates => handleUpdateArea(area.id, updates)}
                    onDelete={() => handleDeleteArea(area.id)}
                  />
                ))}
              </div>
            </div>

            {/* General Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Notes <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>

            {/* Overall Result */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Overall Assessment Result
              </label>
              <div className="flex items-center gap-6">
                {Object.entries(RESULT_TYPE_CONFIG).map(([key, config]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="overall_result"
                      value={key}
                      checked={form.overall_result === key}
                      onChange={e =>
                        setForm({
                          ...form,
                          overall_result: e.target.value as
                            | 'Pass'
                            | 'Fail'
                            | 'Exempt'
                            | 'Pending',
                        })
                      }
                      className="w-4 h-4 text-[#0066CC]"
                    />
                    <span className={`text-sm font-medium ${config.color} px-2 py-1 rounded`}>
                      {config.icon} {config.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Photos Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Photos</h2>

              {errors.photos && <p className="text-red-600 text-sm mb-4">{errors.photos}</p>}

              {/* Upload Photos Button */}
              {!noPhotosConfirmed && uploadedPhotos.length === 0 && (
                <div className="mb-4">
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0066CC] cursor-pointer transition">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Click to upload photos</p>
                      <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Uploaded Photos List */}
              {uploadedPhotos.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded Photos ({uploadedPhotos.length})
                  </p>
                  <div className="space-y-2">
                    {uploadedPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{photo.name}</span>
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.multiple = true
                      input.accept = 'image/*'
                      input.onchange = (e: any) => {
                        if (e.target.files) {
                          setUploadedPhotos([
                            ...uploadedPhotos,
                            ...Array.from(e.target.files) as File[],
                          ])
                        }
                      }
                      input.click()
                    }}
                    className="mt-2 text-sm text-[#0066CC] hover:underline font-medium"
                  >
                    + Add More Photos
                  </button>
                </div>
              )}

              {/* No Photos Confirmation */}
              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={noPhotosConfirmed}
                  onChange={e => setNoPhotosConfirmed(e.target.checked)}
                  className="w-4 h-4 text-[#0066CC] rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  No photos to upload
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
              <button
                onClick={() => router.back()}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssessment}
                disabled={loading}
                className="px-6 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] disabled:opacity-50 font-medium"
              >
                {loading ? 'Creating...' : 'Create Assessment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Assessment Area Form Component
function AssessmentAreaForm({
  area,
  appTypes,
  wordings,
  onUpdate,
  onDelete,
}: {
  area: FormAssessmentArea
  appTypes: AppType[]
  wordings: AssessmentWording[]
  onUpdate: (updates: Partial<FormAssessmentArea>) => void
  onDelete: () => void
}) {
  const [areaPhotos, setAreaPhotos] = useState<File[]>(area.photos || [])
  const [wordingSearch, setWordingSearch] = useState('')
  const [showWordingDropdown, setShowWordingDropdown] = useState(false)
  const areaLabel = area.area_name?.toLowerCase() || ''

  console.log('AssessmentAreaForm wordings:', wordings.length, 'area:', area.area_name)

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-wording-dropdown]')) {
        setShowWordingDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredWordings = wordings.filter(w => {
    const wordingText = (w.wording_text || '').toLowerCase()
    const areaHint = (area.area_name || '').toLowerCase()
    const search = wordingSearch.toLowerCase().trim()

    // Match by area_label if specified in template
    const areaMatch = !w.area_label || areaHint.includes(w.area_label.toLowerCase())

    // Match by result_type if specified in template
    const resultMatch = !w.result_type || area.result_type === w.result_type

    if (search) {
      return wordingText.includes(search) && areaMatch && resultMatch
    }

    return areaMatch && resultMatch
  })

  { `Search wordings (e.g. ${area.area_name || 'ceiling'})` }



  const handleAppTypeChange = (appTypeId: string) => {
    const appType = appTypes.find(t => t.id === appTypeId)
    onUpdate({
      area_id: appTypeId,
      area_name: appType?.name || '',
      area_color: appType?.color_hex || '#C27BA0',
    })
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: area.area_color }}
          />
          <h3 className="font-semibold text-gray-900">
            {area.area_name || 'Select Area Type'}
          </h3>
        </div>
        <button onClick={onDelete} className="text-red-600 hover:text-red-700 font-medium text-sm">
          Delete
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Area Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Area Type <span className="text-red-500">*</span>
          </label>
          <select
            value={area.area_id}
            onChange={e => handleAppTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
          >
            <option value="">Select area type</option>
            {appTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Wording Selection and Notes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wording <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative" data-wording-dropdown>
              <input
                type="text"
                placeholder={`Search wordings (e.g. ${area.area_name || 'ceiling'})`}
                value={wordingSearch}
                onChange={e => {
                  setWordingSearch(e.target.value)
                  setShowWordingDropdown(true)
                }}
                onFocus={() => setShowWordingDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
              />

              {showWordingDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredWordings.length > 0 ? (
                    filteredWordings.map(w => (
                      <button
                        key={w.id}
                        onClick={() => {
                          onUpdate({ wording_id: w.id })
                          setWordingSearch('')
                          setShowWordingDropdown(false)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-medium text-gray-900">{w.wording_text}</p>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {wordings.length === 0 ? 'Loading wordings...' : 'No wordings found'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Square Metres <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={area.square_metres || ''}
              onChange={e => onUpdate({ square_metres: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            value={area.notes}
            onChange={e => onUpdate({ notes: e.target.value })}
            placeholder="Add notes for this area..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
          />
        </div>

        {/* Result Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Result</label>
          <div className="flex items-center gap-4">
            {Object.entries(RESULT_TYPE_CONFIG).map(([key, config]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`result-${area.id}`}
                  value={key}
                  checked={area.result_type === key}
                  onChange={e =>
                    onUpdate({
                      result_type: e.target.value as
                        | 'Pass'
                        | 'Fail'
                        | 'Exempt'
                        | 'Pending',
                    })
                  }
                  className="w-4 h-4 text-[#0066CC]"
                />
                <span
                  className={`text-xs font-semibold ${config.color} px-2 py-1 rounded`}
                >
                  {config.icon} {config.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Per-Area Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Area Photos <span className="text-gray-500">(optional)</span>
          </label>
          <div className="space-y-2">
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-[#0066CC] cursor-pointer transition">
                <Upload className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Click to upload photos</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => {
                  if (e.target.files) {
                    const updated = [...areaPhotos, ...Array.from(e.target.files)]
                    setAreaPhotos(updated)
                    onUpdate({ photos: updated })
                  }
                }}
                className="hidden"
              />
            </label>

            {areaPhotos.length > 0 && (
              <div className="space-y-1">
                {areaPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-xs"
                  >
                    <span className="text-gray-700">{photo.name}</span>
                    <button
                      onClick={() => {
                        const updated = areaPhotos.filter((_, i) => i !== idx)
                        setAreaPhotos(updated)
                        onUpdate({ photos: updated })
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}