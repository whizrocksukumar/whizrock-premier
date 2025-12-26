'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, X, ChevronRight, ChevronLeft } from 'lucide-react';

type Step = 1 | 2 | 3;
type ResultType = 'Pass' | 'Fail' | 'Exempt' | 'Pending';

// Types
interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: string;
  companies?: {
    company_name: string;
    site_address: string;
  };
}

interface Installer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Region {
  id: string;
  name: string;
  code: string;
}

interface ApplicationType {
  id: string;
  name: string;
  hex_color: string;
  sort_order: number;
}

interface AssessmentWording {
  id: string;
  assessment_area: string;
  description: string;
  result_type: ResultType;
  recommended_action: string | null;
  is_active: boolean;
}

interface AssessmentArea {
  id: string;
  area_name: string;
  wordings_id?: string;
  wordings_description?: string;
  suggested_result_type?: ResultType;
  selected_result_type: ResultType;
  work_description: string;
  notes: string;
  color?: string;
}

// Result Type Config
const RESULT_TYPE_CONFIG = {
  Pass: {
    label: 'Pass',
    color: 'bg-green-100 text-green-800',
    badgeColor: 'bg-green-500',
    borderColor: 'border-green-500',
    icon: '✓'
  },
  Fail: {
    label: 'Fail',
    color: 'bg-red-100 text-red-800',
    badgeColor: 'bg-red-500',
    borderColor: 'border-red-500',
    icon: '✗'
  },
  Exempt: {
    label: 'Exempt',
    color: 'bg-purple-100 text-purple-800',
    badgeColor: 'bg-purple-500',
    borderColor: 'border-purple-500',
    icon: '○'
  },
  Pending: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-800',
    badgeColor: 'bg-gray-500',
    borderColor: 'border-gray-500',
    icon: '◌'
  }
} as const;

const AREA_COLORS: Record<string, string> = {
  'Ceiling': '#C27BA0',
  'Underfloor': '#76A5AF',
  'External Walls': '#FFD966',
  'Wall Cavity': '#9FC5E8',
  'GIW': '#F6B26B',
  'Void Wall': '#EAD1DC',
  'Soffit': '#B7B7B7',
  'Flat Ceiling': '#CFE2F3',
  'Raked Ceiling': '#D9EAD3',
  'GCFO': '#F4CCCC',
};

const AREA_OPTIONS = Object.keys(AREA_COLORS);

export default function ScheduleAssessmentPage() {
  const router = useRouter();

  // Auth
  const [currentUserId, setCurrentUserId] = useState('');

  // Step state
  const [step, setStep] = useState<Step>(1);

  // Step 1: Client Selection
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showAddClientForm, setShowAddClientForm] = useState(false);

  // New client form
  const [newClientFirstName, setNewClientFirstName] = useState('');
  const [newClientLastName, setNewClientLastName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Step 2: Installer Selection
  const [selectedInstallerId, setSelectedInstallerId] = useState('');

  // Step 3: Schedule Details
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [siteAddress, setSiteAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [regionId, setRegionId] = useState('');
  const [notes, setNotes] = useState('');

  // Assessment Areas
  const [assessmentAreas, setAssessmentAreas] = useState<AssessmentArea[]>([]);
  const [showAddAreaForm, setShowAddAreaForm] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaWordings, setNewAreaWordings] = useState<AssessmentWording[]>([]);
  const [newAreaSelectedWording, setNewAreaSelectedWording] = useState<AssessmentWording | null>(null);
  const [showNewAreaWordings, setShowNewAreaWordings] = useState(false);
  const [newAreaSearchTerm, setNewAreaSearchTerm] = useState('');
  const [newAreaWorkDescription, setNewAreaWorkDescription] = useState('');
  const [newAreaNotes, setNewAreaNotes] = useState('');
  const [newAreaResultType, setNewAreaResultType] = useState<ResultType>('Pending');

  // Lookups
  const [clients, setClients] = useState<Client[]>([]);
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [allWordings, setAllWordings] = useState<AssessmentWording[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Refs
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const newAreaWordingsRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    initializeAuth();
    loadLookupData();
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (err) {
      console.error('Error getting auth user:', err);
    }
  };

  const loadLookupData = async () => {
    try {
      setLoading(true);

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, company_id, companies(company_name, site_address)');

      if (clientsError) {
        console.error('Clients error:', clientsError);
        throw clientsError;
      }
      if (clientsData) {
        setClients(clientsData as any);
      }

      // Load installers
      const { data: installersData, error: installersError } = await supabase
        .from('team_members')
        .select('id, first_name, last_name, email')
        .eq('role', 'Installer')
        .eq('status', 'active');

      if (installersError) throw installersError;
      if (installersData) {
        setInstallers(installersData as any);
      }

      // Load regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('id, name, code')
        .order('name');

      if (regionsError) throw regionsError;
      if (regionsData) {
        setRegions(regionsData as any);
      }

      // Load all assessment wordings
      const { data: wordingsData, error: wordingsError } = await supabase
        .from('assessment_wordings')
        .select('id, assessment_area, description, result_type, recommended_action, is_active')
        .eq('is_active', true)
        .order('assessment_area, description');

      if (wordingsError) {
        console.error('Wordings error:', wordingsError);
      } else if (wordingsData) {
        setAllWordings(wordingsData as any);
      }

      setError(null);
    } catch (error) {
      console.error('Error loading lookup data:', error);
      setError('Failed to load form data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Client fuzzy search
  const filterClients = (searchTerm: string) => {
    if (!searchTerm) return clients;
    const term = searchTerm.toLowerCase();
    return clients.filter((c) =>
      c.first_name?.toLowerCase().includes(term) ||
      c.last_name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.companies?.company_name?.toLowerCase().includes(term)
    );
  };

  const selectClient = (client: Client) => {
    setClientId(client.id);
    setClientSearch(`${client.first_name} ${client.last_name}${client.companies?.company_name ? ` - ${client.companies.company_name}` : ''}`);
    setShowClientSuggestions(false);

    if (client.companies?.site_address) {
      setSiteAddress(client.companies.site_address);
    }
  };

  const handleAddNewClient = async () => {
    if (!newClientFirstName || !newClientLastName) {
      setError('Please enter at least first and last name');
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('clients')
        .insert({
          first_name: newClientFirstName,
          last_name: newClientLastName,
          email: newClientEmail || null,
          phone: newClientPhone || null,
        })
        .select('id, first_name, last_name, email, phone, company_id, companies(company_name, site_address)')
        .single();

      if (error) throw error;

      if (data) {
        const { data: updatedClients } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, phone, company_id, companies(company_name, site_address)');

        if (updatedClients) setClients(updatedClients as any);
        selectClient(data as Client);

        setNewClientFirstName('');
        setNewClientLastName('');
        setNewClientEmail('');
        setNewClientPhone('');
        setShowAddClientForm(false);
      }
    } catch (error: any) {
      console.error('Error adding client:', error);
      setError(`Error adding client: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Assessment Area Management
  const handleAddArea = async () => {
    if (!newAreaName || !newAreaSelectedWording) {
      setError('Please select an area type and wording');
      return;
    }

    const newArea: AssessmentArea = {
      id: `temp-${Date.now()}`,
      area_name: newAreaName,
      wordings_id: newAreaSelectedWording.id,
      wordings_description: newAreaSelectedWording.description,
      suggested_result_type: newAreaSelectedWording.result_type,
      selected_result_type: newAreaResultType,
      work_description: newAreaWorkDescription || newAreaSelectedWording.recommended_action || '',
      notes: newAreaNotes,
      color: AREA_COLORS[newAreaName],
    };

    setAssessmentAreas([...assessmentAreas, newArea]);
    
    // Reset form
    setNewAreaName('');
    setNewAreaSelectedWording(null);
    setNewAreaSearchTerm('');
    setNewAreaWorkDescription('');
    setNewAreaNotes('');
    setNewAreaResultType('Pending');
    setShowAddAreaForm(false);
    setError(null);
  };

  const handleRemoveArea = (id: string) => {
    setAssessmentAreas(assessmentAreas.filter(a => a.id !== id));
  };

  const getFilteredWordings = (areeName: string, searchTerm: string) => {
    let filtered = allWordings.filter(w => w.assessment_area === areeName && w.is_active);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(w =>
        w.description.toLowerCase().includes(term) ||
        w.recommended_action?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const handleSelectWording = (wording: AssessmentWording) => {
    setNewAreaSelectedWording(wording);
    setNewAreaWorkDescription(wording.recommended_action || '');
    setNewAreaResultType(wording.result_type);
    setShowNewAreaWordings(false);
    setNewAreaSearchTerm('');
  };

  // Fetch booked slots
  const fetchBookedSlots = async (date: string) => {
    try {
      const startDate = new Date(date).toISOString();
      const endDate = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch(
        `/api/calendar/events?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );

      if (!response.ok) {
        console.warn('Failed to fetch calendar events');
        return;
      }

      const { events } = await response.json();
      console.log('Booked slots:', events);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    }
  };

  const handleDateChange = (date: string) => {
    setScheduledDate(date);
    setScheduledTime('09:00');
    fetchBookedSlots(date);
  };

  // Generate reference number
  const generateReferenceNumber = async (): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const { data, error } = await supabase
      .from('assessments')
      .select('reference_number', { count: 'exact' })
      .like('reference_number', `ASS-${currentYear}-%`)
      .order('reference_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last reference number:', error);
      return `ASS-${currentYear}-0001`;
    }

    if (!data || data.length === 0) {
      return `ASS-${currentYear}-0001`;
    }

    const lastRef = data[0].reference_number;
    const lastNumber = parseInt(lastRef.split('-')[2]);
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `ASS-${currentYear}-${newNumber}`;
  };

  // Handle submit
  const handleScheduleAssessment = async () => {
    if (!clientId || !selectedInstallerId || !scheduledDate || !scheduledTime || !siteAddress) {
      setError('Please fill in all required fields');
      return;
    }

    if (assessmentAreas.length === 0) {
      setError('Please add at least one assessment area');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const refNumber = await generateReferenceNumber();

      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          reference_number: refNumber,
          client_id: clientId,
          site_address: siteAddress,
          city: city || null,
          postcode: postcode || null,
          region_id: regionId || null,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          assigned_installer_id: selectedInstallerId,
          status: 'Scheduled',
          notes: notes || null,
          created_by_premier_user_id: currentUserId || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      if (assessment) {
        // Create assessment areas
        const areasToInsert = assessmentAreas.map(area => ({
          assessment_id: assessment.id,
          area_name: area.area_name,
          wordings_id: area.wordings_id || null,
          current_insulation_type: area.wordings_description || null,
          result_type: area.selected_result_type,
          work_description: area.work_description,
          notes: area.notes || null,
        }));

        const { error: areasError } = await supabase
          .from('assessment_areas')
          .insert(areasToInsert);

        if (areasError) {
          console.warn('Warning: Could not insert assessment areas:', areasError);
        }

        // Create Google Calendar event
        try {
          const [year, month, day] = scheduledDate.split('-');
          const [hours, minutes] = scheduledTime.split(':');

          const startDateTime = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes)
          );
          const endDateTime = new Date(startDateTime.getTime() + 3 * 60 * 60 * 1000);

          const selectedClient = clients.find((c) => c.id === clientId);
          const selectedInstaller = installers.find((i) => i.id === selectedInstallerId);

          const calendarResponse = await fetch('/api/calendar/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assessmentId: assessment.id,
              clientName: selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'Client',
              siteAddress: siteAddress,
              installerName: selectedInstaller ? `${selectedInstaller.first_name} ${selectedInstaller.last_name}` : 'TBD',
              scheduledDate: scheduledDate,
              scheduledTime: scheduledTime,
              startDateTime: startDateTime.toISOString(),
              endDateTime: endDateTime.toISOString(),
            }),
          });

          if (calendarResponse.ok) {
            const { calendarEventId } = await calendarResponse.json();

            await supabase
              .from('assessments')
              .update({
                calendar_event_id: calendarEventId,
                calendar_provider: 'google',
              })
              .eq('id', assessment.id);
          }
        } catch (calendarErr) {
          console.warn('Calendar event creation failed, but assessment was created:', calendarErr);
        }

        setSuccess(`Assessment ${refNumber} scheduled successfully!`);

        setTimeout(() => {
          router.push('/assessments');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error scheduling assessment:', err);
      setError(err.message || 'Failed to schedule assessment');
    } finally {
      setSaving(false);
    }
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setShowClientSuggestions(false);
      }
      if (newAreaWordingsRef.current && !newAreaWordingsRef.current.contains(event.target as Node)) {
        setShowNewAreaWordings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedClientObj = clients.find((c) => c.id === clientId);
  const selectedInstallerObj = installers.find((i) => i.id === selectedInstallerId);

  return (
    <div className="min-h-screen bg-gray-100">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 mx-6 mt-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 mx-6 mt-4">
          <p className="font-bold">Success</p>
          <p>{success}</p>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0066CC]">Schedule Assessment</h1>
            <p className="text-sm text-gray-500 mt-1">Create a new site assessment appointment</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-[#0066CC]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-[#0066CC] text-white' : 'bg-gray-300 text-gray-700'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Client</span>
            </div>

            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-[#0066CC]' : 'bg-gray-300'}`}></div>

            <div className={`flex items-center ${step >= 2 ? 'text-[#0066CC]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-[#0066CC] text-white' : 'bg-gray-300 text-gray-700'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Installer</span>
            </div>

            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-[#0066CC]' : 'bg-gray-300'}`}></div>

            <div className={`flex items-center ${step >= 3 ? 'text-[#0066CC]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-[#0066CC] text-white' : 'bg-gray-300 text-gray-700'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Schedule</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* STEP 1: CLIENT SELECTION */}
          {step === 1 && (
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Select or Create Client</h2>

              {!showAddClientForm ? (
                <>
                  <div className="relative mb-4" ref={clientDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Client *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientSuggestions(true);
                        }}
                        onFocus={() => setShowClientSuggestions(true)}
                        placeholder="Type to search by name, email, phone, or company..."
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                      />
                      <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                    </div>

                    {showClientSuggestions && clients.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filterClients(clientSearch).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => selectClient(c)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <p className="font-medium text-gray-900">{c.first_name} {c.last_name}</p>
                            <p className="text-sm text-gray-600">{c.email}</p>
                            {c.companies?.company_name && <p className="text-xs text-gray-500">{c.companies.company_name}</p>}
                          </button>
                        ))}
                        {filterClients(clientSearch).length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No clients found.{' '}
                            <button onClick={() => setShowAddClientForm(true)} className="text-[#0066CC] hover:underline">
                              Add new client
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {clientId && selectedClientObj && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
                      <p className="text-xs text-gray-500">Selected Client</p>
                      <p className="font-medium text-gray-900">
                        {selectedClientObj.first_name} {selectedClientObj.last_name}
                      </p>
                      {selectedClientObj.companies?.company_name && <p className="text-sm text-gray-600">{selectedClientObj.companies.company_name}</p>}
                    </div>
                  )}

                  <button
                    onClick={() => setShowAddClientForm(true)}
                    className="px-3 py-1.5 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors"
                  >
                    + Add New Client
                  </button>
                </>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">New Client</h3>
                    <button onClick={() => setShowAddClientForm(false)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={newClientFirstName}
                        onChange={(e) => setNewClientFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={newClientLastName}
                        onChange={(e) => setNewClientLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setShowAddClientForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNewClient}
                      disabled={saving}
                      className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] disabled:opacity-50"
                    >
                      {saving ? 'Adding...' : 'Add Client'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: INSTALLER SELECTION */}
          {step === 2 && (
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Installer</h2>

              <div className="space-y-2">
                {installers.map((installer) => (
                  <label key={installer.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type="radio"
                      name="installer"
                      value={installer.id}
                      checked={selectedInstallerId === installer.id}
                      onChange={(e) => setSelectedInstallerId(e.target.value)}
                      className="w-4 h-4 text-[#0066CC]"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">
                        {installer.first_name} {installer.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{installer.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE DETAILS & AREAS */}
          {step === 3 && (
            <>
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Schedule Details</h2>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Client</p>
                    <p className="font-semibold text-gray-900">{selectedClientObj ? `${selectedClientObj.first_name} ${selectedClientObj.last_name}` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Installer</p>
                    <p className="font-semibold text-gray-900">{selectedInstallerObj ? `${selectedInstallerObj.first_name} ${selectedInstallerObj.last_name}` : '—'}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time *</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Site Details */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Address *</label>
                  <input
                    type="text"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    placeholder="e.g. 8 Ulster Road, Blockhouse Bay"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Auckland"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="e.g. 1050"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <select
                      value={regionId}
                      onChange={(e) => setRegionId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                    >
                      <option value="">Select region...</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any additional notes or special instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  />
                </div>
              </div>

              {/* ASSESSMENT AREAS SECTION */}
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Assessment Areas *</h2>

                {/* Existing Areas */}
                {assessmentAreas.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {assessmentAreas.map((area) => (
                      <div key={area.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: area.color }}
                            ></div>
                            <h3 className="font-semibold text-gray-900">{area.area_name}</h3>
                          </div>
                          <button
                            onClick={() => handleRemoveArea(area.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Wording</p>
                            <p className="font-medium text-gray-900">{area.wordings_description || 'Custom'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Suggested Status</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${RESULT_TYPE_CONFIG[area.suggested_result_type || 'Pending'].color}`}>
                              {area.suggested_result_type || 'Pending'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Selected Status</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${RESULT_TYPE_CONFIG[area.selected_result_type].color}`}>
                              {area.selected_result_type}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-600">Work Required</p>
                            <p className="font-medium text-gray-900 truncate">{area.work_description || '—'}</p>
                          </div>
                        </div>

                        {area.notes && (
                          <div className="mt-3 text-sm bg-gray-50 p-2 rounded">
                            <p className="text-gray-600">Notes</p>
                            <p className="text-gray-800">{area.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Area Form */}
                {!showAddAreaForm ? (
                  <button
                    onClick={() => setShowAddAreaForm(true)}
                    className="px-4 py-2 bg-[#0066CC] text-white rounded-lg font-medium hover:bg-[#0052a3] transition-colors"
                  >
                    + Add Assessment Area
                  </button>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-4">Add New Area</h3>

                    {/* Area Name Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Area *</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {AREA_OPTIONS.map((area) => (
                          <button
                            key={area}
                            onClick={() => setNewAreaName(area)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              newAreaName === area
                                ? 'bg-[#0066CC] text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Wordings Selection */}
                    {newAreaName && (
                      <div className="mb-4" ref={newAreaWordingsRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Insulation Found *</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={newAreaSearchTerm}
                            onChange={(e) => {
                              setNewAreaSearchTerm(e.target.value);
                              setShowNewAreaWordings(true);
                            }}
                            onFocus={() => setShowNewAreaWordings(true)}
                            placeholder="Search wordings..."
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                          />
                          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                        </div>

                        {showNewAreaWordings && newAreaName && (
                          <div className="absolute z-40 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {getFilteredWordings(newAreaName, newAreaSearchTerm).length > 0 ? (
                              getFilteredWordings(newAreaName, newAreaSearchTerm).map((wording) => (
                                <button
                                  key={wording.id}
                                  onClick={() => handleSelectWording(wording)}
                                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                  <p className="font-medium text-gray-900 text-sm">{wording.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${RESULT_TYPE_CONFIG[wording.result_type].color}`}>
                                      {wording.result_type}
                                    </span>
                                    {wording.recommended_action && (
                                      <p className="text-xs text-gray-600">{wording.recommended_action}</p>
                                    )}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No wordings found for {newAreaName}
                              </div>
                            )}
                          </div>
                        )}

                        {newAreaSelectedWording && (
                          <div className="mt-2 p-3 bg-white border border-blue-200 rounded">
                            <p className="text-xs text-gray-600">Selected</p>
                            <p className="font-medium text-gray-900 text-sm">{newAreaSelectedWording.description}</p>
                            <span className={`inline-block text-xs font-semibold px-2 py-1 rounded mt-1 ${RESULT_TYPE_CONFIG[newAreaSelectedWording.result_type].color}`}>
                              {newAreaSelectedWording.result_type}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Result Type Selection */}
                    {newAreaSelectedWording && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Result *</label>
                          <p className="text-xs text-gray-600 mb-2">
                            ℹ️ Suggested: <span className={`font-semibold ${RESULT_TYPE_CONFIG[newAreaSelectedWording.result_type].color} px-2 py-0.5 rounded`}>
                              {newAreaSelectedWording.result_type}
                            </span>
                            {' '}(You can override)
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(Object.keys(RESULT_TYPE_CONFIG) as ResultType[]).map((type) => (
                              <label key={type} className="flex items-center p-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-100 transition">
                                <input
                                  type="radio"
                                  name="resultType"
                                  value={type}
                                  checked={newAreaResultType === type}
                                  onChange={(e) => setNewAreaResultType(e.target.value as ResultType)}
                                  className="w-4 h-4"
                                />
                                <span className="ml-2 text-sm font-medium">{type}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Work Description */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Work Description</label>
                          <textarea
                            value={newAreaWorkDescription}
                            onChange={(e) => setNewAreaWorkDescription(e.target.value)}
                            rows={2}
                            placeholder="Describe the work required..."
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                          />
                        </div>

                        {/* Notes */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Area Notes</label>
                          <textarea
                            value={newAreaNotes}
                            onChange={(e) => setNewAreaNotes(e.target.value)}
                            rows={2}
                            placeholder="Any additional notes about this area..."
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                          />
                        </div>
                      </>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowAddAreaForm(false);
                          setNewAreaName('');
                          setNewAreaSelectedWording(null);
                          setNewAreaSearchTerm('');
                          setNewAreaWorkDescription('');
                          setNewAreaNotes('');
                          setNewAreaResultType('Pending');
                        }}
                        className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddArea}
                        className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] disabled:opacity-50"
                        disabled={!newAreaName || !newAreaSelectedWording}
                      >
                        Add Area
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="px-6 py-4 flex justify-between items-center bg-gray-50">
            {step > 1 ? (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && !clientId) {
                    setError('Please select a client');
                    return;
                  }
                  if (step === 2 && !selectedInstallerId) {
                    setError('Please select an installer');
                    return;
                  }
                  setError(null);
                  setStep((step + 1) as Step);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-[#0066CC] text-white font-medium rounded-lg hover:bg-[#0052a3]"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleScheduleAssessment}
                disabled={saving}
                className="px-8 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Scheduling...' : 'Schedule Assessment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}