'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Search, Plus, X } from 'lucide-react';

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
    site_address?: string;
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

interface CustomerFormData {
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
}

interface CompanyFormData {
    company_name: string;
    industry: string;
    phone: string;
    email: string;
}

type SortField = 'first_name' | 'last_name' | 'company_name' | 'site_address' | 'region_name' | 'email' | 'phone' | 'status' | 'follow_up_date';
type SortDirection = 'asc' | 'desc';

export default function CustomersPage() {
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
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Company state
    const [companies, setCompanies] = useState<Company[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [showCompanyForm, setShowCompanyForm] = useState(false);
    const [savingCompany, setSavingCompany] = useState(false);
    const [companyError, setCompanyError] = useState<string | null>(null);

    // Form data
    const [customerForm, setCustomerForm] = useState<CustomerFormData>({
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
        status: 'active'
    });

    const [companyForm, setCompanyForm] = useState<CompanyFormData>({
        company_name: '',
        industry: '',
        phone: '',
        email: ''
    });

    // Fetch clients on mount and when filters change
    useEffect(() => {
        fetchClients();
        fetchCompanies();
        fetchRegions();
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
                site_address: client.address_line_1 || '—',
                status: client.status || 'Active',
                follow_up_date: client.follow_up_date || '',
            }));

            setClients(transformedData);
            setPagination(prev => ({ ...prev, total: data.length }));
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch customers');
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
            
            // Map company_name to name for dropdown
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

    const openDrawer = () => {
        // Reset form
        setCustomerForm({
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
            status: 'active'
        });
        setFormError(null);
        setShowCompanyForm(false);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setShowCompanyForm(false);
        setFormError(null);
        setCompanyError(null);
    };

    const handleCustomerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCustomerForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCompanyForm(prev => ({ ...prev, [name]: value }));
    };

    const validateCustomerForm = (): boolean => {
        if (!customerForm.first_name.trim()) {
            setFormError('First name is required');
            return false;
        }
        if (!customerForm.last_name.trim()) {
            setFormError('Last name is required');
            return false;
        }
        if (!customerForm.email.trim()) {
            setFormError('Email is required');
            return false;
        }
        if (!customerForm.email.includes('@')) {
            setFormError('Please enter a valid email address');
            return false;
        }
        if (!customerForm.phone.trim()) {
            setFormError('Phone is required');
            return false;
        }
        if (!customerForm.address_line_1.trim()) {
            setFormError('Address is required');
            return false;
        }
        if (!customerForm.region_id) {
            setFormError('Region is required');
            return false;
        }
        return true;
    };

    const handleSubmitCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!validateCustomerForm()) return;

        setSaving(true);

        try {
            const { data, error: insertError } = await supabase
                .from('clients')
                .insert({
                    first_name: customerForm.first_name.trim(),
                    last_name: customerForm.last_name.trim(),
                    email: customerForm.email.trim(),
                    phone: customerForm.phone.trim(),
                    company_id: customerForm.company_id || null,
                    address_line_1: customerForm.address_line_1.trim(),
                    address_line_2: customerForm.address_line_2.trim() || null,
                    city: customerForm.city.trim() || null,
                    postcode: customerForm.postcode.trim() || null,
                    region_id: customerForm.region_id,
                    status: customerForm.status
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Refresh clients list
            await fetchClients();
            closeDrawer();
        } catch (err: any) {
            console.error('Error creating customer:', err);
            setFormError(err.message || 'Failed to create customer');
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
            const { data, error: insertError } = await supabase
                .from('companies')
                .insert({
                    company_name: companyForm.company_name.trim(),
                    industry: companyForm.industry.trim() || null,
                    phone: companyForm.phone.trim() || null,
                    email: companyForm.email.trim() || null
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Add to companies list
            setCompanies(prev => [...prev, { id: data.id, name: data.company_name }].sort((a, b) => a.name.localeCompare(b.name)));
            
            // Auto-select the new company
            setCustomerForm(prev => ({ ...prev, company_id: data.id }));
            
            // Reset company form and hide it
            setCompanyForm({ company_name: '', industry: '', phone: '', email: '' });
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
            case 'inactive': return 'bg-gray-500 text-white';
            case 'prospect': return 'bg-blue-500 text-white';
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
                client.site_address?.toLowerCase().includes(term)
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
                            onClick={openDrawer}
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
                        onClick={() => setStatusFilter('Active')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            statusFilter === 'Active'
                                ? 'bg-[#0066CC] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setStatusFilter('Prospect')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            statusFilter === 'Prospect'
                                ? 'bg-[#0066CC] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Prospect
                    </button>
                    <button
                        onClick={() => setStatusFilter('Inactive')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            statusFilter === 'Inactive'
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
                                                checked={selectedIds.size === clients.length && clients.length > 0}
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
                                            onClick={() => handleSort('site_address')}
                                        >
                                            Site Address <SortArrow field="site_address" />
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
                                                            href={`/customers/${client.id}`}
                                                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                                        >
                                                            View
                                                        </Link>
                                                        <Link
                                                            href={`/customers/${client.id}/edit`}
                                                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <Link
                                                        href={`/customers/${client.id}`}
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
                                                <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate" title={client.site_address}>
                                                    {client.site_address}
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

            {/* ===== ADD CUSTOMER DRAWER ===== */}
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
                                <h2 className="text-xl font-semibold text-[#0066CC]">Add New Contact</h2>
                                <button
                                    onClick={closeDrawer}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Content */}
                        <form onSubmit={handleSubmitCustomer} className="p-6 space-y-6">
                            
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
                                            value={customerForm.first_name}
                                            onChange={handleCustomerFormChange}
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
                                            value={customerForm.last_name}
                                            onChange={handleCustomerFormChange}
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
                                            value={customerForm.email}
                                            onChange={handleCustomerFormChange}
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
                                            value={customerForm.phone}
                                            onChange={handleCustomerFormChange}
                                            placeholder="+64 21 123 4567"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                        />
                                    </div>
                                </div>
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
                                                value={customerForm.company_id}
                                                onChange={handleCustomerFormChange}
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
                                                    setCompanyForm({ company_name: '', industry: '', phone: '', email: '' });
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
                                                <input
                                                    type="text"
                                                    name="industry"
                                                    value={companyForm.industry}
                                                    onChange={handleCompanyFormChange}
                                                    placeholder="e.g., Construction, Property Management"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                                                />
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
                                            value={customerForm.address_line_1}
                                            onChange={handleCustomerFormChange}
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
                                            value={customerForm.address_line_2}
                                            onChange={handleCustomerFormChange}
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
                                                value={customerForm.city}
                                                onChange={handleCustomerFormChange}
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
                                                value={customerForm.postcode}
                                                onChange={handleCustomerFormChange}
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
                                                value={customerForm.region_id}
                                                onChange={handleCustomerFormChange}
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
                                            value="active"
                                            checked={customerForm.status === 'active'}
                                            onChange={handleCustomerFormChange}
                                            className="w-4 h-4 text-[#0066CC]"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="inactive"
                                            checked={customerForm.status === 'inactive'}
                                            onChange={handleCustomerFormChange}
                                            className="w-4 h-4 text-[#0066CC]"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Inactive</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="prospect"
                                            checked={customerForm.status === 'prospect'}
                                            onChange={handleCustomerFormChange}
                                            className="w-4 h-4 text-[#0066CC]"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Prospect</span>
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
                                    {saving ? 'Saving...' : 'Save Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}