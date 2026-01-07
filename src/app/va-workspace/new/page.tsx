'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, X, Upload, FileText } from 'lucide-react';
import ClientDetailsForm from '@/components/ClientDetailsForm';

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
    type: 'LHROAL' | 'MHWA' | 'AREA';
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

// INNER COMPONENT - uses useSearchParams
function CreateRecommendationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const opportunityId = searchParams.get('opportunityId');
    const assessmentId = searchParams.get('assessmentId');

    const [clientId, setClientId] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [siteAddress, setSiteAddress] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [opportunityNumber, setOpportunityNumber] = useState('');
    const [assessmentNumber, setAssessmentNumber] = useState('');

    const [sections, setSections] = useState<Section[]>([]);
    const [nextSectionId, setNextSectionId] = useState(1);
    const [nextLineItemId, setNextLineItemId] = useState(1);

    const [appTypes, setAppTypes] = useState<ApplicationType[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState<{ [key: string]: string }>({});
    const [showProductSuggestions, setShowProductSuggestions] = useState<{ [key: string]: boolean }>({});
    const [generalNotes, setGeneralNotes] = useState('');

    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
    const [uploadingFile, setUploadingFile] = useState(false);

    useEffect(() => {
        loadLookupData();
        if (assessmentId) {
            loadAssessmentData(assessmentId);
        } else if (opportunityId) {
            loadOpportunityData(opportunityId);
        } else {
            addInitialSection();
        }
    }, [opportunityId, assessmentId]);

    const loadOpportunityData = async (oppId: string) => {
        try {
            const { data: opp, error } = await supabase
                .from('opportunities')
                .select(`
                    id,
                    opp_number,
                    contact_first_name,
                    contact_last_name,
                    contact_email,
                    contact_phone,
                    site_address,
                    site_city,
                    site_postcode,
                    company_id,
                    notes
                `)
                .eq('id', oppId)
                .single();

            if (error) throw error;

            if (opp) {
                setOpportunityNumber(opp.opp_number);
                setContactPerson(`${opp.contact_first_name} ${opp.contact_last_name}`);
                setContactEmail(opp.contact_email || '');
                setContactPhone(opp.contact_phone || '');
                setSiteAddress(`${opp.site_address}, ${opp.site_city} ${opp.site_postcode}`);
                if (opp.notes) setGeneralNotes(opp.notes);

                if (opp.company_id) {
                    const { data: company } = await supabase
                        .from('companies')
                        .select('company_name')
                        .eq('id', opp.company_id)
                        .single();

                    if (company) setCompanyName(company.company_name);
                }
            }

            addInitialSection();
        } catch (err) {
            console.error('Error loading opportunity:', err);
            setError('Failed to load opportunity data');
        }
    };

    const loadAssessmentData = async (assmtId: string) => {
        try {
            const { data: assessment, error } = await supabase
                .from('assessments')
                .select(`
                    id,
                    reference_number,
                    client_id,
                    site_id,
                    notes,
                    clients!client_id (
                        id,
                        contact_first_name,
                        contact_last_name,
                        contact_email,
                        contact_phone,
                        company_id,
                        companies!company_id (
                            company_name
                        )
                    ),
                    sites!site_id (
                        address_line_1,
                        address_line_2,
                        city,
                        postcode
                    )
                `)
                .eq('id', assmtId)
                .single();

            if (error) throw error;

            if (assessment) {
                setAssessmentNumber(assessment.reference_number);
                setClientId(assessment.client_id);

                // Set contact details from client
                if (assessment.clients) {
                    setContactPerson(`${assessment.clients.contact_first_name} ${assessment.clients.contact_last_name}`);
                    setContactEmail(assessment.clients.contact_email || '');
                    setContactPhone(assessment.clients.contact_phone || '');

                    // Set company name
                    if (assessment.clients.companies) {
                        setCompanyName(assessment.clients.companies.company_name);
                    }
                }

                // Set site address
                if (assessment.sites) {
                    const site = assessment.sites;
                    const addressParts = [
                        site.address_line_1,
                        site.address_line_2,
                        site.city,
                        site.postcode
                    ].filter(Boolean);
                    setSiteAddress(addressParts.join(', '));
                }

                // Set notes
                if (assessment.notes) setGeneralNotes(assessment.notes);
            }

            addInitialSection();
        } catch (err) {
            console.error('Error loading assessment:', err);
            setError('Failed to load assessment data');
        }
    };

    const loadLookupData = async () => {
        try {
            setLoading(true);
            const [appTypesRes, productsRes] = await Promise.all([
                supabase.from('app_types').select('*').order('sort_order'),
                supabase.from('products').select('*')
            ]);

            if (appTypesRes.error) throw appTypesRes.error;
            if (productsRes.error) throw productsRes.error;

            const activeAppTypes = appTypesRes.data.filter(at => at.is_active !== false);
            const activeProducts = productsRes.data.filter(p => p.is_active !== false && p.is_labour !== true);

            setAppTypes(activeAppTypes);
            setProducts(activeProducts);
        } catch (err) {
            console.error(err);
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
        const colors = { LHROAL: '#FFD966', MHWA: '#9FC5E8', AREA: '#F6B26B' };
        const names = { LHROAL: 'External Walls', MHWA: 'Openings', AREA: 'Area Section' };

        setSections([
            ...sections,
            {
                id: `${nextSectionId}`,
                type,
                app_type_id: null,
                custom_name: names[type],
                section_color: colors[type],
                line_items: []
            }
        ]);
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
                    const app = appTypes.find(at => at.id === value);
                    if (app) {
                        updated.app_type = app;
                        updated.section_color = app.color_hex;
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
                            return updated;
                        }
                        return item;
                    })
                };
            }
            return section;
        }));
    };

    const handleProductSelect = (sectionId: string, lineItemId: string, product: Product) => {
        updateLineItem(sectionId, lineItemId, 'product_id', product.id);
        updateLineItem(sectionId, lineItemId, 'product', product);
        setProductSearch({ ...productSearch, [lineItemId]: product.product_description });
        setShowProductSuggestions({ ...showProductSuggestions, [lineItemId]: false });
    };

    const calculateAreaLHROAL = (item: LineItemLHROAL): number => {
        const length = item.length || 0;
        const height = item.height || 0;
        const raked = item.raked || 0;
        const openings = item.openings || 0;
        return (length * height) + (raked * 0.5) - openings;
    };

    const calculateAreaMHWA = (item: LineItemMHWA): number => {
        const height = item.height || 0;
        const width = item.width || 0;
        return height * width;
    };

    const calculatePacks = (areaSqm: number, product: Product | undefined): number => {
        if (!product || !product.bale_size_sqm) return 0;
        const wastePercent = product.waste_percentage || 10;
        const adjustedArea = areaSqm * (1 + wastePercent / 100);
        return Math.ceil(adjustedArea / product.bale_size_sqm);
    };

    const getStockStatus = (packs: number): { status: string; color: string } => {
        if (packs === 0) return { status: 'N/A', color: 'text-gray-500' };
        // Simplified - in real app, check actual stock levels
        return { status: '✓ In Stock', color: 'text-green-600' };
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachedFiles([...attachedFiles, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
    };

    const saveDraft = async () => {
        alert("Save Draft – coming soon");
    };

    const submitForReview = async () => {
        alert("Submit – coming soon");
        router.push('/va-workspace');
    };

    const filteredProducts = (lineItemId: string) => {
        const query = (productSearch[lineItemId] || '').toLowerCase();
        if (!query) return [];
        return products.filter(p =>
            p.product_description.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query) ||
            p.r_value.toLowerCase().includes(query)
        ).slice(0, 5);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER */}
            <div className="bg-white border-b px-6 py-4">
                <h1 className="text-2xl font-semibold text-[#0066CC]">Create Product Recommendation</h1>
                <p className="text-sm text-gray-500">Fill in the details below</p>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <div className="max-w-6xl mx-auto p-6 space-y-6">

                {/* OPPORTUNITY/ASSESSMENT INFO */}
                {(opportunityNumber || assessmentNumber) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900">
                            {opportunityNumber && `Opportunity: ${opportunityNumber}`}
                            {assessmentNumber && `Assessment: ${assessmentNumber}`}
                        </p>
                    </div>
                )}

                {/* CLIENT DETAILS */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Client Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Contact Person</label>
                            <input
                                type="text"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Company Name</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input
                                type="tel"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Site Address</label>
                            <input
                                type="text"
                                value={siteAddress}
                                onChange={(e) => setSiteAddress(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                    </div>
                </div>

                {/* SECTIONS */}
                {sections.map((section, sectionIndex) => (
                    <div key={section.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-6 h-6 rounded"
                                    style={{ backgroundColor: section.section_color }}
                                />
                                <h3 className="text-lg font-semibold">
                                    Section {sectionIndex + 1}: {section.type}
                                </h3>
                            </div>
                            <button
                                onClick={() => removeSection(section.id)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Application Type, Custom Name, and Color Picker - Same layout as quote page */}
                        <div className="mb-4 flex items-center gap-3">
                            <select
                                value={section.app_type_id || ''}
                                onChange={(e) => updateSection(section.id, 'app_type_id', e.target.value)}
                                className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                            >
                                <option value="">Select application type...</option>
                                {appTypes.map(at => (
                                    <option key={at.id} value={at.id}>{at.name}</option>
                                ))}
                            </select>

                            <span className="text-gray-400">or</span>

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
                                    className="w-20 text-xs border-0 focus:outline-none"
                                    maxLength={7}
                                />
                            </div>
                        </div>

                        {/* LINE ITEMS TABLE */}
                        {section.type === 'LHROAL' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-2 py-2 text-left">Marker</th>
                                            <th className="px-2 py-2 text-left">Length (m)</th>
                                            <th className="px-2 py-2 text-left">Height (m)</th>
                                            <th className="px-2 py-2 text-left">Raked (m)</th>
                                            <th className="px-2 py-2 text-left">Openings (m²)</th>
                                            <th className="px-2 py-2 text-left">Area (m²)</th>
                                            <th className="px-2 py-2 text-left">Product</th>
                                            <th className="px-2 py-2 text-left">Packs</th>
                                            <th className="px-2 py-2 text-left">Stock</th>
                                            <th className="px-2 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.line_items.map((item) => {
                                            const lhItem = item as LineItemLHROAL;
                                            const area = calculateAreaLHROAL(lhItem);
                                            const packs = calculatePacks(area, item.product);
                                            const stockStatus = getStockStatus(packs);

                                            return (
                                                <tr key={item.id} className="border-b">
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="text"
                                                            value={lhItem.marker || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'marker', e.target.value)}
                                                            className="w-20 border rounded px-2 py-1"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            value={lhItem.length || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'length', parseFloat(e.target.value) || 0)}
                                                            className="w-20 border rounded px-2 py-1"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            value={lhItem.height || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'height', parseFloat(e.target.value) || 0)}
                                                            className="w-20 border rounded px-2 py-1"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            value={lhItem.raked || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'raked', parseFloat(e.target.value) || 0)}
                                                            className="w-20 border rounded px-2 py-1"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            value={lhItem.openings || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'openings', parseFloat(e.target.value) || 0)}
                                                            className="w-20 border rounded px-2 py-1"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 font-semibold">{area.toFixed(2)}</td>
                                                    <td className="px-2 py-2 relative">
                                                        <input
                                                            type="text"
                                                            value={productSearch[item.id] || ''}
                                                            onChange={(e) => {
                                                                setProductSearch({ ...productSearch, [item.id]: e.target.value });
                                                                setShowProductSuggestions({ ...showProductSuggestions, [item.id]: true });
                                                            }}
                                                            onFocus={() => setShowProductSuggestions({ ...showProductSuggestions, [item.id]: true })}
                                                            placeholder="Search product..."
                                                            className="w-48 border rounded px-2 py-1"
                                                        />
                                                        {showProductSuggestions[item.id] && filteredProducts(item.id).length > 0 && (
                                                            <div className="absolute z-10 bg-white border rounded shadow-lg mt-1 w-64 max-h-48 overflow-y-auto">
                                                                {filteredProducts(item.id).map(p => (
                                                                    <div
                                                                        key={p.id}
                                                                        onClick={() => handleProductSelect(section.id, item.id, p)}
                                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                                    >
                                                                        <div className="font-semibold text-sm">{p.product_description}</div>
                                                                        <div className="text-xs text-gray-500">{p.sku} - {p.r_value}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-2 font-semibold">{packs}</td>
                                                    <td className={`px-2 py-2 text-xs ${stockStatus.color}`}>{stockStatus.status}</td>
                                                    <td className="px-2 py-2">
                                                        <button
                                                            onClick={() => removeLineItem(section.id, item.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {section.type === 'MHWA' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-2 py-2 text-left">Marker</th>
                                            <th className="px-2 py-2 text-left">Height (m)</th>
                                            <th className="px-2 py-2 text-left">Width (m)</th>
                                            <th className="px-2 py-2 text-left">Area (m²)</th>
                                            <th className="px-2 py-2 text-left">Product</th>
                                            <th className="px-2 py-2 text-left">Packs</th>
                                            <th className="px-2 py-2 text-left">Stock</th>
                                            <th className="px-2 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.line_items.map((item) => {
                                            const mhItem = item as LineItemMHWA;
                                            const area = calculateAreaMHWA(mhItem);
                                            const packs = calculatePacks(area, item.product);
                                            const stockStatus = getStockStatus(packs);

                                            return (
                                                <tr key={item.id} className="border-b">
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="text"
                                                            value={mhItem.marker || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'marker', e.target.value)}
                                                            className="w-20 border rounded px-2 py-1"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            value={mhItem.height || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'height', parseFloat(e.target.value) || 0)}
                                                            className="w-20 border rounded px-2 py-1"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            value={mhItem.width || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'width', parseFloat(e.target.value) || 0)}
                                                            className="w-20 border rounded px-2 py-1"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 font-semibold">{area.toFixed(2)}</td>
                                                    <td className="px-2 py-2 relative">
                                                        <input
                                                            type="text"
                                                            value={productSearch[item.id] || ''}
                                                            onChange={(e) => {
                                                                setProductSearch({ ...productSearch, [item.id]: e.target.value });
                                                                setShowProductSuggestions({ ...showProductSuggestions, [item.id]: true });
                                                            }}
                                                            onFocus={() => setShowProductSuggestions({ ...showProductSuggestions, [item.id]: true })}
                                                            placeholder="Search product..."
                                                            className="w-48 border rounded px-2 py-1"
                                                        />
                                                        {showProductSuggestions[item.id] && filteredProducts(item.id).length > 0 && (
                                                            <div className="absolute z-10 bg-white border rounded shadow-lg mt-1 w-64 max-h-48 overflow-y-auto">
                                                                {filteredProducts(item.id).map(p => (
                                                                    <div
                                                                        key={p.id}
                                                                        onClick={() => handleProductSelect(section.id, item.id, p)}
                                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                                    >
                                                                        <div className="font-semibold text-sm">{p.product_description}</div>
                                                                        <div className="text-xs text-gray-500">{p.sku} - {p.r_value}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-2 font-semibold">{packs}</td>
                                                    <td className={`px-2 py-2 text-xs ${stockStatus.color}`}>{stockStatus.status}</td>
                                                    <td className="px-2 py-2">
                                                        <button
                                                            onClick={() => removeLineItem(section.id, item.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {section.type === 'AREA' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-2 py-2 text-left">Level</th>
                                            <th className="px-2 py-2 text-left">Area (m²)</th>
                                            <th className="px-2 py-2 text-left">Product</th>
                                            <th className="px-2 py-2 text-left">Packs</th>
                                            <th className="px-2 py-2 text-left">Stock</th>
                                            <th className="px-2 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.line_items.map((item) => {
                                            const areaItem = item as LineItemAREA;
                                            const packs = calculatePacks(item.area_sqm, item.product);
                                            const stockStatus = getStockStatus(packs);

                                            return (
                                                <tr key={item.id} className="border-b">
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="text"
                                                            value={areaItem.level || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'level', e.target.value)}
                                                            className="w-32 border rounded px-2 py-1"
                                                            placeholder="e.g., Level 1"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            value={item.area_sqm || ''}
                                                            onChange={(e) => updateLineItem(section.id, item.id, 'area_sqm', parseFloat(e.target.value) || 0)}
                                                            className="w-24 border rounded px-2 py-1"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 relative">
                                                        <input
                                                            type="text"
                                                            value={productSearch[item.id] || ''}
                                                            onChange={(e) => {
                                                                setProductSearch({ ...productSearch, [item.id]: e.target.value });
                                                                setShowProductSuggestions({ ...showProductSuggestions, [item.id]: true });
                                                            }}
                                                            onFocus={() => setShowProductSuggestions({ ...showProductSuggestions, [item.id]: true })}
                                                            placeholder="Search product..."
                                                            className="w-48 border rounded px-2 py-1"
                                                        />
                                                        {showProductSuggestions[item.id] && filteredProducts(item.id).length > 0 && (
                                                            <div className="absolute z-10 bg-white border rounded shadow-lg mt-1 w-64 max-h-48 overflow-y-auto">
                                                                {filteredProducts(item.id).map(p => (
                                                                    <div
                                                                        key={p.id}
                                                                        onClick={() => handleProductSelect(section.id, item.id, p)}
                                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                                    >
                                                                        <div className="font-semibold text-sm">{p.product_description}</div>
                                                                        <div className="text-xs text-gray-500">{p.sku} - {p.r_value}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-2 font-semibold">{packs}</td>
                                                    <td className={`px-2 py-2 text-xs ${stockStatus.color}`}>{stockStatus.status}</td>
                                                    <td className="px-2 py-2">
                                                        <button
                                                            onClick={() => removeLineItem(section.id, item.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <button
                            onClick={() => addLineItem(section.id)}
                            className="mt-3 flex items-center gap-2 text-[#0066CC] hover:text-blue-800"
                        >
                            <Plus className="w-4 h-4" />
                            Add Line Item
                        </button>
                    </div>
                ))}

                {/* ADD SECTION BUTTONS */}
                <div className="flex gap-3">
                    <button
                        onClick={() => addSection('LHROAL')}
                        className="px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded hover:bg-yellow-200"
                    >
                        + Add LHROAL Section
                    </button>
                    <button
                        onClick={() => addSection('MHWA')}
                        className="px-4 py-2 bg-blue-100 text-blue-800 border border-blue-300 rounded hover:bg-blue-200"
                    >
                        + Add MHWA Section
                    </button>
                    <button
                        onClick={() => addSection('AREA')}
                        className="px-4 py-2 bg-orange-100 text-orange-800 border border-orange-300 rounded hover:bg-orange-200"
                    >
                        + Add AREA Section
                    </button>
                </div>

                {/* NOTES */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-3">General Notes</h2>
                    <textarea
                        value={generalNotes}
                        onChange={(e) => setGeneralNotes(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 h-32"
                        placeholder="Add any additional notes here..."
                    />
                </div>

                {/* ATTACHMENTS */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-3">Attachments</h2>
                    <div className="mb-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200 w-fit">
                            <Upload className="w-4 h-4" />
                            <span>Upload Files</span>
                            <input
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                    </div>
                    {attachedFiles.length > 0 && (
                        <div className="space-y-2">
                            {attachedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm">{file.name}</span>
                                    </div>
                                    <button
                                        onClick={() => removeFile(idx)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={saveDraft}
                        className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={submitForReview}
                        className="px-6 py-2 bg-[#0066CC] text-white rounded hover:bg-blue-700"
                    >
                        Submit for Review
                    </button>
                </div>

            </div>
        </div>
    );
}

// OUTER COMPONENT - wraps in Suspense
export default function CreateRecommendation() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto mb-4"></div>
                    <p className="text-gray-700">Loading...</p>
                </div>
            </div>
        }>
            <CreateRecommendationForm />
        </Suspense>
    );
}