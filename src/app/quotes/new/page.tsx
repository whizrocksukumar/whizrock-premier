'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, X, AlertTriangle, Check, ChevronDown, GripVertical } from 'lucide-react';
import ClientSelectorWithSites from '@/components/ClientSelectorWithSites';

// ============================================
// TYPES
// ============================================
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
    stock_level?: number;
    reorder_level?: number;
    stock_status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
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

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
}

interface JobType {
    id: string;
    name: string;
    code?: string;
    is_active?: boolean;
}

interface LineItem {
    id: string;
    marker?: string;
    product_id: string | null;
    product?: Product;
    area_sqm: number;
    is_labour: boolean;
    parent_line_item_id?: string;
    cost_price: number;
    sell_price: number;
    line_cost: number;
    line_sell: number;
    margin_percent: number;
    packs_required?: number;
    stock_warning?: string;
}

interface Section {
    id: string;
    app_type_id: string | null;
    app_type?: ApplicationType;
    custom_name: string;
    section_color: string;
    line_items: LineItem[];
}

interface CustomProductMargin {
    margin_percent: number;
    sell_price: number;
}

type PricingTier = 'Retail' | 'Trade' | 'VIP' | 'Custom';

// ============================================
// CONSTANTS
// ============================================
// GP% targets for each tier (displayed and used in calculations)
const PRICING_TIER_GP: Record<PricingTier, number> = {
    'Retail': 37.5,   // ~60% markup equivalent
    'Trade': 28.5,    // ~40% markup equivalent
    'VIP': 20,        // ~25% markup equivalent
    'Custom': 37.5    // default
};

const LABOUR_COST_PER_SQM = 2.00;
const DEFAULT_LABOUR_SELL_PER_SQM = 0;
const DEFAULT_WASTE_PERCENT = 0;

// Quote Details Defaults
const DEFAULT_DESCRIPTION_PLACEHOLDER = `**Supply and Installation of:**

- Ceiling Insulation
- Wall Insulation  
- Underfloor Insulation

**Work Includes:**
- Site preparation and cleanup
- Professional installation to NZ Building Code standards
- Completion certificate provided upon job completion`;

const DEFAULT_SPECIFICATIONS_NOTE = `**Did you know?**

✓ Premier Insulation is **Site Safe** certified  
✓ We are **Sitewise** accredited  
✓ All our installers are **Police Vetted**  
✓ We carry **Public Liability Insurance** up to $10 million  
✓ All work comes with a **50-year product warranty**

Your home is in safe, professional hands.`;

// ============================================
// HELPER FUNCTIONS
// ============================================
const generateId = () => Math.random().toString(36).substring(2, 15);

const calculateStockStatus = (available: number | undefined, reorderLevel: number | undefined): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' => {
    if (available === undefined || available === null) return 'LOW_STOCK';
    if (reorderLevel && available <= reorderLevel) return 'LOW_STOCK';
    return 'IN_STOCK';
};

const getStockStatusDisplay = (status: string, quantity?: number) => {
    switch (status) {
        case 'IN_STOCK':
            return { icon: '✓', color: 'text-green-600', bg: 'bg-green-100', label: `In Stock${quantity !== undefined ? ` (${quantity})` : ''}` };
        case 'LOW_STOCK':
            return { icon: '⚠️', color: 'text-orange-600', bg: 'bg-orange-100', label: `Low Stock${quantity !== undefined ? ` (${quantity})` : ''}` };
        case 'OUT_OF_STOCK':
            return { icon: '❌', color: 'text-red-600', bg: 'bg-red-100', label: 'Out of Stock' };
        default:
            return { icon: '?', color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
    }
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function AddNewQuotePage() {
    const router = useRouter();

    // Client & Site State
    const [clientId, setClientId] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [siteId, setSiteId] = useState('');
    const [siteAddress, setSiteAddress] = useState('');
    const [city, setCity] = useState('Auckland');
    const [postcode, setPostcode] = useState('');
    const [regionId, setRegionId] = useState('');
    const [salesRepId, setSalesRepId] = useState('');
    const [propertyType, setPropertyType] = useState('');
    const [jobTypeId, setJobTypeId] = useState('');

    // Property Types
    const propertyTypes = ['Residential', 'Commercial', 'Industrial', 'Retail', 'Mixed Use', 'Other'];

    // Quote Details State
    const [subject, setSubject] = useState('');
    const [descriptionOfWork, setDescriptionOfWork] = useState('');
    const [specificationsNote, setSpecificationsNote] = useState('');
    const [includeImportantNotes, setIncludeImportantNotes] = useState(true);

    // Pricing Controls
    const [pricingTier, setPricingTier] = useState<PricingTier>('Retail');
    const [targetGP, setTargetGP] = useState(PRICING_TIER_GP['Retail']);
    const [labourRate, setLabourRate] = useState(DEFAULT_LABOUR_SELL_PER_SQM);
    const [wastePercent, setWastePercent] = useState(DEFAULT_WASTE_PERCENT);

    // Sections & Line Items
    const [sections, setSections] = useState<Section[]>([]);

    // Custom Product Margins (synced across sections)
    const [customProductMargins, setCustomProductMargins] = useState<{ [productId: string]: CustomProductMargin }>({});

    // Lookup Data
    const [products, setProducts] = useState<Product[]>([]);
    const [appTypes, setAppTypes] = useState<ApplicationType[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [salesReps, setSalesReps] = useState<TeamMember[]>([]);
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [productSearch, setProductSearch] = useState<{ [key: string]: string }>({});
    const [showProductSuggestions, setShowProductSuggestions] = useState<{ [key: string]: boolean }>({});
    const [draggedItem, setDraggedItem] = useState<{ sectionId: string; itemId: string } | null>(null);
    const [dragOverSection, setDragOverSection] = useState<string | null>(null);

    // ============================================
    // LOAD DATA
    // ============================================
    useEffect(() => {
        loadLookupData();
    }, []);

    // ============================================
    // AUTO-POPULATE QUOTE DETAILS
    // ============================================
    useEffect(() => {
        // Auto-populate subject when site address changes
        if (siteAddress && !subject) {
            setSubject(`Quote for ${siteAddress}`);
        }
    }, [siteAddress]);

    useEffect(() => {
        // Pre-populate specifications note on first load
        if (!specificationsNote) {
            setSpecificationsNote(DEFAULT_SPECIFICATIONS_NOTE);
        }
    }, []);

    const loadLookupData = async () => {
        setLoading(true);
        try {
            const [productsRes, appTypesRes, regionsRes, teamMembersRes, jobTypesRes] = await Promise.all([
                supabase.from('products').select('*').eq('is_active', true),
                supabase.from('app_types').select('*').eq('is_active', true).order('sort_order'),
                supabase.from('regions').select('*').order('name'),
                supabase.from('team_members').select('*').order('first_name'),
                supabase.from('job_types').select('*').order('name'),
            ]);

            // Products have stock_level field
            if (productsRes.data) {
                const productsWithStock = productsRes.data.map((p: any) => {
                    const available = p.stock_level || 0;
                    const reorder = p.reorder_level || 0;
                    return {
                        ...p,
                        stock_status: calculateStockStatus(available, reorder)
                    };
                });
                setProducts(productsWithStock as Product[]);
            }

            if (appTypesRes.data) setAppTypes(appTypesRes.data as ApplicationType[]);
            if (regionsRes.data) setRegions(regionsRes.data as Region[]);
            if (jobTypesRes.data) setJobTypes(jobTypesRes.data as JobType[]);
            
            if (teamMembersRes.data) {
                const activeSalesReps = teamMembersRes.data.filter((tm: any) => 
                    tm.is_active !== false && tm.role === 'Sales Rep'
                );
                setSalesReps(activeSalesReps as TeamMember[]);
            }
        } catch (error) {
            console.error('Error loading lookup data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // PRICING TIER CHANGE
    // ============================================
    const handlePricingTierChange = (tier: PricingTier) => {
        setPricingTier(tier);
        if (tier !== 'Custom') {
            setTargetGP(PRICING_TIER_GP[tier]);
        }
        // Clear custom margins when tier changes (prices will recalculate)
        setCustomProductMargins({});
    };

    // ============================================
    // RECALCULATE PRICES
    // ============================================
    const recalculateAllPrices = useCallback(() => {
        setSections(prevSections => {
            return prevSections.map(section => ({
                ...section,
                line_items: section.line_items.map(item => {
                    if (item.is_labour) {
                        // Labour uses fixed rate
                        return {
                            ...item,
                            cost_price: LABOUR_COST_PER_SQM,
                            sell_price: labourRate,
                            line_cost: item.area_sqm * LABOUR_COST_PER_SQM,
                            line_sell: item.area_sqm * labourRate,
                            margin_percent: labourRate > 0 
                                ? ((labourRate - LABOUR_COST_PER_SQM) / labourRate) * 100 
                                : 0
                        };
                    }

                    if (!item.product_id || !item.product) return item;

                    const product = products.find(p => p.id === item.product_id);
                    if (!product) return item;

                    // Check for custom margin
                    const customMargin = customProductMargins[item.product_id];
                    
                    let sellPrice: number;
                    let marginPercent: number;

                    if (customMargin) {
                        sellPrice = customMargin.sell_price;
                        marginPercent = customMargin.margin_percent;
                    } else {
                        // Calculate from GP%
                        const costPrice = product.cost_price || 0;
                        marginPercent = targetGP;
                        sellPrice = costPrice / (1 - (marginPercent / 100));
                    }

                    const packsRequired = Math.ceil(
                        (item.area_sqm * (1 + (wastePercent / 100))) / product.bale_size_sqm
                    );

                    return {
                        ...item,
                        cost_price: product.cost_price,
                        sell_price: sellPrice,
                        packs_required: packsRequired,
                        line_cost: packsRequired * product.cost_price,
                        line_sell: packsRequired * sellPrice,
                        margin_percent: marginPercent
                    };
                })
            }));
        });
    }, [products, targetGP, labourRate, wastePercent, customProductMargins]);

    useEffect(() => {
        recalculateAllPrices();
    }, [recalculateAllPrices]);

    // ============================================
    // CUSTOM MARGIN UPDATE (syncs across sections)
    // ============================================
    const handleCustomMarginChange = (productId: string, newMarginPercent: number, costPrice: number) => {
        const newSellPrice = costPrice / (1 - (newMarginPercent / 100));
        
        setCustomProductMargins(prev => ({
            ...prev,
            [productId]: {
                margin_percent: newMarginPercent,
                sell_price: newSellPrice
            }
        }));
    };

    const handleCustomSellPriceChange = (productId: string, newSellPrice: number, costPrice: number) => {
        const newMarginPercent = costPrice > 0 && newSellPrice > 0
            ? ((newSellPrice - costPrice) / newSellPrice) * 100
            : 0;

        setCustomProductMargins(prev => ({
            ...prev,
            [productId]: {
                margin_percent: newMarginPercent,
                sell_price: newSellPrice
            }
        }));
    };

    // ============================================
    // SECTION MANAGEMENT
    // ============================================
    const handleAddSection = () => {
        const newSection: Section = {
            id: generateId(),
            app_type_id: null,
            custom_name: '',
            section_color: '#6B7280',
            line_items: []
        };
        setSections([...sections, newSection]);
    };

    const handleRemoveSection = (sectionId: string) => {
        setSections(sections.filter(s => s.id !== sectionId));
    };

    const handleSectionAppTypeChange = (sectionId: string, appTypeId: string) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                const appType = appTypes.find(a => a.id === appTypeId);
                return {
                    ...s,
                    app_type_id: appTypeId,
                    app_type: appType,
                    section_color: appType?.color_hex || '#6B7280',
                    custom_name: '' // Clear custom name when app type selected
                };
            }
            return s;
        }));
    };

    const handleSectionCustomNameChange = (sectionId: string, customName: string) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    custom_name: customName,
                    app_type_id: customName ? null : s.app_type_id // Clear app type if custom name entered
                };
            }
            return s;
        }));
    };

    // ============================================
    // LINE ITEM MANAGEMENT
    // ============================================
    const handleAddProduct = (sectionId: string) => {
        const newItem: LineItem = {
            id: generateId(),
            product_id: null,
            area_sqm: 0,
            is_labour: false,
            cost_price: 0,
            sell_price: 0,
            line_cost: 0,
            line_sell: 0,
            margin_percent: 0
        };

        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, line_items: [...s.line_items, newItem] };
            }
            return s;
        }));
    };

    const handleAddLabour = (sectionId: string) => {
        // Get total area for this section (excluding existing labour)
        const section = sections.find(s => s.id === sectionId);
        const totalArea = section?.line_items
            .filter(item => !item.is_labour)
            .reduce((sum, item) => sum + (item.area_sqm || 0), 0) || 0;

        const labourItem: LineItem = {
            id: generateId(),
            product_id: null,
            area_sqm: totalArea,
            is_labour: true,
            cost_price: LABOUR_COST_PER_SQM,
            sell_price: labourRate,
            line_cost: totalArea * LABOUR_COST_PER_SQM,
            line_sell: totalArea * labourRate,
            margin_percent: labourRate > 0 
                ? ((labourRate - LABOUR_COST_PER_SQM) / labourRate) * 100 
                : 0
        };

        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, line_items: [...s.line_items, labourItem] };
            }
            return s;
        }));
    };

    const handleRemoveLineItem = (sectionId: string, itemId: string) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    line_items: s.line_items.filter(item => item.id !== itemId)
                };
            }
            return s;
        }));
    };

    const handleProductSelect = (sectionId: string, itemId: string, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    line_items: s.line_items.map(item => {
                        if (item.id === itemId) {
                            // Check for custom margin
                            const customMargin = customProductMargins[productId];
                            let sellPrice: number;
                            let marginPercent: number;

                            if (customMargin) {
                                sellPrice = customMargin.sell_price;
                                marginPercent = customMargin.margin_percent;
                            } else {
                                marginPercent = targetGP;
                                sellPrice = product.cost_price / (1 - (marginPercent / 100));
                            }

                            const packsRequired = item.area_sqm > 0 
                                ? Math.ceil((item.area_sqm * (1 + (wastePercent / 100))) / product.bale_size_sqm)
                                : 0;

                            return {
                                ...item,
                                product_id: productId,
                                product: product,
                                cost_price: product.cost_price,
                                sell_price: sellPrice,
                                packs_required: packsRequired,
                                line_cost: packsRequired * product.cost_price,
                                line_sell: packsRequired * sellPrice,
                                margin_percent: marginPercent,
                                stock_warning: product.stock_status === 'OUT_OF_STOCK' ? 'Out of stock' :
                                               product.stock_status === 'LOW_STOCK' ? 'Low stock' : undefined
                            };
                        }
                        return item;
                    })
                };
            }
            return s;
        }));

        // Close suggestions
        setShowProductSuggestions({ ...showProductSuggestions, [`${sectionId}-${itemId}`]: false });
    };

    const handleAreaChange = (sectionId: string, itemId: string, newArea: number) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    line_items: s.line_items.map(item => {
                        if (item.id === itemId) {
                            if (item.is_labour) {
                                return {
                                    ...item,
                                    area_sqm: newArea,
                                    line_cost: newArea * LABOUR_COST_PER_SQM,
                                    line_sell: newArea * labourRate
                                };
                            }

                            if (!item.product) return { ...item, area_sqm: newArea };

                            const packsRequired = Math.ceil(
                                (newArea * (1 + (wastePercent / 100))) / item.product.bale_size_sqm
                            );

                            return {
                                ...item,
                                area_sqm: newArea,
                                packs_required: packsRequired,
                                line_cost: packsRequired * item.cost_price,
                                line_sell: packsRequired * item.sell_price
                            };
                        }
                        return item;
                    })
                };
            }
            return s;
        }));
    };

    const handleMarkerChange = (sectionId: string, itemId: string, marker: string) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    line_items: s.line_items.map(item => 
                        item.id === itemId ? { ...item, marker } : item
                    )
                };
            }
            return s;
        }));
    };

    // ============================================
    // DRAG & DROP (Optional - for reordering items)
    // ============================================
    const handleDragStart = (sectionId: string, itemId: string) => {
        setDraggedItem({ sectionId, itemId });
    };

    const handleDragOver = (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        setDragOverSection(sectionId);
    };

    const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault();
        if (!draggedItem) return;

        // Move item between sections
        const sourceSection = sections.find(s => s.id === draggedItem.sectionId);
        const item = sourceSection?.line_items.find(i => i.id === draggedItem.itemId);
        
        if (!item) return;

        setSections(sections.map(s => {
            if (s.id === draggedItem.sectionId) {
                return {
                    ...s,
                    line_items: s.line_items.filter(i => i.id !== draggedItem.itemId)
                };
            }
            if (s.id === targetSectionId) {
                return {
                    ...s,
                    line_items: [...s.line_items, item]
                };
            }
            return s;
        }));

        setDraggedItem(null);
        setDragOverSection(null);
    };

    // ============================================
    // TOTALS CALCULATION
    // ============================================
    const calculateSectionTotals = (section: Section) => {
        const totalCost = section.line_items.reduce((sum, item) => sum + (item.line_cost || 0), 0);
        const totalSell = section.line_items.reduce((sum, item) => sum + (item.line_sell || 0), 0);
        const margin = totalSell > 0 ? ((totalSell - totalCost) / totalSell) * 100 : 0;
        return { totalCost, totalSell, margin };
    };

    const calculateQuoteTotals = () => {
        const totalCost = sections.reduce((sum, section) => {
            const sectionTotal = section.line_items.reduce((s, item) => s + (item.line_cost || 0), 0);
            return sum + sectionTotal;
        }, 0);

        const totalSell = sections.reduce((sum, section) => {
            const sectionTotal = section.line_items.reduce((s, item) => s + (item.line_sell || 0), 0);
            return sum + sectionTotal;
        }, 0);

        const gstAmount = totalSell * 0.15;
        const totalIncGst = totalSell + gstAmount;
        const overallMargin = totalSell > 0 ? ((totalSell - totalCost) / totalSell) * 100 : 0;

        return { totalCost, totalSell, gstAmount, totalIncGst, overallMargin };
    };

    // ============================================
    // SAVE QUOTE
    // ============================================
    const handleSaveQuote = async (status: 'Draft' | 'Sent') => {
        if (!clientId && !companyId) {
            alert('Please select a client');
            return;
        }

        if (!siteAddress) {
            alert('Please enter a site address');
            return;
        }

        if (sections.length === 0) {
            alert('Please add at least one section');
            return;
        }

        setSaving(true);

        try {
            const totals = calculateQuoteTotals();

            // Create new site if needed (siteAddress filled but no siteId)
            let finalSiteId = siteId;
            if (!siteId && siteAddress && (clientId || companyId)) {
                const { data: newSite, error: siteError } = await supabase
                    .from('sites')
                    .insert({
                        client_id: clientId || null,
                        company_id: companyId || null,
                        site_name: siteAddress, // Use address as site name
                        address_line_1: siteAddress,
                        city: city || 'Auckland',
                        postcode: postcode || '0000',
                        region_id: regionId || null,
                        property_type: propertyType || null,
                        is_active: true
                    })
                    .select()
                    .single();
                
                if (siteError) {
                    console.warn('Could not create site:', siteError);
                    // Continue without site_id - not critical
                } else if (newSite) {
                    finalSiteId = newSite.id;
                }
            }

            // Generate quote number
            // Get all quotes with Q-YYYY-NNNN format (excluding cloned quotes starting with "Copy - ")
            const { data: allQuotes } = await supabase
                .from('quotes')
                .select('quote_number')
                .like('quote_number', 'Q-%')
                .not('quote_number', 'like', 'Copy -%');

            let quoteNumber = 'Q-2025-0001';
            if (allQuotes && allQuotes.length > 0) {
                // Extract all numbers and find the highest
                const numbers = allQuotes
                    .map(q => {
                        const match = q.quote_number?.match(/Q-\d{4}-(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                    })
                    .filter(n => n > 0);

                if (numbers.length > 0) {
                    const maxNum = Math.max(...numbers);
                    const nextNum = maxNum + 1;
                    quoteNumber = `Q-2025-${nextNum.toString().padStart(4, '0')}`;
                }
            }

            // Insert quote with Quote Details fields
            const { data: quote, error: quoteError } = await supabase
                .from('quotes')
                .insert({
                    quote_number: quoteNumber,
                    quote_date: new Date().toISOString(),
                    client_id: clientId || null,
                    company_id: companyId || null,
                    site_id: finalSiteId || null,
                    site_address: siteAddress,
                    city: city,
                    postcode: postcode,
                    region_id: regionId || null,
                    sales_rep_id: salesRepId || null,
                    job_type: jobTypeId || null,
                    status: status,
                    pricing_tier: pricingTier,
                    markup_percent: targetGP, // Storing GP% in this field
                    labour_rate_per_sqm: labourRate,
                    waste_percent: wastePercent,
                    total_cost_ex_gst: totals.totalCost,
                    total_sell_ex_gst: totals.totalSell,
                    gst_amount: totals.gstAmount,
                    total_inc_gst: totals.totalIncGst,
                    custom_product_margins: customProductMargins,
                    version: 1,
                    // NEW: Quote Details fields
                    subject: subject || null,
                    description_of_work: descriptionOfWork || null,
                    specifications_note: specificationsNote || null,
                    include_important_notes: includeImportantNotes
                })
                .select()
                .single();

            if (quoteError) throw quoteError;

            // Insert sections
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const sectionTotals = calculateSectionTotals(section);

                const { data: savedSection, error: sectionError } = await supabase
                    .from('quote_sections')
                    .insert({
                        quote_id: quote.id,
                        app_type_id: section.app_type_id,
                        section_name: section.custom_name || appTypes.find(a => a.id === section.app_type_id)?.name || 'Section',
                        custom_name: section.custom_name,
                        section_color: section.section_color,
                        sort_order: i + 1
                    })
                    .select()
                    .single();

                if (sectionError) throw sectionError;

                // Insert line items
                const lineItemsToInsert = section.line_items.map((item, idx) => ({
                    quote_id: quote.id,
                    section_id: savedSection.id,
                    product_id: item.product_id,
                    description: item.is_labour ? 'Labour' : (item.product?.product_description || 'Product'),
                    quantity: item.is_labour ? item.area_sqm : (item.packs_required || 1),
                    unit_price: item.sell_price || 0,
                    line_total: item.line_sell || 0,
                    marker: item.marker || null,
                    area_sqm: item.area_sqm,
                    is_labour: item.is_labour,
                    packs_required: item.packs_required || 0,
                    cost_price: item.cost_price || 0,
                    sell_price: item.sell_price || 0,
                    line_cost: item.line_cost || 0,
                    line_sell: item.line_sell || 0,
                    margin_percent: item.margin_percent || 0,
                    sort_order: idx + 1
                }));

                const { error: itemsError } = await supabase
                    .from('quote_line_items')
                    .insert(lineItemsToInsert);

                if (itemsError) throw itemsError;
            }

            alert(`Quote ${quoteNumber} saved successfully!`);
            router.push(`/quotes/${quote.id}`);

        } catch (error: any) {
            console.error('Error saving quote:', error);
            console.error('Error details:', error?.message, error?.details, error?.hint);
            alert(`Failed to save quote: ${error?.message || 'Unknown error'}. Check console for details.`);
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // PRODUCT SEARCH
    // ============================================
    const getFilteredProducts = (searchKey: string) => {
        const searchTerm = productSearch[searchKey]?.toLowerCase() || '';
        if (!searchTerm) return products;

        return products.filter(p => 
            p.sku.toLowerCase().includes(searchTerm) ||
            p.product_description.toLowerCase().includes(searchTerm) ||
            p.r_value.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
    };

    // ============================================
    // RENDER
    // ============================================
    const totals = calculateQuoteTotals();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create New Quote</h1>
                            <p className="text-sm text-gray-600 mt-1">Build a professional quote for your customer</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSaveQuote('Draft')}
                                disabled={saving}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button
                                onClick={() => handleSaveQuote('Sent')}
                                disabled={saving}
                                className="px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052A3] transition disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save & Send'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* Pricing Tier & Controls */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Controls</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Tier</label>
                            <select
                                value={pricingTier}
                                onChange={(e) => handlePricingTierChange(e.target.value as PricingTier)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                            >
                                <option value="Retail">Retail (37.5% GP)</option>
                                <option value="Trade">Trade (28.5% GP)</option>
                                <option value="VIP">VIP (20% GP)</option>
                                <option value="Custom">Custom GP%</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target GP%</label>
                            <input
                                type="number"
                                step="0.1"
                                value={targetGP}
                                onChange={(e) => setTargetGP(parseFloat(e.target.value) || 0)}
                                disabled={pricingTier !== 'Custom'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent disabled:bg-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Labour Rate ($/m²)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={labourRate}
                                onChange={(e) => setLabourRate(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waste %</label>
                            <input
                                type="number"
                                step="0.1"
                                value={wastePercent}
                                onChange={(e) => setWastePercent(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Target GP% applies to all products. Use "Custom" tier to set individual product margins below.
                        </p>
                    </div>

                    {/* Job Type */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                        <select
                            value={jobTypeId}
                            onChange={(e) => setJobTypeId(e.target.value)}
                            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        >
                            <option value="">Select job type...</option>
                            {jobTypes.map(jt => (
                                <option key={jt.id} value={jt.id}>{jt.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Client & Site Selection */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <ClientSelectorWithSites
                                onClientAndSiteSelected={(client, site) => {
                                    if (client) {
                                        setClientId(client.id || '');
                                        setCompanyId(client.company_id || '');
                                        
                                        // Auto-populate sales rep
                                        if (client.sales_rep_id) {
                                            setSalesRepId(client.sales_rep_id);
                                        }
                                        
                                        if (site) {
                                            setSiteId(site.id);
                                            setSiteAddress(site.address_line_1);
                                            setCity(site.city || 'Auckland');
                                            setPostcode(site.postcode || '');
                                            setRegionId(site.region_id || '');
                                            setPropertyType(site.property_type || '');
                                        } else {
                                            setSiteId('');
                                            setSiteAddress('');
                                            setCity('Auckland');
                                            setPostcode('');
                                            setRegionId('');
                                            setPropertyType('');
                                        }
                                    }
                                }}
                                onClear={() => {
                                    setClientId('');
                                    setCompanyId('');
                                    setSiteId('');
                                    setSiteAddress('');
                                    setCity('Auckland');
                                    setPostcode('');
                                    setRegionId('');
                                    setSalesRepId('');
                                    setPropertyType('');
                                }}
                            />
                        </div>

                        <div className="space-y-4">
                            {/* Site Address with Clear Button */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Site Address *</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={siteAddress}
                                        onChange={(e) => setSiteAddress(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        placeholder="Enter site address..."
                                    />
                                    {siteAddress && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSiteId('');
                                                setSiteAddress('');
                                                setCity('Auckland');
                                                setPostcode('');
                                                setRegionId('');
                                                setPropertyType('');
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Clear site address"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                                    <input
                                        type="text"
                                        value={postcode}
                                        onChange={(e) => setPostcode(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                                    <select
                                        value={regionId}
                                        onChange={(e) => setRegionId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                    >
                                        <option value="">Select region...</option>
                                        {regions.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Sales Rep & Property Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Rep</label>
                                    <select
                                        value={salesRepId}
                                        onChange={(e) => setSalesRepId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                    >
                                        <option value="">Select sales rep...</option>
                                        {salesReps.map(sr => (
                                            <option key={sr.id} value={sr.id}>
                                                {sr.first_name} {sr.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                                    <select
                                        value={propertyType}
                                        onChange={(e) => setPropertyType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                    >
                                        <option value="">Select type...</option>
                                        {propertyTypes.map(pt => (
                                            <option key={pt} value={pt}>{pt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================ */}
                {/* NEW: QUOTE DETAILS SECTION */}
                {/* ============================================ */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Details</h2>
                    
                    {/* Subject Line */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject Line
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Quote for [Site Address]"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This will appear as the quote title in the PDF
                        </p>
                    </div>

                    {/* Description of Work */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description of Work
                        </label>
                        <textarea
                            value={descriptionOfWork}
                            onChange={(e) => setDescriptionOfWork(e.target.value)}
                            placeholder={DEFAULT_DESCRIPTION_PLACEHOLDER}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Use markdown: **bold**, - bullets. Leave blank to use default template.
                        </p>
                    </div>

                    {/* Specifications Note */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Specifications & Important Notes
                        </label>
                        <textarea
                            value={specificationsNote}
                            onChange={(e) => setSpecificationsNote(e.target.value)}
                            placeholder="Enter specifications and important notes..."
                            rows={10}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Use markdown: **bold**, - bullets. This appears in the "Important Notes" section.
                        </p>
                    </div>

                    {/* Include Important Notes Toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="includeImportantNotes"
                            checked={includeImportantNotes}
                            onChange={(e) => setIncludeImportantNotes(e.target.checked)}
                            className="w-4 h-4 text-[#0066CC] border-gray-300 rounded focus:ring-[#0066CC]"
                        />
                        <label htmlFor="includeImportantNotes" className="text-sm text-gray-700">
                            Include "Important Notes" section in PDF (Site Safe, Police Vetted, etc.)
                        </label>
                    </div>
                </div>
                {/* ============================================ */}
                {/* END: QUOTE DETAILS SECTION */}
                {/* ============================================ */}

                {/* Quote Sections */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Quote Sections</h2>
                        <button
                            onClick={handleAddSection}
                            className="px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052A3] transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Section
                        </button>
                    </div>

                    {sections.length === 0 && (
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                            <p className="text-gray-500 mb-4">No sections added yet</p>
                            <button
                                onClick={handleAddSection}
                                className="px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052A3] transition"
                            >
                                Add First Section
                            </button>
                        </div>
                    )}

                    {sections.map((section, sectionIndex) => {
                        const sectionTotals = calculateSectionTotals(section);

                        return (
                            <div
                                key={section.id}
                                className={`bg-white rounded-lg shadow-sm border-2 transition ${
                                    dragOverSection === section.id ? 'border-[#0066CC]' : 'border-gray-200'
                                }`}
                                onDragOver={(e) => handleDragOver(e, section.id)}
                                onDrop={(e) => handleDrop(e, section.id)}
                            >
                                {/* Section Header */}
                                <div 
                                    className="p-4 border-b border-gray-200"
                                    style={{ backgroundColor: `${section.section_color}15` }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-md font-semibold text-gray-900">
                                            Section {sectionIndex + 1}
                                        </h3>
                                        <button
                                            onClick={() => handleRemoveSection(section.id)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                            title="Remove section"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Application Type
                                            </label>
                                            <select
                                                value={section.app_type_id || ''}
                                                onChange={(e) => handleSectionAppTypeChange(section.id, e.target.value)}
                                                disabled={!!section.custom_name}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent disabled:bg-gray-100"
                                            >
                                                <option value="">Select type...</option>
                                                {appTypes.map(at => (
                                                    <option key={at.id} value={at.id}>
                                                        {at.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                OR Custom Name
                                            </label>
                                            <input
                                                type="text"
                                                value={section.custom_name}
                                                onChange={(e) => handleSectionCustomNameChange(section.id, e.target.value)}
                                                placeholder="e.g., Ceiling Insulation"
                                                disabled={!!section.app_type_id}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent disabled:bg-gray-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Line Items */}
                                <div className="p-4">
                                    {section.line_items.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                            <p className="text-gray-500 mb-3">No products added</p>
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleAddProduct(section.id)}
                                                    className="px-3 py-1.5 bg-[#0066CC] text-white text-sm rounded-lg hover:bg-[#0052A3] transition"
                                                >
                                                    Add Product
                                                </button>
                                                <button
                                                    onClick={() => handleAddLabour(section.id)}
                                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition"
                                                >
                                                    Add Labour
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {section.line_items.map((item, itemIndex) => {
                                        const searchKey = `${section.id}-${item.id}`;
                                        const filteredProducts = getFilteredProducts(searchKey);
                                        const showSuggestions = showProductSuggestions[searchKey] && filteredProducts.length > 0;

                                        return (
                                            <div
                                                key={item.id}
                                                draggable
                                                onDragStart={() => handleDragStart(section.id, item.id)}
                                                className="border border-gray-200 rounded-lg p-3 mb-3 hover:bg-gray-50 transition"
                                            >
                                                <div className="flex items-start gap-2 mb-2">
                                                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move mt-1" />
                                                    <div className="flex-1 grid grid-cols-12 gap-2 items-start">
                                                        {/* Marker */}
                                                        <div className="col-span-1">
                                                            <input
                                                                type="text"
                                                                value={item.marker || ''}
                                                                onChange={(e) => handleMarkerChange(section.id, item.id, e.target.value)}
                                                                placeholder="A"
                                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center font-semibold focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                                                maxLength={2}
                                                            />
                                                        </div>

                                                        {/* Product Search / Labour Label */}
                                                        {item.is_labour ? (
                                                            <div className="col-span-5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                                                                <span className="text-sm font-medium text-blue-800">Labour</span>
                                                            </div>
                                                        ) : (
                                                            <div className="col-span-5 relative">
                                                                <input
                                                                    type="text"
                                                                    value={productSearch[searchKey] || (item.product?.sku || '')}
                                                                    onChange={(e) => {
                                                                        setProductSearch({ ...productSearch, [searchKey]: e.target.value });
                                                                        setShowProductSuggestions({ ...showProductSuggestions, [searchKey]: true });
                                                                    }}
                                                                    onFocus={() => setShowProductSuggestions({ ...showProductSuggestions, [searchKey]: true })}
                                                                    placeholder="Search product..."
                                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                                                />
                                                                {showSuggestions && (
                                                                    <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                                                                        {filteredProducts.slice(0, 10).map(p => {
                                                                            const stockDisplay = getStockStatusDisplay(p.stock_status || 'LOW_STOCK', p.stock_level);
                                                                            return (
                                                                                <div
                                                                                    key={p.id}
                                                                                    onClick={() => {
                                                                                        handleProductSelect(section.id, item.id, p.id);
                                                                                        setProductSearch({ ...productSearch, [searchKey]: '' });
                                                                                    }}
                                                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                                                >
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div>
                                                                                            <p className="text-sm font-medium text-gray-900">{p.sku}</p>
                                                                                            <p className="text-xs text-gray-600">{p.product_description}</p>
                                                                                            <p className="text-xs text-gray-500">R{p.r_value} | Bale: {p.bale_size_sqm}m²</p>
                                                                                        </div>
                                                                                        <span className={`text-xs px-2 py-1 rounded-full ${stockDisplay.bg} ${stockDisplay.color}`}>
                                                                                            {stockDisplay.label}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                                {item.product && (
                                                                    <p className="text-xs text-gray-600 mt-1">
                                                                        {item.product.product_description} | Bale: {item.product.bale_size_sqm}m²
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Area */}
                                                        <div className="col-span-2">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.area_sqm || ''}
                                                                onChange={(e) => handleAreaChange(section.id, item.id, parseFloat(e.target.value) || 0)}
                                                                placeholder="Area m²"
                                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                                            />
                                                        </div>

                                                        {/* Packs */}
                                                        <div className="col-span-1 flex items-center justify-center">
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {item.is_labour ? '-' : (item.packs_required || 0)}
                                                            </span>
                                                        </div>

                                                        {/* GP% or Custom Margin */}
                                                        {pricingTier === 'Custom' && !item.is_labour && item.product_id ? (
                                                            <div className="col-span-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={customProductMargins[item.product_id]?.margin_percent ?? item.margin_percent}
                                                                    onChange={(e) => {
                                                                        const newMargin = parseFloat(e.target.value) || 0;
                                                                        handleCustomMarginChange(item.product_id!, newMargin, item.cost_price);
                                                                    }}
                                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="col-span-2 flex items-center justify-end">
                                                                <span className="text-sm text-gray-600">
                                                                    {item.margin_percent.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Total */}
                                                        <div className="col-span-2 flex items-center justify-end">
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                ${item.line_sell.toFixed(2)}
                                                            </span>
                                                        </div>

                                                        {/* Delete */}
                                                        <div className="col-span-1 flex items-center justify-center">
                                                            <button
                                                                onClick={() => handleRemoveLineItem(section.id, item.id)}
                                                                className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {item.stock_warning && (
                                                    <div className="ml-7 mt-2 p-2 bg-orange-50 border border-orange-200 rounded flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                                                        <span className="text-xs text-orange-700">{item.stock_warning}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Add Product/Labour Buttons */}
                                    {section.line_items.length > 0 && (
                                        <div className="flex items-center gap-2 mt-3">
                                            <button
                                                onClick={() => handleAddProduct(section.id)}
                                                className="px-3 py-1.5 bg-[#0066CC] text-white text-sm rounded-lg hover:bg-[#0052A3] transition flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Product
                                            </button>
                                            <button
                                                onClick={() => handleAddLabour(section.id)}
                                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Labour
                                            </button>
                                        </div>
                                    )}

                                    {/* Section Totals */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Section Total:</span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-gray-600">
                                                    GP: {sectionTotals.margin.toFixed(1)}%
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    ${sectionTotals.totalSell.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quote Totals */}
                {sections.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h2>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Total Cost (ex GST):</span>
                                <span className="font-medium text-gray-900">${totals.totalCost.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Total Sell (ex GST):</span>
                                <span className="font-medium text-gray-900">${totals.totalSell.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Overall GP%:</span>
                                <span className={`font-medium ${
                                    totals.overallMargin >= targetGP ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                    {totals.overallMargin.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">GST (15%):</span>
                                <span className="font-medium text-gray-900">${totals.gstAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-lg font-bold border-t pt-2 mt-2">
                                <span className="text-gray-900">Total (Excl GST):</span>
                                <span className="text-[#0066CC]">${totals.totalIncGst.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}