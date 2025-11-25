'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Types
interface Company {
    id: string;
    company_name: string;
}

interface Region {
    id: string;
    name: string;
}

export default function AddCustomerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [status, setStatus] = useState('Active');
    const [followUpDate, setFollowUpDate] = useState('');

    // Lookup data
    const [companies, setCompanies] = useState<Company[]>([]);
    const [newCompanyName, setNewCompanyName] = useState('');

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('companies')
                .select('id, company_name')
                .order('company_name');

            if (fetchError) throw fetchError;
            setCompanies(data || []);
        } catch (err) {
            console.error('Error loading companies:', err);
            setError('Failed to load companies');
        } finally {
            setLoading(false);
        }
    };

    const createOrSelectCompany = async (): Promise<string | null> => {
        if (!companyId && !newCompanyName) {
            setError('Please select or create a company');
            return null;
        }

        if (companyId) {
            return companyId;
        }

        // Create new company
        const { data, error: createError } = await supabase
            .from('companies')
            .insert({ company_name: newCompanyName })
            .select('id')
            .single();

        if (createError) {
            setError('Failed to create company');
            return null;
        }

        return data?.id || null;
    };

    const handleSave = async () => {
        if (!firstName || !lastName || !email || !phone) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const finalCompanyId = await createOrSelectCompany();
            if (!finalCompanyId) return;

            const { error: saveError } = await supabase
                .from('clients')
                .insert({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    phone,
                    company_id: finalCompanyId,
                    status,
                    follow_up_date: followUpDate || null,
                })
                .select();

            if (saveError) throw saveError;

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
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h1 className="text-2xl font-semibold text-[#0066CC]">Add New Customer</h1>
                <p className="text-sm text-gray-500 mt-1">Create a new customer record</p>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Form */}
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Customer Information</h2>

                    <div className="space-y-6">
                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                />
                            </div>
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone *
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+64 21 123 4567"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                />
                            </div>
                        </div>

                        {/* Company */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company *
                            </label>
                            <div className="space-y-3">
                                <select
                                    value={companyId}
                                    onChange={(e) => {
                                        setCompanyId(e.target.value);
                                        setNewCompanyName('');
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                >
                                    <option value="">Select existing company...</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.company_name}
                                        </option>
                                    ))}
                                </select>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="text-gray-500 text-sm">or</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={newCompanyName}
                                        onChange={(e) => {
                                            setNewCompanyName(e.target.value);
                                            setCompanyId('');
                                        }}
                                        placeholder="Create new company..."
                                        className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status & Follow-up */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Prospect">Prospect</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Follow-up Date
                                </label>
                                <input
                                    type="date"
                                    value={followUpDate}
                                    onChange={(e) => setFollowUpDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end">
                    <button
                        onClick={() => router.push('/customers')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Customer'}
                    </button>
                </div>
            </div>
        </div>
    );
}