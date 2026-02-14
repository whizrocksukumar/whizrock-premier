'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, X, Upload, Camera, AlertTriangle, Check, ChevronDown, FileDown } from 'lucide-react';
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
  
  // CRITICAL: Assessment Type
  const [assessmentType, setAssessmentType] = useState<'retrofit' | 'eeca' | ''>('');
  
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
  
  // EECA Eligibility (Section 3)
  const [houseBuiltBefore2008, setHouseBuiltBefore2008] = useState<'yes' | 'no' | ''>('');
  const [ownerOccupied, setOwnerOccupied] = useState<'yes' | 'no' | ''>('');
  const [deprivationIndex57, setDeprivationIndex57] = useState<'yes' | 'no' | ''>('');
  
  // Homeowner Info (Section 4)
  const [homeownerName, setHomeownerName] = useState('');
  const [homeownerPhone, setHomeownerPhone] = useState('');
  const [homeownerEmail, setHomeownerEmail] = useState('');
  
  // Homeowner Declaration (Section 5)
  const [homeownerDeclaration1, setHomeownerDeclaration1] = useState(false);
  const [homeownerDeclaration2, setHomeownerDeclaration2] = useState(false);
  const [homeownerDeclarationDate, setHomeownerDeclarationDate] = useState('');
  
  // Property Checks (Section 6)
  const [addressMatchesReferral, setAddressMatchesReferral] = useState<'yes' | 'no' | ''>('');
  const [propertyHasCurtains, setPropertyHasCurtains] = useState<'yes' | 'no' | ''>('');
  const [heatingSolution, setHeatingSolution] = useState('');
  const [heatingInMainLiving, setHeatingInMainLiving] = useState<'yes' | 'no' | ''>('');
  const [heatingWorkingAsked, setHeatingWorkingAsked] = useState<'yes' | 'no' | ''>('');
  
  // H&S Assessment (Section 7)
  const [hsAssessmentCompleted, setHsAssessmentCompleted] = useState<'yes' | 'no' | ''>('');
  const [hsRisksEliminated, setHsRisksEliminated] = useState<'yes' | 'no' | ''>('');
  const [hsPersonnelReviewed, setHsPersonnelReviewed] = useState<'yes' | 'no' | ''>('');
  const [hsSafetyConcerns, setHsSafetyConcerns] = useState('');
  
  // Ceiling - Current State (Section 8)
  const [ceilingAccessible, setCeilingAccessible] = useState<'yes' | 'no' | ''>('');
  const [ceilingExistingCoversThermal, setCeilingExistingCoversThermal] = useState<'yes' | 'no' | ''>('');
  const [ceilingExistingAtLeast120mm, setCeilingExistingAtLeast120mm] = useState<'yes' | 'no' | ''>('');
  const [ceilingDampDamaged, setCeilingDampDamaged] = useState<'yes' | 'no' | ''>('');
  const [ceilingSignificantGaps, setCeilingSignificantGaps] = useState<'yes' | 'no' | ''>('');
  const [ceilingClearancesMet, setCeilingClearancesMet] = useState<'yes' | 'no' | ''>('');
  const [ceilingRequiresUpgrade, setCeilingRequiresUpgrade] = useState<'yes' | 'no' | ''>('');
  
  // Ceiling - Detailed (Section 9)
  const [ceilingAccessSize, setCeilingAccessSize] = useState('');
  const [ceilingNewAccessCanCreate, setCeilingNewAccessCanCreate] = useState<'yes' | 'no' | ''>('');
  const [ceilingContractorCreateAccess, setCeilingContractorCreateAccess] = useState<'yes' | 'no' | ''>('');
  const [ceilingAccessHeightMm, setCeilingAccessHeightMm] = useState('');
  const [ceilingCavityApexHeightMm, setCeilingCavityApexHeightMm] = useState('');
  const [ceilingLowAccessAreas, setCeilingLowAccessAreas] = useState<'yes' | 'no' | ''>('');
  const [ceilingWaterIngress, setCeilingWaterIngress] = useState<'yes' | 'no' | ''>('');
  const [ceilingDownlights, setCeilingDownlights] = useState<'yes' | 'no' | ''>('');
  const [ceilingType, setCeilingType] = useState('');
  const [ceilingSqm, setCeilingSqm] = useState('');
  const [ceilingRemedialHours, setCeilingRemedialHours] = useState('');
  const [ceilingComments, setCeilingComments] = useState('');
  
  // Ceiling Wall (Section 10)
  const [ceilingWallPresent, setCeilingWallPresent] = useState<'yes' | 'no' | ''>('');
  const [ceilingWallCavitiesAccessible, setCeilingWallCavitiesAccessible] = useState<'yes' | 'no' | ''>('');
  const [ceilingWallExistingInsulation, setCeilingWallExistingInsulation] = useState<'yes' | 'no' | ''>('');
  const [ceilingWallSqm, setCeilingWallSqm] = useState('');
  const [pipeLaggingRequired, setPipeLaggingRequired] = useState('');
  const [ceilingWallComments, setCeilingWallComments] = useState('');
  
  // Underfloor - Current State (Section 11)
  const [underfloorAccessible, setUnderfloorAccessible] = useState<'yes' | 'no' | ''>('');
  const [underfloorExistingCoversThermal, setUnderfloorExistingCoversThermal] = useState<'yes' | 'no' | ''>('');
  const [underfloorExistingDamaged, setUnderfloorExistingDamaged] = useState<'yes' | 'no' | ''>('');
  const [underfloorSignificantGaps, setUnderfloorSignificantGaps] = useState<'yes' | 'no' | ''>('');
  const [underfloorClearancesMet, setUnderfloorClearancesMet] = useState<'yes' | 'no' | ''>('');
  const [underfloorRequiresUpgrade, setUnderfloorRequiresUpgrade] = useState<'yes' | 'no' | ''>('');
  
  // Underfloor - Detailed (Section 12)
  const [underfloorAccessSize, setUnderfloorAccessSize] = useState('');
  const [underfloorNewAccessCanCreate, setUnderfloorNewAccessCanCreate] = useState<'yes' | 'no' | ''>('');
  const [underfloorExistingInsulation, setUnderfloorExistingInsulation] = useState<'yes' | 'no' | ''>('');
  const [underfloorPerimeterEnclosed, setUnderfloorPerimeterEnclosed] = useState<'yes' | 'no' | ''>('');
  const [underfloorFoilUnderlay, setUnderfloorFoilUnderlay] = useState<'yes' | 'no' | ''>('');
  const [underfloorLuminaires, setUnderfloorLuminaires] = useState<'yes' | 'no' | ''>('');
  const [underfloorSqm, setUnderfloorSqm] = useState('');
  const [underfloorComments, setUnderfloorComments] = useState('');
  
  // Subfloor Wall (Section 13)
  const [subfloorWallPresent, setSubfloorWallPresent] = useState<'yes' | 'no' | ''>('');
  const [subfloorWallCavitiesAccessible, setSubfloorWallCavitiesAccessible] = useState<'yes' | 'no' | ''>('');
  const [subfloorWallSqm, setSubfloorWallSqm] = useState('');
  const [subfloorWallComments, setSubfloorWallComments] = useState('');
  
  // GMB (Section 14 - EECA Only)
  const [gmbPresent, setGmbPresent] = useState<'yes' | 'no' | ''>('');
  const [gmbInstalledNzs4246, setGmbInstalledNzs4246] = useState<'yes' | 'no' | ''>('');
  const [gmbUnderfloorPercentEnclosed, setGmbUnderfloorPercentEnclosed] = useState('');
  const [gmbHomeownerOptOut, setGmbHomeownerOptOut] = useState<'yes' | 'no' | ''>('');
  const [gmbSqm, setGmbSqm] = useState('');
  
  // Travel (Section 15 - EECA Only)
  const [travelOver50km, setTravelOver50km] = useState<'yes' | 'no' | ''>('');
  const [travelKmOver50, setTravelKmOver50] = useState('');
  
  // Homeowner Tasks (Section 16 - EECA Only)
  const [homeownerRemoveObjects, setHomeownerRemoveObjects] = useState<'yes' | 'no' | ''>('');
  const [homeownerFixLeaks, setHomeownerFixLeaks] = useState<'yes' | 'no' | ''>('');
  
  // Recommendations (Section 17)
  const [enablingMeasuresComments, setEnablingMeasuresComments] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  
  // Assessor Declaration (Section 18)
  const [assessorDeclaration, setAssessorDeclaration] = useState(false);
  const [assessorName, setAssessorName] = useState('');
  const [assessorDate, setAssessorDate] = useState('');
  
  // Assessment Areas (existing functionality)
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
    const today = new Date().toISOString().split('T')[0];
    setAssessorDate(today);
  }, []);

  const loadReferenceData = async () => {
    try {
      const { data: appTypesData } = await supabase
        .from('app_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (appTypesData) setAppTypes(appTypesData);

      const { data: installersData } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, email, role, status')
        .eq('role', 'Installer')
        .eq('status', 'active')
        .order('first_name');
      if (installersData) setInstallers(installersData);

      const { data: wordingsData } = await supabase
        .from('assessment_wordings')
        .select('*')
        .order('wordings');
      if (wordingsData) setAllWordings(wordingsData);
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
    if (!search) return allWordings.slice(0, 20);
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

    if (!selectedClient) {
      setError('Please select a client');
      return;
    }
    if (!selectedSite) {
      setError('Please select a site');
      return;
    }
    if (!assessmentType) {
      setError('Please select assessment type (Retrofit or EECA)');
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
      const refNumber = `ASM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          reference_number: refNumber,
          client_id: selectedClient.id,
          site_id: selectedSite.id,
          assigned_installer_id: installerId,
          assessment_type: assessmentType,
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
          
          // EECA fields
          house_built_before_2008: assessmentType === 'eeca' ? houseBuiltBefore2008 === 'yes' : null,
          owner_occupied: assessmentType === 'eeca' ? ownerOccupied === 'yes' : null,
          deprivation_index_5_7: assessmentType === 'eeca' ? deprivationIndex57 === 'yes' : null,
          homeowner_name: assessmentType === 'eeca' ? homeownerName : null,
          homeowner_phone: assessmentType === 'eeca' ? homeownerPhone : null,
          homeowner_email: assessmentType === 'eeca' ? homeownerEmail : null,
          homeowner_declaration_1: assessmentType === 'eeca' ? homeownerDeclaration1 : null,
          homeowner_declaration_2: assessmentType === 'eeca' ? homeownerDeclaration2 : null,
          homeowner_declaration_date: assessmentType === 'eeca' ? homeownerDeclarationDate : null,
          address_matches_referral: assessmentType === 'eeca' ? addressMatchesReferral === 'yes' : null,
          property_has_curtains: assessmentType === 'eeca' ? propertyHasCurtains === 'yes' : null,
          heating_solution: assessmentType === 'eeca' ? heatingSolution : null,
          heating_in_main_living: assessmentType === 'eeca' ? heatingInMainLiving === 'yes' : null,
          heating_working_asked: assessmentType === 'eeca' ? heatingWorkingAsked === 'yes' : null,
          
          // H&S fields
          hs_assessment_completed: hsAssessmentCompleted === 'yes',
          hs_risks_eliminated: hsRisksEliminated === 'yes',
          hs_personnel_reviewed: hsPersonnelReviewed === 'yes',
          hs_safety_concerns: hsSafetyConcerns || null,
          
          // Ceiling fields
          ceiling_accessible: ceilingAccessible === 'yes',
          ceiling_existing_covers_thermal: ceilingExistingCoversThermal === 'yes',
          ceiling_existing_at_least_120mm: ceilingExistingAtLeast120mm === 'yes',
          ceiling_damp_damaged: ceilingDampDamaged === 'yes',
          ceiling_significant_gaps: ceilingSignificantGaps === 'yes',
          ceiling_clearances_met: ceilingClearancesMet === 'yes',
          ceiling_requires_upgrade: ceilingRequiresUpgrade === 'yes',
          ceiling_access_size: ceilingAccessSize || null,
          ceiling_new_access_can_create: ceilingNewAccessCanCreate === 'yes',
          ceiling_contractor_create_access: ceilingContractorCreateAccess === 'yes',
          ceiling_access_height_mm: ceilingAccessHeightMm ? parseFloat(ceilingAccessHeightMm) : null,
          ceiling_cavity_apex_height_mm: ceilingCavityApexHeightMm ? parseFloat(ceilingCavityApexHeightMm) : null,
          ceiling_low_access_areas: ceilingLowAccessAreas === 'yes',
          ceiling_water_ingress: ceilingWaterIngress === 'yes',
          ceiling_downlights: ceilingDownlights === 'yes',
          ceiling_type: ceilingType || null,
          ceiling_sqm: ceilingSqm ? parseFloat(ceilingSqm) : null,
          ceiling_remedial_hours: ceilingRemedialHours ? parseFloat(ceilingRemedialHours) : null,
          ceiling_comments: ceilingComments || null,
          
          // Ceiling wall fields
          ceiling_wall_present: ceilingWallPresent === 'yes',
          ceiling_wall_cavities_accessible: ceilingWallCavitiesAccessible === 'yes',
          ceiling_wall_existing_insulation: ceilingWallExistingInsulation === 'yes',
          ceiling_wall_sqm: ceilingWallSqm ? parseFloat(ceilingWallSqm) : null,
          pipe_lagging_required: pipeLaggingRequired || null,
          ceiling_wall_comments: ceilingWallComments || null,
          
          // Underfloor fields
          underfloor_accessible: underfloorAccessible === 'yes',
          underfloor_existing_covers_thermal: underfloorExistingCoversThermal === 'yes',
          underfloor_existing_damaged: underfloorExistingDamaged === 'yes',
          underfloor_significant_gaps: underfloorSignificantGaps === 'yes',
          underfloor_clearances_met: underfloorClearancesMet === 'yes',
          underfloor_requires_upgrade: underfloorRequiresUpgrade === 'yes',
          underfloor_access_size: underfloorAccessSize || null,
          underfloor_new_access_can_create: underfloorNewAccessCanCreate === 'yes',
          underfloor_existing_insulation: underfloorExistingInsulation === 'yes',
          underfloor_perimeter_enclosed: underfloorPerimeterEnclosed === 'yes',
          underfloor_foil_underlay: underfloorFoilUnderlay === 'yes',
          underfloor_luminaires: underfloorLuminaires === 'yes',
          underfloor_sqm: underfloorSqm ? parseFloat(underfloorSqm) : null,
          underfloor_comments: underfloorComments || null,
          
          // Subfloor wall fields
          subfloor_wall_present: subfloorWallPresent === 'yes',
          subfloor_wall_cavities_accessible: subfloorWallCavitiesAccessible === 'yes',
          subfloor_wall_sqm: subfloorWallSqm ? parseFloat(subfloorWallSqm) : null,
          subfloor_wall_comments: subfloorWallComments || null,
          
          // GMB fields (EECA only)
          gmb_present: assessmentType === 'eeca' ? gmbPresent === 'yes' : null,
          gmb_installed_nzs_4246: assessmentType === 'eeca' ? gmbInstalledNzs4246 === 'yes' : null,
          gmb_underfloor_percent_enclosed: assessmentType === 'eeca' && gmbUnderfloorPercentEnclosed ? parseFloat(gmbUnderfloorPercentEnclosed) : null,
          gmb_homeowner_opt_out: assessmentType === 'eeca' ? gmbHomeownerOptOut === 'yes' : null,
          gmb_sqm: assessmentType === 'eeca' && gmbSqm ? parseFloat(gmbSqm) : null,
          
          // Travel fields (EECA only)
          travel_over_50km: assessmentType === 'eeca' ? travelOver50km === 'yes' : null,
          travel_km_over_50: assessmentType === 'eeca' && travelKmOver50 ? parseFloat(travelKmOver50) : null,
          
          // Homeowner tasks (EECA only)
          homeowner_remove_objects: assessmentType === 'eeca' ? homeownerRemoveObjects === 'yes' : null,
          homeowner_fix_leaks: assessmentType === 'eeca' ? homeownerFixLeaks === 'yes' : null,
          
          // Recommendations
          enabling_measures_comments: enablingMeasuresComments || null,
          additional_comments: additionalComments || null,
          
          // Assessor declaration
          assessor_declaration: assessorDeclaration,
          assessor_name: assessorName || null,
          assessor_date: assessorDate || null,
          
          notes: generalNotes || null,
          status: 'Scheduled',
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create assessment areas
      if (assessment && areas.length > 0) {
        const areasToInsert = areas
          .filter(a => a.app_type_name)
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

      setSuccess(true);
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
  // YES/NO RADIO COMPONENT
  // ============================================
  const YesNoRadio = ({ 
    name, 
    value, 
    onChange, 
    label 
  }: { 
    name: string; 
    value: 'yes' | 'no' | ''; 
    onChange: (val: 'yes' | 'no') => void;
    label: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name={name}
            value="yes"
            checked={value === 'yes'}
            onChange={() => onChange('yes')}
            className="text-[#0066CC] focus:ring-[#0066CC]"
          />
          <span className="text-sm">Yes</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name={name}
            value="no"
            checked={value === 'no'}
            onChange={() => onChange('no')}
            className="text-[#0066CC] focus:ring-[#0066CC]"
          />
          <span className="text-sm">No</span>
        </label>
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Assessment</h1>
          <p className="text-gray-600">Assessment #{assessmentNumber}</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Assessment created successfully! Redirecting...</span>
          </div>
        )}

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
          
          {/* SECTION 1: CLIENT & SITE */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              1. Client & Site Selection <span className="text-red-500 ml-1">*</span>
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

          {/* SECTION 2: ASSESSMENT DETAILS */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              2. Assessment Details
            </h2>
            
            {/* ASSESSMENT TYPE - CRITICAL */}
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Assessment Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assessmentType"
                    value="retrofit"
                    checked={assessmentType === 'retrofit'}
                    onChange={() => setAssessmentType('retrofit')}
                    required
                    className="w-5 h-5 text-[#0066CC] focus:ring-[#0066CC]"
                  />
                  <span className="text-sm font-medium">Retrofit (Private)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assessmentType"
                    value="eeca"
                    checked={assessmentType === 'eeca'}
                    onChange={() => setAssessmentType('eeca')}
                    required
                    className="w-5 h-5 text-[#0066CC] focus:ring-[#0066CC]"
                  />
                  <span className="text-sm font-medium">EECA Subsidy</span>
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {assessmentType === 'eeca' 
                  ? '✓ Full EECA sections will be shown (18 total)'
                  : assessmentType === 'retrofit'
                  ? '✓ Retrofit sections only (11 total)'
                  : 'Please select to continue'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Reference</label>
                <input
                  type="text"
                  value={opportunity}
                  onChange={(e) => setOpportunity(e.target.value)}
                  placeholder="e.g., OPP-2025-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Built</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Size (m²)</label>
                <input
                  type="number"
                  value={estimatedSize}
                  onChange={(e) => setEstimatedSize(e.target.value)}
                  placeholder="e.g., 150"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Access Difficulty</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crawl Space Height (cm)</label>
                <input
                  type="number"
                  value={crawlSpaceHeight}
                  onChange={(e) => setCrawlSpaceHeight(e.target.value)}
                  placeholder="e.g., 45"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Existing Insulation Type</label>
                <input
                  type="text"
                  value={existingInsulationType}
                  onChange={(e) => setExistingInsulationType(e.target.value)}
                  placeholder="e.g., Glasswool R1.8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

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

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hazards Present</label>
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

          {/* EECA SECTION 3: ELIGIBILITY */}
          {assessmentType === 'eeca' && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
                3. EECA Eligibility <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">EECA Only</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <YesNoRadio name="houseBefore2008" value={houseBuiltBefore2008} onChange={setHouseBuiltBefore2008} label="House built before 2008?" />
                <YesNoRadio name="ownerOccupied" value={ownerOccupied} onChange={setOwnerOccupied} label="Owner Occupied?" />
                <YesNoRadio name="deprivationIndex" value={deprivationIndex57} onChange={setDeprivationIndex57} label="Deprivation Index 5-7?" />
              </div>
            </div>
          )}

          {/* EECA SECTION 4: HOMEOWNER INFO */}
          {assessmentType === 'eeca' && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
                4. Homeowner Information <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">EECA Only</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Homeowner Name</label>
                  <input type="text" value={homeownerName} onChange={(e) => setHomeownerName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Homeowner Phone</label>
                  <input type="tel" value={homeownerPhone} onChange={(e) => setHomeownerPhone(e.target.value)} placeholder="021 XXX XXXX" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Homeowner Email</label>
                  <input type="email" value={homeownerEmail} onChange={(e) => setHomeownerEmail(e.target.value)} placeholder="email@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
                </div>
              </div>
            </div>
          )}

          {/* EECA SECTION 5: HOMEOWNER DECLARATION */}
          {assessmentType === 'eeca' && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
                5. Homeowner Declaration <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">EECA Only</span>
              </h2>
              <div className="space-y-4">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={homeownerDeclaration1} onChange={(e) => setHomeownerDeclaration1(e.target.checked)} className="mt-1 w-4 h-4 text-[#0066CC] border-gray-300 rounded focus:ring-[#0066CC]" />
                  <span className="text-sm text-gray-700">I confirm the above details are correct</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={homeownerDeclaration2} onChange={(e) => setHomeownerDeclaration2(e.target.checked)} className="mt-1 w-4 h-4 text-[#0066CC] border-gray-300 rounded focus:ring-[#0066CC]" />
                  <span className="text-sm text-gray-700">I confirm I am the owner and occupier of this property</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Declaration Date</label>
                  <input type="date" value={homeownerDeclarationDate} onChange={(e) => setHomeownerDeclarationDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
                </div>
              </div>
            </div>
          )}

          {/* EECA SECTION 6: PROPERTY CHECKS */}
          {assessmentType === 'eeca' && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
                6. Property Checks <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">EECA Only</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <YesNoRadio name="addressMatch" value={addressMatchesReferral} onChange={setAddressMatchesReferral} label="Does address match referral?" />
                <YesNoRadio name="curtains" value={propertyHasCurtains} onChange={setPropertyHasCurtains} label="Property have Curtains?" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heating Solution</label>
                  <select value={heatingSolution} onChange={(e) => setHeatingSolution(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent">
                    <option value="">Select...</option>
                    <option value="None">None</option>
                    <option value="Heat Pump">Heat Pump</option>
                    <option value="Gas">Gas</option>
                    <option value="Wood">Wood</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <YesNoRadio name="heatingMain" value={heatingInMainLiving} onChange={setHeatingInMainLiving} label="Heating in main living space?" />
              </div>
            </div>
          )}

          {/* SECTION 7: H&S ASSESSMENT */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              {assessmentType === 'eeca' ? '7' : '3'}. H&S Assessment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <YesNoRadio name="hsComplete" value={hsAssessmentCompleted} onChange={setHsAssessmentCompleted} label="H&S assessment completed?" />
              <YesNoRadio name="hsRisks" value={hsRisksEliminated} onChange={setHsRisksEliminated} label="Risks eliminated?" />
              <YesNoRadio name="hsPersonnel" value={hsPersonnelReviewed} onChange={setHsPersonnelReviewed} label="Personnel reviewed H&S?" />
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Safety Concerns</label>
                <textarea value={hsSafetyConcerns} onChange={(e) => setHsSafetyConcerns(e.target.value)} placeholder="Describe any safety concerns..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
            </div>
          </div>

          {/* SECTION 8: CEILING CURRENT STATE */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              {assessmentType === 'eeca' ? '8' : '4'}. Ceiling - Current State
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <YesNoRadio name="ceilingAccess" value={ceilingAccessible} onChange={setCeilingAccessible} label="Is ceiling accessible?" />
              <YesNoRadio name="ceilingThermal" value={ceilingExistingCoversThermal} onChange={setCeilingExistingCoversThermal} label="Existing covers thermal envelope?" />
              <YesNoRadio name="ceiling120mm" value={ceilingExistingAtLeast120mm} onChange={setCeilingExistingAtLeast120mm} label="Existing at least 120mm?" />
              <YesNoRadio name="ceilingDamp" value={ceilingDampDamaged} onChange={setCeilingDampDamaged} label="Existing damp/damaged?" />
              <YesNoRadio name="ceilingGaps" value={ceilingSignificantGaps} onChange={setCeilingSignificantGaps} label="Significant gaps?" />
              <YesNoRadio name="ceilingClearance" value={ceilingClearancesMet} onChange={setCeilingClearancesMet} label="Clearances met?" />
              <YesNoRadio name="ceilingUpgrade" value={ceilingRequiresUpgrade} onChange={setCeilingRequiresUpgrade} label="Requires upgrading?" />
            </div>
          </div>

          {/* SECTION 9: CEILING DETAILED */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              {assessmentType === 'eeca' ? '9' : '5'}. Ceiling - Detailed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access size</label>
                <select value={ceilingAccessSize} onChange={(e) => setCeilingAccessSize(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent">
                  <option value="">Select...</option>
                  <option value="400x600">400x600</option>
                  <option value="500x500">500x500</option>
                  <option value="600x600">600x600</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <YesNoRadio name="ceilingNewAccess" value={ceilingNewAccessCanCreate} onChange={setCeilingNewAccessCanCreate} label="New access can be created?" />
              <YesNoRadio name="ceilingContractor" value={ceilingContractorCreateAccess} onChange={setCeilingContractorCreateAccess} label="Contractor to create access?" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access height (mm)</label>
                <input type="number" value={ceilingAccessHeightMm} onChange={(e) => setCeilingAccessHeightMm(e.target.value)} placeholder="e.g., 500" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cavity apex height (mm)</label>
                <input type="number" value={ceilingCavityApexHeightMm} onChange={(e) => setCeilingCavityApexHeightMm(e.target.value)} placeholder="e.g., 600" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
              <YesNoRadio name="ceilingLowAccess" value={ceilingLowAccessAreas} onChange={setCeilingLowAccessAreas} label="Low access areas?" />
              <YesNoRadio name="ceilingWater" value={ceilingWaterIngress} onChange={setCeilingWaterIngress} label="Water ingress?" />
              <YesNoRadio name="ceilingDownlights" value={ceilingDownlights} onChange={setCeilingDownlights} label="Downlights present?" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ceiling Type</label>
                <select value={ceilingType} onChange={(e) => setCeilingType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent">
                  <option value="">Select...</option>
                  <option value="Gib">Gib</option>
                  <option value="Timber">Timber</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Square meters</label>
                <input type="number" value={ceilingSqm} onChange={(e) => setCeilingSqm(e.target.value)} placeholder="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remedial hours</label>
                <input type="number" value={ceilingRemedialHours} onChange={(e) => setCeilingRemedialHours(e.target.value)} placeholder="0" step="0.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea value={ceilingComments} onChange={(e) => setCeilingComments(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
            </div>
          </div>

          {/* SECTION 10: CEILING WALL */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              {assessmentType === 'eeca' ? '10' : '6'}. Ceiling Wall
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <YesNoRadio name="ceilingWall" value={ceilingWallPresent} onChange={setCeilingWallPresent} label="Walls in ceiling space?" />
              <YesNoRadio name="ceilingWallCavities" value={ceilingWallCavitiesAccessible} onChange={setCeilingWallCavitiesAccessible} label="Cavities accessible?" />
              <YesNoRadio name="ceilingWallInsulation" value={ceilingWallExistingInsulation} onChange={setCeilingWallExistingInsulation} label="Existing insulation?" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Square Meters</label>
                <input type="number" value={ceilingWallSqm} onChange={(e) => setCeilingWallSqm(e.target.value)} placeholder="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pipe lagging</label>
                <select value={pipeLaggingRequired} onChange={(e) => setPipeLaggingRequired(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent">
                  <option value="">Select...</option>
                  <option value="Not Required">Not Required</option>
                  <option value="Zone 3">Zone 3</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea value={ceilingWallComments} onChange={(e) => setCeilingWallComments(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
            </div>
          </div>

          {/* SECTION 11: UNDERFLOOR CURRENT */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              {assessmentType === 'eeca' ? '11' : '7'}. Underfloor - Current State
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <YesNoRadio name="underfloorAccess" value={underfloorAccessible} onChange={setUnderfloorAccessible} label="Underfloor accessible?" />
              <YesNoRadio name="underfloorThermal" value={underfloorExistingCoversThermal} onChange={setUnderfloorExistingCoversThermal} label="Existing covers thermal?" />
              <YesNoRadio name="underfloorDamaged" value={underfloorExistingDamaged} onChange={setUnderfloorExistingDamaged} label="Existing damaged?" />
              <YesNoRadio name="underfloorGaps" value={underfloorSignificantGaps} onChange={setUnderfloorSignificantGaps} label="Significant gaps?" />
              <YesNoRadio name="underfloorClearance" value={underfloorClearancesMet} onChange={setUnderfloorClearancesMet} label="Clearances met?" />
              <YesNoRadio name="underfloorUpgrade" value={underfloorRequiresUpgrade} onChange={setUnderfloorRequiresUpgrade} label="Requires upgrading?" />
            </div>
          </div>

          {/* SECTION 12: UNDERFLOOR DETAILED */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              {assessmentType === 'eeca' ? '12' : '8'}. Underfloor - Detailed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access size</label>
                <select value={underfloorAccessSize} onChange={(e) => setUnderfloorAccessSize(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent">
                  <option value="">Select...</option>
                  <option value="400x600">400x600</option>
                  <option value="500x500">500x500</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <YesNoRadio name="underfloorNewAccess" value={underfloorNewAccessCanCreate} onChange={setUnderfloorNewAccessCanCreate} label="New access can be created?" />
              <YesNoRadio name="underfloorExisting" value={underfloorExistingInsulation} onChange={setUnderfloorExistingInsulation} label="Existing insulation?" />
              <YesNoRadio name="underfloorPerimeter" value={underfloorPerimeterEnclosed} onChange={setUnderfloorPerimeterEnclosed} label="Perimeter enclosed?" />
              <YesNoRadio name="underfloorFoil" value={underfloorFoilUnderlay} onChange={setUnderfloorFoilUnderlay} label="Foil underlay?" />
              <YesNoRadio name="underfloorLuminaires" value={underfloorLuminaires} onChange={setUnderfloorLuminaires} label="Luminaires?" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Square meters</label>
                <input type="number" value={underfloorSqm} onChange={(e) => setUnderfloorSqm(e.target.value)} placeholder="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea value={underfloorComments} onChange={(e) => setUnderfloorComments(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
            </div>
          </div>

          {/* SECTION 13: SUBFLOOR WALL */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              {assessmentType === 'eeca' ? '13' : '9'}. Subfloor Wall
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <YesNoRadio name="subfloorWall" value={subfloorWallPresent} onChange={setSubfloorWallPresent} label="Walls in subfloor space?" />
              <YesNoRadio name="subfloorCavities" value={subfloorWallCavitiesAccessible} onChange={setSubfloorWallCavitiesAccessible} label="Cavities accessible?" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Square Meters</label>
                <input type="number" value={subfloorWallSqm} onChange={(e) => setSubfloorWallSqm(e.target.value)} placeholder="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea value={subfloorWallComments} onChange={(e) => setSubfloorWallComments(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
            </div>
          </div>

          {/* EECA SECTION 14: GMB */}
          {assessmentType === 'eeca' && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
                14. GMB <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">EECA Only</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <YesNoRadio name="gmb" value={gmbPresent} onChange={setGmbPresent} label="GMB present?" />
                <YesNoRadio name="gmbNzs" value={gmbInstalledNzs4246} onChange={setGmbInstalledNzs4246} label="Installed to NZS 4246?" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Underfloor % enclosed</label>
                  <input type="number" value={gmbUnderfloorPercentEnclosed} onChange={(e) => setGmbUnderfloorPercentEnclosed(e.target.value)} placeholder="80" min="0" max="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
                </div>
                <YesNoRadio name="gmbOptOut" value={gmbHomeownerOptOut} onChange={setGmbHomeownerOptOut} label="Homeowner opt out?" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Square Meters</label>
                  <input type="number" value={gmbSqm} onChange={(e) => setGmbSqm(e.target.value)} placeholder="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
                </div>
              </div>
            </div>
          )}

          {/* EECA SECTION 15: TRAVEL */}
          {assessmentType === 'eeca' && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
                15. Travel <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">EECA Only</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <YesNoRadio name="travel" value={travelOver50km} onChange={setTravelOver50km} label="Travel >50km?" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Km over 50</label>
                  <input type="number" value={travelKmOver50} onChange={(e) => setTravelKmOver50(e.target.value)} placeholder="0" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
                </div>
              </div>
            </div>
          )}

          {/* EECA SECTION 16: HOMEOWNER TASKS */}
          {assessmentType === 'eeca' && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
                16. Homeowner Tasks <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">EECA Only</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <YesNoRadio name="removeObjects" value={homeownerRemoveObjects} onChange={setHomeownerRemoveObjects} label="Remove stored objects?" />
                <YesNoRadio name="fixLeaks" value={homeownerFixLeaks} onChange={setHomeownerFixLeaks} label="Fix leaks?" />
              </div>
            </div>
          )}

          {/* SECTION 17: RECOMMENDATIONS */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              {assessmentType === 'eeca' ? '17' : '10'}. Recommendations
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enabling Measures</label>
                <textarea value={enablingMeasuresComments} onChange={(e) => setEnablingMeasuresComments(e.target.value)} placeholder="Details of enabling measures..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comments</label>
                <textarea value={additionalComments} onChange={(e) => setAdditionalComments(e.target.value)} placeholder="Any additional comments..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
              </div>
            </div>
          </div>

          {/* SECTION 18: ASSESSOR DECLARATION */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              {assessmentType === 'eeca' ? '18' : '11'}. Assessor Declaration <span className="text-red-500">*</span>
            </h2>
            <div className="space-y-4">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={assessorDeclaration} onChange={(e) => setAssessorDeclaration(e.target.checked)} required className="mt-1 w-4 h-4 text-[#0066CC] border-gray-300 rounded focus:ring-[#0066CC]" />
                <span className="text-sm text-gray-700">I declare this information is accurate and complete</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessor Name <span className="text-red-500">*</span></label>
                  <input type="text" value={assessorName} onChange={(e) => setAssessorName(e.target.value)} placeholder="Full name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={assessorDate} onChange={(e) => setAssessorDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* KEEP YOUR EXISTING ASSESSMENT AREAS SECTION HERE */}
          {/* (The areas section from your original code) */}

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052A3] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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