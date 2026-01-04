'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Search, Plus, X, ChevronDown, Edit, Eye } from 'lucide-react';

// Types
interface Client {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_id: string;
    company_name?: string;
    region_name?: string;
    address_line_1?: string;
    region_id?: string;
    status: string;
    follow_up_date?: string;
}

interface Company {
    id: string;
    name: string;
}

interface Region {
    id: string;
    name: string;
}

interface ClientType {
    id: string;
    name: string;
}

interface ClientFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_id: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    postcode: string;
    region_id: string;
    status: string;
    client_type_id: string;
    website?: string;
}

interface CompanyFormData {
    company_name: string;
    industry: string;
    phone: string;
    email: string;
    website?: string;
}

type SortField = 'first_name' | 'last_name' | 'company_name' | 'address_line_1' | 'region_name' | 'email' | 'phone' | 'status' | 'follow_up_date';
type SortDirection = 'asc' | 'desc';

export default function ClientsPage() {
    const router = useRouter();

    // State
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('last_name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Company state
    const [companies, setCompanies] = useState<Company[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
    const [industries, setIndustries] = useState<string[]>([]);
    const [showCompanyForm, setShowCompanyForm] = useState(false);
    const [savingCompany, setSavingCompany] = useState(false);
    const [companyError, setCompanyError] = useState<string | null>(null);
    const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);

    // Form data
    const [clientForm, setClientForm] = useState<ClientFormData>({
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
        client_type_id: '',
        website: ''
    });

    const [companyForm, setCompanyForm] = useState<CompanyFormData>({
        company_name: '',
        industry: '',
        phone: '',
        email: '',
        website: ''
    });

    // Fetch clients on mount and when filters change
    useEffect(() => {
        fetchClients();
        fetchCompanies();
        fetchRegions();
        fetchClientTypes();
        fetchIndustries();
    }, [searchTerm, statusFilter, sortField, sortDirection, pagination.page]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            setError('');

            // Get clients
            const { data, error: fetchError } = await supabase
                .from('clients')
                .select('*')
                .order('last_name', { ascending: true })
                .limit(50);

            if (fetchError) throw fetchError;
            if (!data) throw new Error('No data returned from Supabase');

            // Get unique company IDs
            const companyIds = [...new Set(data.map(c => c.company_id).filter(Boolean))];
            
            // Get unique region IDs
            const regionIds = [...new Set(data.map(c => c.region_id).filter(Boolean))];
            
            // Fetch company names
            const companyMap: Record<string, string> = {};
            if (companyIds.length > 0) {
                const { data: companies } = await supabase
                    .from('companies')
                    .select('id, company_name')
                    .in('id', companyIds);
                
                if (companies) {
                    companies.forEach(company => {
                        companyMap[company.id] = company.company_name;
                    });
                }
            }

            // Fetch region names
            const regionMap: Record<string, string> = {};
            if (regionIds.length > 0) {
                const { data: regions } = await supabase
                    .from('regions')
                    .select('id, name')
                    .in('id', regionIds);
                
                if (regions) {
                    regions.forEach(region => {
                        regionMap[region.id] = region.name;
                    });
                }
            }

            const transformedData = data.map((client: any) => ({
                id: client.id,
                first_name: client.first_name || '',
                last_name: client.last_name || '',
                email: client.email || '',
                phone: client.phone || '',
                company_id: client.company_id,
                company_name: client.company_id ? (companyMap[client.company_id] || '—') : '—',
                region_name: client.region_id ? (regionMap[client.region_id] || '—') : '—',
                address_line_1: client.address_line_1 || '—',
                region_id: client.region_id,
                status: client.status || 'Prospect',
                follow_up_date: client.follow_up_date || '',
            }));

            setClients(transformedData);
            setPagination(prev => ({ ...prev, total: data.length }));
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('companies')
                .select('id, company_name')
                .order('company_name', { ascending: true });

            if (fetchError) throw fetchError;
            
            const mappedCompanies = (data || []).map(company => ({
                id: company.id,
                name: company.company_name
            }));
            
            setCompanies(mappedCompanies);
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    };

    const fetchRegions = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('regions')
                .select('id, name')
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;
            setRegions(data || []);
        } catch (err) {
            console.error('Error fetching regions:', err);
        }
    };

    const fetchClientTypes = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('client_types')
                .select('id, name')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;
            setClientTypes(data || []);
        } catch (err) {
            console.error('Error fetching client types:', err);
        }
    };

    const fetchIndustries = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('companies')
                .select('industry')
                .not('industry', 'is', null)
                .order('industry', { ascending: true });

            if (fetchError) throw fetchError;
            
            const uniqueIndustries = Array.from(new Set((data || []).map(c => c.industry).filter(Boolean)));
            setIndustries(uniqueIndustries);
        } catch (err) {
            console.error('Error fetching industries:', err);
        }
    };

    const openDrawer = (client?: Client) => {
        if (client) {
            // EDIT MODE - pre-populate form
            setEditingId(client.id);
            setClientForm({
                first_name: client.first_name,
                last_name: client.last_name,
                email: client.email,
                phone: client.phone,
                company_id: client.company_id || '',
                address_line_1: client.address_line_1 || '',
                address_line_2: '',
                city: '',
                postcode: '',
                region_id: client.region_id || '',
                status: client.status || 'Prospect',
                client_type_id: '',
                website: ''
            });
        } else {
            // ADD MODE - empty form
            setEditingId(null);
            setClientForm({
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
                client_type_id: '',
                website: ''
            });
        }
        setFormError(null);
        setShowCompanyForm(false);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setEditingId(null);
        setShowCompanyForm(false);
        setFormError(null);
        setCompanyError(null);
    };

    const handleClientFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setClientForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCompanyForm(prev => ({ ...prev, [name]: value }));
    };

    const validateClientForm = (): boolean => {
        if (!clientForm.first_name.trim()) {
            setFormError('First name is required');
            return false;
        }
        if (!clientForm.last_name.trim()) {
            setFormError('Last name is required');
            return false;
        }
        if (!clientForm.email.trim()) {
            setFormError('Email is required');
            return false;
        }
        if (!clientForm.email.includes('@')) {
            setFormError('Please enter a valid email address');
            return false;
        }
        if (!clientForm.phone.trim()) {
            setFormError('Phone is required');
            return false;
        }
        if (!clientForm.address_line_1.trim()) {
            setFormError('Address is required');
            return false;
        }
        if (!clientForm.region_id) {
            setFormError('Region is required');
            return false;
        }
        return true;
    };

    const handleSubmitClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!validateClientForm()) return;

        setSaving(true);

        try {
            const dataToSave = {
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
            };

            if (editingId) {
                // UPDATE existing client
                const { error: updateError } = await supabase
                    .from('clients')
                    .update(dataToSave)
                    .eq('id', editingId);

                if (updateError) throw updateError;
            } else {
                // INSERT new client
                const { error: insertError } = await supabase
                    .from('clients')
                    .insert(dataToSave);

                if (insertError) throw insertError;
            }

            // Refresh clients list
            await fetchClients();
            closeDrawer();
        } catch (err: any) {
            console.error('Error saving client:', err);
            setFormError(err.message || 'Failed to save client');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setCompanyError(null);

        if (!companyForm.company_name.trim()) {
            setCompanyError('Company name is required');
            return;
        }

        setSavingCompany(true);

        try {
            // Normalize website URL
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

            // Add to companies list
            setCompanies(prev => [...prev, { id: data.id, name: data.company_name }].sort((a, b) => a.name.localeCompare(b.name)));
            
            // Add industry if it's new
            if (companyForm.industry && !industries.includes(companyForm.industry)) {
                setIndustries(prev => [...prev, companyForm.industry].sort());
            }
            
            // Auto-select the new company
            setClientForm(prev => ({ ...prev, company_id: data.id }));
            
            // Reset company form and hide it
            setCompanyForm({ company_name: '', industry: '', phone: '', email: '', website: '' });
            setShowCompanyForm(false);
        } catch (err: any) {
            console.error('Error creating company:', err);
            setCompanyError(err.message || 'Failed to create company');
        } finally {
            setSavingCompany(false);
        }
    };

    const totalPages = Math.ceil(pagination.total / pagination.pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const SortArrow = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <span className="ml-1 text-blue-200">⇅</span>;
        return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-green-500 text-white';
            case 'prospect': return 'bg-blue-500 text-white';
            case 'inactive': return 'bg-gray-500 text-white';
            case 'lost': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-NZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredClients.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredClients.map(c => c.id)));
        }
    };

    const toggleSelectClient = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // Filter clients based on search term and status
    const getFilteredClients = () => {
        let filtered = clients;

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(client =>
                client.first_name?.toLowerCase().includes(term) ||
                client.last_name?.toLowerCase().includes(term) ||
                client.email?.toLowerCase().includes(term) ||
                client.phone?.includes(term) ||
                client.company_name?.toLowerCase().includes(term) ||
                client.address_line_1?.toLowerCase().includes(term)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(client => 
                client.status?.toLowerCase() === statusFilter.toLowerCase()
            );
        }

        return filtered;
    };

    const filteredClients = getFilteredClients();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* ===== PAGE HEADER ===== */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0066CC]">
                            Contacts
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your customer contacts</p>
                    </div>
                    {/* User Icon and Email */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                            U
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-700">user@premier.local</p>
                        </div>
                        <button className="ml-2 text-xs text-[#0066CC] hover:underline">Logout</button>
                    </div>
                </div>
            </div>

            {/* ===== TOOLBAR ROW ===== */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left side - Search */}
                    <div className="w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Right side - Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            Export
                        </button>
                        <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            Import
                        </button>
                        <button
                            onClick={() => openDrawer()}
                            className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Contact
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== FILTER ROW ===== */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            statusFilter === 'all'
                                ? 'bg-[#0066CC] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            statusFilter === 'active'
                                ? 'bg-[#0066CC] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setStatusFilter('prospect')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            statusFilter === 'prospect'
                                ? 'bg-[#0066CC] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Prospect
                    </button>
                    <button
                        onClick={() => setStatusFilter('inactive')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            statusFilter === 'inactive'
                                ? 'bg-[#0066CC] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Inactive
                    </button>
                </div>
            </div>

            {/* ===== CONTENT AREA ===== */}
            <div className="p-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="text-sm text-gray-600 mb-4">
                    Showing {filteredClients.length} of {clients.length} contacts
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12 bg-white rounded shadow">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
                        <span className="ml-3 text-gray-600">Loading contacts...</span>
                    </div>
                ) : (
                    <>
                        {/* Table */}
                        <div className="bg-white rounded shadow overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#0066CC] text-white">
                                        <th className="text-center px-4 py-3 text-xs font-semibold">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === filteredClients.length && filteredClients.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded"
                                            />
                                        </th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold whitespace-nowrap">
                                            Action
                                        </th>
                                        <th
                                            className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                                            onClick={() => handleSort('first_name')}
                                        >
                                            Contact Name <SortArrow field="first_name" />
                                        </th>
                                        <th
                                            className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                                            onClick={() => handleSort('company_name')}
                                        >
                                            Company Name <SortArrow field="company_name" />
                                        </th>
                                        <th
                                            className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                                            onClick={() => handleSort('address_line_1')}
                                        >
                                            Site Address <SortArrow field="address_line_1" />
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">
                                            Region
                                        </th>
                                        <th
                                            className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                                            onClick={() => handleSort('phone')}
                                        >
                                            Phone <SortArrow field="phone" />
                                        </th>
                                        <th
                                            className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                                            onClick={() => handleSort('email')}
                                        >
                                            Email <SortArrow field="email" />
                                        </th>
                                        <th
                                            className="text-center px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                                            onClick={() => handleSort('status')}
                                        >
                                            Status <SortArrow field="status" />
                                        </th>
                                        <th
                                            className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                                            onClick={() => handleSort('follow_up_date')}
                                        >
                                            Follow Up <SortArrow field="follow_up_date" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {clients.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                                No contacts found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredClients.map((client, index) => (
                                            <tr
                                                key={client.id}
                                                className={`hover:bg-blue-50 transition-colors ${
                                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                }`}
                                            >
                                                <td className="text-center px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(client.id)}
                                                        onChange={() => toggleSelectClient(client.id)}
                                                        className="rounded"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Link
                                                            href={`/clients/${client.id}`}
                                                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            View
                                                        </Link>
                                                        <button
                                                            onClick={() => openDrawer(client)}
                                                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                            Edit
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <Link
                                                        href={`/clients/${client.id}`}
                                                        className="text-[#0066CC] hover:underline font-medium"
                                                    >
                                                        {client.first_name} {client.last_name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {client.company_name && client.company_name !== '—' && client.company_id ? (
                                                        <Link
                                                            href={`/companies/${client.company_id}`}
                                                            className="text-[#0066CC] hover:underline"
                                                        >
                                                            {client.company_name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-500">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate" title={client.address_line_1}>
                                                    {client.address_line_1}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {client.region_name || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {client.phone}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {client.email}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                                                            client.status
                                                        )}`}
                                                    >
                                                        {client.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {formatDate(client.follow_up_date)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ===== PAGINATION ===== */}
                        {totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 rounded shadow">
                                <div className="text-sm text-gray-600">
                                    Page {pagination.page} of {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        Previous
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(
                                            page =>
                                                page === 1 ||
                                                page === totalPages ||
                                                Math.abs(page - pagination.page) <= 2
                                        )
                                        .map((page, index, array) => (
                                            <span key={page}>
                                                {index > 0 && array[index - 1] !== page - 1 && (
                                                    <span className="px-2 text-gray-400">...</span>
                                                )}
                                                <button
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-1 rounded text-sm ${
                                                        pagination.page === page
                                                            ? 'bg-[#0066CC] text-white'
                                                            : 'border border-gray-300 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </span>
                                        ))}

                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ===== EDIT/ADD CLIENT DRAWER ===== */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={closeDrawer}
                    ></div>

                    {/* Drawer Panel */}
                    <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-xl overflow-y-auto">
                        {/* Drawer Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-[#0066CC]">
                                    {editingId ? 'Edit Contact' : 'Add New Contact'}
                                </h2>
                                <button
                                    onClick={closeDrawer}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Content */}
                        <form onSubmit={handleSubmitClient} className="p-6 space-y-6">
                            
                            {/* Error */}
                            {formError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {formError}
                                </div>
                            )}

                            {/* Personal Information */}
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
                                            name="first_name"
                                            value={clientForm.first_name}
                                            onChange={handleClientFormChange}
                                            placeholder="John"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={clientForm.last_name}
                                            onChange={handleClientFormChange}
                                            placeholder="Smith"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={clientForm.email}
                                            onChange={handleClientFormChange}
                                            placeholder="john.smith@example.com"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={clientForm.phone}
                                            onChange={handleClientFormChange}
                                            placeholder="+64 21 123 4567"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Client Type */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Client Classification
                                </h3>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Client Type
                                </label>
                                <select
                                    name="client_type_id"
                                    value={clientForm.client_type_id}
                                    onChange={handleClientFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                >
                                    <option value="">-- Select client type (optional) --</option>
                                    {clientTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">e.g., EECA, Head Office, Retailer, Builder</p>
                            </div>

                            {/* Company Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Company Information
                                </h3>
                                
                                {!showCompanyForm ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                name="company_id"
                                                value={clientForm.company_id}
                                                onChange={handleClientFormChange}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                            >
                                                <option value="">-- Select a company --</option>
                                                {companies.map(company => (
                                                    <option key={company.id} value={company.id}>
                                                        {company.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setShowCompanyForm(true)}
                                                className="px-3 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg transition-colors flex items-center gap-1 text-sm font-medium whitespace-nowrap"
                                            >
                                                <Plus className="w-4 h-4" />
                                                New
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Leave empty if this is a residential customer</p>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold text-blue-900">Add New Company</h4>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCompanyForm(false);
                                                    setCompanyError(null);
                                                    setCompanyForm({ company_name: '', industry: '', phone: '', email: '', website: '' });
                                                }}
                                                className="text-sm text-blue-700 hover:text-blue-900 underline"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        {companyError && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-3">
                                                {companyError}
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Company Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="company_name"
                                                    value={companyForm.company_name}
                                                    onChange={handleCompanyFormChange}
                                                    placeholder="ABC Construction Ltd"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Industry
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        name="industry"
                                                        value={companyForm.industry}
                                                        onChange={handleCompanyFormChange}
                                                        onFocus={() => setIndustryDropdownOpen(true)}
                                                        placeholder="e.g., Construction, Property Management"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                                    />
                                                    {industryDropdownOpen && industries.length > 0 && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                                            {industries
                                                                .filter(ind => 
                                                                    ind.toLowerCase().includes(companyForm.industry.toLowerCase()) ||
                                                                    companyForm.industry === ''
                                                                )
                                                                .map((industry, index) => (
                                                                    <button
                                                                        key={index}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setCompanyForm(prev => ({ ...prev, industry }));
                                                                            setIndustryDropdownOpen(false);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 hover:bg-blue-100 text-sm"
                                                                    >
                                                                        {industry}
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={companyForm.phone}
                                                    onChange={handleCompanyFormChange}
                                                    placeholder="+64 9 123 4567"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={companyForm.email}
                                                    onChange={handleCompanyFormChange}
                                                    placeholder="contact@company.com"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Website
                                                </label>
                                                <input
                                                    type="text"
                                                    name="website"
                                                    value={companyForm.website || ''}
                                                    onChange={handleCompanyFormChange}
                                                    placeholder="www.example.com or https://example.com"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleSubmitCompany}
                                                disabled={savingCompany}
                                                className="w-full px-4 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                                            >
                                                {savingCompany ? 'Adding...' : 'Add Company'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Address Information */}
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
                                            name="address_line_1"
                                            value={clientForm.address_line_1}
                                            onChange={handleClientFormChange}
                                            placeholder="123 Main Street"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address Line 2
                                        </label>
                                        <input
                                            type="text"
                                            name="address_line_2"
                                            value={clientForm.address_line_2}
                                            onChange={handleClientFormChange}
                                            placeholder="Apt, suite, unit (optional)"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={clientForm.city}
                                                onChange={handleClientFormChange}
                                                placeholder="Auckland"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Postcode
                                            </label>
                                            <input
                                                type="text"
                                                name="postcode"
                                                value={clientForm.postcode}
                                                onChange={handleClientFormChange}
                                                placeholder="1010"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Region <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="region_id"
                                                value={clientForm.region_id}
                                                onChange={handleClientFormChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                            >
                                                <option value="">-- Select --</option>
                                                {regions.map(region => (
                                                    <option key={region.id} value={region.id}>
                                                        {region.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Status
                                </h3>
                                <div className="flex gap-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Active"
                                            checked={clientForm.status === 'Active'}
                                            onChange={handleClientFormChange}
                                            className="w-4 h-4 text-[#0066CC]"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Prospect"
                                            checked={clientForm.status === 'Prospect'}
                                            onChange={handleClientFormChange}
                                            className="w-4 h-4 text-[#0066CC]"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Prospect</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Inactive"
                                            checked={clientForm.status === 'Inactive'}
                                            onChange={handleClientFormChange}
                                            className="w-4 h-4 text-[#0066CC]"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Inactive</span>
                                    </label>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={closeDrawer}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                                >
                                    {saving ? 'Saving...' : editingId ? 'Update Contact' : 'Save Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}