'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Users, Check, AlertTriangle, X, Package, FileText, ClipboardList } from 'lucide-react';
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
}

interface Site {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2?: string;
  suburb?: string;
  city: string;
  postcode?: string;
}

interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  site_id: string;
  total_inc_gst: number;
  status: string;
  notes?: string;
  special_requirements?: string;
}

interface Assessment {
  id: string;
  reference_number: string;
  client_id: string;
  site_id: string;
  status: string;
  scheduled_date: string;
  property_type?: string;
  estimated_size_sqm?: number;
  notes?: string;
  site_access_difficulty?: string;
  hazards_present?: string;
}

interface AssessmentArea {
  id: string;
  assessment_id: string;
  area_name: string;
  square_metres: number;
  existing_insulation_type?: string;
  result_type?: string;
  notes?: string;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
}

interface QuoteLineItem {
  id: string;
  product_id: string;
  description: string;
  quantity: number;
  unit: string;
  sell_price: number;
  line_total: number;
  is_labour?: boolean;
  notes?: string;
  products?: {
    sku: string;
    product_description: string;
    category?: string;
    quantity_available?: number;
    stock_status?: string;
  };
}

interface QuoteSection {
  id: string;
  section_name: string;
  notes?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const generateJobNumber = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `J-${num}`;
};

const getStockStatusBadge = (status?: string, quantity?: number) => {
  if (!status) return null;

  switch (status) {
    case 'OUT_OF_STOCK':
      return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">OUT OF STOCK</span>;
    case 'LOW_STOCK':
      return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">LOW ({quantity} left)</span>;
    case 'IN_STOCK':
      return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">IN STOCK ({quantity})</span>;
    default:
      return null;
  }
};

const getResultTypeBadge = (resultType?: string) => {
  if (!resultType) return null;

  switch (resultType) {
    case 'PASS':
      return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">PASS</span>;
    case 'FAIL':
      return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">FAIL</span>;
    case 'EXEMPT':
      return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">EXEMPT</span>;
    default:
      return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">{resultType}</span>;
  }
};

// ============================================
// MAIN COMPONENT
// ============================================
// Skip static generation for this page
export const dynamic = 'force-dynamic'

function CreateJobPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteIdParam = searchParams.get('quote_id');

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Client & Site
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // Quote & Assessment references
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);
  const [quoteSections, setQuoteSections] = useState<QuoteSection[]>([]);
  const [assessmentAreas, setAssessmentAreas] = useState<AssessmentArea[]>([]);
  const [availableQuotes, setAvailableQuotes] = useState<Quote[]>([]);
  const [availableAssessments, setAvailableAssessments] = useState<Assessment[]>([]);

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

  // ============================================
  // LOAD DATA
  // ============================================
  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (selectedClient && selectedSite) {
      loadClientQuotesAndAssessments();
    }
  }, [selectedClient, selectedSite]);

  useEffect(() => {
    if (quoteIdParam) {
      loadQuoteById(quoteIdParam);
    }
  }, [quoteIdParam]);

  const loadReferenceData = async () => {
    try {
      // Load installers
      const { data: installersData } = await supabase
        .from('team_members')
        .select('*')
        .eq('role', 'Installer')
        .eq('status', 'active')
        .order('first_name');
      if (installersData) setInstallers(installersData);

    } catch (err) {
      console.error('Error loading reference data:', err);
      setError('Failed to load reference data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuoteById = async (quoteId: string) => {
    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (id, first_name, last_name, email, phone),
          sites (id, name, address_line_1, address_line_2, suburb, city, postcode)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;
      if (quoteData) {
        setSelectedQuote(quoteData);
        if (quoteData.clients) {
          setSelectedClient(quoteData.clients as unknown as Client);
        }
        if (quoteData.sites) {
          setSelectedSite(quoteData.sites as unknown as Site);
        }
        await loadQuoteDetails(quoteId);
      }
    } catch (err) {
      console.error('Error loading quote:', err);
    }
  };

  const loadClientQuotesAndAssessments = async () => {
    if (!selectedClient || !selectedSite) return;

    try {
      // Load accepted quotes for this client/site
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*')
        .eq('client_id', selectedClient.id)
        .eq('site_id', selectedSite.id)
        .eq('status', 'Accepted')
        .order('created_at', { ascending: false });
      if (quotesData) setAvailableQuotes(quotesData);

      // Load completed assessments for this client/site
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('*')
        .eq('client_id', selectedClient.id)
        .eq('site_id', selectedSite.id)
        .in('status', ['Completed', 'Scheduled'])
        .order('created_at', { ascending: false });
      if (assessmentsData) setAvailableAssessments(assessmentsData);

    } catch (err) {
      console.error('Error loading quotes/assessments:', err);
    }
  };

  const loadQuoteDetails = async (quoteId: string) => {
    try {
      // Load quote sections
      const { data: sectionsData } = await supabase
        .from('quote_sections')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order');
      if (sectionsData) setQuoteSections(sectionsData);

      // Load line items with product details and stock info
      const { data: itemsData } = await supabase
        .from('quote_line_items')
        .select(`
          *,
          products (
            sku,
            product_description,
            category
          )
        `)
        .eq('quote_id', quoteId)
        .order('sort_order');

      if (itemsData) {
        // Filter out labor items - only show materials/products for installers
        const materialItems = itemsData.filter(item => !item.is_labour && item.product_id);

        // Get stock levels
        const { data: stockData } = await supabase
          .from('stock_levels')
          .select('product_id, quantity_available, reorder_level');

        const stockMap = new Map(
          (stockData || []).map(s => [s.product_id, s])
        );

        // Enhance items with stock info
        const enhancedItems = materialItems.map(item => {
          const stock = item.product_id ? stockMap.get(item.product_id) : null;
          let stockStatus = 'IN_STOCK';
          if (stock) {
            if (stock.quantity_available <= 0) stockStatus = 'OUT_OF_STOCK';
            else if (stock.quantity_available < stock.reorder_level) stockStatus = 'LOW_STOCK';
          }

          return {
            ...item,
            products: item.products ? {
              ...item.products,
              quantity_available: stock?.quantity_available,
              stock_status: stockStatus
            } : undefined
          };
        });

        setLineItems(enhancedItems);
      }
    } catch (err) {
      console.error('Error loading quote details:', err);
    }
  };

  const loadAssessmentAreas = async (assessmentId: string) => {
    try {
      const { data: areasData } = await supabase
        .from('assessment_areas')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('sort_order');

      if (areasData) {
        setAssessmentAreas(areasData);
      }
    } catch (err) {
      console.error('Error loading assessment areas:', err);
    }
  };

  const handleClientSiteSelection = (client: Client | null, site: Site | null) => {
    setSelectedClient(client);
    setSelectedSite(site);
    // Reset quote and assessment when client/site changes
    if (!quoteIdParam) {
      setSelectedQuote(null);
      setLineItems([]);
      setQuoteSections([]);
    }
    setSelectedAssessment(null);
    setAssessmentAreas([]);
  };

  const handleQuoteSelection = async (quote: Quote) => {
    setSelectedQuote(quote);
    await loadQuoteDetails(quote.id);
  };

  const handleAssessmentSelection = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    await loadAssessmentAreas(assessment.id);
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
    if (!selectedClient || !selectedSite) {
      setError('Please select a client and site');
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
      // Combine scheduled date and time into notes if time is not default
      let jobNotes = internalNotes || '';
      if (scheduledTime !== '09:00') {
        jobNotes = `Scheduled Time: ${scheduledTime}\n${jobNotes}`.trim();
      }
      if (estimatedDuration !== '4') {
        jobNotes = `Estimated Duration: ${estimatedDuration} hours\n${jobNotes}`.trim();
      }
      if (priority !== 'Normal') {
        jobNotes = `Priority: ${priority}\n${jobNotes}`.trim();
      }

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          job_number: jobNumber,
          quote_id: selectedQuote?.id || null,
          assessment_id: selectedAssessment?.id || null,
          client_id: selectedClient.id,
          site_id: selectedSite.id,
          scheduled_date: scheduledDate,
          crew_lead_id: assignedInstallers.length > 0 ? assignedInstallers[0] : null,
          crew_members: assignedInstallers.length > 0 ? assignedInstallers : null,
          special_instructions: specialInstructions || null,
          internal_notes: jobNotes || null,
          notes: null,
          status: 'Scheduled',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // 3. Copy quote line items to job line items if quote is selected
      if (job && selectedQuote && lineItems.length > 0) {
        const jobLineItems = lineItems.map((item, index) => ({
          job_id: job.id,
          product_id: item.product_id,
          product_code: item.products?.sku || null,
          description: item.description,
          quantity_quoted: item.quantity,
          quantity_actual: item.quantity,
          unit: item.unit,
          unit_cost: item.sell_price,
          line_cost: item.line_total,
          sort_order: index + 1,
          notes: item.notes || null,
        }));

        const { error: itemsError } = await supabase
          .from('job_line_items')
          .insert(jobLineItems);

        if (itemsError) console.error('Error copying line items:', itemsError);
      }

      // 4. Update quote status to "Converted to Job" if quote is selected
      if (selectedQuote) {
        await supabase
          .from('quotes')
          .update({ status: 'Converted to Job' })
          .eq('id', selectedQuote.id);
      }

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
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Schedule a New Job</h1>
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
          {/* SECTION 1: CLIENT & SITE SELECTION */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              1. Client & Site Selection
            </h2>
            <ClientSelectorWithSites
              onClientAndSiteSelected={handleClientSiteSelection}
            />
          </div>

          {/* ============================================ */}
          {/* SECTION 2: REFERENCE SELECTION (Quote/Assessment) */}
          {/* ============================================ */}
          {selectedClient && selectedSite && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
                2. Reference Selection
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quote Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline w-4 h-4 mr-1" />
                    Quote Reference
                  </label>
                  {availableQuotes.length > 0 ? (
                    <select
                      value={selectedQuote?.id || ''}
                      onChange={(e) => {
                        const quote = availableQuotes.find(q => q.id === e.target.value);
                        if (quote) {
                          handleQuoteSelection(quote);
                        } else {
                          setSelectedQuote(null);
                          setLineItems([]);
                          setQuoteSections([]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                    >
                      <option value="">No quote reference</option>
                      {availableQuotes.map(quote => (
                        <option key={quote.id} value={quote.id}>
                          {quote.quote_number} - ${quote.total_inc_gst?.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">No accepted quotes found for this client/site</p>
                  )}
                </div>

                {/* Assessment Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ClipboardList className="inline w-4 h-4 mr-1" />
                    Assessment Reference
                  </label>
                  {availableAssessments.length > 0 ? (
                    <select
                      value={selectedAssessment?.id || ''}
                      onChange={(e) => {
                        const assessment = availableAssessments.find(a => a.id === e.target.value);
                        if (assessment) {
                          handleAssessmentSelection(assessment);
                        } else {
                          setSelectedAssessment(null);
                          setAssessmentAreas([]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                    >
                      <option value="">No assessment reference</option>
                      {availableAssessments.map(assessment => (
                        <option key={assessment.id} value={assessment.id}>
                          {assessment.reference_number} - {assessment.status} ({new Date(assessment.scheduled_date).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">No assessments found for this client/site</p>
                  )}
                </div>
              </div>

              {/* Quote Reference & Materials Display */}
              {selectedQuote && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-700" />
                      <div>
                        <h3 className="font-semibold text-blue-900">Quote Reference: {selectedQuote.quote_number}</h3>
                        {selectedQuote.notes && (
                          <p className="text-sm text-blue-700 mt-1">{selectedQuote.notes}</p>
                        )}
                      </div>
                    </div>
                    {selectedQuote.special_requirements && (
                      <div className="mt-3 p-2 bg-blue-100 border border-blue-300 rounded">
                        <p className="text-xs font-medium text-blue-800">⚠️ Special Requirements:</p>
                        <p className="text-sm text-blue-800">{selectedQuote.special_requirements}</p>
                      </div>
                    )}
                  </div>

                  {/* Materials List - NO PRICING */}
                  {lineItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Materials & Products Required for Installation
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stock Status</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {lineItems.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-3 py-3 text-sm text-gray-900 font-medium">
                                  {item.products?.sku || '-'}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-900">
                                  {item.description}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-600">
                                  {item.products?.category || '-'}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-900 text-right font-medium">
                                  {item.quantity}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-500">
                                  {item.unit}
                                </td>
                                <td className="px-3 py-3 text-sm text-right">
                                  {getStockStatusBadge(
                                    item.products?.stock_status,
                                    item.products?.quantity_available
                                  )}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-600">
                                  {item.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assessment Report Display */}
              {selectedAssessment && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-amber-900">Assessment Report: {selectedAssessment.reference_number}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                      <div>
                        <p className="text-xs text-amber-700">Status</p>
                        <p className="font-medium text-amber-900">{selectedAssessment.status}</p>
                      </div>
                      {selectedAssessment.property_type && (
                        <div>
                          <p className="text-xs text-amber-700">Property Type</p>
                          <p className="font-medium text-amber-900">{selectedAssessment.property_type}</p>
                        </div>
                      )}
                      {selectedAssessment.estimated_size_sqm && (
                        <div>
                          <p className="text-xs text-amber-700">Estimated Size</p>
                          <p className="font-medium text-amber-900">{selectedAssessment.estimated_size_sqm} m²</p>
                        </div>
                      )}
                      {selectedAssessment.site_access_difficulty && (
                        <div>
                          <p className="text-xs text-amber-700">Access Difficulty</p>
                          <p className="font-medium text-amber-900">{selectedAssessment.site_access_difficulty}</p>
                        </div>
                      )}
                    </div>
                    {selectedAssessment.hazards_present && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-medium text-red-800">⚠️ Hazards Present:</p>
                        <p className="text-sm text-red-700">{selectedAssessment.hazards_present}</p>
                      </div>
                    )}
                    {selectedAssessment.notes && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-amber-800">Assessment Notes:</p>
                        <p className="text-sm text-amber-700">{selectedAssessment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Assessment Areas */}
                  {assessmentAreas.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Assessment Areas
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Size (m²)</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Existing Insulation</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {assessmentAreas.map((area) => (
                              <tr key={area.id} className="hover:bg-gray-50">
                                <td className="px-3 py-3 text-sm font-medium text-gray-900">
                                  {area.area_name}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-900 text-right">
                                  {area.square_metres}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-600">
                                  {area.existing_insulation_type || '-'}
                                </td>
                                <td className="px-3 py-3 text-sm">
                                  {getResultTypeBadge(area.result_type)}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-600">
                                  {area.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* SECTION 3: SCHEDULING */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              3. Scheduling
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          {/* SECTION 4: CREW ASSIGNMENT */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              <Users className="inline w-5 h-5 mr-2" />
              4. Crew Assignment <span className="text-red-500">*</span>
            </h2>

            <p className="text-sm text-gray-600 mb-3">
              Select installers for this job (first selected will be lead):
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {installers.map((installer) => (
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
          {/* SECTION 5: NOTES */}
          {/* ============================================ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-[#0066CC]">
              5. Instructions & Notes
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
              disabled={isSubmitting || !selectedClient || !selectedSite}
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

// Wrapper component with Suspense
export default function CreateJobPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CreateJobPageContent />
    </Suspense>
  );
}
