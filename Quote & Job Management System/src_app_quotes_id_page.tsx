
import {
  getNextQuoteVersion,
  supersedeCurrentFinalQuote,
  snapshotQuoteTerms
} from '@/lib/utils/quoteVersioning'

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { acceptQuote, formatDateDDMMYYYY } from '@/lib/utils/quote-acceptance-helpers';
import { ArrowLeft, Edit, CheckCircle, Clock, AlertCircle } from 'lucide-react';

// Types
interface Quote {
  id: string;
  quote_number: string;
  status: string;
  quote_date: string;
  valid_until: string;
  reference: string | null;

  // Client/Site info
  client_id: string | null;
  site_address: string;
  city: string;
  postcode: string;
  region_id: string | null;
  job_type: string;

  // Assigned to
  assigned_to_sales_rep_id: string | null;

  // Pricing settings
  pricing_tier: string;
  markup_percent: number;
  waste_percent: number;
  labour_rate: number;

  // Financial totals
  total_cost_ex_gst: number;
  total_sell_ex_gst: number;
  gst_amount: number;
  total_inc_gst: number;
  gross_profit: number;
  gross_profit_percent: number;

  // Legacy fields (for backward compatibility)
  total_amount: number;
  total_sell: number;
  subtotal: number;

  notes: string | null;
  created_at: string;
  updated_at: string;
  accepted_date: string | null;
}

interface Product {
  id: string;
  sku: string;
  product_description: string;
  category: string;
  r_value: string;
  bale_size_sqm: number;
  cost_price: number;
  pack_price: number;
}

interface QuoteItem {
  id: string;
  section_id: string;
  product_id: string | null;
  marker: string | null;
  description: string;
  area_sqm: number;
  is_labour: boolean;
  cost_price: number;
  sell_price: number;
  line_cost: number;
  line_sell: number;
  margin_percent: number;
  packs_required: number;
  sort_order: number;
  product?: Product;
}

interface QuoteSection {
  id: string;
  quote_id: string;
  app_type_id: string | null;
  custom_name: string;
  section_color: string;
  sort_order: number;
  app_type?: {
    id: string;
    name: string;
    code: string;
    color_hex: string;
  };
  quote_items: QuoteItem[];
}

interface ClientDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company?: {
    company_name: string;
  };
}

interface Region {
  id: string;
  name: string;
  code: string;
}

interface SalesRep {
  id: string;
  name: string;
  email: string;
}

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const quoteId = params.id;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [sections, setSections] = useState<QuoteSection[]>([]);
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState('');
  const [acceptError, setAcceptError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    getUser();
  }, []);

  // Fetch quote data
  useEffect(() => {
    if (!quoteId) return;
    fetchQuoteData();
  }, [quoteId]);

  const fetchQuoteData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch quote
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError || !quoteData) throw quoteError;
      setQuote(quoteData);

      // Fetch sections separately (without nested joins to avoid relationship issues)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('quote_sections')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order');

      if (sectionsError) throw sectionsError;

      // Fetch quote items separately
      const { data: quoteItemsData, error: itemsError } = await supabase
        .from('quote_line_items')
        .select('*')
        .in('section_id', (sectionsData || []).map(s => s.id))
        .order('sort_order');

      if (itemsError) throw itemsError;

      // Group items by section_id
      const itemsBySection: { [key: string]: any[] } = {};
      (quoteItemsData || []).forEach((item: any) => {
        if (!itemsBySection[item.section_id]) {
          itemsBySection[item.section_id] = [];
        }
        itemsBySection[item.section_id].push(item);
      });

      // Fetch app_types separately
      const appTypeIds = (sectionsData || [])
        .map((s: any) => s.app_type_id)
        .filter(Boolean);

      let appTypesMap: { [key: string]: any } = {};
      if (appTypeIds.length > 0) {
        const { data: appTypesData } = await supabase
          .from('app_types')
          .select('*')
          .in('id', appTypeIds);

        if (appTypesData) {
          appTypesMap = appTypesData.reduce((acc: any, at: any) => {
            acc[at.id] = at;
            return acc;
          }, {});
        }
      }

      // Fetch products separately for all items
      const productIds = (quoteItemsData || [])
        .map((item: any) => item.product_id)
        .filter(Boolean);

      let productsMap: { [key: string]: any } = {};
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (productsData) {
          productsMap = productsData.reduce((acc: any, p: any) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      // Transform the data to match our interface
      const transformedSections = (sectionsData || []).map((section: any) => ({
        id: section.id,
        quote_id: section.quote_id,
        app_type_id: section.app_type_id,
        custom_name: section.custom_name,
        section_color: section.section_color,
        sort_order: section.sort_order,
        app_type: section.app_type_id ? appTypesMap[section.app_type_id] : undefined,
        quote_items: (itemsBySection[section.id] || [])
          .map((item: any) => ({
            id: item.id,
            section_id: item.section_id,
            product_id: item.product_id,
            marker: item.marker,
            description: item.description,
            area_sqm: item.area_sqm,
            is_labour: item.is_labour,
            cost_price: item.cost_price,
            sell_price: item.sell_price,
            line_cost: item.line_cost,
            line_sell: item.line_sell,
            margin_percent: item.margin_percent,
            packs_required: item.packs_required,
            sort_order: item.sort_order,
            product: item.product_id ? productsMap[item.product_id] : undefined
          }))
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
      }));

      setSections(transformedSections);

      // Fetch client details
      if (quoteData.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, phone, company_id')
          .eq('id', quoteData.client_id)
          .single();

        if (clientData) {
          let companyData = null;
          if (clientData.company_id) {
            const { data: company } = await supabase
              .from('companies')
              .select('company_name')
              .eq('id', clientData.company_id)
              .single();
            companyData = company;
          }

          setClient({
            id: clientData.id,
            first_name: clientData.first_name,
            last_name: clientData.last_name,
            email: clientData.email,
            phone: clientData.phone,
            company: companyData
          });
        }
      }

      // Fetch region
      if (quoteData.region_id) {
        const { data: regionData } = await supabase
          .from('regions')
          .select('*')
          .eq('id', quoteData.region_id)
          .single();
        setRegion(regionData);
      }

      // Fetch sales rep from team_members
      if (quoteData.assigned_to_sales_rep_id) {
        const { data: repData } = await supabase
          .from('team_members')
          .select('id, first_name, last_name, email')
          .eq('id', quoteData.assigned_to_sales_rep_id)
          .single();

        if (repData) {
          setSalesRep({
            id: repData.id,
            name: `${repData.first_name} ${repData.last_name}`,
            email: repData.email
          });
        }
      }

    } catch (err: any) {
      console.error('Error fetching quote:', err);
      setError(err.message || 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!quote || !currentUserId) return;

    setAcceptLoading(true);
    setAcceptSuccess('');
    setAcceptError('');

    try {
      const result = await acceptQuote(quote.id, currentUserId);

      if (result.success) {
        setAcceptSuccess(result.message);
        // Refresh quote data to show updated status
        setTimeout(() => {
          fetchQuoteData();
        }, 1000);
      } else {
        setAcceptError(result.message);
      }
    } catch (err: any) {
      setAcceptError('An unexpected error occurred');
      console.error('Error:', err);
    } finally {
      setAcceptLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Accepted':
      case 'Won':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
      case 'Won':
        return <CheckCircle className="w-4 h-4" />;
      case 'Rejected':
      case 'Lost':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const canAccept = quote && (quote.status === 'Draft' || quote.status === 'Sent');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto mb-4"></div>
          <p className="text-gray-700">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Link href="/quotes" className="text-sm text-[#0066CC] hover:text-[#0052a3] flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Quotes
          </Link>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Quote not found'}
          </div>
        </div>
      </div>
    );
  }

  const customerName = client
    ? `${client.first_name} ${client.last_name}`.trim()
    : '—';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* THREE-TIER HEADER */}

      {/* TIER 1: PAGE HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0066CC]">Quote Details</h1>
            <p className="text-sm text-gray-500 mt-1">{quote.quote_number}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Quote Date</p>
              <p className="text-sm font-medium">{formatDateDDMMYYYY(new Date(quote.quote_date))}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                {getStatusIcon(quote.status)}
                {quote.status}
              </span>
            </div>
            {/* User Section */}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
              <div className="w-10 h-10 rounded-full bg-[#0066CC] flex items-center justify-center text-white font-medium">
                U
              </div>
              <div className="flex flex-col">
                <p className="text-xs text-gray-500">user@premier.local</p>
              </div>
              <button className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TIER 2: TOOLBAR */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/quotes" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Quotes
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/quotes/${quote.id}/edit`)}
              className="px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-900 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Quote
            </button>
            {canAccept && (
              <button
                onClick={handleAcceptQuote}
                disabled={acceptLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium flex items-center gap-2"
              >
                {acceptLoading ? 'Accepting...' : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Accept Quote
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {(acceptSuccess || acceptError) && (
        <div className="px-6 pt-4">
          {acceptSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{acceptSuccess}</p>
            </div>
          )}
          {acceptError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{acceptError}</p>
            </div>
          )}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Quote Header Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Quote Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Number</label>
                <p className="text-sm text-gray-900">{quote.quote_number || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Date</label>
                <p className="text-sm text-gray-900">{formatDateDDMMYYYY(new Date(quote.quote_date))}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <p className="text-sm text-gray-900">
                  {quote.valid_until ? formatDateDDMMYYYY(new Date(quote.valid_until)) : '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <p className="text-sm text-gray-900">{quote.reference || '—'}</p>
              </div>
            </div>

            {/* Pricing Tier Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <div>
                  <span className="text-gray-700 font-medium">Pricing Tier: </span>
                  <span className="px-3 py-1 bg-[#0066CC] text-white rounded font-medium">{quote.pricing_tier}</span>
                </div>
                {quote.pricing_tier === 'Custom' && (
                  <div>
                    <span className="text-gray-700 font-medium">Markup: </span>
                    <span className="text-gray-900">{quote.markup_percent}%</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-700 font-medium">Labour Rate: </span>
                  <span className="text-gray-900">${quote.labour_rate}/m²</span>
                </div>
                <div>
                  <span className="text-gray-700 font-medium">Waste: </span>
                  <span className="text-gray-900">{quote.waste_percent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Information Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Client Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <p className="text-sm text-gray-900">{customerName}</p>
                {client?.company?.company_name && (
                  <p className="text-xs text-gray-500 mt-1">{client.company.company_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <p className="text-sm text-gray-900">{client?.email || '—'}</p>
                <p className="text-sm text-gray-500">{client?.phone || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Address</label>
                <p className="text-sm text-gray-900">{quote.site_address || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <p className="text-sm text-gray-900">{quote.city || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                <p className="text-sm text-gray-900">{quote.postcode || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <p className="text-sm text-gray-900">{region?.name || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <p className="text-sm text-gray-900">{quote.job_type || '—'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Rep</label>
                <p className="text-sm text-gray-900">{salesRep?.name || '—'}</p>
              </div>
            </div>

            {quote.notes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">{quote.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Products & Services */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Products & Services</h2>
          </div>
          <div className="p-6">
            {sections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sections or items added to this quote
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.id} className="mb-6 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: section.section_color || '#ffffff' }}
                    />
                    <h3 className="text-base font-semibold text-gray-900">
                      {section.app_type?.name || section.custom_name || 'Unnamed Section'}
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 text-gray-700 font-semibold w-24">Marker</th>
                          <th className="text-left py-2 px-2 text-gray-700 font-semibold">Product</th>
                          <th className="text-left py-2 px-2 text-gray-700 font-semibold">Area m²</th>
                          <th className="text-center py-2 px-2 text-gray-700 font-semibold">Packs</th>
                          <th className="text-right py-2 px-2 text-gray-700 font-semibold">Cost ex</th>
                          <th className="text-right py-2 px-2 text-gray-700 font-semibold">Sell ex</th>
                          <th className="text-right py-2 px-2 text-gray-700 font-semibold">GP%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.quote_items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-gray-900">{item.marker || '—'}</td>
                            <td className="py-2 px-2">
                              {item.is_labour ? (
                                <span className="text-gray-700 italic">{item.description}</span>
                              ) : (
                                <div>
                                  <div className="text-gray-900">{item.description}</div>
                                  {item.product && (
                                    <div className="text-xs text-gray-500">{item.product.sku} - {item.product.r_value}</div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-gray-900">{item.area_sqm.toFixed(2)}</td>
                            <td className="py-2 px-2 text-center">
                              {item.packs_required > 0 ? (
                                <span className="font-semibold text-green-600">{item.packs_required}</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-gray-900">
                              ${item.line_cost.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-gray-900">
                              ${item.line_sell.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <span className={item.margin_percent >= 30 ? 'text-green-600' : 'text-orange-600'}>
                                {item.margin_percent.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Totals */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-end gap-8 text-lg">
            <div className="text-right">
              <p className="text-gray-600 mb-2">Total Cost ex GST</p>
              <p className="font-bold text-gray-900">${(quote.total_cost_ex_gst || 0).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 mb-2">Total Sell ex GST</p>
              <p className="font-bold text-gray-900">${(quote.total_sell_ex_gst || 0).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 mb-2">GST (15%)</p>
              <p className="font-bold text-gray-900">${(quote.gst_amount || 0).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 mb-2">Total Inc GST</p>
              <p className="font-bold text-[#0066CC] text-2xl">${(quote.total_inc_gst || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex justify-end gap-8 mt-4 pt-4 border-t border-gray-100">
            <div className="text-right">
              <p className="text-sm text-gray-500">Gross Profit</p>
              <p className="font-medium text-green-600">${(quote.gross_profit || 0).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">GP Margin</p>
              <p className="font-medium text-green-600">{(quote.gross_profit_percent || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}