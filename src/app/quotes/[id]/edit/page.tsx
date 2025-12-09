'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, X, ArrowLeft } from 'lucide-react';

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

interface Product {
  id: string;
  sku: string;
  product_description: string;
  category: string;
  r_value: string;
  application_type: string;
  bale_size_sqm: number;
  cost_price: number;
  retail_price: number;
  pack_price: number;
  waste_percentage: number;
  is_active?: boolean;
  is_labour?: boolean;
}

interface ApplicationType {
  id: string;
  name: string;
  code: string;
  description: string;
  color_hex: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
}

interface Region {
  id: string;
  name: string;
  code: string;
}

interface LineItem {
  id: string;
  marker?: string;
  product_id: string | null;
  product?: Product;
  area_sqm: number;
  is_labour: boolean;
  cost_price: number;
  sell_price: number;
  line_cost: number;
  line_sell: number;
  margin_percent: number;
  packs_required?: number;
}

interface Section {
  id: string;
  app_type_id: string | null;
  app_type?: ApplicationType;
  custom_name: string;
  section_color?: string;
  line_items: LineItem[];
}

interface QuoteData {
  id: string;
  quote_number: string;
  client_id: string;
  site_address: string;
  city: string;
  postcode: string;
  region_id: string;
  job_type: string;
  status: string;
  quote_date: string;
  valid_until: string;
  notes: string;
  pricing_tier: string;
  waste_percent: number;
  labour_rate_per_sqm: number;
}

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  // Quote header fields
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [siteAddress, setSiteAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [regionId, setRegionId] = useState('');
  const [jobType, setJobType] = useState('');
  const [quoteStatus, setQuoteStatus] = useState('Draft');
  const [quoteDate, setQuoteDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');

  // Pricing settings
  const [pricingTier, setPricingTier] = useState('Retail');
  const [markupPercent, setMarkupPercent] = useState(60);
  const [wastePercent, setWastePercent] = useState(10);
  const [labourRate, setLabourRate] = useState(3.00);

  // Line items
  const [sections, setSections] = useState<Section[]>([]);
  const [nextSectionId, setNextSectionId] = useState(1);
  const [nextLineItemId, setNextLineItemId] = useState(1);

  // Lookups
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appTypes, setAppTypes] = useState<ApplicationType[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState<{ [key: string]: string }>({});
  const [showProductSuggestions, setShowProductSuggestions] = useState<{ [key: string]: boolean }>({});

  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLookupData();
    fetchQuoteData();
  }, [quoteId]);

  const loadLookupData = async () => {
    try {
      const [clientsRes, productsRes, appTypesRes, regionsRes] = await Promise.all([
        supabase.from('clients').select('id, first_name, last_name, email, phone, company_id, companies(company_name, site_address)'),
        supabase.from('products').select('*'),
        supabase.from('app_types').select('*').order('sort_order'),
        supabase.from('regions').select('*').order('name'),
      ]);

      if (clientsRes.data) setClients(clientsRes.data as any);
      if (productsRes.data) {
        const activeProducts = productsRes.data.filter((p: any) => p.is_active !== false && p.is_labour !== true);
        setProducts(activeProducts as Product[]);
      }
      if (appTypesRes.data) {
        const activeAppTypes = appTypesRes.data.filter((at: any) => at.is_active !== false);
        setAppTypes(activeAppTypes as ApplicationType[]);
      }
      if (regionsRes.data) setRegions(regionsRes.data as Region[]);
    } catch (error) {
      console.error('Error loading lookup data:', error);
    }
  };

  const fetchQuoteData = async () => {
    try {
      setLoading(true);

      // Fetch quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;
      if (!quote) {
        setError('Quote not found');
        setLoading(false);
        return;
      }

      setQuoteData(quote);
      setClientId(quote.client_id || '');
      setSiteAddress(quote.site_address || '');
      setCity(quote.city || '');
      setPostcode(quote.postcode || '');
      setRegionId(quote.region_id || '');
      setJobType(quote.job_type || '');
      setQuoteStatus(quote.status || 'Draft');
      setQuoteDate(quote.quote_date || '');
      setValidUntil(quote.valid_until || '');
      setNotes(quote.notes || '');
      setPricingTier(quote.pricing_tier || 'Retail');
      setWastePercent(quote.waste_percent || 10);
      setLabourRate(quote.labour_rate_per_sqm || 3.00);

      // Fetch and set client search text
      const allClients = (await supabase.from('clients').select('*')).data || [];
      if (quote.client_id) {
        const client = allClients.find((c: any) => c.id === quote.client_id);
        if (client) {
          setClientSearch(`${client.first_name} ${client.last_name}`);
        }
      }

      // Fetch sections with line items
      const { data: sectionsData } = await supabase
        .from('quote_sections')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order');

      if (sectionsData && sectionsData.length > 0) {
        const sectionsWithItems: Section[] = [];

        for (const sectionData of sectionsData) {
          const { data: itemsData } = await supabase
            .from('quote_items')
            .select('*')
            .eq('section_id', sectionData.id)
            .order('id');

          const lineItems = (itemsData || []).map((item: any) => ({
            id: item.id,
            marker: item.marker,
            product_id: item.product_id,
            area_sqm: item.area_sqm,
            is_labour: item.is_labour,
            cost_price: item.cost_price,
            sell_price: item.sell_price,
            line_cost: item.line_cost,
            line_sell: item.line_sell,
            margin_percent: item.margin_percent,
            packs_required: item.packs_required,
          }));

          sectionsWithItems.push({
            id: sectionData.id,
            app_type_id: sectionData.app_type_id,
            custom_name: sectionData.custom_name || '',
            section_color: sectionData.section_color,
            line_items: lineItems,
          });
        }

        setSections(sectionsWithItems);
        setNextSectionId(sectionsWithItems.length + 1);
      } else {
        addInitialSection();
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quote');
      setLoading(false);
    }
  };

  const addInitialSection = () => {
    setSections([{
      id: '1',
      app_type_id: null,
      custom_name: '',
      section_color: '#ffffff',
      line_items: []
    }]);
    setNextSectionId(2);
  };

  const filterClients = (searchTerm: string) => {
    if (!searchTerm) return clients;
    const term = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.first_name?.toLowerCase().includes(term) ||
      c.last_name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  };

  const selectClient = (client: Client) => {
    setClientId(client.id);
    setClientSearch(`${client.first_name} ${client.last_name}`);
    setShowClientSuggestions(false);
    if (client.companies?.site_address) {
      setSiteAddress(client.companies.site_address);
    }
  };

  const addSection = () => {
    setSections([...sections, {
      id: `${nextSectionId}`,
      app_type_id: null,
      custom_name: '',
      section_color: '#ffffff',
      line_items: []
    }]);
    setNextSectionId(nextSectionId + 1);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const updateSection = (sectionId: string, field: string, value: any) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const updated = { ...s, [field]: value };
        if (field === 'app_type_id' && value) {
          const appType = appTypes.find(at => at.id === value);
          updated.app_type = appType;
          if (appType?.color_hex) {
            updated.section_color = appType.color_hex;
          }
        }
        return updated;
      }
      return s;
    }));
  };

  const addLineItem = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          line_items: [...s.line_items, {
            id: `new-${nextLineItemId}`,
            marker: '',
            product_id: null,
            area_sqm: 0,
            is_labour: false,
            cost_price: 0,
            sell_price: 0,
            line_cost: 0,
            line_sell: 0,
            margin_percent: 0,
          }]
        };
      }
      return s;
    }));
    setNextLineItemId(nextLineItemId + 1);
  };

  const removeLineItem = (sectionId: string, lineItemId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          line_items: s.line_items.filter(li => li.id !== lineItemId)
        };
      }
      return s;
    }));
  };

  const updateLineItem = (sectionId: string, lineItemId: string, field: string, value: any) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          line_items: section.line_items.map(item => {
            if (item.id === lineItemId) {
              const updated = { ...item, [field]: value };

              if (field === 'product_id' && value) {
                const product = products.find(p => p.id === value);
                if (product) {
                  updated.product = product;
                  updated.cost_price = product.cost_price;
                  const markup = getMarkupPercent();
                  updated.sell_price = product.cost_price * (1 + markup / 100);

                  if (updated.area_sqm > 0) {
                    const calculations = calculateLineItem(updated, product);
                    Object.assign(updated, calculations);
                  }
                }
              }

              if (field === 'area_sqm' && updated.product) {
                const calculations = calculateLineItem(updated, updated.product);
                Object.assign(updated, calculations);
              }

              return updated;
            }
            return item;
          })
        };
      }
      return section;
    }));
  };

  const calculateLineItem = (lineItem: LineItem, product: Product) => {
    const area = parseFloat(String(lineItem.area_sqm)) || 0;
    const waste = wastePercent / 100;
    const areaWithWaste = area * (1 + waste);
    const baleSize = product.bale_size_sqm || 1;
    const packsRequired = Math.ceil(areaWithWaste / baleSize);

    const lineCost = packsRequired * product.pack_price;
    const markup = getMarkupPercent();
    const lineSell = lineCost * (1 + markup / 100);
    const margin = lineSell > 0 ? ((lineSell - lineCost) / lineSell) * 100 : 0;

    return {
      packs_required: packsRequired,
      line_cost: parseFloat(lineCost.toFixed(2)),
      line_sell: parseFloat(lineSell.toFixed(2)),
      margin_percent: parseFloat(margin.toFixed(1)),
    };
  };

  const getMarkupPercent = () => {
    if (pricingTier === 'Custom') return markupPercent;
    const defaults: { [key: string]: number } = {
      'Retail': 60,
      'Trade': 40,
      'VIP': 25,
    };
    return defaults[pricingTier] || 60;
  };

  const filterProducts = (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(p =>
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.product_description && p.product_description.toLowerCase().includes(term)) ||
      (p.r_value && p.r_value.toLowerCase().includes(term))
    ).slice(0, 10);
  };

  const selectProduct = (sectionId: string, lineItemId: string, product: Product) => {
    updateLineItem(sectionId, lineItemId, 'product_id', product.id);
    setProductSearch({ ...productSearch, [`${sectionId}-${lineItemId}`]: '' });
    setShowProductSuggestions({ ...showProductSuggestions, [`${sectionId}-${lineItemId}`]: false });
  };

  const calculateTotals = () => {
    let totalCostExGST = 0;
    let totalSellExGST = 0;

    sections.forEach(section => {
      section.line_items.forEach(item => {
        totalCostExGST += item.line_cost;
        totalSellExGST += item.line_sell;
      });
    });

    const grossProfit = totalSellExGST - totalCostExGST;
    const grossProfitPercent = totalSellExGST > 0 ? (grossProfit / totalSellExGST) * 100 : 0;
    const gstAmount = totalSellExGST * 0.15;
    const totalIncGST = totalSellExGST + gstAmount;

    return {
      totalCostExGST: totalCostExGST.toFixed(2),
      totalSellExGST: totalSellExGST.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      grossProfitPercent: grossProfitPercent.toFixed(1),
      gstAmount: gstAmount.toFixed(2),
      totalIncGST: totalIncGST.toFixed(2),
    };
  };

  const totals = calculateTotals();

  const handleSaveChanges = async () => {
    try {
      setSaving(true);

      if (!clientId) {
        alert('Please select a client');
        setSaving(false);
        return;
      }

      // Update quote
      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          client_id: clientId,
          site_address: siteAddress,
          city: city || null,
          postcode: postcode || null,
          region_id: regionId || null,
          job_type: jobType,
          status: quoteStatus,
          quote_date: quoteDate || null,
          valid_until: validUntil || null,
          notes: notes || null,
          pricing_tier: pricingTier,
          waste_percent: wastePercent,
          labour_rate_per_sqm: labourRate,
          total_cost_ex_gst: parseFloat(totals.totalCostExGST),
          total_sell_ex_gst: parseFloat(totals.totalSellExGST),
          gst_amount: parseFloat(totals.gstAmount),
          total_inc_gst: parseFloat(totals.totalIncGST),
          gross_profit_percent: parseFloat(totals.grossProfitPercent),
        })
        .eq('id', quoteId);

      if (updateError) throw updateError;

      alert('Quote updated successfully!');
      router.push(`/quotes/${quoteId}`);
    } catch (error: any) {
      console.error('Error updating quote:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[#0066CC] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-[#0066CC] hover:underline">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[#0066CC]">Edit Quote</h1>
              <p className="text-sm text-gray-500 mt-1">{quoteData?.quote_number}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* SECTION 1: COMPACT QUOTE HEADER */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Quote Details</h2>
          </div>
          <div className="p-6">
            {/* Row 1: Quote basics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Number</label>
                <input type="text" value={quoteData?.quote_number || ''} disabled className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Date</label>
                <input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={quoteStatus} onChange={(e) => setQuoteStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                  <option>Draft</option>
                  <option>Sent</option>
                  <option>Accepted</option>
                  <option>Won</option>
                  <option>Lost</option>
                </select>
              </div>
            </div>

            {/* Row 2: Client & Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Address</label>
                <input type="text" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
            </div>

            {/* Row 3: City, Postcode, Region, Job Type */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                  <option value="">Select...</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                  <option value="">Select...</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>
            </div>

            {/* Pricing controls */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <button onClick={() => setPricingTier('Retail')} className={`px-3 py-1 rounded text-sm font-medium ${pricingTier === 'Retail' ? 'bg-[#0066CC] text-white' : 'bg-white text-gray-700 border border-gray-300'}`}>Retail</button>
                  <button onClick={() => setPricingTier('Trade')} className={`px-3 py-1 rounded text-sm font-medium ${pricingTier === 'Trade' ? 'bg-[#0066CC] text-white' : 'bg-white text-gray-700 border border-gray-300'}`}>Trade</button>
                  <button onClick={() => setPricingTier('VIP')} className={`px-3 py-1 rounded text-sm font-medium ${pricingTier === 'VIP' ? 'bg-[#0066CC] text-white' : 'bg-white text-gray-700 border border-gray-300'}`}>VIP</button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Labour $/m²:</label>
                  <input type="number" step="0.01" value={labourRate} onChange={(e) => setLabourRate(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Waste:</label>
                  <input type="number" step="0.1" value={wastePercent} onChange={(e) => setWastePercent(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
            </div>
          </div>
        </div>

        {/* SECTION 2: LINE ITEMS & SECTIONS */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Line Items & Sections</h3>

          {sections.length > 0 ? (
            <>
              {sections.map((section) => (
                <div key={section.id} className="mb-6 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <select value={section.app_type_id || ''} onChange={(e) => updateSection(section.id, 'app_type_id', e.target.value || null)} className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] text-sm font-medium" style={{ backgroundColor: section.section_color }}>
                      <option value="">Select type...</option>
                      {appTypes.map(at => (
                        <option key={at.id} value={at.id}>{at.name}</option>
                      ))}
                    </select>
                    <span className="text-gray-500">or</span>
                    <input type="text" value={section.custom_name} onChange={(e) => updateSection(section.id, 'custom_name', e.target.value)} placeholder="Custom name..." className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm" />
                    <button onClick={() => removeSection(section.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {section.line_items.length > 0 ? (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 text-gray-700 font-semibold">Product</th>
                            <th className="text-left py-2 px-2 text-gray-700 font-semibold">Area m²</th>
                            <th className="text-center py-2 px-2 text-gray-700 font-semibold">Packs</th>
                            <th className="text-right py-2 px-2 text-gray-700 font-semibold">Cost</th>
                            <th className="text-right py-2 px-2 text-gray-700 font-semibold">Sell</th>
                            <th className="text-right py-2 px-2 text-gray-700 font-semibold">GP%</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.line_items.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-2 px-2">
                                {!item.is_labour ? (
                                  <div className="relative">
                                    <input type="text" value={productSearch[`${section.id}-${item.id}`] || (item.product?.product_description || '')} onChange={(e) => { setProductSearch({ ...productSearch, [`${section.id}-${item.id}`]: e.target.value }); setShowProductSuggestions({ ...showProductSuggestions, [`${section.id}-${item.id}`]: true }); }} placeholder="Search..." className="w-full px-3 py-1 border border-gray-300 rounded text-sm" />
                                    {showProductSuggestions[`${section.id}-${item.id}`] && productSearch[`${section.id}-${item.id}`] && (
                                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {filterProducts(productSearch[`${section.id}-${item.id}`]).map(p => (
                                          <button key={p.id} onClick={() => selectProduct(section.id, item.id, p)} className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 text-sm">
                                            {p.product_description} ({p.sku})
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-700">{item.product?.product_description}</span>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                {!item.is_labour ? (
                                  <input type="number" step="0.01" value={item.area_sqm} onChange={(e) => updateLineItem(section.id, item.id, 'area_sqm', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                                ) : (
                                  <span className="text-gray-600">{item.area_sqm}</span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-center">{item.packs_required || '-'}</td>
                              <td className="py-2 px-2 text-right">${item.line_cost.toFixed(2)}</td>
                              <td className="py-2 px-2 text-right">${item.line_sell.toFixed(2)}</td>
                              <td className="py-2 px-2 text-right text-green-600">{item.margin_percent.toFixed(1)}%</td>
                              <td className="py-2 px-2">
                                {!item.is_labour && (
                                  <button onClick={() => removeLineItem(section.id, item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic mb-4">No items in this section</div>
                  )}

                  <button onClick={() => addLineItem(section.id)} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
              ))}

              <button onClick={addSection} className="w-full px-4 py-3 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Add Section
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No sections added yet</p>
              <button onClick={addSection} className="px-4 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded flex items-center justify-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-end gap-8 text-lg">
            <div className="text-right">
              <p className="text-gray-600 mb-2">Total Cost ex GST</p>
              <p className="font-bold">${totals.totalCostExGST}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 mb-2">Total Sell ex GST</p>
              <p className="font-bold">${totals.totalSellExGST}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 mb-2">GST (15%)</p>
              <p className="font-bold">${totals.gstAmount}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 mb-2">Total Inc GST</p>
              <p className="font-bold text-[#0066CC] text-2xl">${totals.totalIncGST}</p>
            </div>
          </div>
          <div className="flex justify-end gap-8 mt-4 pt-4 border-t border-gray-100">
            <div className="text-right">
              <p className="text-sm text-gray-500">Gross Profit</p>
              <p className="font-medium text-green-600">${totals.grossProfit}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">GP Margin</p>
              <p className="font-medium text-green-600">{totals.grossProfitPercent}%</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button onClick={() => router.back()} className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSaveChanges} disabled={saving} className="px-6 py-3 bg-[#0066CC] text-white font-medium rounded-lg hover:bg-[#0052a3] disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}