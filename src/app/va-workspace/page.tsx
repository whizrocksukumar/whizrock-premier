'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

// Simplified interface - only include fields that actually exist
interface Recommendation {
    id: string;
    recommendation_number: string;
    version: string;
    status: string;
    created_at: string;
    client_id: string;
}

export default function VAWorkspacePage() {
    const router = useRouter();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Stats
    const [stats, setStats] = useState({ total: 0, draft: 0, submitted: 0, converted: 0 });

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);

            // SIMPLIFIED QUERY - just get the core fields
            // Don't try to join related tables that might not exist or have permission issues
            const { data, error: queryError } = await supabase
                .from('product_recommendations')
                .select(`
                    id,
                    recommendation_number,
                    version,
                    status,
                    created_at,
                    client_id
                `)
                .order('created_at', { ascending: false });

            if (queryError) {
                console.error('Error loading recommendations:', queryError);
                setError(`Error: ${queryError.message}`);
                return;
            }

            setRecommendations(data || []);

            const total = data?.length || 0;
            const draft = data?.filter(r => r.status === 'Draft').length || 0;
            const submitted = data?.filter(r => r.status === 'Submitted').length || 0;
            const converted = data?.filter(r => r.status === 'Converted to Quote').length || 0;
            setStats({ total, draft, submitted, converted });
        } catch (error) {
            console.error('Error:', error);
            setError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, recNumber: string) => {
        if (!confirm(`Delete recommendation ${recNumber}?`)) return;

        try {
            const { error: deleteError } = await supabase
                .from('product_recommendations')
                .delete()
                .eq('id', id);

            if (deleteError) {
                alert(`Error deleting: ${deleteError.message}`);
                return;
            }

            setRecommendations(recommendations.filter(r => r.id !== id));
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const filteredRecommendations = recommendations.filter(rec => {
        const matchesSearch = rec.recommendation_number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            Draft: 'bg-gray-100 text-gray-700',
            Submitted: 'bg-blue-100 text-blue-700',
            'Converted to Quote': 'bg-green-100 text-green-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
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
            {/* Page Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0066CC]">VA Workspace</h1>
                        <p className="text-sm text-gray-500 mt-1">Create and manage product recommendations</p>
                    </div>
                    <button
                        onClick={() => router.push('/va-workspace/new')}
                        className="px-4 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Create Recommendation
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm"><strong>Error:</strong> {error}</p>
                </div>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-2 px-6 py-4">
                {['All', 'Draft', 'Submitted', 'Converted to Quote'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status ? 'bg-[#0066CC] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        {status === 'Converted to Quote' ? 'Converted' : status}
                    </button>
                ))}
            </div>

            {/* Search and Stats */}
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search recommendations..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Total: <span className="font-semibold">{stats.total}</span></span>
                    <span>Draft: <span className="font-semibold">{stats.draft}</span></span>
                    <span>Submitted: <span className="font-semibold">{stats.submitted}</span></span>
                    <span>Converted: <span className="font-semibold">{stats.converted}</span></span>
                </div>
            </div>

            {/* Recommendations Table */}
            <div className="px-6 pb-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#0066CC]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Recommendation #</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Created Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRecommendations.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">
                                        No recommendations found. Click "Create Recommendation" to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecommendations.map(rec => (
                                    <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => router.push(`/va-workspace/${rec.id}`)}
                                                className="text-[#0066CC] hover:underline font-medium"
                                            >
                                                {rec.recommendation_number}.{rec.version}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {new Date(rec.created_at).toLocaleDateString('en-NZ')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(rec.status)}`}>
                                                {rec.status === 'Converted to Quote' ? 'Converted' : rec.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {rec.status === 'Draft' ? (
                                                    <>
                                                        <button
                                                            onClick={() => router.push(`/va-workspace/${rec.id}`)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(rec.id, rec.recommendation_number)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push(`/va-workspace/${rec.id}`)}
                                                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}