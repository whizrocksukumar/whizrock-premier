'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, X } from 'lucide-react';

// Types
interface Product {
    id: string;
    sku: string;
    product_description: string;
    category: string;
    r_value: string;
    bale_size_sqm: number;
    waste_percentage: number;
    is_active?: boolean;
    is_labour?: boolean;
}

interface ApplicationType {
    id: string;
    name: string;
    code: string;
    color_hex: string;
}

interface LineItem {
    id: string;
    marker?: string;
    product_id: string | null;
    product?: Product;
    area_sqm: number;
    packs_required?: number;
}

interface Section {
    id: string;
    type: 'LHROAL' | 'MHWA' | 'AREA'; // Length-Height-Raked-Openings-Area-Level | Marked-Height-Width-Area | Area
    app_type_id: string | null;
    app_type?: ApplicationType;
    custom_name: string;
    section_color: string;
    line_items: LineItem[];
}

interface LineItemLHROAL extends LineItem {
    length?: number;
    height?: number;
    raked?: number;
    openings?: number;
}

interface LineItemMHWA extends LineItem {
    height?: number;
    width?: number;
}

interface LineItemAREA extends LineItem {
    level?: string;
}

export default function CreateRecommendation() {
    const router = useRouter();

    // Form state
    const [companyName, setCompanyName] = useState('');
    const [siteAddress, setSiteAddress] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    // Sections and line items
    const [sections, setSections] = useState<Section[]>([]);
    const [nextSectionId, setNextSectionId] = useState(1);
    const [nextLineItemId, setNextLineItemId] = useState(1);

    // Lookups
    const [appTypes, setAppTypes] = useState<ApplicationType[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState<{ [key: string]: string }>({});
    const [showProductSuggestions, setShowProductSuggestions] = useState<{ [key: string]: boolean }>({});
    const [generalNotes, setGeneralNotes] = useState('');

    useEffect(() => {
        loadLookupData();
        addInitialSection();
    }, []);

    const loadLookupData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [appTypesRes, productsRes] = await Promise.all([
                supabase.from('app_types').select('*').order('sort_order', { ascending: true }),
                supabase.from('products').select('*')
            ]);

            if (appTypesRes.error) throw appTypesRes.error;
            if (productsRes.error) throw productsRes.error;

            const activeAppTypes = (appTypesRes.data || []).filter((at: any) => at.is_active !== false);
            const activeProducts = (productsRes.data || []).filter((p: any) => p.is_active !== false && p.is_labour !== true);

            setAppTypes(activeAppTypes);
            setProducts(activeProducts);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load application types and products');
        } finally {
            setLoading(false);
        }
    };

    const addInitialSection = () => {
        setSections([{
            id: '1',
            type: 'LHROAL',
            app_type_id: null,
            custom_name: '',
            section_color: '#FFD966',
            line_items: []
        }]);
        setNextSectionId(2);
    };

    const addSection = (type: 'LHROAL' | 'MHWA' | 'AREA') => {
        const colors = { 'LHROAL': '#FFD966', 'MHWA': '#9FC5E8', 'AREA': '#F6B26B' };
        const defaultNames = { 'LHROAL': 'External Walls', 'MHWA': 'Openings', 'AREA': 'Area Section' };

        setSections([...sections, {
            id: `${nextSectionId}`,
            type,
            app_type_id: null,
            custom_name: defaultNames[type],
            section_color: colors[type],
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
                    if (appType) {
                        updated.app_type = appType;
                        updated.section_color = appType.color_hex || s.section_color;
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
                const newItem: LineItem = {
                    id: `${nextLineItemId}`,
                    marker: '',
                    product_id: null,
                    area_sqm: 0
                };
                setNextLineItemId(nextLineItemId + 1);
                return { ...s, line_items: [...s.line_items, newItem] };
            }
            return s;
        }));
    };

    const removeLineItem = (sectionId: string, lineItemId: string) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, line_items: s.line_items.filter(li => li.id !== lineItemId) };
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
                                    
                                    // Auto-calculate packs for product items
                                    if (updated.area_sqm > 0) {
                                        const waste = product.waste_percentage / 100;
                                        const areaWithWaste = updated.area_sqm * (1 + waste);
                                        const baleSize = product.bale_size_sqm || 1;
                                        updated.packs_required = Math.ceil(areaWithWaste / baleSize);
                                    }
                                }
                            }

                            // Auto-calculate area for LHROAL sections
                            if (section.type === 'LHROAL' && ['length', 'height', 'raked', 'openings'].includes(field)) {
                                const lhroal = updated as LineItemLHROAL;
                                const length = lhroal.length || 0;
                                const height = lhroal.height || 0;
                                const raked = lhroal.raked || 0;
                                const openings = lhroal.openings || 0;
                                lhroal.area_sqm = parseFloat(((length * height) + raked - openings).toFixed(3));

                                if (updated.product) {
                                    const waste = updated.product.waste_percentage / 100;
                                    const areaWithWaste = lhroal.area_sqm * (1 + waste);
                                    const baleSize = updated.product.bale_size_sqm || 1;
                                    updated.packs_required = Math.ceil(areaWithWaste / baleSize);
                                }
                            }

                            // Auto-calculate area for MHWA sections
                            if (section.type === 'MHWA' && ['height', 'width'].includes(field)) {
                                const mhwa = updated as LineItemMHWA;
                                const width = mhwa.width || 0;
                                const height = mhwa.height || 0;
                                mhwa.area_sqm = parseFloat((width * height).toFixed(3));

                                if (updated.product) {
                                    const waste = updated.product.waste_percentage / 100;
                                    const areaWithWaste = mhwa.area_sqm * (1 + waste);
                                    const baleSize = updated.product.bale_size_sqm || 1;
                                    updated.packs_required = Math.ceil(areaWithWaste / baleSize);
                                }
                            }

                            // Auto-calculate packs for AREA sections
                            if (section.type === 'AREA' && field === 'area_sqm' && updated.product) {
                                const waste = updated.product.waste_percentage / 100;
                                const areaWithWaste = updated.area_sqm * (1 + waste);
                                const baleSize = updated.product.bale_size_sqm || 1;
                                updated.packs_required = Math.ceil(areaWithWaste / baleSize);
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

    const getSectionTotalArea = (section: Section) => {
        return section.line_items.reduce((sum, item) => sum + (item.area_sqm || 0), 0);
    };

    const getSectionTotalPacks = (section: Section) => {
        return section.line_items.reduce((sum, item) => sum + (item.packs_required || 0), 0);
    };

    const filterProducts = (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 1) return [];
        const term = searchTerm.toLowerCase();
        return products.filter(p =>
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.product_description && p.product_description.toLowerCase().includes(term)) ||
            (p.r_value && p.r_value.toLowerCase().includes(term))
        ).slice(0, 10);
    };

    const selectProduct = (sectionId: string, lineItemId: string, product: Product) => {
        updateLineItem(sectionId, lineItemId, 'product_id', product.id);
        setProductSearch({ ...productSearch, [`${sectionId}-${lineItemId}`]: product.product_description });
        setShowProductSuggestions({ ...showProductSuggestions, [`${sectionId}-${lineItemId}`]: false });
    };

    const saveDraft = async () => {
        alert('Save Draft feature coming soon!');
    };

    const submitForReview = async () => {
        alert('Submit feature coming soon!');
        router.push('/va-workspace');
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
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h1 className="text-2xl font-semibold text-[#0066CC]">Create Product Recommendation</h1>
                <p className="text-sm text-gray-500 mt-1">Fill in the details below</p>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-6xl mx-auto p-6">
                {/* Client Details */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Client Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Company Name"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                        />
                        <input
                            type="text"
                            placeholder="Site Address"
                            value={siteAddress}
                            onChange={e => setSiteAddress(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                        />
                        <input
                            type="text"
                            placeholder="Contact Person"
                            value={contactPerson}
                            onChange={e => setContactPerson(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={contactEmail}
                            onChange={e => setContactEmail(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                        />
                        <input
                            type="tel"
                            placeholder="Phone"
                            value={contactPhone}
                            onChange={e => setContactPhone(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                        />
                    </div>
                </div>

                {/* Sections */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Sections & Products</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => addSection('LHROAL')}
                                className="px-3 py-2 bg-[#FFD966] hover:bg-[#fcc93d] text-gray-800 rounded-lg text-sm font-medium"
                            >
                                + External Walls
                            </button>
                            <button
                                onClick={() => addSection('MHWA')}
                                className="px-3 py-2 bg-[#9FC5E8] hover:bg-[#7db5d8] text-gray-800 rounded-lg text-sm font-medium"
                            >
                                + Openings
                            </button>
                            <button
                                onClick={() => addSection('AREA')}
                                className="px-3 py-2 bg-[#F6B26B] hover:bg-[#f0935b] text-gray-800 rounded-lg text-sm font-medium"
                            >
                                + Area
                            </button>
                        </div>
                    </div>

                    {sections.map(section => (
                        <div key={section.id} className="mb-6 border rounded-lg p-4" style={{ backgroundColor: section.section_color + '20', borderColor: section.section_color }}>
                            {/* Section Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <select
                                    value={section.app_type_id || ''}
                                    onChange={(e) => updateSection(section.id, 'app_type_id', e.target.value || null)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded font-medium text-sm"
                                    style={{
                                        backgroundColor: section.section_color,
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
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC]"
                                />

                                {/* Color Picker */}
                                <div className="flex items-center gap-2 border border-gray-300 rounded px-2 py-1 bg-white">
                                    <label className="text-xs text-gray-500">Color:</label>
                                    <input
                                        type="color"
                                        value={section.section_color}
                                        onChange={(e) => updateSection(section.id, 'section_color', e.target.value)}
                                        className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                    />
                                </div>

                                <button
                                    onClick={() => removeSection(section.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Product Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by SKU, description, or R-value..."
                                        value={productSearch[section.id] || ''}
                                        onChange={(e) => {
                                            setProductSearch({ ...productSearch, [section.id]: e.target.value });
                                            setShowProductSuggestions({ ...showProductSuggestions, [section.id]: true });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                    />
                                    {showProductSuggestions[section.id] && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                            {filterProducts(productSearch[section.id] || '').map(product => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => selectProduct(section.id, section.line_items[0]?.id || '', product)}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm border-b last:border-0"
                                                >
                                                    <div className="font-medium">{product.sku}</div>
                                                    <div className="text-gray-600 text-xs">{product.product_description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto mb-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-300">
                                            <th className="text-left py-2 px-2">Marker</th>
                                            {section.type === 'LHROAL' && (
                                                <>
                                                    <th className="text-left py-2 px-2">Length (m)</th>
                                                    <th className="text-left py-2 px-2">Height (m)</th>
                                                    <th className="text-left py-2 px-2">Raked (m²)</th>
                                                    <th className="text-left py-2 px-2">Deduction (m²)</th>
                                                </>
                                            )}
                                            {section.type === 'MHWA' && (
                                                <>
                                                    <th className="text-left py-2 px-2">Width (m)</th>
                                                    <th className="text-left py-2 px-2">Height (m)</th>
                                                </>
                                            )}
                                            {section.type === 'AREA' && (
                                                <th className="text-left py-2 px-2">Level</th>
                                            )}
                                            <th className="text-left py-2 px-2">Area (m²)</th>
                                            <th className="text-center py-2 px-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.line_items.map(item => (
                                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="text"
                                                        value={(item as any).marker || ''}
                                                        onChange={e => updateLineItem(section.id, item.id, 'marker', e.target.value)}
                                                        placeholder="e.g. W1"
                                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                </td>
                                                {section.type === 'LHROAL' && (
                                                    <>
                                                        <td className="py-2 px-2">
                                                            <input type="number" value={(item as LineItemLHROAL).length || ''} onChange={e => updateLineItem(section.id, item.id, 'length', parseFloat(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input type="number" value={(item as LineItemLHROAL).height || ''} onChange={e => updateLineItem(section.id, item.id, 'height', parseFloat(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input type="number" value={(item as LineItemLHROAL).raked || ''} onChange={e => updateLineItem(section.id, item.id, 'raked', parseFloat(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input type="number" value={(item as LineItemLHROAL).openings || ''} onChange={e => updateLineItem(section.id, item.id, 'openings', parseFloat(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                        </td>
                                                    </>
                                                )}
                                                {section.type === 'MHWA' && (
                                                    <>
                                                        <td className="py-2 px-2">
                                                            <input type="number" value={(item as LineItemMHWA).width || ''} onChange={e => updateLineItem(section.id, item.id, 'width', parseFloat(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input type="number" value={(item as LineItemMHWA).height || ''} onChange={e => updateLineItem(section.id, item.id, 'height', parseFloat(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                        </td>
                                                    </>
                                                )}
                                                {section.type === 'AREA' && (
                                                    <td className="py-2 px-2">
                                                        <input type="text" value={(item as LineItemAREA).level || ''} onChange={e => updateLineItem(section.id, item.id, 'level', e.target.value)} placeholder="GF/FF" className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                    </td>
                                                )}
                                                <td className="py-2 px-2 font-semibold">{item.area_sqm || 0}</td>
                                                <td className="py-2 px-2 text-center">
                                                    <button onClick={() => removeLineItem(section.id, item.id)} className="text-red-600 hover:text-red-800">
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={() => addLineItem(section.id)}
                                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>

                            {/* Section Summary */}
                            <div className="mt-4 pt-4 border-t border-gray-300 grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Total Area:</span>
                                    <div className="font-semibold">{getSectionTotalArea(section).toFixed(2)} m²</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Total Packs:</span>
                                    <div className="font-semibold">{getSectionTotalPacks(section)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* General Notes */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">General Notes</h2>
                    <textarea
                        value={generalNotes}
                        onChange={e => setGeneralNotes(e.target.value)}
                        placeholder="Add any additional notes..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end">
                    <button
                        onClick={() => router.push('/va-workspace')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={saveDraft}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={submitForReview}
                        className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg"
                    >
                        Submit for Review
                    </button>
                </div>
            </div>
        </div>
    );
}