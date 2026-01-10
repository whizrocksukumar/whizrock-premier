'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, X, Upload, Camera, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import ClientSelectorWithSites from '@/components/ClientSelectorWithSites';

// ============================================
// TYPES
// ============================================
interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: string | null;
  companies?: { id: string; name: string } | null;
}

interface Site {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  suburb?: string;
  city?: string;
  postcode?: string;
  property_type?: string;
}

interface AppType {
  id: string;
  name: string;
  code: string;
  color_hex: string;
  sort_order: number;
  is_active: boolean;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
}

interface Wording {
  id: string;
  wordings: string;
  area_label?: string;
  result_type?: string;
  recommended_action?: string;
}

interface AssessmentArea {
  id: string;
  app_type_id: string | null;
  app_type_name?: string;
  app_type_color?: string;
  area_sqm: number;
  wording_id: string | null;
  wording_text: string;
  result_type: 'Pass' | 'Fail' | 'Exempt' | 'Pending';
  notes: string;
  photos: File[];
  photoUrls: string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const generateAssessmentNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ASS-${year}-${random}`;
};

const createEmptyArea = (): AssessmentArea => ({
  id: crypto.randomUUID(),
  app_type_id: null,
  app_type_name: '',
  app_type_color: '#6B7280',
  area_sqm: 0,
  wording_id: null,
  wording_text: '',
  result_type: 'Pending',
  notes: '',
  photos: [],
  photoUrls: [],
});

// ============================================
// MAIN COMPONENT
// ============================================
export default function CreateAssessmentPage() {
  const router = useRouter();
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Client & Site
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [salesRepId, setSalesRepId] = useState<string | null>(null);
  
  // Assessment Details
  const [assessmentNumber] = useState(generateAssessmentNumber());
  const [opportunity, setOpportunity] = useState('');
  const [installerId, setInstallerId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [estimatedSize, setEstimatedSize] = useState('');
  const [siteAccessDifficulty, setSiteAccessDifficulty] = useState('');
  const [crawlSpaceHeight, setCrawlSpaceHeight] = useState('');
  const [existingInsulationType, setExistingInsulationType] = useState('');
  const [removalRequired, setRemovalRequired] = useState(false);
  const [hazardsPresent, setHazardsPresent] = useState('');
  
  // Assessment Areas
  const [areas, setAreas] = useState<AssessmentArea[]>([createEmptyArea()]);
  
  // General Photos
  const [generalPhotos, setGeneralPhotos] = useState<File[]>([]);
  const [generalPhotoUrls, setGeneralPhotoUrls] = useState<string[]>([]);
  const [noPhotosToUpload, setNoPhotosToUpload] = useState(false);
  
  // Overall Result
  const [overallResult, setOverallResult] = useState<'Pass' | 'Fail' | 'Exempt' | 'Pending'>('Pending');
  const [generalNotes, setGeneralNotes] = useState('');
  
  // Reference Data
  const [appTypes, setAppTypes] = useState<AppType[]>([]);
  const [installers, setInstallers] = useState<TeamMember[]>([]);
  const [allWordings, setAllWordings] = useState<Wording[]>([]);
  const [wordingSearch, setWordingSearch] = useState<{ [key: string]: string }>({});
  const [showWordingDropdown, setShowWordingDropdown] = useState<string | null>(null);

  // ============================================
  // LOAD REFERENCE DATA
  // ============================================
  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      // Load app types
      const { data: appTypesData } = await supabase
        .from('app_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (appTypesData) setAppTypes(appTypesData);

      // Load installers from team_members
      const { data: installersData, error: installersError } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, email, role, status')
        .eq('role', 'Installer')
        .eq('status', 'active')
        .order('first_name');

      if (installersError) {
        console.error('Error loading installers:', installersError);
      }
      if (installersData) {
        console.log('Loaded installers:', installersData);
        setInstallers(installersData);
      }

      // Load all wordings from assessment_wordings
      const { data: wordingsData, error: wordingsError } = await supabase
        .from('assessment_wordings')
        .select('*')
        .order('wordings');

      if (wordingsError) {
        console.error('Error loading wordings:', wordingsError);
      }
      if (wordingsData) {
        console.log('Loaded wordings count:', wordingsData.length);
        console.log('First 3 wordings:', wordingsData.slice(0, 3));
        setAllWordings(wordingsData);
      }
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  };

  // ============================================
  // CLIENT/SITE SELECTION HANDLER
  // ============================================
  const handleClientAndSiteSelected = useCallback((client: Client | null, site: Site | null, repId: string | null) => {
    setSelectedClient(client);
    setSelectedSite(site);
    setSalesRepId(repId);
    
    // Auto-populate property type from site if available
    if (site?.property_type) {
      setPropertyType(site.property_type);
    }
  }, []);

  // ============================================
  // ASSESSMENT AREAS HANDLERS
  // ============================================
  const addArea = () => {
    setAreas([...areas, createEmptyArea()]);
  };

  const removeArea = (areaId: string) => {
    if (areas.length > 1) {
      setAreas(areas.filter(a => a.id !== areaId));
    }
  };

  const updateArea = (areaId: string, field: keyof AssessmentArea, value: any) => {
    setAreas(areas.map(area => {
      if (area.id !== areaId) return area;
      
      const updated = { ...area, [field]: value };
      
      // If app_type changed, update name and color
      if (field === 'app_type_id' && value) {
        const appType = appTypes.find(at => at.id === value);
        if (appType) {
          updated.app_type_name = appType.name;
          updated.app_type_color = appType.color_hex;
        }
      }
      
      return updated;
    }));
  };

  // ============================================
  // WORDING SEARCH & SELECTION
  // ============================================
  const getFilteredWordings = (areaId: string) => {
    const search = wordingSearch[areaId]?.toLowerCase().trim() || '';

    if (!search) {
      // Show first 20 wordings when no search term
      return allWordings.slice(0, 20);
    }

    // Search in the 'wordings' field
    return allWordings.filter(w => {
      const wordingText = w.wordings?.toLowerCase() || '';
      return wordingText.includes(search);
    }).slice(0, 20);
  };

  const selectWording = (areaId: string, wording: Wording) => {
    setAreas(areas.map(area => {
      if (area.id !== areaId) return area;
      return {
        ...area,
        wording_id: wording.id,
        wording_text: wording.wordings
      };
    }));
    setWordingSearch({ ...wordingSearch, [areaId]: '' });
    setShowWordingDropdown(null);
  };

  // ============================================
  // PHOTO HANDLERS
  // ============================================
  const handleAreaPhotoUpload = (areaId: string, files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    
    setAreas(areas.map(area => {
      if (area.id !== areaId) return area;
      const newPhotos = [...area.photos, ...fileArray];
      const newUrls = [...area.photoUrls, ...fileArray.map(f => URL.createObjectURL(f))];
      return { ...area, photos: newPhotos, photoUrls: newUrls };
    }));
  };

  const removeAreaPhoto = (areaId: string, photoIndex: number) => {
    setAreas(areas.map(area => {
      if (area.id !== areaId) return area;
      const newPhotos = area.photos.filter((_, i) => i !== photoIndex);
      const newUrls = area.photoUrls.filter((_, i) => i !== photoIndex);
      return { ...area, photos: newPhotos, photoUrls: newUrls };
    }));
  };

  const handleGeneralPhotoUpload = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setGeneralPhotos([...generalPhotos, ...fileArray]);
    setGeneralPhotoUrls([...generalPhotoUrls, ...fileArray.map(f => URL.createObjectURL(f))]);
    setNoPhotosToUpload(false);
  };

  const removeGeneralPhoto = (index: number) => {
    setGeneralPhotos(generalPhotos.filter((_, i) => i !== index));
    setGeneralPhotoUrls(generalPhotoUrls.filter((_, i) => i !== index));
  };

  // ============================================
  // FORM SUBMISSION
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedClient) {
      setError('Please select a client');
      return;
    }
    if (!selectedSite) {
      setError('Please select a site (required for assessments)');
      return;
    }
    if (!installerId) {
      setError('Please select an installer');
      return;
    }
    if (!scheduledDate || !scheduledTime) {
      setError('Please enter scheduled date and time');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the assessment record
      // Generate unique reference number
      const refNumber = `ASM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          reference_number: refNumber,
          client_id: selectedClient.id,
          site_id: selectedSite.id,
          assigned_installer_id: installerId,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          property_type: propertyType || null,
          year_built: yearBuilt ? parseInt(yearBuilt) : null,
          estimated_size_sqm: estimatedSize ? parseFloat(estimatedSize) : null,
          site_access_difficulty: siteAccessDifficulty || null,
          crawl_space_height_cm: crawlSpaceHeight ? parseFloat(crawlSpaceHeight) : null,
          existing_insulation_type: existingInsulationType || null,
          removal_required: removalRequired,
          hazards_present: hazardsPresent || null,
          notes: generalNotes || null,
          status: 'Scheduled',
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // 2. Create assessment areas
      if (assessment && areas.length > 0) {
        const areasToInsert = areas
          .filter(a => a.app_type_name) // Only insert areas with area type selected
          .map((area, index) => ({
            assessment_id: assessment.id,
            area_name: area.app_type_name || null,
            square_metres: area.area_sqm || 0,
            existing_insulation_type: area.wording_text || null,
            result_type: area.result_type || 'Pending',
            notes: area.notes || null,
            sort_order: index + 1,
          }));

        if (areasToInsert.length > 0) {
          const { error: areasError } = await supabase
            .from('assessment_areas')
            .insert(areasToInsert);

          if (areasError) throw areasError;
        }
      }

      // 3. Upload photos (if Supabase storage is configured)
      // For now, we'll skip photo upload - can be added later

      setSuccess(true);
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/assessments');
      }, 1500);

    } catch (err: any) {
      console.error('Error creating assessment:', err);
      setError(err.message || 'Failed to create assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Assessment</h1>
          <p className="text-gray-600">Assessment #{assessmentNumber}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Assessment created successfully! Redirecting...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ============================================ */}
          {/* SECTION 1: CLIENT & SITE SELECTION */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              1. Client & Site Selection
              <span className="text-red-500 ml-1">*</span>
            </h2>
            
            <ClientSelectorWithSites
              onClientAndSiteSelected={handleClientAndSiteSelected}
              selectedClientId={selectedClient?.id}
              selectedSiteId={selectedSite?.id}
            />
            
            {selectedClient && !selectedSite && (
              <p className="mt-2 text-amber-600 text-sm flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Site is required for assessments
              </p>
            )}
          </div>

          {/* ============================================ */}
          {/* SECTION 2: ASSESSMENT DETAILS */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              2. Assessment Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Opportunity (text input) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opportunity Reference
                </label>
                <input
                  type="text"
                  value={opportunity}
                  onChange={(e) => setOpportunity(e.target.value)}
                  placeholder="e.g., OPP-2025-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              {/* Installer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Installer <span className="text-red-500">*</span>
                </label>
                <select
                  value={installerId}
                  onChange={(e) => setInstallerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  <option value="">Select installer...</option>
                  {installers.map(installer => (
                    <option key={installer.id} value={installer.id}>
                      {installer.first_name} {installer.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              {/* Scheduled Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="House">House</option>
                  <option value="Unit">Unit</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Year Built */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Built
                </label>
                <input
                  type="number"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="e.g., 1985"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              {/* Estimated Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Size (m²)
                </label>
                <input
                  type="number"
                  value={estimatedSize}
                  onChange={(e) => setEstimatedSize(e.target.value)}
                  placeholder="e.g., 150"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              {/* Site Access Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Access Difficulty
                </label>
                <select
                  value={siteAccessDifficulty}
                  onChange={(e) => setSiteAccessDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Difficult">Difficult</option>
                  <option value="Very Difficult">Very Difficult</option>
                </select>
              </div>

              {/* Crawl Space Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crawl Space Height (cm)
                </label>
                <input
                  type="number"
                  value={crawlSpaceHeight}
                  onChange={(e) => setCrawlSpaceHeight(e.target.value)}
                  placeholder="e.g., 45"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              {/* Existing Insulation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Existing Insulation Type
                </label>
                <input
                  type="text"
                  value={existingInsulationType}
                  onChange={(e) => setExistingInsulationType(e.target.value)}
                  placeholder="e.g., Glasswool R1.8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              {/* Removal Required */}
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="removalRequired"
                  checked={removalRequired}
                  onChange={(e) => setRemovalRequired(e.target.checked)}
                  className="w-4 h-4 text-[#0066CC] border-gray-300 rounded focus:ring-[#0066CC]"
                />
                <label htmlFor="removalRequired" className="ml-2 text-sm text-gray-700">
                  Removal Required
                </label>
              </div>

              {/* Hazards Present */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hazards Present
                </label>
                <textarea
                  value={hazardsPresent}
                  onChange={(e) => setHazardsPresent(e.target.value)}
                  placeholder="e.g., Low clearance in ceiling, exposed wiring..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SECTION 3: ASSESSMENT AREAS */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#0066CC]">
              <h2 className="text-lg font-semibold text-gray-900">
                3. Assessment Areas
              </h2>
              <button
                type="button"
                onClick={addArea}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#0066CC] text-white rounded-lg hover:bg-[#0052A3] transition"
              >
                <Plus className="w-4 h-4" />
                Add Area
              </button>
            </div>

            <div className="space-y-4">
              {areas.map((area, index) => (
                <div
                  key={area.id}
                  className="border rounded-lg p-4"
                  style={{ borderLeftWidth: '4px', borderLeftColor: area.app_type_color || '#6B7280' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Area {index + 1}</h3>
                    {areas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArea(area.id)}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Area Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area Type
                      </label>
                      <select
                        value={area.app_type_id || ''}
                        onChange={(e) => updateArea(area.id, 'app_type_id', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        {appTypes.map(at => (
                          <option key={at.id} value={at.id}>
                            {at.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Square Metres */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Square Metres
                      </label>
                      <input
                        type="number"
                        value={area.area_sqm || ''}
                        onChange={(e) => updateArea(area.id, 'area_sqm', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                      />
                    </div>

                    {/* Wording */}
                    <div className="md:col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wording
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={area.wording_text || wordingSearch[area.id] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setWordingSearch({ ...wordingSearch, [area.id]: value });
                            setShowWordingDropdown(area.id);
                            if (!value) {
                              updateArea(area.id, 'wording_id', null);
                              updateArea(area.id, 'wording_text', '');
                            }
                          }}
                          onFocus={() => setShowWordingDropdown(area.id)}
                          placeholder="Type to search wordings..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        />
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Wording Dropdown */}
                      {showWordingDropdown === area.id && (
                        <div
                          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {getFilteredWordings(area.id).length > 0 ? (
                            <div>
                              {getFilteredWordings(area.id).map(wording => (
                                <button
                                  key={wording.id}
                                  type="button"
                                  onClick={() => {
                                    updateArea(area.id, 'wording_id', wording.id);
                                    updateArea(area.id, 'wording_text', wording.wordings);
                                    setWordingSearch({ ...wordingSearch, [area.id]: '' });
                                    setShowWordingDropdown(null);
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                                >
                                  <div className="font-medium text-gray-900">{wording.wordings}</div>
                                  <div className="flex gap-2 mt-1">
                                    {wording.area_label && (
                                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                        {wording.area_label}
                                      </span>
                                    )}
                                    {wording.result_type && (
                                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                        wording.result_type === 'PASS' ? 'bg-green-100 text-green-700' :
                                        wording.result_type === 'FAIL' ? 'bg-red-100 text-red-700' :
                                        wording.result_type === 'EXEMPT' ? 'bg-amber-100 text-amber-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {wording.result_type}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                              {getFilteredWordings(area.id).length >= 20 && (
                                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                                  Showing first 20 results. Type more to refine search.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="px-4 py-8 text-center text-gray-500">
                              {wordingSearch[area.id] ? 'No wordings found' : 'Start typing to search...'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Result Type */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Result
                      </label>
                      <div className="flex gap-4">
                        {(['Pass', 'Fail', 'Exempt', 'Pending'] as const).map(result => (
                          <label key={result} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`result-${area.id}`}
                              value={result}
                              checked={area.result_type === result}
                              onChange={(e) => updateArea(area.id, 'result_type', e.target.value)}
                              className="text-[#0066CC] focus:ring-[#0066CC]"
                            />
                            <span className={`text-sm ${
                              result === 'Pass' ? 'text-green-600' :
                              result === 'Fail' ? 'text-red-600' :
                              result === 'Exempt' ? 'text-amber-600' :
                              'text-gray-600'
                            }`}>
                              {result}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={area.notes}
                        onChange={(e) => updateArea(area.id, 'notes', e.target.value)}
                        placeholder="Area-specific notes..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                      />
                    </div>

                    {/* Area Photos */}
                    <div className="md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Photos for this area
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {area.photoUrls.map((url, photoIndex) => (
                          <div key={photoIndex} className="relative w-20 h-20 group">
                            <img
                              src={url}
                              alt={`Area photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeAreaPhoto(area.id, photoIndex)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0066CC] hover:bg-gray-50 transition">
                          <Camera className="w-5 h-5 text-gray-400" />
                          <span className="text-xs text-gray-400 mt-1">Add</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleAreaPhotoUpload(area.id, e.target.files)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================ */}
          {/* SECTION 4: GENERAL PHOTOS */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              4. General Photos
            </h2>
            
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noPhotosToUpload}
                  onChange={(e) => {
                    setNoPhotosToUpload(e.target.checked);
                    if (e.target.checked) {
                      setGeneralPhotos([]);
                      setGeneralPhotoUrls([]);
                    }
                  }}
                  className="w-4 h-4 text-[#0066CC] border-gray-300 rounded focus:ring-[#0066CC]"
                />
                <span className="text-sm text-gray-700">No photos to upload</span>
              </label>
            </div>

            {!noPhotosToUpload && (
              <div className="flex flex-wrap gap-2">
                {generalPhotoUrls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 group">
                    <img
                      src={url}
                      alt={`General photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeGeneralPhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0066CC] hover:bg-gray-50 transition">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleGeneralPhotoUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* SECTION 5: OVERALL RESULT & NOTES */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              5. Overall Result & Notes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Overall Result */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Result
                </label>
                <div className="flex gap-4">
                  {(['Pass', 'Fail', 'Exempt', 'Pending'] as const).map(result => (
                    <label key={result} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="overallResult"
                        value={result}
                        checked={overallResult === result}
                        onChange={(e) => setOverallResult(e.target.value as typeof overallResult)}
                        className="text-[#0066CC] focus:ring-[#0066CC]"
                      />
                      <span className={`text-sm font-medium ${
                        result === 'Pass' ? 'text-green-600' :
                        result === 'Fail' ? 'text-red-600' :
                        result === 'Exempt' ? 'text-amber-600' :
                        'text-gray-600'
                      }`}>
                        {result}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* General Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  General Notes
                </label>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Any additional notes about the assessment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* ACTIONS */}
          {/* ============================================ */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052A3] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Assessment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}