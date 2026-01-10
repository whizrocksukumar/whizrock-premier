'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, Users, Check, AlertTriangle, X, ChevronDown } from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  site_id: string;
  total_inc_gst: number;
  status: string;
  clients?: { first_name: string; last_name: string; email: string; phone: string };
  sites?: { address_line_1: string; suburb: string; city: string };
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface QuoteLineItem {
  id: string;
  product_id: string;
  description: string;
  quantity: number;
  unit: string;
  sell_price: number;
  line_total: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const generateJobNumber = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `J-${num}`;
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function CreateJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quote_id');

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Quote data
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);

  // Job details
  const [jobNumber] = useState(generateJobNumber());
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [estimatedDuration, setEstimatedDuration] = useState('4');
  const [assignedInstallers, setAssignedInstallers] = useState<string[]>([]);
  const [priority, setPriority] = useState('Normal');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Reference data
  const [installers, setInstallers] = useState<TeamMember[]>([]);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);

  // ============================================
  // LOAD DATA
  // ============================================
  useEffect(() => {
    loadData();
  }, [quoteId]);

  const loadData = async () => {
    try {
      // Load installers
      const { data: installersData } = await supabase
        .from('team_members')
        .select('*')
        .eq('role', 'Installer')
        .eq('is_active', true)
        .order('first_name');
      if (installersData) setInstallers(installersData);

      // If quote_id provided, load that quote
      if (quoteId) {
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .select(`
            *,
            clients (first_name, last_name, email, phone),
            sites (address_line_1, suburb, city)
          `)
          .eq('id', quoteId)
          .single();

        if (quoteError) throw quoteError;
        if (quoteData) {
          setQuote(quoteData);
          
          // Load line items
          const { data: itemsData } = await supabase
            .from('quote_line_items')
            .select('*')
            .eq('quote_id', quoteId)
            .order('sort_order');
          if (itemsData) setLineItems(itemsData);
        }
      } else {
        // Load accepted quotes for selection
        const { data: quotesData } = await supabase
          .from('quotes')
          .select(`
            *,
            clients (first_name, last_name, email, phone),
            sites (address_line_1, suburb, city)
          `)
          .eq('status', 'Accepted')
          .order('created_at', { ascending: false });
        if (quotesData) setAllQuotes(quotesData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const selectQuote = async (selectedQuote: Quote) => {
    setQuote(selectedQuote);
    
    // Load line items for selected quote
    const { data: itemsData } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('quote_id', selectedQuote.id)
      .order('sort_order');
    if (itemsData) setLineItems(itemsData);
  };

  // ============================================
  // INSTALLER SELECTION
  // ============================================
  const toggleInstaller = (installerId: string) => {
    setAssignedInstallers(prev => 
      prev.includes(installerId)
        ? prev.filter(id => id !== installerId)
        : [...prev, installerId]
    );
  };

  // ============================================
  // FORM SUBMISSION
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!quote) {
      setError('Please select a quote');
      return;
    }
    if (!scheduledDate) {
      setError('Please select a scheduled date');
      return;
    }
    if (assignedInstallers.length === 0) {
      setError('Please assign at least one installer');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create job record
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          job_number: jobNumber,
          quote_id: quote.id,
          client_id: quote.client_id,
          site_id: quote.site_id,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          estimated_duration_hours: parseFloat(estimatedDuration),
          priority: priority,
          special_instructions: specialInstructions || null,
          internal_notes: internalNotes || null,
          status: 'Scheduled',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // 2. Create job_installers records
      if (job && assignedInstallers.length > 0) {
        const installerRecords = assignedInstallers.map((installerId, index) => ({
          job_id: job.id,
          installer_id: installerId,
          is_lead: index === 0, // First installer is lead
        }));

        const { error: installerError } = await supabase
          .from('job_installers')
          .insert(installerRecords);

        if (installerError) console.error('Error assigning installers:', installerError);
      }

      // 3. Copy quote line items to job line items
      if (job && lineItems.length > 0) {
        const jobLineItems = lineItems.map((item, index) => ({
          job_id: job.id,
          product_id: item.product_id,
          description: item.description,
          quoted_quantity: item.quantity,
          actual_quantity: item.quantity, // Start with quoted
          unit: item.unit,
          unit_price: item.sell_price,
          line_total: item.line_total,
          sort_order: index + 1,
        }));

        const { error: itemsError } = await supabase
          .from('job_line_items')
          .insert(jobLineItems);

        if (itemsError) console.error('Error copying line items:', itemsError);
      }

      // 4. Update quote status to "Converted to Job"
      await supabase
        .from('quotes')
        .update({ status: 'Converted to Job' })
        .eq('id', quote.id);

      setSuccess(true);
      setTimeout(() => router.push('/jobs'), 1500);

    } catch (err: any) {
      console.error('Error creating job:', err);
      setError(err.message || 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Job</h1>
          <p className="text-gray-600">Job #{jobNumber}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Job created successfully! Redirecting...</span>
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
          {/* SECTION 1: QUOTE SELECTION */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              1. Quote Selection
            </h2>

            {quote ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-blue-900">{quote.quote_number}</p>
                    <p className="text-sm text-blue-700">
                      {quote.clients?.first_name} {quote.clients?.last_name}
                    </p>
                    <p className="text-sm text-blue-600">
                      {quote.sites?.address_line_1}, {quote.sites?.suburb}
                    </p>
                    <p className="text-lg font-bold text-blue-900 mt-2">
                      ${quote.total_inc_gst?.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {!quoteId && (
                    <button
                      type="button"
                      onClick={() => setQuote(null)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Change
                    </button>
                  )}
                </div>

                {/* Line Items Summary */}
                {lineItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-2">Products ({lineItems.length})</p>
                    <div className="space-y-1">
                      {lineItems.slice(0, 5).map(item => (
                        <div key={item.id} className="flex justify-between text-sm text-blue-700">
                          <span>{item.description}</span>
                          <span>{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                      {lineItems.length > 5 && (
                        <p className="text-xs text-blue-600">+{lineItems.length - 5} more items</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">Select an accepted quote to convert to a job:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allQuotes.length > 0 ? (
                    allQuotes.map(q => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => selectQuote(q)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-[#0066CC] hover:bg-blue-50 transition"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{q.quote_number}</span>
                          <span className="text-green-600 font-medium">
                            ${q.total_inc_gst?.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {q.clients?.first_name} {q.clients?.last_name} - {q.sites?.address_line_1}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No accepted quotes available</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* SECTION 2: SCHEDULING */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              2. Scheduling
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Start Time
                </label>
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  <option value="07:00">7:00 AM</option>
                  <option value="07:30">7:30 AM</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="08:30">8:30 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="09:30">9:30 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration
                </label>
                <select
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4 hours (Half day)</option>
                  <option value="6">6 hours</option>
                  <option value="8">8 hours (Full day)</option>
                  <option value="12">12 hours (1.5 days)</option>
                  <option value="16">16 hours (2 days)</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SECTION 3: CREW ASSIGNMENT */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              <Users className="inline w-5 h-5 mr-2" />
              3. Crew Assignment <span className="text-red-500">*</span>
            </h2>

            <p className="text-sm text-gray-600 mb-3">
              Select installers for this job (first selected will be lead):
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {installers.map((installer, index) => (
                <label
                  key={installer.id}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${
                    assignedInstallers.includes(installer.id)
                      ? 'border-[#0066CC] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={assignedInstallers.includes(installer.id)}
                    onChange={() => toggleInstaller(installer.id)}
                    className="w-4 h-4 text-[#0066CC] border-gray-300 rounded focus:ring-[#0066CC]"
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {installer.first_name} {installer.last_name}
                    </p>
                    {assignedInstallers[0] === installer.id && (
                      <span className="text-xs text-[#0066CC]">Lead</span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {assignedInstallers.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">Please select at least one installer</p>
            )}
          </div>

          {/* ============================================ */}
          {/* SECTION 4: NOTES */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              4. Instructions & Notes
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions (visible to installers)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., Access via side gate, call client 30 mins before arrival..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes (office use only)
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Internal notes not visible to installers..."
                  rows={2}
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
              disabled={isSubmitting || !quote}
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
                  Create Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
