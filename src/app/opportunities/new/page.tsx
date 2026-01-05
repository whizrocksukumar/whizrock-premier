'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, Plus, X, Building2, User } from 'lucide-react';
import Link from 'next/link';

// Types
interface Client {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_id: string | null;
    address_line_1: string;
    address_line_2?: string;
    city?: string;
    postcode?: string;
    region_id: string;
}

interface Company {
    id: string;
    company_name: string;
    industry?: string;
    phone?: string;
    email?: string;
    website?: string;
}

interface Region {
    id: string;
    name: string;
}

interface ClientType {
    id: string;
    name: string;
}

interface SiteAddress {
    id: string;
    address_line_1: string;
    address_line_2?: string;
    city?: string;
    postcode?: string;
    region_id: string;
}

export default function NewOpportunityPage() {
    const router = useRouter();

    // State
    const [searchType, setSearchType] = useState<'contact' | 'company'>('contact');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [contacts, setContacts] = useState<Client[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [clientTypes, setClientTypes] = useState<ClientType[]>([]);

    // Selected data
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [siteAddresses, setSiteAddresses] = useState<SiteAddress[]>([]);
    const [selectedSiteAddress, setSelectedSiteAddress] = useState<string>('');
    const [showNewSiteForm, setShowNewSiteForm] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        contact_type: 'Primary Contact',
        client_type: 'Homeowner',
        site_address: '',
        site_city: '',
        site_postcode: '',
        estimated_value: '',
        due_date: '',
        notes: ''
    });

    // Drawer states
    const [showClientDrawer, setShowClientDrawer] = useState(false);
    const [showCompanyDrawer, setShowCompanyDrawer] = useState(false);

    // Client form
    const [clientForm, setClientForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_id: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        postcode: '',
        region_id: '',
        status: 'Prospect',
        client_type_id: ''
    });

    // Company form
    const [companyForm, setCompanyForm] = useState({
        company_name: '',
        industry: '',
        phone: '',
        email: '',
        website: ''
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [savingClient, setSavingClient] = useState(false);
    const [savingCompany, setSavingCompany] = useState(false);

    // Fetch initial data
    useEffect(() => {
        fetchContacts();
        fetchCompanies();
        fetchRegions();
        fetchClientTypes();
    }, []);

    // Fetch site addresses when contact or company is selected
    useEffect(() => {
        if (selectedClient || selectedCompany) {
            fetchSiteAddresses();
        }
    }, [selectedClient, selectedCompany]);

    const fetchContacts = async () => {
        const { data } = await supabase
            .from('clients')
            .select('*')
            .order('last_name', { ascending: true });
        if (data) setContacts(data);
    };

    const fetchCompanies = async () => {
        const { data } = await supabase
            .from('companies')
            .select('id, company_name, industry, phone, email, website')
            .order('company_name', { ascending: true });
        if (data) setCompanies(data);
    };

    const fetchRegions = async () => {
        const { data } = await supabase
            .from('regions')
            .select('id, name')
            .order('name', { ascending: true });
        if (data) setRegions(data);
    };

    const fetchClientTypes = async () => {
        const { data } = await supabase
            .from('client_types')
            .select('id, name')
            .eq('is_active', true)
            .order('name', { ascending: true });
        if (data) setClientTypes(data);
    };

    const fetchSiteAddresses = async () => {
        let addresses: SiteAddress[] = [];

        if (selectedClient) {
            // Get address from the selected contact
            addresses.push({
                id: selectedClient.id,
                address_line_1: selectedClient.address_line_1,
                address_line_2: selectedClient.address_line_2,
                city: selectedClient.city,
                postcode: selectedClient.postcode,
                region_id: selectedClient.region_id
            });

            // If contact has a company, get all addresses from other contacts in that company
            if (selectedClient.company_id) {
                const { data } = await supabase
                    .from('clients')
                    .select('id, address_line_1, address_line_2, city, postcode, region_id')
                    .eq('company_id', selectedClient.company_id)
                    .neq('id', selectedClient.id);

                if (data) {
                    addresses = [...addresses, ...data];
                }
            }
        } else if (selectedCompany) {
            // Get all addresses from contacts in this company
            const { data } = await supabase
                .from('clients')
                .select('id, address_line_1, address_line_2, city, postcode, region_id')
                .eq('company_id', selectedCompany.id);

            if (data) {
                addresses = data;
            }
        }

        // Remove duplicates based on address_line_1
        const uniqueAddresses = addresses.filter(
            (addr, index, self) =>
                index === self.findIndex((a) => a.address_line_1 === addr.address_line_1)
        );

        setSiteAddresses(uniqueAddresses);
    };

    const getNextOppNumber = async () => {
        // Get the latest opportunity number
        const { data, error } = await supabase
            .from('opportunities')
            .select('opp_number')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) {
            // Start with OPP-0001 if no opportunities exist
            return 'OPP-0001';
        }

        // Extract the number from the last opp_number (format: OPP-XXXX)
        const lastOppNumber = data[0].opp_number;
        const numberPart = parseInt(lastOppNumber.split('-')[1] || '0');
        const nextNumber = numberPart + 1;

        // Format with leading zeros
        return `OPP-${String(nextNumber).padStart(4, '0')}`;
    };

    const filteredContacts = contacts.filter(contact => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
        return fullName.includes(searchLower) || contact.email.toLowerCase().includes(searchLower);
    });

    const filteredCompanies = companies.filter(company => {
        const searchLower = searchTerm.toLowerCase();
        return company.company_name.toLowerCase().includes(searchLower);
    });

    const handleSelectContact = (contact: Client) => {
        setSelectedClient(contact);
        setSelectedCompany(null);
        setSearchTerm(`${contact.first_name} ${contact.last_name}`);
        setShowSearchResults(false);
        setSelectedSiteAddress('');
        setShowNewSiteForm(false);
    };

    const handleSelectCompany = (company: Company) => {
        setSelectedCompany(company);
        setSelectedClient(null);
        setSearchTerm(company.company_name);
        setShowSearchResults(false);
        setSelectedSiteAddress('');
        setShowNewSiteForm(false);
    };

    const handleSelectSiteAddress = (address: SiteAddress) => {
        setSelectedSiteAddress(address.id);
        setFormData({
            ...formData,
            site_address: address.address_line_1,
            site_city: address.city || '',
            site_postcode: address.postcode || ''
        });
        setShowNewSiteForm(false);
    };

    const handleNewSite = () => {
        setSelectedSiteAddress('new');
        setShowNewSiteForm(true);
        setFormData({
            ...formData,
            site_address: '',
            site_city: '',
            site_postcode: ''
        });
    };

    const handleSubmitClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingClient(true);

        try {
            const { data, error: insertError } = await supabase
                .from('clients')
                .insert({
                    first_name: clientForm.first_name.trim(),
                    last_name: clientForm.last_name.trim(),
                    email: clientForm.email.trim(),
                    phone: clientForm.phone.trim(),
                    company_id: clientForm.company_id || null,
                    address_line_1: clientForm.address_line_1.trim(),
                    address_line_2: clientForm.address_line_2.trim() || null,
                    city: clientForm.city.trim() || null,
                    postcode: clientForm.postcode.trim() || null,
                    region_id: clientForm.region_id,
                    status: clientForm.status,
                    client_type_id: clientForm.client_type_id || null
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Refresh contacts and select the new one
            await fetchContacts();
            if (data) {
                handleSelectContact(data);
            }
            setShowClientDrawer(false);
        } catch (err: any) {
            console.error('Error creating contact:', err);
            alert(err.message || 'Failed to create contact');
        } finally {
            setSavingClient(false);
        }
    };

    const handleSubmitCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingCompany(true);

        try {
            const normalizedWebsite = companyForm.website?.trim()
                ? (companyForm.website.startsWith('http')
                    ? companyForm.website
                    : `https://${companyForm.website}`)
                : null;

            const { data, error: insertError } = await supabase
                .from('companies')
                .insert({
                    company_name: companyForm.company_name.trim(),
                    industry: companyForm.industry.trim() || null,
                    phone: companyForm.phone.trim() || null,
                    email: companyForm.email.trim() || null,
                    website: normalizedWebsite
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Refresh companies and select the new one
            await fetchCompanies();
            if (data) {
                handleSelectCompany(data);
            }
            setShowCompanyDrawer(false);
        } catch (err: any) {
            console.error('Error creating company:', err);
            alert(err.message || 'Failed to create company');
        } finally {
            setSavingCompany(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!selectedClient && !selectedCompany) {
            setError('Please select a contact or company');
            return;
        }

        if (!formData.site_address) {
            setError('Please select or enter a site address');
            return;
        }

        if (!formData.estimated_value) {
            setError('Please enter an estimated value');
            return;
        }

        setSaving(true);

        try {
            // Get next opportunity number
            const oppNumber = await getNextOppNumber();

            // Get contact information
            let contactFirstName = '';
            let contactLastName = '';
            let contactEmail = '';
            let contactPhone = '';

            if (selectedClient) {
                contactFirstName = selectedClient.first_name;
                contactLastName = selectedClient.last_name;
                contactEmail = selectedClient.email;
                contactPhone = selectedClient.phone;
            } else if (selectedCompany) {
                // For company, we need to get a primary contact
                const { data: companyContacts } = await supabase
                    .from('clients')
                    .select('first_name, last_name, email, phone')
                    .eq('company_id', selectedCompany.id)
                    .limit(1);

                if (companyContacts && companyContacts.length > 0) {
                    contactFirstName = companyContacts[0].first_name;
                    contactLastName = companyContacts[0].last_name;
                    contactEmail = companyContacts[0].email || '';
                    contactPhone = companyContacts[0].phone || '';
                } else {
                    // Use company info as fallback
                    contactFirstName = selectedCompany.company_name;
                    contactLastName = '';
                    contactEmail = selectedCompany.email || '';
                    contactPhone = selectedCompany.phone || '';
                }
            }

            // Prepare opportunity data
            const opportunityData: any = {
                opp_number: oppNumber,
                client_id: selectedClient?.id || null,
                company_id: selectedCompany?.id || null,
                contact_first_name: contactFirstName,
                contact_last_name: contactLastName,
                contact_email: contactEmail,
                contact_phone: contactPhone,
                contact_type: formData.contact_type,
                client_type: formData.client_type,
                site_address: formData.site_address.trim(),
                site_city: formData.site_city.trim() || null,
                site_postcode: formData.site_postcode.trim() || null,
                estimated_value: parseFloat(formData.estimated_value),
                due_date: formData.due_date || null,
                notes: formData.notes.trim() || null,
                stage: 'NEW',
                sub_status: 'Initial Contact',
                is_active: true
            };

            const { error: insertError } = await supabase
                .from('opportunities')
                .insert(opportunityData);

            if (insertError) throw insertError;

            // Redirect to opportunities page
            router.push('/opportunities');
        } catch (err: any) {
            console.error('Error creating opportunity:', err);
            setError(err.message || 'Failed to create opportunity');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link href="/opportunities" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0066CC]">New Opportunity</h1>
                        <p className="text-sm text-gray-500 mt-1">Create a new sales opportunity</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="p-6 max-w-6xl mx-auto">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Search by Contact or Company */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Search by Contact or Company
                        </h2>

                        {/* Search Type Toggle */}
                        <div className="flex gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchType('contact');
                                    setSearchTerm('');
                                    setSelectedClient(null);
                                    setSelectedCompany(null);
                                }}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                    searchType === 'contact'
                                        ? 'bg-[#0066CC] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                Search Contact
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchType('company');
                                    setSearchTerm('');
                                    setSelectedClient(null);
                                    setSelectedCompany(null);
                                }}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                    searchType === 'company'
                                        ? 'bg-[#0066CC] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <Building2 className="w-4 h-4" />
                                Search Company
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={
                                    searchType === 'contact'
                                        ? 'Search contacts by name or email...'
                                        : 'Search companies by name...'
                                }
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowSearchResults(true);
                                }}
                                onFocus={() => setShowSearchResults(true)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                            />

                            {/* Search Results Dropdown */}
                            {showSearchResults && searchTerm && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-[400px] overflow-y-auto">
                                    {searchType === 'contact' ? (
                                        filteredContacts.length > 0 ? (
                                            filteredContacts.slice(0, 50).map((contact) => (
                                                <button
                                                    key={contact.id}
                                                    type="button"
                                                    onClick={() => handleSelectContact(contact)}
                                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="font-medium text-gray-900 flex-shrink-0">
                                                            {contact.first_name} {contact.last_name}
                                                        </span>
                                                        <span className="text-sm text-gray-500 truncate">
                                                            {contact.email}
                                                        </span>
                                                        {contact.address_line_1 && (
                                                            <span className="text-xs text-gray-400 truncate flex-shrink-0 max-w-[200px]">
                                                                {contact.address_line_1}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500">No contacts found</div>
                                        )
                                    ) : (
                                        filteredCompanies.length > 0 ? (
                                            filteredCompanies.slice(0, 50).map((company) => (
                                                <button
                                                    key={company.id}
                                                    type="button"
                                                    onClick={() => handleSelectCompany(company)}
                                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="font-medium text-gray-900 flex-shrink-0">
                                                            {company.company_name}
                                                        </span>
                                                        {company.industry && (
                                                            <span className="text-sm text-gray-500 truncate">
                                                                {company.industry}
                                                            </span>
                                                        )}
                                                        {company.email && (
                                                            <span className="text-xs text-gray-400 truncate">
                                                                {company.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500">No companies found</div>
                                        )
                                    )}
                                    {((searchType === 'contact' && filteredContacts.length > 50) ||
                                      (searchType === 'company' && filteredCompanies.length > 50)) && (
                                        <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 text-center border-t">
                                            Showing first 50 results. Refine your search for more specific results.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Create New Button */}
                        <button
                            type="button"
                            onClick={() => {
                                if (searchType === 'contact') {
                                    setShowClientDrawer(true);
                                } else {
                                    setShowCompanyDrawer(true);
                                }
                            }}
                            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create New {searchType === 'contact' ? 'Contact' : 'Company'}
                        </button>

                        {/* Selected Display */}
                        {(selectedClient || selectedCompany) && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-800">Selected:</p>
                                        <p className="text-green-900 font-semibold">
                                            {selectedClient
                                                ? `${selectedClient.first_name} ${selectedClient.last_name}`
                                                : selectedCompany?.company_name}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedClient(null);
                                            setSelectedCompany(null);
                                            setSearchTerm('');
                                            setSiteAddresses([]);
                                            setSelectedSiteAddress('');
                                        }}
                                        className="text-green-700 hover:text-green-900"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Site Address Selection */}
                    {(selectedClient || selectedCompany) && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Site Address</h2>

                            {siteAddresses.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Existing Address
                                    </label>
                                    <div className="space-y-2">
                                        {siteAddresses.map((address) => (
                                            <button
                                                key={address.id}
                                                type="button"
                                                onClick={() => handleSelectSiteAddress(address)}
                                                className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-colors ${
                                                    selectedSiteAddress === address.id
                                                        ? 'border-[#0066CC] bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <p className="font-medium text-gray-900">{address.address_line_1}</p>
                                                {address.city && (
                                                    <p className="text-sm text-gray-600">
                                                        {address.city} {address.postcode}
                                                    </p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleNewSite}
                                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mb-4"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Site Address
                            </button>

                            {/* New Site Form */}
                            {showNewSiteForm && (
                                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Street Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.site_address}
                                            onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                                            placeholder="123 Main Street"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                            <input
                                                type="text"
                                                value={formData.site_city}
                                                onChange={(e) => setFormData({ ...formData, site_city: e.target.value })}
                                                placeholder="Auckland"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                                            <input
                                                type="text"
                                                value={formData.site_postcode}
                                                onChange={(e) => setFormData({ ...formData, site_postcode: e.target.value })}
                                                placeholder="1010"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contact & Client Type */}
                    {(selectedClient || selectedCompany) && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                Classification
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Type
                                    </label>
                                    <select
                                        value={formData.contact_type}
                                        onChange={(e) => setFormData({ ...formData, contact_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                    >
                                        <option value="Primary Contact">Primary Contact</option>
                                        <option value="Decision Maker">Decision Maker</option>
                                        <option value="Influencer">Influencer</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Client Type
                                    </label>
                                    <select
                                        value={formData.client_type}
                                        onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                    >
                                        <option value="Homeowner">Homeowner</option>
                                        <option value="Builder">Builder</option>
                                        <option value="Developer">Developer</option>
                                        <option value="Contractor">Contractor</option>
                                        <option value="Business">Business</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Opportunity Details */}
                    {(selectedClient || selectedCompany) && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                Opportunity Details
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estimated Value (NZD) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.estimated_value}
                                        onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={4}
                                    placeholder="Add any additional notes about this opportunity..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end">
                        <Link
                            href="/opportunities"
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving || !selectedClient && !selectedCompany}
                            className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Creating...' : 'Create Opportunity'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Client Drawer */}
            {showClientDrawer && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowClientDrawer(false)}></div>
                    <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-xl overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-[#0066CC]">Add New Contact</h2>
                                <button onClick={() => setShowClientDrawer(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitClient} className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={clientForm.first_name}
                                            onChange={(e) => setClientForm({ ...clientForm, first_name: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={clientForm.last_name}
                                            onChange={(e) => setClientForm({ ...clientForm, last_name: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={clientForm.email}
                                            onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={clientForm.phone}
                                            onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Address Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address Line 1 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={clientForm.address_line_1}
                                            onChange={(e) => setClientForm({ ...clientForm, address_line_1: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                            <input
                                                type="text"
                                                value={clientForm.city}
                                                onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                                            <input
                                                type="text"
                                                value={clientForm.postcode}
                                                onChange={(e) => setClientForm({ ...clientForm, postcode: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Region <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={clientForm.region_id}
                                                onChange={(e) => setClientForm({ ...clientForm, region_id: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                            >
                                                <option value="">-- Select --</option>
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

                            <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={() => setShowClientDrawer(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingClient}
                                    className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                                >
                                    {savingClient ? 'Creating...' : 'Create Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Company Drawer */}
            {showCompanyDrawer && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCompanyDrawer(false)}></div>
                    <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-xl overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-[#0066CC]">Add New Company</h2>
                                <button onClick={() => setShowCompanyDrawer(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitCompany} className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Company Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={companyForm.company_name}
                                            onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                                        <input
                                            type="text"
                                            value={companyForm.industry}
                                            onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={companyForm.phone}
                                            onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={companyForm.email}
                                            onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                        <input
                                            type="text"
                                            value={companyForm.website}
                                            onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                                            placeholder="www.example.com"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={() => setShowCompanyDrawer(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingCompany}
                                    className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                                >
                                    {savingCompany ? 'Creating...' : 'Create Company'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
