'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, X, AlertTriangle, Check, CheckCircle, ArrowLeft, Printer, Mail, Edit2 } from 'lucide-react';

// Helper function for date formatting (dd-mm-yyyy)
const formatDateDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

// Types
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
    quantity_available?: number;
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

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_id?: string;
    companies?: {
        company_name: string;
    };
}

interface LineItem {
    id: string;
    db_id?: string;
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
    db_id?: string;
    app_type_id: string | null;
    app_type?: ApplicationType;
    custom_name: string;
    section_color?: string;
    line_items: LineItem[];
}

interface CustomProductMargin {
    margin_percent: number;
    sell_price: number;
}

interface Quote {
    id: string;
    quote_number: string;
    client_id: string;
    site_address: string;
    city: string;
    postcode: string;
    region_id: string;
    job_type: string;
    sales_rep_id: string;
    status: string;
    quote_date: string;
    valid_until: string;
    notes: string;
    pricing_tier: string;
    markup_percent: number;
    waste_percent: number;
    labour_rate_per_sqm?: number;
    labour_rate?: number; // Legacy field
    custom_product_margins?: { [productId: string]: CustomProductMargin };
    clients?: Client;
}

export default function QuoteDetailPage() {
    const router = useRouter();
    const params = useParams();
    const quoteId = params.id as string;

    // Quote header fields
    const [quote, setQuote] = useState<Quote | null>(null);
    const [quoteNumber, setQuoteNumber] = useState('');
    const [quoteDate, setQuoteDate] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [quoteStatus, setQuoteStatus] = useState('Draft');
    const [reference, setReference] = useState('');

    // Client
    const [clientId, setClientId] = useState('');
    const [clientName, setClientName] = useState('');
    const [companyName, setCompanyName] = useState('');

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
    const [labourCost] = useState(1.50);

    // Line items
    const [sections, setSections] = useState<Section[]>([]);
    const [nextSectionId, setNextSectionId] = useState(1);
    const [nextLineItemId, setNextLineItemId] = useState(1);

    // Custom product margins
    const [customProductMargins, setCustomProductMargins] = useState<{ [productId: string]: CustomProductMargin }>({});

    // Lookups
    const [products, setProducts] = useState<Product[]>([]);
    const [appTypes, setAppTypes] = useState<ApplicationType[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [salesReps, setSalesReps] = useState<TeamMember[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [sending, setSending] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [productSearch, setProductSearch] = useState<{ [key: string]: string }>({});
    const [showProductSuggestions, setShowProductSuggestions] = useState<{ [key: string]: boolean }>({});

    // Get markup percent based on tier
    const getMarkupPercent = useCallback(() => {
        if (pricingTier === 'Custom') return markupPercent;
        const defaults: { [key: string]: number } = {
            'Retail': 60,
            'Trade': 40,
            'VIP': 25,
        };
        return defaults[pricingTier] || 60;
    }, [pricingTier, markupPercent]);

    // Calculate line item values
    const calculateLineItem = useCallback((lineItem: LineItem, product: Product, customMargin?: CustomProductMargin): Partial<LineItem> => {
        const area = parseFloat(String(lineItem.area_sqm)) || 0;
        const waste = wastePercent / 100;
        const areaWithWaste = area * (1 + waste);
        const baleSize = product.bale_size_sqm || 1;
        const packsRequired = Math.ceil(areaWithWaste / baleSize);

        const lineCost = packsRequired * product.pack_price;
        
        let lineSell: number;
        let marginPercent: number;

        if (customMargin) {
            marginPercent = customMargin.margin_percent;
            lineSell = lineCost / (1 - marginPercent / 100);
        } else {
            const markup = getMarkupPercent();
            lineSell = lineCost * (1 + markup / 100);
            marginPercent = lineSell > 0 ? ((lineSell - lineCost) / lineSell) * 100 : 0;
        }

        let stockWarning: string | undefined;
        if (product.quantity_available !== undefined && packsRequired > product.quantity_available) {
            stockWarning = `⚠️ Only ${product.quantity_available} packs available, ${packsRequired} required`;
        }

        return {
            packs_required: packsRequired,
            line_cost: parseFloat(lineCost.toFixed(2)),
            line_sell: parseFloat(lineSell.toFixed(2)),
            margin_percent: parseFloat(marginPercent.toFixed(1)),
            stock_warning: stockWarning,
        };
    }, [wastePercent, getMarkupPercent]);

    // Calculate labour line item
    const calculateLabourItem = useCallback((area: number): Partial<LineItem> => {
        const lineCost = area * labourCost;
        const lineSell = area * labourRate;
        const marginPercent = lineSell > 0 ? ((lineSell - lineCost) / lineSell) * 100 : 0;

        return {
            line_cost: parseFloat(lineCost.toFixed(2)),
            line_sell: parseFloat(lineSell.toFixed(2)),
            margin_percent: parseFloat(marginPercent.toFixed(1)),
        };
    }, [labourCost, labourRate]);

    // Recalculate all line items when global settings change
    const recalculateAllLineItems = useCallback(() => {
        setSections(prevSections => prevSections.map(section => ({
            ...section,
            line_items: section.line_items.map(item => {
                if (item.is_labour) {
                    const labourCalc = calculateLabourItem(item.area_sqm);
                    return { ...item, ...labourCalc };
                } else if (item.product) {
                    const customMargin = item.product_id ? customProductMargins[item.product_id] : undefined;
                    const calc = calculateLineItem(item, item.product, customMargin);
                    return { ...item, ...calc };
                }
                return item;
            })
        })));
    }, [calculateLabourItem, calculateLineItem, customProductMargins]);

    // Effect to recalculate when global settings change
    useEffect(() => {
        if (sections.length > 0 && isEditing) {
            recalculateAllLineItems();
        }
    }, [labourRate, wastePercent, pricingTier, markupPercent]);

    // Load quote data
    useEffect(() => {
        loadQuoteData();
        loadLookupData();
    }, [quoteId]);

    const loadLookupData = async () => {
        try {
            const [productsRes, stockRes, appTypesRes, regionsRes, teamMembersRes] = await Promise.all([
                supabase.from('products').select('*'),
                supabase.from('stock_levels').select('product_id, quantity_available, reorder_level'),
                supabase.from('app_types').select('*').order('sort_order'),
                supabase.from('regions').select('*').order('name'),
                supabase.from('team_members').select('*').order('first_name'),
            ]);

            if (productsRes.data) {
                const stockMap = new Map();
                if (stockRes.data) {
                    stockRes.data.forEach((s: any) => {
                        stockMap.set(s.product_id, {
                            quantity_available: s.quantity_available,
                            reorder_level: s.reorder_level
                        });
                    });
                }

                const activeProducts = productsRes.data
                    .filter((p: any) => p.is_active !== false && p.is_labour !== true)
                    .map((p: any) => {
                        const stock = stockMap.get(p.id);
                        let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
                        if (stock) {
                            if (stock.quantity_available <= 0) stockStatus = 'OUT_OF_STOCK';
                            else if (stock.quantity_available < stock.reorder_level) stockStatus = 'LOW_STOCK';
                        }
                        return {
                            ...p,
                            quantity_available: stock?.quantity_available ?? 0,
                            reorder_level: stock?.reorder_level ?? 20,
                            stock_status: stockStatus
                        };
                    });
                setProducts(activeProducts as Product[]);
            }

            if (appTypesRes.data) {
                const activeAppTypes = appTypesRes.data.filter((at: any) => at.is_active !== false);
                setAppTypes(activeAppTypes as ApplicationType[]);
            }
            if (regionsRes.data) setRegions(regionsRes.data as Region[]);
            if (teamMembersRes.data) {
                const activeSalesReps = teamMembersRes.data.filter((tm: any) => 
                    tm.is_active !== false && tm.role === 'Sales Rep'
                );
                setSalesReps(activeSalesReps as TeamMember[]);
            }
        } catch (error) {
            console.error('Error loading lookup data:', error);
        }
    };

    const loadQuoteData = async () => {
        try {
            setLoading(true);

            // Load quote header with client
            const { data: quoteData, error: quoteError } = await supabase
                .from('quotes')
                .select(`
                    *,
                    clients (
                        id,
                        first_name,
                        last_name,
                        email,
                        phone,
                        companies (company_name)
                    )
                `)
                .eq('id', quoteId)
                .single();

            if (quoteError) throw quoteError;
            if (!quoteData) throw new Error('Quote not found');

            setQuote(quoteData);
            setQuoteNumber(quoteData.quote_number || '');
            setQuoteDate(quoteData.quote_date || '');
            setValidUntil(quoteData.valid_until || '');
            setQuoteStatus(quoteData.status || 'Draft');
            setSiteAddress(quoteData.site_address || '');
            setCity(quoteData.city || '');
            setPostcode(quoteData.postcode || '');
            setRegionId(quoteData.region_id || '');
            setJobType(quoteData.job_type || '');
            setSalesRepId(quoteData.sales_rep_id || '');
            setNotes(quoteData.notes || '');
            setPricingTier(quoteData.pricing_tier || 'Retail');
            setMarkupPercent(quoteData.markup_percent || 60);
            setWastePercent(quoteData.waste_percent || 10);
            setLabourRate(quoteData.labour_rate_per_sqm || quoteData.labour_rate || 3.00);

            if (quoteData.custom_product_margins) {
                setCustomProductMargins(quoteData.custom_product_margins);
            }

            if (quoteData.clients) {
                setClientId(quoteData.clients.id);
                setClientName(`${quoteData.clients.first_name} ${quoteData.clients.last_name}`);
                setCompanyName(quoteData.clients.companies?.company_name || '');
            }

            // Load sections
            const { data: sectionsData, error: sectionsError } = await supabase
                .from('quote_sections')
                .select('*')
                .eq('quote_id', quoteId)
                .order('sort_order');

            if (sectionsError) throw sectionsError;

            // Load line items for all sections
            const sectionIds = sectionsData?.map(s => s.id) || [];
            let lineItemsData: any[] = [];

            if (sectionIds.length > 0) {
                const { data: itemsData, error: itemsError } = await supabase
                    .from('quote_line_items')
                    .select('*')
                    .in('section_id', sectionIds)
                    .order('sort_order');

                if (itemsError) throw itemsError;
                lineItemsData = itemsData || [];
            }

            // Load products for line items
            const productIds = lineItemsData
                .filter(li => li.product_id)
                .map(li => li.product_id);

            let productsMap = new Map();
            if (productIds.length > 0) {
                const { data: productsData } = await supabase
                    .from('products')
                    .select('*')
                    .in('id', productIds);

                if (productsData) {
                    productsData.forEach(p => productsMap.set(p.id, p));
                }
            }

            // Build sections with line items
            const loadedSections: Section[] = (sectionsData || []).map((section, sIndex) => {
                const sectionLineItems = lineItemsData
                    .filter(li => li.section_id === section.id)
                    .map((li, liIndex) => {
                        const product = li.product_id ? productsMap.get(li.product_id) : null;
                        return {
                            id: `${sIndex + 1}-${liIndex + 1}`,
                            db_id: li.id,
                            marker: li.marker || '',
                            product_id: li.product_id,
                            product: product || (li.is_labour ? {
                                id: 'labour',
                                sku: 'LABOUR',
                                product_description: li.description || 'Labour',
                                category: 'Labour',
                                r_value: '',
                                application_type: '',
                                bale_size_sqm: 0,
                                cost_price: labourCost,
                                retail_price: labourRate,
                                pack_price: 0,
                                waste_percentage: 0
                            } : undefined),
                            area_sqm: li.area_sqm || 0,
                            is_labour: li.is_labour || false,
                            parent_line_item_id: li.parent_line_item_id || undefined,
                            cost_price: li.cost_price || 0,
                            sell_price: li.sell_price || 0,
                            line_cost: li.line_cost || 0,
                            line_sell: li.line_sell || 0,
                            margin_percent: li.margin_percent || 0,
                            packs_required: li.packs_required || 0,
                        } as LineItem;
                    });

                return {
                    id: `${sIndex + 1}`,
                    db_id: section.id,
                    app_type_id: section.app_type_id,
                    custom_name: section.custom_name || '',
                    section_color: section.section_color || '#ffffff',
                    line_items: sectionLineItems,
                } as Section;
            });

            setSections(loadedSections);
            setNextSectionId(loadedSections.length + 1);
            
            // Calculate next line item ID
            let maxLineItemId = 0;
            loadedSections.forEach(s => {
                s.line_items.forEach(li => {
                    const parts = li.id.split('-');
                    const num = parseInt(parts[1] || '0');
                    if (num > maxLineItemId) maxLineItemId = num;
                });
            });
            setNextLineItemId(maxLineItemId + 1);

        } catch (error: any) {
            console.error('Error loading quote:', error);
            setError(error.message);
        } finally {
            setLoading(false);
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
                if (field === 'app_type_id') {
                    if (value) {
                        const appType = appTypes.find(at => at.id === value);
                        updated.app_type = appType;
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
        const newId = `${sectionId}-${nextLineItemId}`;
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    line_items: [...s.line_items, {
                        id: newId,
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
                const filteredItems = s.line_items.filter(li => 
                    li.id !== lineItemId && li.parent_line_item_id !== lineItemId
                );
                return { ...s, line_items: filteredItems };
            }
            return s;
        }));
    };

    const addLabourRow = (sectionId: string, productLineItemId: string, area: number) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;

        const sectionName = section.app_type?.name || section.custom_name || 'Section';
        const labourCalc = calculateLabourItem(area);

        const labourLineItem: LineItem = {
            id: `${sectionId}-${nextLineItemId}`,
            product_id: null,
            parent_line_item_id: productLineItemId,
            area_sqm: area,
            is_labour: true,
            cost_price: labourCost,
            sell_price: labourRate,
            line_cost: labourCalc.line_cost || 0,
            line_sell: labourCalc.line_sell || 0,
            margin_percent: labourCalc.margin_percent || 0,
            product: {
                id: 'labour',
                sku: 'LABOUR',
                product_description: `Labour - ${sectionName}`,
                category: 'Labour',
                r_value: '',
                application_type: '',
                bale_size_sqm: 0,
                cost_price: labourCost,
                retail_price: labourRate,
                pack_price: 0,
                waste_percentage: 0
            },
        };

        setSections(prevSections => prevSections.map(s => {
            if (s.id === sectionId) {
                const productIndex = s.line_items.findIndex(li => li.id === productLineItemId);
                const existingLabourIndex = s.line_items.findIndex(li => li.parent_line_item_id === productLineItemId);
                
                if (existingLabourIndex !== -1) {
                    const newLineItems = [...s.line_items];
                    newLineItems[existingLabourIndex] = {
                        ...newLineItems[existingLabourIndex],
                        area_sqm: area,
                        ...labourCalc
                    };
                    return { ...s, line_items: newLineItems };
                } else {
                    const newLineItems = [...s.line_items];
                    newLineItems.splice(productIndex + 1, 0, labourLineItem);
                    return { ...s, line_items: newLineItems };
                }
            }
            return s;
        }));

        setNextLineItemId(prev => prev + 1);
    };

    const updateLineItem = (sectionId: string, lineItemId: string, field: string, value: any) => {
        setSections(prevSections => prevSections.map(section => {
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

                                    const customMargin = customProductMargins[value];
                                    if (customMargin) {
                                        updated.sell_price = customMargin.sell_price;
                                    } else {
                                        const markup = getMarkupPercent();
                                        updated.sell_price = product.cost_price * (1 + markup / 100);
                                    }

                                    if (updated.area_sqm > 0) {
                                        const calculations = calculateLineItem(updated, product, customMargin);
                                        Object.assign(updated, calculations);
                                    }
                                }
                            }

                            if (field === 'area_sqm') {
                                const area = parseFloat(value) || 0;
                                updated.area_sqm = area;
                                
                                if (updated.product && !updated.is_labour) {
                                    const customMargin = updated.product_id ? customProductMargins[updated.product_id] : undefined;
                                    const calculations = calculateLineItem(updated, updated.product, customMargin);
                                    Object.assign(updated, calculations);
                                    
                                    if (area > 0) {
                                        setTimeout(() => addLabourRow(sectionId, lineItemId, area), 0);
                                    }
                                }
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

    const handleMarginChange = (sectionId: string, lineItemId: string, newMargin: number) => {
        if (newMargin >= 100 || newMargin < 0) return;

        setSections(prevSections => {
            let productId: string | null = null;
            let lineCost = 0;

            prevSections.forEach(section => {
                const item = section.line_items.find(li => li.id === lineItemId);
                if (item && item.product_id) {
                    productId = item.product_id;
                    lineCost = item.line_cost;
                }
            });

            if (!productId) return prevSections;

            const newSellPrice = lineCost / (1 - newMargin / 100);

            setCustomProductMargins(prev => ({
                ...prev,
                [productId!]: { margin_percent: newMargin, sell_price: newSellPrice }
            }));

            return prevSections.map(section => ({
                ...section,
                line_items: section.line_items.map(item => {
                    if (item.product_id === productId && !item.is_labour) {
                        const newLineSell = item.line_cost / (1 - newMargin / 100);
                        return {
                            ...item,
                            margin_percent: newMargin,
                            line_sell: parseFloat(newLineSell.toFixed(2))
                        };
                    }
                    return item;
                })
            }));
        });
    };

    const filterProducts = (searchTerm: string) => {
        // If no search term, show all products (up to 10)
        if (!searchTerm || searchTerm.length === 0) return products.slice(0, 10);

        // If search term is too short, don't filter yet
        if (searchTerm.length < 2) return [];

        const term = searchTerm.toLowerCase();
        return products.filter(p =>
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.product_description && p.product_description.toLowerCase().includes(term)) ||
            (p.r_value && p.r_value.toLowerCase().includes(term)) ||
            (p.application_type && p.application_type.toLowerCase().includes(term))
        ).slice(0, 10);
    };

    const getStockStatusBadge = (product: Product) => {
        if (product.stock_status === 'OUT_OF_STOCK') {
            return <span className="text-red-600 text-xs flex items-center gap-1"><X className="w-3 h-3" /> Out of Stock</span>;
        } else if (product.stock_status === 'LOW_STOCK') {
            return <span className="text-orange-600 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low ({product.quantity_available})</span>;
        }
        return <span className="text-green-600 text-xs flex items-center gap-1"><Check className="w-3 h-3" /> In Stock ({product.quantity_available})</span>;
    };

    const selectProduct = (sectionId: string, lineItemId: string, product: Product) => {
        if (product.stock_status === 'OUT_OF_STOCK') {
            alert('This product is out of stock. Please select a different product.');
            return;
        }

        updateLineItem(sectionId, lineItemId, 'product_id', product.id);
        setProductSearch({ ...productSearch, [`${sectionId}-${lineItemId}`]: '' });
        setShowProductSuggestions({ ...showProductSuggestions, [`${sectionId}-${lineItemId}`]: false });
    };

    const calculateSectionTotals = (section: Section) => {
        let totalCost = 0;
        let totalSell = 0;

        section.line_items.forEach(item => {
            totalCost += item.line_cost;
            totalSell += item.line_sell;
        });

        const grossProfit = totalSell - totalCost;
        const grossProfitPercent = totalSell > 0 ? (grossProfit / totalSell) * 100 : 0;

        return {
            totalCost: totalCost.toFixed(2),
            totalSell: totalSell.toFixed(2),
            grossProfit: grossProfit.toFixed(2),
            grossProfitPercent: grossProfitPercent.toFixed(1),
        };
    };

    const calculateQuoteTotals = () => {
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

    const totals = calculateQuoteTotals();

    const handleSave = async () => {
        try {
            setSaving(true);

            // Update quote header
            const { error: quoteError } = await supabase
                .from('quotes')
                .update({
                    quote_number: quoteNumber || null,
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
                    labour_rate_per_sqm: labourRate,
                    total_cost_ex_gst: parseFloat(totals.totalCostExGST),
                    total_sell_ex_gst: parseFloat(totals.totalSellExGST),
                    gst_amount: parseFloat(totals.gstAmount),
                    total_inc_gst: parseFloat(totals.totalIncGST),
                    subtotal: parseFloat(totals.totalSellExGST),
                    total_amount: parseFloat(totals.totalIncGST),
                    custom_product_margins: customProductMargins,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', quoteId);

            if (quoteError) throw quoteError;

            // Delete existing sections and line items
            await supabase
                .from('quote_sections')
                .delete()
                .eq('quote_id', quoteId);

            // Insert updated sections
            for (const section of sections) {
                const { data: sectionData, error: sectionError } = await supabase
                    .from('quote_sections')
                    .insert({
                        quote_id: quoteId,
                        app_type_id: section.app_type_id || null,
                        custom_name: section.custom_name,
                        section_color: section.section_color,
                        sort_order: parseInt(section.id)
                    })
                    .select()
                    .single();

                if (sectionError) throw sectionError;

                const itemsToInsert = section.line_items.map((item, index) => ({
                    section_id: sectionData.id,
                    product_id: item.is_labour ? null : (item.product_id || null),
                    marker: item.marker || null,
                    description: item.product?.product_description || (item.is_labour ? `Labour - ${section.app_type?.name || section.custom_name || 'Section'}` : 'Custom Item'),
                    area_sqm: item.area_sqm,
                    is_labour: item.is_labour,
                    parent_line_item_id: item.parent_line_item_id || null,
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

            setIsEditing(false);
            alert('Quote saved successfully!');

        } catch (error: any) {
            console.error('Error saving quote:', error);
            alert(`Error saving quote: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSendToCustomer = async () => {
        if (!confirm('Send this quote to the customer via email?')) {
            return;
        }

        setSending(true);
        try {
            const response = await fetch(`/api/send-quote-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quoteId: params.id }),
            });

            const result = await response.json();

            if (result.ok) {
                alert(`✓ Quote sent successfully!\n✉ Email sent to: ${result.sentTo}`);
                loadQuote(); // Refresh
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            alert('Failed to send quote');
            console.error(error);
        }
        setSending(false);
    };

    const handleAcceptQuote = async () => {
        if (!confirm('Customer has accepted this quote. Create a job now?')) {
            return;
        }

        setAccepting(true);
        try {
            const response = await fetch(`/api/quotes/${params.id}/accept`, {
                method: 'POST',
            });

            const result = await response.json();

            if (result.ok) {
                alert(`✓ Job created successfully!\n\nJob Number: ${result.jobNumber}\n\nRedirecting to job page...`);
                // Redirect to the new job
                router.push(`/jobs/${result.job.id}`);
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            alert('Failed to accept quote and create job');
            console.error(error);
        }
        setAccepting(false);
    };

    const handleDeleteQuote = async () => {
        if (!confirm(`Are you sure you want to delete quote ${quoteNumber}? This action cannot be undone.`)) {
            return;
        }

        try {
            // Delete line items
            await supabase.from('quote_line_items').delete().eq('quote_id', quoteId);

            // Delete sections
            await supabase.from('quote_sections').delete().eq('quote_id', quoteId);

            // Delete quote
            const { error } = await supabase.from('quotes').delete().eq('id', quoteId);

            if (error) {
                alert(`Failed to delete quote: ${error.message}`);
                return;
            }

            alert(`Quote ${quoteNumber} deleted successfully`);
            router.push('/quotes');
        } catch (error) {
            console.error('Error deleting quote:', error);
            alert('Failed to delete quote');
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
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3]"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold text-[#0066CC]">
                                {quoteNumber || 'Quote Details'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {clientName} {companyName && `- ${companyName}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            quoteStatus === 'Accepted' ? 'bg-green-100 text-green-800' :
                            quoteStatus === 'Sent' ? 'bg-blue-100 text-blue-800' :
                            quoteStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {quoteStatus}
                        </span>
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors"
                                >
                                    Edit Quote
                                </button>
                                <button
                                    onClick={() => window.open(`/api/quotes/${quoteId}/pdf`, '_blank')}
                                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                                    title="Print Quote"
                                >
                                    <Printer className="w-5 h-5 text-gray-600" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                                    <Mail className="w-5 h-5 text-gray-600" />
                                </button>
                                <button
                                    onClick={handleDeleteQuote}
                                    className="p-2 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Quote"
                                >
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                </button>
                                {quoteStatus === 'Draft' && parseFloat(calculateQuoteTotals().totalSellExGST) > 0 && (
                                    <button
                                        onClick={handleSendToCustomer}
                                        disabled={sending}
                                        className="px-4 py-2 bg-blue-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-[#0052a3] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Mail className="w-4 h-4" />
                                        {sending ? 'Sending...' : 'Send to Customer'}
                                    </button>
                                )}
                                {quote?.sent_at && (quoteStatus === 'Sent' || quoteStatus === 'Draft') && quoteStatus !== 'Accepted' && quoteStatus !== 'Won' && (
                                    <button
                                        onClick={handleAcceptQuote}
                                        disabled={accepting}
                                        className="px-4 py-2 bg-green-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        {accepting ? 'Creating Job...' : 'Customer Accepted - Create Job'}
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-[1400px] mx-auto">
                {/* Combined Client & Quote Info Card */}
                <div className="bg-white rounded-lg shadow mb-6">
                    {!isEditing ? (
                        /* VIEW MODE - Compact side-by-side layout */
                        <div className="p-5">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Client Information Column */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Client Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex"><span className="text-gray-500 w-28">Client:</span><span className="font-medium text-gray-900">{clientName || '--'}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Company:</span><span className="text-gray-900">{companyName || '--'}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Email:</span><span className="text-gray-900">{quote?.clients?.email || '--'}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Phone:</span><span className="text-gray-900">{quote?.clients?.phone || '--'}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Site Address:</span><span className="text-gray-900">{siteAddress || '--'}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">City:</span><span className="text-gray-900">{city || '--'}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Postcode:</span><span className="text-gray-900">{postcode || '--'}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Region:</span><span className="text-gray-900">{regions.find(r => r.id === regionId)?.name || '--'}</span></div>
                                    </div>
                                </div>

                                {/* Quote Details Column */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Quote Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex"><span className="text-gray-500 w-28">Quote No:</span><span className="font-medium text-gray-900">{quoteNumber}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Quote Date:</span><span className="text-gray-900">{formatDateDisplay(quoteDate)}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Valid Until:</span><span className="text-gray-900">{formatDateDisplay(validUntil)}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Reference:</span><span className="text-gray-900">{reference || '--'}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Job Type:</span><span className="text-gray-900">{jobType || '--'}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Sales Rep:</span><span className="text-gray-900">{(() => { const sr = salesReps.find(s => s.id === salesRepId); return sr ? `${sr.first_name} ${sr.last_name}` : '--'; })()}</span></div>
                                        <div className="flex"><span className="text-gray-500 w-28">Status:</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                quoteStatus === 'Accepted' ? 'bg-green-100 text-green-800' :
                                                quoteStatus === 'Sent' ? 'bg-blue-100 text-blue-800' :
                                                quoteStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>{quoteStatus}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Tier Bar */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Pricing Tier:</span>
                                        <span className="px-2 py-0.5 bg-[#0066CC] text-white rounded text-xs font-medium">{pricingTier}</span>
                                    </div>
                                    <div><span className="text-gray-500">Labour Rate:</span><span className="ml-1 font-medium">${labourRate}/m²</span></div>
                                    <div><span className="text-gray-500">Waste:</span><span className="ml-1 font-medium">{wastePercent}%</span></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* EDIT MODE - Form inputs */
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Client Information Column */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Client Information</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
                                                <input type="text" value={clientName} disabled className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-gray-50" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                                                <input type="text" value={companyName} disabled className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-gray-50" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Site Address</label>
                                            <input type="text" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                                                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Postcode</label>
                                                <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
                                                <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                                                    <option value="">Select...</option>
                                                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Job Type</label>
                                                <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                                                    <option value="">Select...</option>
                                                    <option value="New Build">New Build</option>
                                                    <option value="Retrofit">Retrofit</option>
                                                    <option value="Renovation">Renovation</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Sales Rep</label>
                                                <select value={salesRepId} onChange={(e) => setSalesRepId(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                                                    <option value="">Select...</option>
                                                    {salesReps.map(sr => <option key={sr.id} value={sr.id}>{sr.first_name} {sr.last_name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quote Details Column */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Quote Details</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Quote Number</label>
                                                <input type="text" value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                                <select value={quoteStatus} onChange={(e) => setQuoteStatus(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                                                    <option>Draft</option>
                                                    <option>Sent</option>
                                                    <option>Accepted</option>
                                                    <option>Rejected</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Quote Date</label>
                                                <input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Valid Until</label>
                                                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
                                            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Tier Bar - Edit Mode */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <span className="text-sm font-medium text-gray-700">Pricing Tier:</span>
                                    {['Retail', 'Trade', 'VIP', 'Custom'].map(tier => (
                                        <button
                                            key={tier}
                                            onClick={() => setPricingTier(tier)}
                                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${pricingTier === tier ? 'bg-[#0066CC] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            {tier}
                                        </button>
                                    ))}
                                    <div className="h-6 w-px bg-gray-300"></div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-700">Labour $/m²:</label>
                                        <input type="number" step="0.01" value={labourRate} onChange={(e) => setLabourRate(parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-700">Waste %:</label>
                                        <input type="number" value={wastePercent} onChange={(e) => setWastePercent(parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sections */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Products & Services</h3>

                    {sections.map((section) => {
                        const sectionTotals = calculateSectionTotals(section);
                        const appType = appTypes.find(at => at.id === section.app_type_id);
                        
                        return (
                            <div key={section.id} className="mb-6 border border-gray-200 rounded-lg p-4">
                                {/* Section Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    {isEditing ? (
                                        <>
                                            <select
                                                value={section.app_type_id || ''}
                                                onChange={(e) => updateSection(section.id, 'app_type_id', e.target.value || null)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-medium"
                                                style={{
                                                    backgroundColor: section.section_color || '#ffffff',
                                                    color: '#000000'
                                                }}
                                            >
                                                <option value="">Select application type...</option>
                                                {appTypes.map(at => (
                                                    <option key={at.id} value={at.id}>{at.name}</option>
                                                ))}
                                            </select>

                                            <span className="text-gray-500">or</span>

                                            <input
                                                type="text"
                                                value={section.custom_name}
                                                onChange={(e) => updateSection(section.id, 'custom_name', e.target.value)}
                                                placeholder="Custom section name..."
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded"
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
                                                <input
                                                    type="text"
                                                    value={section.section_color || '#ffffff'}
                                                    onChange={(e) => {
                                                        const hex = e.target.value;
                                                        if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                                                            updateSection(section.id, 'section_color', hex);
                                                        }
                                                    }}
                                                    placeholder="#ffffff"
                                                    className="w-20 px-1 py-0.5 text-xs border border-gray-200 rounded"
                                                    maxLength={7}
                                                />
                                            </div>

                                            <button
                                                onClick={() => removeSection(section.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </>
                                    ) : (
                                        <div 
                                            className="flex-1 px-3 py-2 rounded text-sm font-medium"
                                            style={{
                                                backgroundColor: section.section_color || '#f3f4f6',
                                                color: '#000000'
                                            }}
                                        >
                                            {appType?.name || section.custom_name || 'Section'}
                                        </div>
                                    )}
                                </div>

                                {/* Line Items Table */}
                                <div className="overflow-visible">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-2 px-2 text-gray-700 font-semibold w-20">Marker</th>
                                                <th className="text-left py-2 px-2 text-gray-700 font-semibold">Product</th>
                                                <th className="text-left py-2 px-2 text-gray-700 font-semibold w-24">Area m²</th>
                                                <th className="text-center py-2 px-2 text-gray-700 font-semibold w-16">Packs</th>
                                                <th className="text-right py-2 px-2 text-gray-700 font-semibold w-24">Cost ex</th>
                                                <th className="text-right py-2 px-2 text-gray-700 font-semibold w-24">Sell ex</th>
                                                <th className="text-right py-2 px-2 text-gray-700 font-semibold w-24">GP%</th>
                                                {isEditing && <th className="w-10"></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.line_items.map((item) => (
                                                <tr key={item.id} className={`border-b border-gray-100 ${item.is_labour ? 'bg-gray-50' : ''}`}>
                                                    <td className="py-2 px-2">
                                                        {!item.is_labour && isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={item.marker || ''}
                                                                onChange={(e) => updateLineItem(section.id, item.id, 'marker', e.target.value)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                                placeholder="e.g. W1"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-600">{item.marker}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        {!item.is_labour && isEditing ? (
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        showProductSuggestions[`${section.id}-${item.id}`] 
                                                                            ? (productSearch[`${section.id}-${item.id}`] || '') 
                                                                            : (item.product?.product_description || '')
                                                                    }
                                                                    onChange={(e) => {
                                                                        setProductSearch({ ...productSearch, [`${section.id}-${item.id}`]: e.target.value });
                                                                        setShowProductSuggestions({ ...showProductSuggestions, [`${section.id}-${item.id}`]: true });
                                                                    }}
                                                                    onFocus={() => {
                                                                        setShowProductSuggestions({ ...showProductSuggestions, [`${section.id}-${item.id}`]: true });
                                                                        if (item.product) {
                                                                            setProductSearch({ ...productSearch, [`${section.id}-${item.id}`]: '' });
                                                                        }
                                                                    }}
                                                                    onBlur={() => {
                                                                        setTimeout(() => {
                                                                            setShowProductSuggestions({ ...showProductSuggestions, [`${section.id}-${item.id}`]: false });
                                                                        }, 200);
                                                                    }}
                                                                    placeholder="Type to search..."
                                                                    className="w-full px-3 py-1 border border-gray-300 rounded text-sm pr-8"
                                                                />
                                                                <Search className="absolute right-2 top-1.5 w-4 h-4 text-gray-400" />

                                                                {showProductSuggestions[`${section.id}-${item.id}`] && (
                                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                                        {filterProducts(productSearch[`${section.id}-${item.id}`] || '').map(p => (
                                                                            <button
                                                                                key={p.id}
                                                                                onClick={() => selectProduct(section.id, item.id, p)}
                                                                                className={`w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0 ${p.stock_status === 'OUT_OF_STOCK' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                                disabled={p.stock_status === 'OUT_OF_STOCK'}
                                                                            >
                                                                                <div className="flex justify-between items-start">
                                                                                    <div>
                                                                                        <div className="font-medium text-gray-900">{p.product_description}</div>
                                                                                        <div className="text-xs text-gray-600">{p.sku} | {p.r_value}</div>
                                                                                    </div>
                                                                                    <div className="ml-2">
                                                                                        {getStockStatusBadge(p)}
                                                                                    </div>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                        {filterProducts(productSearch[`${section.id}-${item.id}`] || '').length === 0 && (
                                                                            <div className="px-3 py-2 text-sm text-gray-500">No products found</div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {item.stock_warning && (
                                                                    <div className="mt-1 text-xs text-orange-600 flex items-center gap-1">
                                                                        <AlertTriangle className="w-3 h-3" />
                                                                        {item.stock_warning}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className={item.is_labour ? 'text-gray-600 italic' : 'text-gray-900'}>
                                                                {item.product?.product_description}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        {!item.is_labour && isEditing ? (
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.area_sqm || ''}
                                                                onChange={(e) => updateLineItem(section.id, item.id, 'area_sqm', e.target.value)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                                placeholder="0"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-600">{item.area_sqm}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2 text-center">
                                                        {item.is_labour ? (
                                                            <span className="text-gray-400">-</span>
                                                        ) : item.packs_required ? (
                                                            <span className="font-semibold text-green-600">{item.packs_required}</span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2 text-right font-medium">${item.line_cost.toFixed(2)}</td>
                                                    <td className="py-2 px-2 text-right font-medium">${item.line_sell.toFixed(2)}</td>
                                                    <td className="py-2 px-2 text-right">
                                                        {item.is_labour || !isEditing ? (
                                                            <span className={item.margin_percent >= 30 ? 'text-green-600' : 'text-orange-600'}>
                                                                {item.margin_percent.toFixed(1)}%
                                                            </span>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={item.margin_percent || ''}
                                                                    onChange={(e) => handleMarginChange(section.id, item.id, parseFloat(e.target.value) || 0)}
                                                                    className={`w-16 px-1 py-0.5 border border-gray-300 rounded text-sm text-right ${item.margin_percent >= 30 ? 'text-green-600' : 'text-orange-600'}`}
                                                                />
                                                                <span className="text-gray-500">%</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    {isEditing && (
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
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {isEditing && (
                                    <button
                                        onClick={() => addLineItem(section.id)}
                                        className="mt-3 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Product
                                    </button>
                                )}

                                {/* Section Totals */}
                                {section.line_items.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-8 text-sm">
                                        <div>
                                            <span className="font-semibold text-gray-700">Total Cost ex GST:</span>
                                            <span className="ml-2 text-gray-900">${sectionTotals.totalCost}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Total Sell ex GST:</span>
                                            <span className="ml-2 text-gray-900">${sectionTotals.totalSell}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Gross Profit:</span>
                                            <span className="ml-2 text-green-600">${sectionTotals.grossProfit}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">GP Margin:</span>
                                            <span className="ml-2 text-green-600">{sectionTotals.grossProfitPercent}%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {isEditing && (
                        <button
                            onClick={addSection}
                            className="w-full px-4 py-3 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Section
                        </button>
                    )}
                </div>

                {/* Quote Summary */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase">Total Cost ex GST</p>
                            <p className="text-base font-bold text-gray-900">${totals.totalCostExGST}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase">Total Sell ex GST</p>
                            <p className="text-base font-bold text-gray-900">${totals.totalSellExGST}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600 uppercase">Gross Profit</p>
                            <p className="text-base font-bold text-green-700">${totals.grossProfit}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600 uppercase">GP Margin</p>
                            <p className="text-base font-bold text-green-700">{totals.grossProfitPercent}%</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600 uppercase">GST (15%)</p>
                            <p className="text-base font-bold text-blue-700">${totals.gstAmount}</p>
                        </div>
                        <div className="p-3 bg-[#0066CC] rounded-lg">
                            <p className="text-xs text-blue-200 uppercase">Total Inc GST</p>
                            <p className="text-base font-bold text-white">${totals.totalIncGST}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}