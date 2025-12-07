'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Building, User, Mail, Phone, MapPin } from 'lucide-react';

// Types
interface Company {
    id: string;
    name: string;
}

interface Region {
    id: string;
    name: string;
}

export default function AddCustomerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state - Personal Information
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    // Company Information
    const [companyId, setCompanyId] = useState(searchParams.get('company_id') || '');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [contactType, setContactType] = useState('Primary Contact');
    
    // Address Information
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [regionId, setRegionId] = useState('');
    
    // Status - always Active for new customers
    const status = 'Active';

    // Lookup data
    const [companies, setCompanies] = useState<Company[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);

    useEffect(() => {
        loadLookupData();
    }, []);

    const loadLookupData = async () => {
        try {
            setLoading(true);
            
            // Load companies and regions in parallel
            const [companiesRes, regionsRes] = await Promise.all([
                supabase.from('companies').select('id, name').order('name'),
                supabase.from('regions').select('id, name').order('name')
            ]);

            if (companiesRes.data) setCompanies(companiesRes.data);
            if (regionsRes.data) setRegions(regionsRes.data);
            
        } catch (err) {
            console.error('Error loading lookup data:', err);
            setError('Failed to load form data');
        } finally {
            setLoading(false);
        }
    };

    const createOrSelectCompany = async (): Promise<string | null> => {
        if (!companyId && !newCompanyName) {
            // Company is optional - return null
            return null;
        }

        if (companyId) {
            return companyId;
        }

        // Create new company
        const { data, error: createError } = await supabase
            .from('companies')
            .insert({ name: newCompanyName })
            .select('id')
            .single();

        if (createError) {
            throw new Error('Failed to create company');
        }

        return data?.id || null;
    };

    const handleSave = async () => {
        if (!firstName || !lastName || !email || !phone) {
            setError('Please fill in all required fields (First Name, Last Name, Email, Phone)');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const finalCompanyId = await createOrSelectCompany();

            const { error: saveError } = await supabase
                .from('clients')
                .insert({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    phone,
                    company_id: finalCompanyId,
                    contact_type: contactType,
                    address_line_1: addressLine1 || null,
                    address_line_2: addressLine2 || null,
                    city: city || null,
                    postal_code: postalCode || null,
                    region_id: regionId || null,
                    status,
                })
                .select();

            if (saveError) throw saveError;

            // Redirect back to customers list
            router.push('/customers');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save customer');
        } finally {
            setSaving(false);
        }
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <Link 
                            href="/customers" 
                            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-1"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Customers
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Add New Customer</h1>
                    </div>
                    {/* User Icon */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            U
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-700">user@premier.local</p>
                        </div>
                        <button className="ml-2 text-xs text-[#0066CC] hover:underline">Logout</button>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-7xl mx-auto p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <div className="flex-shrink-0 w-4 h-4 text-red-600 mt-0.5">⚠</div>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                        {/* Personal Information */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                <User className="w-4 h-4 text-[#0066CC]" />
                                <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="John"
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Doe"
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="john@example.com"
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            Phone <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+64 21 123 4567"
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Company Information */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                <Building className="w-4 h-4 text-[#0066CC]" />
                                <h2 className="text-base font-semibold text-gray-900">Company Information</h2>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Company
                                        </label>
                                        <select
                                            value={companyId}
                                            onChange={(e) => {
                                                setCompanyId(e.target.value);
                                                setNewCompanyName('');
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        >
                                            <option value="">Select existing company...</option>
                                            {companies.map((company) => (
                                                <option key={company.id} value={company.id}>
                                                    {company.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                value={newCompanyName}
                                                onChange={(e) => {
                                                    setNewCompanyName(e.target.value);
                                                    setCompanyId('');
                                                }}
                                                placeholder="Or create new company..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Contact Type
                                        </label>
                                        <select
                                            value={contactType}
                                            onChange={(e) => setContactType(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        >
                                            <option value="Primary Contact">Primary Contact</option>
                                            <option value="Secondary Contact">Secondary Contact</option>
                                            <option value="Billing Contact">Billing Contact</option>
                                            <option value="Property Manager">Property Manager</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#0066CC]" />
                                <h2 className="text-base font-semibold text-gray-900">Address Information</h2>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Address Line 1
                                        </label>
                                        <input
                                            type="text"
                                            value={addressLine1}
                                            onChange={(e) => setAddressLine1(e.target.value)}
                                            placeholder="123 Main Street"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Address Line 2
                                        </label>
                                        <input
                                            type="text"
                                            value={addressLine2}
                                            onChange={(e) => setAddressLine2(e.target.value)}
                                            placeholder="Apt, suite, unit (optional)"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder="Auckland"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            value={postalCode}
                                            onChange={(e) => setPostalCode(e.target.value)}
                                            placeholder="1010"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Region
                                        </label>
                                        <select
                                            value={regionId}
                                            onChange={(e) => setRegionId(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                                        >
                                            <option value="">Select region...</option>
                                            {regions.map((region) => (
                                                <option key={region.id} value={region.id}>
                                                    {region.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 mt-4">
                        <Link
                            href="/customers"
                            className="px-5 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 text-sm bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Saving...
                                </>
                            ) : (
                                'Save Customer'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}