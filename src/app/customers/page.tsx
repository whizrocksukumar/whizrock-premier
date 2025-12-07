'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Search, Plus, ChevronDown } from 'lucide-react';

// Types
interface Client {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_id: string;
    company_name?: string;
    site_address?: string;
    status: string;
    follow_up_date?: string;
}

type SortField = 'first_name' | 'last_name' | 'company_name' | 'site_address' | 'email' | 'phone' | 'status' | 'follow_up_date';
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

    // Fetch clients on mount and when filters change
    useEffect(() => {
        fetchClients();
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

            console.log('Supabase response:', { data, error: fetchError });

            if (fetchError) {
                console.error('Supabase error:', fetchError);
                throw fetchError;
            }

            if (!data) {
                throw new Error('No data returned from Supabase');
            }

            // Get unique company IDs
            const companyIds = [...new Set(data.map(c => c.company_id).filter(Boolean))];
            
            // Fetch company names
            const companyMap: Record<string, string> = {};
            if (companyIds.length > 0) {
                const { data: companies } = await supabase
                    .from('companies')
                    .select('id, name')
                    .in('id', companyIds);
                
                if (companies) {
                    companies.forEach(company => {
                        companyMap[company.id] = company.name;
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
                site_address: client.address_line_1 || '—',
                status: client.status || 'Active',
                follow_up_date: client.follow_up_date || '',
            }));

            console.log('Transformed data:', transformedData);
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
                            Customers
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your customer database</p>
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
                                placeholder="Search customers..."
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
                        <Link
                            href="/customers/new"
                            className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Customer
                        </Link>
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

                <div className="text-sm text-gray-600">
                    Showing {filteredClients.length} of {clients.length} customers
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12 bg-white rounded shadow">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
                        <span className="ml-3 text-gray-600">Loading customers...</span>
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
                                            Name <SortArrow field="first_name" />
                                        </th>
                                        <th
                                            className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                                            onClick={() => handleSort('company_name')}
                                        >
                                            Company <SortArrow field="company_name" />
                                        </th>
                                        <th
                                            className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                                            onClick={() => handleSort('site_address')}
                                        >
                                            Site Address <SortArrow field="site_address" />
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
                                            <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                                No customers found
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
        </div>
    );
}