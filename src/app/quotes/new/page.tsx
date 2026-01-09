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

const LABOUR_COST_PER_SQM = 1.50;
const DEFAULT_LABOUR_SELL_PER_SQM = 3.00;
const DEFAULT_WASTE_PERCENT = 10;

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
                        // Labour row - recalculate based on labour rate
                        const labourCost = item.area_sqm * LABOUR_COST_PER_SQM;
                        const labourSell = item.area_sqm * labourRate;
                        const labourMargin = labourSell > 0 ? ((labourSell - labourCost) / labourSell) * 100 : 0;
                        return {
                            ...item,
                            cost_price: LABOUR_COST_PER_SQM,
                            sell_price: labourRate,
                            line_cost: labourCost,
                            line_sell: labourSell,
                            margin_percent: labourMargin
                        };
                    } else if (item.product_id && item.product) {
                        // Product row
                        const areaWithWaste = item.area_sqm * (1 + wastePercent / 100);
                        const packs = Math.ceil(areaWithWaste / (item.product.bale_size_sqm || 1));
                        const lineCost = packs * item.product.pack_price;
                        
                        // Check for custom margin
                        const customMargin = customProductMargins[item.product_id];
                        let sellPrice: number;
                        let marginPercent: number;
                        
                        if (customMargin) {
                            sellPrice = customMargin.sell_price;
                            marginPercent = customMargin.margin_percent;
                        } else {
                            // GP% formula: Sell = Cost / (1 - GP%/100)
                            sellPrice = targetGP < 100 ? item.product.pack_price / (1 - targetGP / 100) : item.product.pack_price;
                            marginPercent = targetGP;
                        }
                        
                        const lineSell = packs * sellPrice;
                        const actualMargin = lineSell > 0 ? ((lineSell - lineCost) / lineSell) * 100 : 0;

                        // Stock warning
                        let stockWarning = '';
                        if (item.product.stock_level !== undefined && packs > item.product.stock_level) {
                            stockWarning = `Need ${packs} packs, only ${item.product.stock_level} available`;
                        }

                        return {
                            ...item,
                            packs_required: packs,
                            cost_price: item.product.pack_price,
                            sell_price: sellPrice,
                            line_cost: lineCost,
                            line_sell: lineSell,
                            margin_percent: actualMargin,
                            stock_warning: stockWarning
                        };
                    }
                    return item;
                })
            }));
        });
    }, [labourRate, wastePercent, targetGP, customProductMargins]);

    // Recalculate when pricing controls change
    useEffect(() => {
        recalculateAllPrices();
    }, [recalculateAllPrices]);

    // ============================================
    // SECTION MANAGEMENT
    // ============================================
    const addSection = () => {
        const newSection: Section = {
            id: generateId(),
            app_type_id: null,
            custom_name: '',
            section_color: '#ffffff',
            line_items: []
        };
        setSections([...sections, newSection]);
    };

    const removeSection = (sectionId: string) => {
        setSections(sections.filter(s => s.id !== sectionId));
    };

    const updateSection = (sectionId: string, field: keyof Section, value: any) => {
        setSections(sections.map(section => {
            if (section.id === sectionId) {
                const updated = { ...section, [field]: value };
                
                // If app_type_id changed, update color
                if (field === 'app_type_id' && value) {
                    const appType = appTypes.find(at => at.id === value);
                    if (appType) {
                        updated.section_color = appType.color_hex;
                        updated.custom_name = '';
                    }
                } else if (field === 'app_type_id' && !value) {
                    updated.section_color = '#ffffff';
                }
                
                return updated;
            }
            return section;
        }));
    };

    // ============================================
    // LINE ITEM MANAGEMENT
    // ============================================
    const addLineItem = (sectionId: string) => {
        const newItem: LineItem = {
            id: generateId(),
            marker: '',
            product_id: null,
            area_sqm: 0,
            is_labour: false,
            cost_price: 0,
            sell_price: 0,
            line_cost: 0,
            line_sell: 0,
            margin_percent: 0
        };

        setSections(sections.map(section => {
            if (section.id === sectionId) {
                return { ...section, line_items: [...section.line_items, newItem] };
            }
            return section;
        }));
    };

    const removeLineItem = (sectionId: string, itemId: string) => {
        setSections(sections.map(section => {
            if (section.id === sectionId) {
                // Also remove associated labour row
                const updatedItems = section.line_items.filter(item => 
                    item.id !== itemId && item.parent_line_item_id !== itemId
                );
                return { ...section, line_items: updatedItems };
            }
            return section;
        }));
    };

    const updateLineItem = (sectionId: string, itemId: string, field: string, value: any) => {
        setSections(sections.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    line_items: section.line_items.map(item => {
                        if (item.id === itemId) {
                            const updated = { ...item, [field]: value };
                            return updated;
                        }
                        // Update labour row if parent's area changed
                        if (item.parent_line_item_id === itemId && field === 'area_sqm') {
                            return { ...item, area_sqm: value };
                        }
                        return item;
                    })
                };
            }
            return section;
        }));
    };

    const selectProduct = (sectionId: string, itemId: string, product: Product) => {
        if (product.stock_status === 'OUT_OF_STOCK') {
            alert('This product is out of stock. Please select a different product.');
            return;
        }

        setSections(prevSections => {
            return prevSections.map(section => {
                if (section.id === sectionId) {
                    let updatedItems = section.line_items.map(item => {
                        if (item.id === itemId) {
                            // Calculate sell price based on target GP%
                            const customMargin = customProductMargins[product.id];
                            let sellPrice: number;
                            
                            if (customMargin) {
                                sellPrice = customMargin.sell_price;
                            } else {
                                // GP% formula: Sell = Cost / (1 - GP%/100)
                                sellPrice = targetGP < 100 ? product.pack_price / (1 - targetGP / 100) : product.pack_price;
                            }

                            // Calculate packs and line totals
                            const areaWithWaste = item.area_sqm * (1 + wastePercent / 100);
                            const packs = item.area_sqm > 0 ? Math.ceil(areaWithWaste / (product.bale_size_sqm || 1)) : 0;
                            const lineCost = packs * product.pack_price;
                            const lineSell = packs * sellPrice;
                            
                            // GP% only calculated when there are actual values
                            const actualMargin = lineSell > 0 ? ((lineSell - lineCost) / lineSell) * 100 : 0;

                            // Stock warning
                            let stockWarning = '';
                            if (product.stock_level !== undefined && packs > 0 && packs > product.stock_level) {
                                stockWarning = `Need ${packs} packs, only ${product.stock_level} available`;
                            }

                            return {
                                ...item,
                                product_id: product.id,
                                product: product,
                                cost_price: product.pack_price,
                                sell_price: sellPrice,
                                margin_percent: actualMargin,
                                packs_required: packs,
                                line_cost: lineCost,
                                line_sell: lineSell,
                                stock_warning: stockWarning
                            };
                        }
                        return item;
                    });

                    // Add labour row if it doesn't exist for this product
                    const currentItem = updatedItems.find(i => i.id === itemId);
                    const hasLabourRow = updatedItems.some(i => i.parent_line_item_id === itemId);
                    
                    if (currentItem && !hasLabourRow && currentItem.area_sqm > 0) {
                        const labourCost = currentItem.area_sqm * LABOUR_COST_PER_SQM;
                        const labourSell = currentItem.area_sqm * labourRate;
                        const labourMargin = labourSell > 0 ? ((labourSell - labourCost) / labourSell) * 100 : 0;

                        const labourRow: LineItem = {
                            id: generateId(),
                            marker: '',
                            product_id: null,
                            area_sqm: currentItem.area_sqm,
                            is_labour: true,
                            parent_line_item_id: itemId,
                            cost_price: LABOUR_COST_PER_SQM,
                            sell_price: labourRate,
                            line_cost: labourCost,
                            line_sell: labourSell,
                            margin_percent: labourMargin
                        };

                        // Insert labour row right after the product row
                        const itemIndex = updatedItems.findIndex(i => i.id === itemId);
                        updatedItems.splice(itemIndex + 1, 0, labourRow);
                    }

                    return { ...section, line_items: updatedItems };
                }
                return section;
            });
        });

        // Clear search
        setProductSearch({ ...productSearch, [`${sectionId}-${itemId}`]: '' });
        setShowProductSuggestions({ ...showProductSuggestions, [`${sectionId}-${itemId}`]: false });
    };

    // Add labour row when area is entered (if product already selected)
    const handleAreaChange = (sectionId: string, itemId: string, newArea: number) => {
        setSections(prevSections => {
            return prevSections.map(section => {
                if (section.id === sectionId) {
                    let updatedItems = [...section.line_items];
                    const itemIndex = updatedItems.findIndex(i => i.id === itemId);
                    const currentItem = updatedItems[itemIndex];
                    
                    if (currentItem && !currentItem.is_labour) {
                        // Calculate product line totals
                        let packs = 0;
                        let lineCost = 0;
                        let lineSell = 0;
                        let marginPercent = 0;
                        let stockWarning = '';
                        
                        if (currentItem.product && newArea > 0) {
                            const areaWithWaste = newArea * (1 + wastePercent / 100);
                            packs = Math.ceil(areaWithWaste / (currentItem.product.bale_size_sqm || 1));
                            lineCost = packs * currentItem.cost_price;
                            lineSell = packs * currentItem.sell_price;
                            
                            // Calculate GP%
                            marginPercent = lineSell > 0 ? ((lineSell - lineCost) / lineSell) * 100 : 0;
                            
                            if (currentItem.product.stock_level !== undefined && packs > currentItem.product.stock_level) {
                                stockWarning = `Need ${packs} packs, only ${currentItem.product.stock_level} available`;
                            }
                        }
                        
                        // Update the product row
                        updatedItems[itemIndex] = { 
                            ...currentItem, 
                            area_sqm: newArea,
                            packs_required: packs,
                            line_cost: lineCost,
                            line_sell: lineSell,
                            margin_percent: marginPercent,
                            stock_warning: stockWarning
                        };
                        
                        // Check if labour row exists
                        const labourIndex = updatedItems.findIndex(i => i.parent_line_item_id === itemId);
                        
                        if (labourIndex >= 0) {
                            // Update existing labour row
                            const labourCost = newArea * LABOUR_COST_PER_SQM;
                            const labourSell = newArea * labourRate;
                            const labourMargin = labourSell > 0 ? ((labourSell - labourCost) / labourSell) * 100 : 0;
                            
                            updatedItems[labourIndex] = {
                                ...updatedItems[labourIndex],
                                area_sqm: newArea,
                                line_cost: labourCost,
                                line_sell: labourSell,
                                margin_percent: labourMargin
                            };
                        } else if (currentItem.product_id && newArea > 0) {
                            // Create new labour row
                            const labourCost = newArea * LABOUR_COST_PER_SQM;
                            const labourSell = newArea * labourRate;
                            const labourMargin = labourSell > 0 ? ((labourSell - labourCost) / labourSell) * 100 : 0;

                            const labourRow: LineItem = {
                                id: generateId(),
                                marker: '',
                                product_id: null,
                                area_sqm: newArea,
                                is_labour: true,
                                parent_line_item_id: itemId,
                                cost_price: LABOUR_COST_PER_SQM,
                                sell_price: labourRate,
                                line_cost: labourCost,
                                line_sell: labourSell,
                                margin_percent: labourMargin
                            };

                            updatedItems.splice(itemIndex + 1, 0, labourRow);
                        }
                    }

                    return { ...section, line_items: updatedItems };
                }
                return section;
            });
        });
    };

    // ============================================
    // MARGIN EDITING (Syncs across all sections)
    // ============================================
    const handleMarginChange = (sectionId: string, itemId: string, newMargin: number, productId: string) => {
        if (newMargin >= 100 || newMargin < 0) return;

        // Calculate new sell price from margin
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const newSellPrice = product.pack_price / (1 - newMargin / 100);

        // Update custom margins (this syncs across all sections)
        setCustomProductMargins(prev => ({
            ...prev,
            [productId]: {
                margin_percent: newMargin,
                sell_price: newSellPrice
            }
        }));
    };

    // ============================================
    // DRAG AND DROP BETWEEN SECTIONS
    // ============================================
    const handleDragStart = (e: React.DragEvent, sectionId: string, itemId: string) => {
        setDraggedItem({ sectionId, itemId });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverSection(sectionId);
    };

    const handleDragLeave = () => {
        setDragOverSection(null);
    };

    const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault();
        setDragOverSection(null);

        if (!draggedItem || draggedItem.sectionId === targetSectionId) {
            setDraggedItem(null);
            return;
        }

        setSections(prevSections => {
            const newSections = JSON.parse(JSON.stringify(prevSections));
            const sourceSection = newSections.find((s: Section) => s.id === draggedItem.sectionId);
            const targetSection = newSections.find((s: Section) => s.id === targetSectionId);
            
            if (!sourceSection || !targetSection) return prevSections;

            const itemIndex = sourceSection.line_items.findIndex((i: LineItem) => i.id === draggedItem.itemId);
            if (itemIndex === -1) return prevSections;
            
            const item = sourceSection.line_items[itemIndex];
            if (item.is_labour) return prevSections;

            // Find associated labour row
            const labourIndex = sourceSection.line_items.findIndex((i: LineItem) => i.parent_line_item_id === draggedItem.itemId);
            
            // Remove labour first if exists
            if (labourIndex > -1) {
                sourceSection.line_items.splice(labourIndex > itemIndex ? labourIndex : labourIndex, 1);
            }
            // Remove item (adjust index if labour was before)
            const adjustedIndex = labourIndex > -1 && labourIndex < itemIndex ? itemIndex - 1 : itemIndex;
            const [movedItem] = sourceSection.line_items.splice(adjustedIndex, 1);
            
            // Add to target
            targetSection.line_items.push(movedItem);
            
            // Re-add labour row
            if (labourIndex > -1 && movedItem.area_sqm > 0) {
                const labourCost = movedItem.area_sqm * LABOUR_COST_PER_SQM;
                const labourSell = movedItem.area_sqm * labourRate;
                const labourMargin = labourSell > 0 ? ((labourSell - labourCost) / labourSell) * 100 : 0;
                
                targetSection.line_items.push({
                    id: generateId(),
                    marker: '',
                    product_id: null,
                    area_sqm: movedItem.area_sqm,
                    is_labour: true,
                    parent_line_item_id: movedItem.id,
                    cost_price: LABOUR_COST_PER_SQM,
                    sell_price: labourRate,
                    line_cost: labourCost,
                    line_sell: labourSell,
                    margin_percent: labourMargin
                });
            }

            return newSections;
        });

        setDraggedItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverSection(null);
    };

    // ============================================
    // CALCULATE SECTION TOTALS
    // ============================================
    const calculateSectionTotals = (section: Section) => {
        let totalCost = 0;
        let totalSell = 0;

        section.line_items.forEach(item => {
            totalCost += item.line_cost || 0;
            totalSell += item.line_sell || 0;
        });

        const grossProfit = totalSell - totalCost;
        const marginPercent = totalSell > 0 ? (grossProfit / totalSell) * 100 : 0;

        return { totalCost, totalSell, grossProfit, marginPercent };
    };

    // ============================================
    // CALCULATE QUOTE TOTALS
    // ============================================
    const calculateQuoteTotals = () => {
        let totalCost = 0;
        let totalSell = 0;

        sections.forEach(section => {
            section.line_items.forEach(item => {
                totalCost += item.line_cost || 0;
                totalSell += item.line_sell || 0;
            });
        });

        const grossProfit = totalSell - totalCost;
        const marginPercent = totalSell > 0 ? (grossProfit / totalSell) * 100 : 0;
        const gstAmount = totalSell * 0.15;
        const totalIncGst = totalSell + gstAmount;

        return { totalCost, totalSell, grossProfit, marginPercent, gstAmount, totalIncGst };
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
            const { data: lastQuote } = await supabase
                .from('quotes')
                .select('quote_number')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            let quoteNumber = 'Q-2025-0001';
            if (lastQuote?.quote_number) {
                const match = lastQuote.quote_number.match(/Q-\d{4}-(\d+)/);
                if (match) {
                    const nextNum = parseInt(match[1]) + 1;
                    quoteNumber = `Q-2025-${nextNum.toString().padStart(4, '0')}`;
                }
            }

            // Insert quote
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
                    version: 1
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
    // FILTER PRODUCTS FOR SEARCH
    // ============================================
    const getFilteredProducts = (searchKey: string) => {
        const search = productSearch[searchKey]?.toLowerCase() || '';
        if (!search) return products.slice(0, 20);

        return products.filter(p => 
            p.product_description?.toLowerCase().includes(search) ||
            p.sku?.toLowerCase().includes(search) ||
            p.r_value?.toLowerCase().includes(search) ||
            p.category?.toLowerCase().includes(search)
        ).slice(0, 20);
    };

    // ============================================
    // RENDER
    // ============================================
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const quoteTotals = calculateQuoteTotals();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Add New Quote</h1>
                            <p className="text-sm text-gray-500 mt-1">Create a new quote for a client</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/quotes')}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSaveQuote('Draft')}
                                disabled={saving}
                                className="px-4 py-2 bg-white border border-[#0066CC] rounded-lg disabled:opacity-50 transition-colors"
                                style={{ color: '#0066CC' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button
                                onClick={() => handleSaveQuote('Sent')}
                                disabled={saving}
                                className="px-4 py-2 text-white bg-[#0066CC] rounded-lg hover:bg-[#0052a3] disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save & Send'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
                {/* Pricing Controls - Single Row */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Pricing Tier Label */}
                        <span className="text-sm font-medium text-gray-700">Pricing Tier:</span>
                        
                        {/* Tier Buttons */}
                        {(['Retail', 'Trade', 'VIP', 'Custom'] as PricingTier[]).map(tier => (
                            <button
                                key={tier}
                                onClick={() => handlePricingTierChange(tier)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    pricingTier === tier
                                        ? 'bg-[#0066CC] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {tier} {tier !== 'Custom' && `(${PRICING_TIER_GP[tier]}%)`}
                            </button>
                        ))}

                        {/* Divider */}
                        <div className="h-8 w-px bg-gray-300"></div>

                        {/* Custom GP % */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Custom GP %</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="99"
                                value={targetGP}
                                onChange={(e) => {
                                    setTargetGP(parseFloat(e.target.value) || 0);
                                    if (pricingTier !== 'Custom') setPricingTier('Custom');
                                }}
                                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                            />
                        </div>

                        {/* Labour Rate */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Labour $/m²</label>
                            <input
                                type="number"
                                step="0.01"
                                value={labourRate}
                                onChange={(e) => setLabourRate(parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                            />
                        </div>

                        {/* Waste % */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Waste %</label>
                            <input
                                type="number"
                                value={wastePercent}
                                onChange={(e) => setWastePercent(parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                            />
                        </div>

                        {/* Divider */}
                        <div className="h-8 w-px bg-gray-300"></div>

                        {/* Job Type */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Job Type</label>
                            <select
                                value={jobTypeId}
                                onChange={(e) => setJobTypeId(e.target.value)}
                                className="w-40 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                            >
                                <option value="">Select...</option>
                                {jobTypes.map(jt => (
                                    <option key={jt.id} value={jt.id}>{jt.name}</option>
                                ))}
                            </select>
                        </div>
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
                                            <option key={sr.id} value={sr.id}>{sr.first_name} {sr.last_name}</option>
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
                                        <option value="">Select property type...</option>
                                        {propertyTypes.map(pt => (
                                            <option key={pt} value={pt}>{pt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Quote Sections</h2>
                    </div>

                    {sections.map((section, sectionIndex) => {
                        const appType = appTypes.find(at => at.id === section.app_type_id);
                        const sectionTotals = calculateSectionTotals(section);

                        return (
                            <div 
                                key={section.id} 
                                className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-colors ${
                                    dragOverSection === section.id 
                                        ? 'border-[#0066CC] bg-blue-50' 
                                        : 'border-gray-200'
                                }`}
                                onDragOver={(e) => handleDragOver(e, section.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, section.id)}
                            >
                                {/* Section Header */}
                                <div 
                                    className="px-6 py-4 border-b border-gray-200"
                                    style={{ backgroundColor: section.section_color || '#f9fafb' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium text-gray-500">Section {sectionIndex + 1}</span>
                                        
                                        {/* Application Type Dropdown */}
                                        <select
                                            value={section.app_type_id || ''}
                                            onChange={(e) => updateSection(section.id, 'app_type_id', e.target.value || null)}
                                            className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                        >
                                            <option value="">Select application type...</option>
                                            {appTypes.map(at => (
                                                <option key={at.id} value={at.id}>{at.name}</option>
                                            ))}
                                        </select>

                                        <span className="text-gray-400">or</span>

                                        {/* Custom Name */}
                                        <input
                                            type="text"
                                            value={section.custom_name}
                                            onChange={(e) => updateSection(section.id, 'custom_name', e.target.value)}
                                            placeholder="Custom section name..."
                                            className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />

                                        {/* Color Picker */}
                                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 bg-white">
                                            <label className="text-xs text-gray-500">Color:</label>
                                            <input
                                                type="color"
                                                value={section.section_color || '#ffffff'}
                                                onChange={(e) => updateSection(section.id, 'section_color', e.target.value)}
                                                className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
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
                                                className="w-20 px-1 py-0.5 text-xs border border-gray-200 rounded"
                                                maxLength={7}
                                            />
                                        </div>

                                        {/* Delete Section */}
                                        <button
                                            onClick={() => removeSection(section.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Line Items Table */}
                                <div className="p-6">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="w-8"></th>
                                                <th className="text-left py-2 px-2 text-gray-700 font-semibold w-20">Marker</th>
                                                <th className="text-left py-2 px-2 text-gray-700 font-semibold">Product</th>
                                                <th className="text-left py-2 px-2 text-gray-700 font-semibold w-24">Area m²</th>
                                                <th className="text-center py-2 px-2 text-gray-700 font-semibold w-16">Packs</th>
                                                <th className="text-right py-2 px-2 text-gray-700 font-semibold w-24">Cost ex</th>
                                                <th className="text-right py-2 px-2 text-gray-700 font-semibold w-24">Sell ex</th>
                                                <th className="text-right py-2 px-2 text-gray-700 font-semibold w-24">GP%</th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.line_items.map((item) => (
                                                <tr 
                                                    key={item.id} 
                                                    className={`border-b border-gray-100 ${item.is_labour ? 'bg-blue-50' : 'cursor-grab hover:bg-gray-50'} ${draggedItem?.itemId === item.id ? 'opacity-50' : ''}`}
                                                    draggable={!item.is_labour}
                                                    onDragStart={(e) => !item.is_labour && handleDragStart(e, section.id, item.id)}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    {/* Drag Handle */}
                                                    <td className="py-2 px-1 text-center">
                                                        {!item.is_labour && (
                                                            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                                        )}
                                                    </td>
                                                    {/* Marker */}
                                                    <td className="py-2 px-2">
                                                        {!item.is_labour && (
                                                            <input
                                                                type="text"
                                                                value={item.marker || ''}
                                                                onChange={(e) => updateLineItem(section.id, item.id, 'marker', e.target.value)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                                                placeholder="A1"
                                                            />
                                                        )}
                                                    </td>

                                                    {/* Product / Labour */}
                                                    <td className="py-2 px-2">
                                                        {item.is_labour ? (
                                                            <span className="text-blue-700 font-medium">↳ Labour</span>
                                                        ) : (
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
                                                                    placeholder="Search R-value, SKU, description..."
                                                                    className="w-full px-3 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                                                />
                                                                
                                                                {/* Product Dropdown */}
                                                                {showProductSuggestions[`${section.id}-${item.id}`] && (
                                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                                        {getFilteredProducts(`${section.id}-${item.id}`).map(product => {
                                                                            const stockDisplay = getStockStatusDisplay(product.stock_status || 'IN_STOCK', product.stock_level);
                                                                            return (
                                                                                <button
                                                                                    key={product.id}
                                                                                    type="button"
                                                                                    onClick={() => selectProduct(section.id, item.id, product)}
                                                                                    disabled={product.stock_status === 'OUT_OF_STOCK'}
                                                                                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                                                                                        product.stock_status === 'OUT_OF_STOCK' ? 'opacity-50 cursor-not-allowed' : ''
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-start justify-between gap-3">
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-sm font-medium text-gray-900">{product.product_description}</p>
                                                                                            <p className="text-xs text-gray-500">{product.sku} | R{product.r_value} | Bale: {product.bale_size_sqm}m²</p>
                                                                                        </div>
                                                                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                                                            <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${stockDisplay.bg} ${stockDisplay.color}`}>
                                                                                                {stockDisplay.label}
                                                                                            </span>
                                                                                            {product.stock_level !== undefined && (
                                                                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                                                    Stock: {product.stock_level}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {/* Stock Warning */}
                                                                {item.stock_warning && (
                                                                    <div className="mt-1 flex items-center gap-1 text-xs text-orange-600">
                                                                        <AlertTriangle className="w-3 h-3" />
                                                                        {item.stock_warning}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Area */}
                                                    <td className="py-2 px-2">
                                                        {!item.is_labour ? (
                                                            <input
                                                                type="number"
                                                                value={item.area_sqm || ''}
                                                                onChange={(e) => handleAreaChange(section.id, item.id, parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right text-gray-900"
                                                                placeholder="0"
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-700 text-right block">{item.area_sqm.toFixed(2)}</span>
                                                        )}
                                                    </td>

                                                    {/* Packs */}
                                                    <td className="py-2 px-2 text-center">
                                                        {!item.is_labour && item.packs_required ? (
                                                            <span className="text-sm font-medium text-gray-900">{item.packs_required}</span>
                                                        ) : null}
                                                    </td>

                                                    {/* Cost */}
                                                    <td className="py-2 px-2 text-right">
                                                        <span className="text-sm text-gray-900">${item.line_cost.toFixed(2)}</span>
                                                    </td>

                                                    {/* Sell */}
                                                    <td className="py-2 px-2 text-right">
                                                        <span className="text-sm text-gray-900">${item.line_sell.toFixed(2)}</span>
                                                    </td>

                                                    {/* GP% (Editable for products, display only for labour) */}
                                                    <td className="py-2 px-2 text-right">
                                                        {!item.is_labour && item.product_id ? (
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                max="99.9"
                                                                value={item.margin_percent !== undefined ? item.margin_percent.toFixed(1) : ''}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val) && val >= 0 && val < 100) {
                                                                        handleMarginChange(section.id, item.id, val, item.product_id!);
                                                                    }
                                                                }}
                                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right text-gray-900"
                                                            />
                                                        ) : item.is_labour ? (
                                                            <span className="text-sm text-gray-900">{item.margin_percent.toFixed(1)}%</span>
                                                        ) : null}
                                                    </td>

                                                    {/* Delete */}
                                                    <td className="py-2 px-2">
                                                        {!item.is_labour && (
                                                            <button
                                                                onClick={() => removeLineItem(section.id, item.id)}
                                                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Section Totals */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => addLineItem(section.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg transition-colors text-[#0066CC]"
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                                            >
                                                <Plus className="w-4 h-4 text-[#0066CC]" />
                                                <span className="text-[#0066CC]">Add Product</span>
                                            </button>

                                            <div className="flex items-center gap-6 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Cost ex GST:</span>
                                                    <span className="ml-2 font-semibold">${sectionTotals.totalCost.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Sell ex GST:</span>
                                                    <span className="ml-2 font-semibold">${sectionTotals.totalSell.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">GP:</span>
                                                    <span className="ml-2 font-semibold text-green-600">${sectionTotals.grossProfit.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">GP%:</span>
                                                    <span className="ml-2 font-semibold text-green-600">{sectionTotals.marginPercent.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Section Button */}
                    <button
                        onClick={addSection}
                        className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg font-medium transition-colors"
                        style={{ color: '#0066CC' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; e.currentTarget.style.borderColor = '#0066CC'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                    >
                        <Plus className="w-5 h-5" />
                        Add Section
                    </button>
                </div>

                {/* Quote Totals */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase">Total Cost ex GST</p>
                            <p className="text-base font-bold text-gray-900">${quoteTotals.totalCost.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase">Total Sell ex GST</p>
                            <p className="text-base font-bold text-gray-900">${quoteTotals.totalSell.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600 uppercase">Gross Profit</p>
                            <p className="text-base font-bold text-green-700">${quoteTotals.grossProfit.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600 uppercase">GP Margin</p>
                            <p className="text-base font-bold text-green-700">{quoteTotals.marginPercent.toFixed(1)}%</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600 uppercase">GST (15%)</p>
                            <p className="text-base font-bold text-blue-700">${quoteTotals.gstAmount.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-[#0066CC] rounded-lg">
                            <p className="text-xs text-blue-200 uppercase">Total Inc GST</p>
                            <p className="text-base font-bold text-white">${quoteTotals.totalIncGst.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}