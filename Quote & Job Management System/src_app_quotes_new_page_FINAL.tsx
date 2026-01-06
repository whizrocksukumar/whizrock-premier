'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, X } from 'lucide-react';
import ClientSelectorSimple from '@/components/ClientSelectorSimple';
import SiteSelector from '@/components/SiteSelector';
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
interface Product {
id: string;
sku: string;
product_description: string; // Changed from description
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
interface SalesRep {
id: string;
name: string;
email: string;
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
export default function AddQuotePage() {
const router = useRouter();
    // Quote header fields
    const [quoteNumber, setQuoteNumber] = useState('');
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [validUntil, setValidUntil] = useState('');
    const [quoteStatus, setQuoteStatus] = useState('Draft');
    const [reference, setReference] = useState('');

    // Client selection
    const [clientId, setClientId] = useState('');

    // Form state
    const [siteAddress, setSiteAddress] = useState('');
    const [city, setCity] = useState('');
    const [postcode, setPostcode] = useState('');
    const [regionId, setRegionId] = useState('');
    const [jobType, setJobType] = useState('');
    const [salesRepId, setSalesRepId] = useState('');
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
    const [products, setProducts] = useState<Product[]>([]);
    const [appTypes, setAppTypes] = useState<ApplicationType[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [salesReps, setSalesReps] = useState<SalesRep[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState<{ [key: string]: string }>({});
    const [showProductSuggestions, setShowProductSuggestions] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            setError('Supabase environment variables are missing. Please check your configuration.');
        }
        loadLookupData();
        addInitialSection();
    }, []);

    const loadLookupData = async () => {
        try {
            setLoading(true);

            // Load all lookup data - removed boolean filters that cause 400 errors
            const [productsRes, appTypesRes, regionsRes, salesRepsRes] = await Promise.all([
                supabase.from('products').select('*'),
                supabase.from('app_types').select('*').order('sort_order'),
                supabase.from('regions').select('*').order('name'),
                supabase.from('sales_reps').select('*').order('name'),
            ]);

            if (productsRes.data) {
                // Filter products client-side
                const activeProducts = productsRes.data.filter((p: any) => p.is_active !== false && p.is_labour !== true);
                setProducts(activeProducts as Product[]);
                console.log('Products loaded:', activeProducts.length);
            }
            if (appTypesRes.data) {
                const activeAppTypes = appTypesRes.data.filter((at: any) => at.is_active !== false);
                setAppTypes(activeAppTypes as ApplicationType[]);
            }
            if (regionsRes.data) setRegions(regionsRes.data as Region[]);
            if (salesRepsRes.data) {
                const activeSalesReps = salesRepsRes.data.filter((sr: any) => sr.is_active !== false);
                setSalesReps(activeSalesReps as SalesRep[]);
            }

        } catch (error) {
            console.error('Error loading lookup data:', error);
        } finally {
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

                // If app_type changed, get the app type details and auto-set color
                if (field === 'app_type_id') {
                    if (value) {
                        const appType = appTypes.find(at => at.id === value);
                        updated.app_type = appType;
                        // Auto-set color from app type if available
                        if (appType?.color_hex) {
                            updated.section_color = appType.color_hex;
                        }
                    } else {
                        updated.app_type = undefined;
                        updated.section_color = '#ffffff';
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
                        id: `${nextLineItemId}`,
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

    const autoAddLabourRow = (sectionId: string, productLineItemId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;

        const productLineItem = section.line_items.find(li => li.id === productLineItemId);
        if (!productLineItem || !productLineItem.area_sqm) return;

        const area = productLineItem.area_sqm;
        const labourCost = area * 1.50;
        const labourSell = area * labourRate;
        const labourMargin = labourSell > 0 ? ((labourSell - labourCost) / labourSell) * 100 : 0;

        const sectionName = section.app_type?.name || section.custom_name || 'Section';

        const labourLineItem: LineItem = {
            id: `${nextLineItemId}`,
            product_id: null,
            area_sqm: area,
            is_labour: true,
            cost_price: 1.50,
            sell_price: labourRate,
            line_cost: parseFloat(labourCost.toFixed(2)),
            line_sell: parseFloat(labourSell.toFixed(2)),
            margin_percent: parseFloat(labourMargin.toFixed(1)),
            product: {
                id: 'labour',
                sku: 'LABOUR',
                product_description: `Labour - ${sectionName}`,
                category: 'Labour',
                r_value: '',
                application_type: '',
                bale_size_sqm: 0,
                cost_price: 1.50,
                retail_price: 3.00,
                pack_price: 0,
                waste_percentage: 0
            },
        };

        setSections(sections.map(s => {
            if (s.id === sectionId) {
                const productIndex = s.line_items.findIndex(li => li.id === productLineItemId);
                const newLineItems = [...s.line_items];
                newLineItems.splice(productIndex + 1, 0, labourLineItem);

                return {
                    ...s,
                    line_items: newLineItems
                };
            }
            return s;
        }));

        setNextLineItemId(nextLineItemId + 1);
    };

    const filterProducts = (searchTerm: string) => {
        console.log('Quote Page - Filtering products with term:', searchTerm);
        if (!searchTerm || searchTerm.length < 2) return [];

        const term = searchTerm.toLowerCase();
        const results = products.filter(p =>
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.product_description && p.product_description.toLowerCase().includes(term)) ||
            (p.r_value && p.r_value.toLowerCase().includes(term)) ||
            (p.application_type && p.application_type.toLowerCase().includes(term))
        ).slice(0, 10);
        console.log('Quote Page - Filter results:', results.length);
        return results;
    };

    const selectProduct = (sectionId: string, lineItemId: string, product: Product) => {
        updateLineItem(sectionId, lineItemId, 'product_id', product.id);
        setProductSearch({ ...productSearch, [`${sectionId}-${lineItemId}`]: '' });
        setShowProductSuggestions({ ...showProductSuggestions, [`${sectionId}-${lineItemId}`]: false });

        setTimeout(() => {
            autoAddLabourRow(sectionId, lineItemId);
        }, 100);
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

    const handleSaveDraft = async () => {
        try {
            setSaving(true);
            console.log('Saving draft...');

            // Validation
            if (!clientId) {
                alert('Please select a client');
                setSaving(false);
                return;
            }
            if (!siteAddress) {
                alert('Please enter a site address');
                setSaving(false);
                return;
            }

            // 1. Insert Quote
            const { data: quoteData, error: quoteError } = await supabase
                .from('quotes')
                .insert({
                    quote_number: quoteNumber || null,
                    client_id: clientId || null,
                    site_address: siteAddress,
                    city: city || null,
                    postcode: postcode || null,
                    region_id: regionId || null,
                    job_type: jobType,
                    sales_rep_id: salesRepId || null,
                    status: quoteStatus,
                    quote_date: quoteDate || null,
                    valid_until: validUntil || null,
                    notes: notes || null,
                    pricing_tier: pricingTier,
                    markup_percent: markupPercent,
                    waste_percent: wastePercent,
                    labour_rate: labourRate,
                    total_cost_ex_gst: parseFloat(totals.totalCostExGST),
                    total_sell_ex_gst: parseFloat(totals.totalSellExGST),
                    gst_amount: parseFloat(totals.gstAmount),
                    total_inc_gst: parseFloat(totals.totalIncGST),
                    gross_profit: parseFloat(totals.grossProfit),
                    gross_profit_percent: parseFloat(totals.grossProfitPercent),
                    subtotal: parseFloat(totals.totalSellExGST),
                    total_amount: parseFloat(totals.totalIncGST),
                })
                .select()
                .single();

            if (quoteError) throw quoteError;
            if (!quoteData) throw new Error('No data returned from quote insert');

            const quoteId = quoteData.id;

            // 2. Insert Sections
            for (const section of sections) {
                const { data: sectionData, error: sectionError } = await supabase
                    .from('quote_sections')
                    .insert({
                        quote_id: quoteId,
                        app_type_id: section.app_type_id || null,
                        custom_name: section.custom_name,
                        section_color: section.section_color,
                        sort_order: parseInt(section.id) // Assuming ID is sort order for now
                    })
                    .select()
                    .single();

                if (sectionError) throw sectionError;

                // 3. Insert Line Items
                const itemsToInsert = section.line_items.map((item, index) => ({
                    section_id: sectionData.id,
                    product_id: item.product_id || null,
                    marker: item.marker || null,
                    description: item.product?.product_description || (item.is_labour ? 'Labour' : 'Custom Item'),
                    area_sqm: item.area_sqm,
                    is_labour: item.is_labour,
                    cost_price: item.cost_price,
                    sell_price: item.sell_price,
                    line_cost: item.line_cost,
                    line_sell: item.line_sell,
                    margin_percent: item.margin_percent,
                    packs_required: item.packs_required || 0,
                    sort_order: index
                }));

                if (itemsToInsert.length > 0) {
                    const { error: itemsError } = await supabase
                        .from('quote_line_items')
                        .insert(itemsToInsert);

                    if (itemsError) throw itemsError;
                }
            }

            console.log('Quote saved successfully:', quoteId);
            // router.push(`/quotes/${quoteId}`); // Commented out until view page is ready, or keep on page
            alert('Quote saved successfully!');

        } catch (error: any) {
            console.error('Error saving quote:', error);
            alert(`Error saving quote: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSendToClient = async () => {
        console.log('Sending to client...');
    };

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

    return (
        <div className="min-h-screen bg-gray-100">
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 mx-6 mt-4" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0066CC]">New Quote</h1>
                        <p className="text-sm text-gray-500 mt-1">Create a new quote for a client</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Quote Date</p>
                            <p className="text-sm font-medium">{new Date().toLocaleDateString('en-NZ')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Status</p>
                            <select
                                value={quoteStatus}
                                onChange={(e) => setQuoteStatus(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                                <option>Draft</option>
                                <option>Sent</option>
                                <option>Accepted</option>
                                <option>Rejected</option>
                            </select>
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

            <div className="p-6 max-w-7xl mx-auto">
                {/* Quote Header Card */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-800">Quote Details</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Number</label>
                                <input
                                    type="text"
                                    value={quoteNumber}
                                    onChange={(e) => setQuoteNumber(e.target.value)}
                                    placeholder="Auto-generated"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Date *</label>
                                <input
                                    type="date"
                                    value={quoteDate}
                                    onChange={(e) => setQuoteDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                <input
                                    type="date"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                                <input
                                    type="text"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="Optional reference"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Pricing Tier Selection */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPricingTier('Retail')}
                                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${pricingTier === 'Retail' ? 'bg-[#0066CC] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Retail
                                    </button>
                                    <button
                                        onClick={() => setPricingTier('Trade')}
                                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${pricingTier === 'Trade' ? 'bg-[#0066CC] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Trade
                                    </button>
                                    <button
                                        onClick={() => setPricingTier('VIP')}
                                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${pricingTier === 'VIP' ? 'bg-[#0066CC] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        VIP
                                    </button>
                                    <button
                                        onClick={() => setPricingTier('Custom')}
                                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${pricingTier === 'Custom' ? 'bg-[#0066CC] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Custom Markup
                                    </button>
                                </div>

                                {pricingTier === 'Custom' && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700">Markup:</label>
                                        <input
                                            type="number"
                                            value={markupPercent}
                                            onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                        <span className="text-sm text-gray-600">%</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">Labour $/m\u00b2:</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={labourRate}
                                        onChange={(e) => setLabourRate(parseFloat(e.target.value) || 0)}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">Waste:</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={wastePercent}
                                        onChange={(e) => setWastePercent(parseFloat(e.target.value) || 0)}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                    <span className="text-sm text-gray-600">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Details Card */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-800">Client Information</h2>
                    </div>
                    <div className="p-6">
                        <div className="mb-6">
                            <ClientSelectorSimple
                                onClientSelected={(client) => {
                                    if (client) {
                                        setClientId(client.id);
                                        // Auto-populate fields from client data
                                        if (client.address_line_1) setSiteAddress(client.address_line_1);
                                        if (client.city) setCity(client.city);
                                        if (client.postcode) setPostcode(client.postcode);
                                        if (client.region_id) setRegionId(client.region_id);
                                    } else {
                                        setClientId('');
                                        setSiteAddress('');
                                        setCity('');
                                        setPostcode('');
                                        setRegionId('');
                                    }
                                }}
                                onClear={() => {
                                    setClientId('');
                                    setSiteAddress('');
                                    setCity('');
                                    setPostcode('');
                                    setRegionId('');
                                }}
                                label="Select Client"
                                placeholder="Search by name, email, phone, or company..."
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Site Address *</label>
                            <SiteSelector
                                onSiteSelected={(site) => {
                                    if (site) {
                                        setSiteAddress(site.address_line_1);
                                        if (site.city) setCity(site.city);
                                        if (site.postcode) setPostcode(site.postcode);
                                        if (site.region_id) setRegionId(site.region_id);
                                    }
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                    placeholder="Auckland"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                                <input
                                    type="text"
                                    value={postcode}
                                    onChange={(e) => setPostcode(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                    placeholder="1050"
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
                                    {regions.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
                                <select
                                    value={jobType}
                                    onChange={(e) => setJobType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                >
                                    <option value="">Select job type...</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Industrial">Industrial</option>
                                    <option value="Retrofit">Retrofit</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                placeholder="Add any additional notes or special instructions..."
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Section</h3>

                    {sections.map((section) => (
                        <div key={section.id} className="mb-6 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <select
                                    value={section.app_type_id || ''}
                                    onChange={(e) => updateSection(section.id, 'app_type_id', e.target.value || null)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-white focus:border-transparent text-sm font-medium"
                                    style={{
                                        backgroundColor: section.section_color || '#ffffff',
                                        color: '#000000'
                                    }}
                                >
                                    <option value="">Select application type...</option>
                                    {appTypes.map(at => (
                                        <option key={at.id} value={at.id}>
                                            {at.name}
                                        </option>
                                    ))}
                                </select>

                                <span className="text-gray-500">or</span>

                                <input
                                    type="text"
                                    value={section.custom_name}
                                    onChange={(e) => updateSection(section.id, 'custom_name', e.target.value)}
                                    placeholder="Custom section name..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                />

                                <div className="flex items-center gap-2 border border-gray-300 rounded px-2 py-1 bg-white">
                                    <label className="text-xs text-gray-500">Color:</label>
                                    <input
                                        type="color"
                                        value={section.section_color || '#ffffff'}
                                        onChange={(e) => updateSection(section.id, 'section_color', e.target.value)}
                                        className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                        title="Section Color"
                                    />
                                </div>

                                <button
                                    onClick={() => removeSection(section.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete section"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-visible">
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
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.line_items.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-100">
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="text"
                                                        value={item.marker || ''}
                                                        onChange={(e) => updateLineItem(section.id, item.id, 'marker', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                        placeholder="e.g. W1"
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    {!item.is_labour ? (
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={productSearch[`${section.id}-${item.id}`] || (item.product?.product_description || '')}
                                                                onChange={(e) => {
                                                                    setProductSearch({ ...productSearch, [`${section.id}-${item.id}`]: e.target.value });
                                                                    setShowProductSuggestions({ ...showProductSuggestions, [`${section.id}-${item.id}`]: true });
                                                                }}
                                                                onFocus={() => setShowProductSuggestions({ ...showProductSuggestions, [`${section.id}-${item.id}`]: true })}
                                                                placeholder="Type to search R-value, SKU, or description..."
                                                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm pr-8"
                                                            />
                                                            <Search className="absolute right-2 top-1.5 w-4 h-4 text-gray-400" />

                                                            {showProductSuggestions[`${section.id}-${item.id}`] && productSearch[`${section.id}-${item.id}`] && (
                                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                                    {filterProducts(productSearch[`${section.id}-${item.id}`]).map(p => (
                                                                        <button
                                                                            key={p.id}
                                                                            onClick={() => selectProduct(section.id, item.id, p)}
                                                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                                                                        >
                                                                            <div className="font-medium text-gray-900">{p.product_description}</div>
                                                                            <div className="text-xs text-gray-600">{p.sku} - {p.r_value}</div>
                                                                        </button>
                                                                    ))}
                                                                    {filterProducts(productSearch[`${section.id}-${item.id}`]).length === 0 && (
                                                                        <div className="px-3 py-2 text-sm text-gray-500">No products found</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-700 italic">{item.product?.product_description}</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-2">
                                                    {!item.is_labour ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.area_sqm || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'area_sqm', parseFloat(e.target.value) || 0)}
                                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                            placeholder="0"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-600">{item.area_sqm}</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    {item.packs_required ? (
                                                        <span className="font-semibold text-green-600">{item.packs_required}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-2 text-right font-medium">${item.line_cost.toFixed(2)}</td>
                                                <td className="py-2 px-2 text-right font-medium">${item.line_sell.toFixed(2)}</td>
                                                <td className="py-2 px-2 text-right">
                                                    <span className={item.margin_percent >= 30 ? 'text-green-600' : 'text-orange-600'}>
                                                        {item.margin_percent.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="py-2 px-2">
                                                    {!item.is_labour && (
                                                        <button
                                                            onClick={() => removeLineItem(section.id, item.id)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={() => addLineItem(section.id)}
                                className="mt-3 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Product
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addSection}
                        className="w-full px-4 py-3 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Section
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-end gap-8 text-lg">
                        <div className="text-right">
                            <p className="text-gray-600 mb-2">Total Cost ex GST</p>
                            <p className="font-bold text-gray-900">${totals.totalCostExGST}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-600 mb-2">Total Sell ex GST</p>
                            <p className="font-bold text-gray-900">${totals.totalSellExGST}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-600 mb-2">GST (15%)</p>
                            <p className="font-bold text-gray-900">${totals.gstAmount}</p>
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

                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={handleSendToClient}
                        disabled={saving}
                        className="px-6 py-3 bg-[#0066CC] text-white font-medium rounded-lg hover:bg-[#0052a3] transition-colors disabled:opacity-50"
                    >
                        Create & Send
                    </button>
                </div>
            </div>
        </div>
    );
}