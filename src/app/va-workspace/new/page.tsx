'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, Send } from 'lucide-react';

// Types
interface Product {
    id: string;
    sku: string;
    product_description: string;
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

interface CalculationItem {
    id: string;
    area: number;
    level?: string;
    length?: number;
    height?: number;
    raked_area?: number;
    openings_deduction?: number;
    marked?: string;
    width?: number;
}

interface CalculationSection {
    id: string;
    name: string;
    type: 'LHROAL' | 'MHWA' | 'AREA';
    color: string;
    items: CalculationItem[];
    product_id?: string | null;
    product?: Product;
    notes?: string;
}

export default function NewRecommendation() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Client Data
    const [companyName, setCompanyName] = useState('');
    const [siteAddress, setSiteAddress] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    // Calculation Data
    const [sections, setSections] = useState<CalculationSection[]>([]);
    const [generalNotes, setGeneralNotes] = useState('');

    // Lookup Data
    const [appTypes, setAppTypes] = useState<ApplicationType[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState<{ [key: string]: string }>({});
    const [showProductSuggestions, setShowProductSuggestions] = useState<{ [key: string]: boolean }>({});

    // Load lookup data on mount
    useEffect(() => {
        loadLookupData();
    }, []);

    const loadLookupData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [appTypesRes, productsRes] = await Promise.all([
                supabase
                    .from('app_types')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true }),
                supabase
                    .from('products')
                    .select('*')
                    .eq('is_active', true)
                    .eq('is_labour', false)
                    .order('sku', { ascending: true })
            ]);

            if (appTypesRes.error) throw appTypesRes.error;
            if (productsRes.error) throw productsRes.error;

            setAppTypes(appTypesRes.data || []);
            setProducts(productsRes.data || []);
        } catch (err) {
            console.error('Error loading lookup data:', err);
            setError('Failed to load application types and products');
        } finally {
            setLoading(false);
        }
    };

    // Calculation Logic
    const addSection = (type: 'LHROAL' | 'MHWA' | 'AREA') => {
        const colors = { 'LHROAL': '#FFD966', 'MHWA': '#9FC5E8', 'AREA': '#F6B26B' };
        const names = { 'LHROAL': 'External Walls', 'MHWA': 'Openings', 'AREA': 'Area Section' };

        setSections([...sections, {
            id: `section-${Date.now()}`,
            name: names[type],
            type,
            color: colors[type],
            items: []
        }]);
    };

    const updateSection = (sectionId: string, field: string, value: any) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, [field]: value } : s));
    };

    const deleteSection = (sectionId: string) => {
        setSections(sections.filter(s => s.id !== sectionId));
    };

    const addItem = (sectionId: string) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    items: [...s.items, { id: `item-${Date.now()}`, area: 0, level: 'GF' }]
                };
            }
            return s;
        }));
    };

    const updateItem = (sectionId: string, itemId: string, field: string, value: any) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    items: s.items.map(item => {
                        if (item.id === itemId) {
                            const updated = { ...item, [field]: parseFloat(value) || 0 };
                            
                            // Auto-calculate Area
                            if (s.type === 'LHROAL') {
                                const l = updated.length || 0;
                                const h = updated.height || 0;
                                const r = updated.raked_area || 0;
                                const d = updated.openings_deduction || 0;
                                updated.area = parseFloat(((l * h) + r - d).toFixed(3));
                            } else if (s.type === 'MHWA') {
                                const w = updated.width || 0;
                                const h = updated.height || 0;
                                updated.area = parseFloat((w * h).toFixed(3));
                            }
                            
                            return updated;
                        }
                        return item;
                    })
                };
            }
            return s;
        }));
    };

    const deleteItem = (sectionId: string, itemId: string) => {
        setSections(sections.map(s => {
            if (s.id === sectionId) {
                return { ...s, items: s.items.filter(i => i.id !== itemId) };
            }
            return s;
        }));
    };

    const getSectionTotalArea = (section: CalculationSection) => {
        return section.items.reduce((sum, item) => sum + (item.area || 0), 0);
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

    const selectProduct = (sectionId: string, product: Product) => {
        updateSection(sectionId, 'product_id', product.id);
        updateSection(sectionId, 'product', product);
        setProductSearch({ ...productSearch, [sectionId]: product.product_description });
        setShowProductSuggestions({ ...showProductSuggestions, [sectionId]: false });
    };

    const getSectionPacksRequired = (section: CalculationSection) => {
        if (!section.product) return 0;
        const totalArea = getSectionTotalArea(section);
        const wasteMultiplier = 1 + (section.product.waste_percentage / 100);
        const adjustedArea = totalArea * wasteMultiplier;
        return Math.ceil(adjustedArea / section.product.bale_size_sqm);
    };

    const saveDraft = async () => {
        alert('Draft saving feature coming soon!');
    };

    const submitForReview = async () => {
        alert('Submit feature coming soon!');
        router.push('/va-workspace');
    };

    // RENDER
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
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
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

                    {sections.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Click a button above to add sections</p>
                    ) : (
                        <div className="space-y-6">
                            {sections.map(section => (
                                <div
                                    key={section.id}
                                    className="border rounded-lg p-4"
                                    style={{ backgroundColor: section.color + '20', borderColor: section.color }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <input
                                            type="text"
                                            value={section.name}
                                            onChange={e => updateSection(section.id, 'name', e.target.value)}
                                            className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#0066CC]"
                                        />
                                        <button
                                            onClick={() => deleteSection(section.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Product Selection */}
                                    <div className="mb-4 relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search by SKU, description, or R-value..."
                                                value={productSearch[section.id] || ''}
                                                onChange={e => {
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
                                                            onClick={() => selectProduct(section.id, product)}
                                                            className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                                        >
                                                            <div className="font-medium">{product.sku}</div>
                                                            <div className="text-gray-600 text-xs">{product.product_description}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {section.product && (
                                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                                ✓ {section.product.sku}
                                            </div>
                                        )}
                                    </div>

                                    {/* Items Table */}
                                    <div className="mb-4 overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
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
                                                    <th className="text-left py-2 px-2">Area (m²)</th>
                                                    <th className="text-center py-2 px-2">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {section.items.map(item => (
                                                    <tr key={item.id} className="border-b hover:bg-gray-50">
                                                        {section.type === 'LHROAL' && (
                                                            <>
                                                                <td className="py-2 px-2">
                                                                    <input type="number" value={item.length || ''} onChange={e => updateItem(section.id, item.id, 'length', e.target.value)} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                                </td>
                                                                <td className="py-2 px-2">
                                                                    <input type="number" value={item.height || ''} onChange={e => updateItem(section.id, item.id, 'height', e.target.value)} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                                </td>
                                                                <td className="py-2 px-2">
                                                                    <input type="number" value={item.raked_area || ''} onChange={e => updateItem(section.id, item.id, 'raked_area', e.target.value)} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                                </td>
                                                                <td className="py-2 px-2">
                                                                    <input type="number" value={item.openings_deduction || ''} onChange={e => updateItem(section.id, item.id, 'openings_deduction', e.target.value)} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                                </td>
                                                            </>
                                                        )}
                                                        {section.type === 'MHWA' && (
                                                            <>
                                                                <td className="py-2 px-2">
                                                                    <input type="number" value={item.width || ''} onChange={e => updateItem(section.id, item.id, 'width', e.target.value)} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                                </td>
                                                                <td className="py-2 px-2">
                                                                    <input type="number" value={item.height || ''} onChange={e => updateItem(section.id, item.id, 'height', e.target.value)} className="w-16 px-2 py-1 border border-gray-300 rounded" />
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="py-2 px-2 font-semibold">{item.area || 0}</td>
                                                        <td className="py-2 px-2 text-center">
                                                            <button onClick={() => deleteItem(section.id, item.id)} className="text-red-600 hover:text-red-800">✕</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button
                                        onClick={() => addItem(section.id)}
                                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Item
                                    </button>

                                    <div className="mt-4 pt-4 border-t border-gray-300 grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Total Area:</span>
                                            <div className="font-semibold">{getSectionTotalArea(section).toFixed(2)} m²</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Packs Required:</span>
                                            <div className="font-semibold">{getSectionPacksRequired(section)}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Bale Size:</span>
                                            <div className="font-semibold">{section.product?.bale_size_sqm || '-'} m²</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes */}
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
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Draft
                    </button>
                    <button
                        onClick={submitForReview}
                        className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Submit for Review
                    </button>
                </div>
            </div>
        </div>
    );
}