'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Plus, X, Upload, Download, Trash2, Edit, ChevronRight, FileText, Calendar, DollarSign, User, Building2, MapPin, Send, AlertCircle, LayoutGrid, List, Eye } from 'lucide-react';
import Link from 'next/link';
import ClientSelector from '@/components/ClientSelector';
import SiteSelector from '@/components/SiteSelector';

// Types
interface Opportunity {
    id: string;
    opp_number: string;
    client_id: string;
    contact_type: string | null;
    client_type: string | null;
    sales_rep_id: string | null;
    site_address: string | null;
    site_city: string | null;
    site_postcode: string | null;
    region_id: string | null;
    stage: 'NEW' | 'QUALIFIED' | 'QUOTED' | 'WON' | 'LOST';
    sub_status: string | null;
    estimated_value: number | null;
    actual_value: number | null;
    due_date: string | null;
    follow_up_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    clients?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string | null;
        phone: string | null;
        company_name: string | null;
    } | null;
    sales_rep?: {
        id: string;
        first_name: string;
        last_name: string;
    } | null;
    regions?: {
        name: string;
    } | null;
}

interface Task {
    id: string;
    task_description: string;
    task_type: string;
    status: string;
    priority: string;
    due_date: string | null;
    completion_percent: number;
    assigned_to_user_id?: string;
    team_members?: {
        first_name: string;
        last_name: string;
    };
}

interface Attachment {
    id: string;
    file_name: string;
    file_path: string;
    file_url: string;
    file_type: string;
    file_size: number;
    file_category: string;
    uploaded_at: string;
    uploaded_by_user_id: string;
    is_deleted: boolean;
}

const STAGES: Array<{key: Opportunity['stage'], label: string, color: string}> = [
    { key: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { key: 'QUALIFIED', label: 'Qualified', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    { key: 'QUOTED', label: 'Quoted', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    { key: 'WON', label: 'Won', color: 'bg-green-100 text-green-800 border-green-300' },
    { key: 'LOST', label: 'Lost', color: 'bg-gray-100 text-gray-800 border-gray-300' }
];

export default function OpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stageFilter, setStageFilter] = useState<string>('ALL');
    const [salesRepFilter, setSalesRepFilter] = useState<string>('all');
    const [regionFilter, setRegionFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    // Drawer state
    const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'timeline' | 'attachments'>('overview');
    const [editMode, setEditMode] = useState(false);

    // Drawer data
    const [tasks, setTasks] = useState<Task[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loadingDrawerData, setLoadingDrawerData] = useState(false);

    // Edit form state
    const [editForm, setEditForm] = useState<Partial<Opportunity>>({});
    const [savingEdit, setSavingEdit] = useState(false);

    // Site entry mode
    const [siteEntryMode, setSiteEntryMode] = useState<'existing' | 'manual'>('existing');

    // Move to stage dropdown
    const [showStageDropdown, setShowStageDropdown] = useState(false);
    
    // File upload state
    const [uploadingFile, setUploadingFile] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // Drag and drop state
    const [draggedOpportunity, setDraggedOpportunity] = useState<Opportunity | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState<Record<string, number>>({
        NEW: 1,
        QUALIFIED: 1,
        QUOTED: 1,
        WON: 1,
        LOST: 1
    });
    const cardsPerPage = 10;

    // Send to VA state
    const [sendToVAModalOpen, setSendToVAModalOpen] = useState(false);
    const [opportunityToSend, setOpportunityToSend] = useState<Opportunity | null>(null);
    const [vaList, setVaList] = useState<Array<{id: string, first_name: string, last_name: string, email: string}>>([]);
    const [selectedVA, setSelectedVA] = useState<string>('16bc0e92-2bbd-4e89-95a6-5f82e849047d');
    const [sendingToVA, setSendingToVA] = useState(false);

    // Sales reps list
    const [salesRepsList, setSalesRepsList] = useState<Array<{id: string, name: string}>>([]);

    // Regions list
    const [regionsList, setRegionsList] = useState<Array<{id: string, name: string}>>([]);

    useEffect(() => {
        fetchOpportunities();
        fetchVAList();
        fetchSalesReps();
        fetchRegions();
    }, []);

    const fetchOpportunities = async () => {
        setLoading(true);

        try {
            // Fetch opportunities without relationships
            const { data: oppsData, error: oppsError } = await supabase
                .from('opportunities')
                .select('*')
                .order('created_at', { ascending: false });

            if (oppsError) {
                console.error('❌ Error fetching opportunities:', oppsError);
                setLoading(false);
                return;
            }

            // Filter for active opportunities
            const activeOpps = oppsData?.filter(opp => opp.is_active !== false) || [];

            // Fetch related data separately
            const clientIds = [...new Set(activeOpps.map(opp => opp.client_id).filter(Boolean))];
            const salesRepIds = [...new Set(activeOpps.map(opp => opp.sales_rep_id).filter(Boolean))];
            const regionIds = [...new Set(activeOpps.map(opp => opp.region_id).filter(Boolean))];

            const [clientsRes, salesRepsRes, regionsRes] = await Promise.all([
                clientIds.length > 0 ? supabase.from('clients').select('*').in('id', clientIds) : { data: [] },
                salesRepIds.length > 0 ? supabase.from('team_members').select('id, first_name, last_name').in('id', salesRepIds) : { data: [] },
                regionIds.length > 0 ? supabase.from('regions').select('id, name').in('id', regionIds) : { data: [] }
            ]);

            // Create lookup maps
            const clientsMap = new Map(clientsRes.data?.map(c => [c.id, c]) || []);
            const salesRepsMap = new Map(salesRepsRes.data?.map(sr => [sr.id, sr]) || []);
            const regionsMap = new Map(regionsRes.data?.map(r => [r.id, r]) || []);

            // Merge data
            const enrichedOpps = activeOpps.map(opp => ({
                ...opp,
                clients: opp.client_id ? clientsMap.get(opp.client_id) : null,
                sales_rep: opp.sales_rep_id ? salesRepsMap.get(opp.sales_rep_id) : null,
                regions: opp.region_id ? regionsMap.get(opp.region_id) : null
            }));

            setOpportunities(enrichedOpps);
        } catch (err) {
            console.error('❌ Unexpected error:', err);
        }

        setLoading(false);
    };

    const fetchVAList = async () => {
        const { data, error } = await supabase
            .from('team_members')
            .select('id, first_name, last_name, email')
            .eq('role', 'VA');

        if (!error && data) {
            setVaList(data);
            const maria = data.find(va => va.id === '16bc0e92-2bbd-4e89-95a6-5f82e849047d');
            if (maria) {
                setSelectedVA(maria.id);
            }
        }
    };

    const fetchSalesReps = async () => {
        const { data, error } = await supabase
            .from('team_members')
            .select('id, first_name, last_name')
            .eq('role', 'Sales Rep')
            .order('first_name');

        if (!error && data) {
            // Map to match the expected format
            const formattedReps = data.map(rep => ({
                id: rep.id,
                name: `${rep.first_name} ${rep.last_name}`
            }));
            setSalesRepsList(formattedReps);
        }
    };

    const fetchRegions = async () => {
        const { data, error } = await supabase
            .from('regions')
            .select('id, name')
            .order('name');

        if (!error && data) {
            setRegionsList(data);
        }
    };

    useEffect(() => {
        let filtered = opportunities;

        // Stage filter
        if (stageFilter !== 'ALL') {
            filtered = filtered.filter(opp => opp.stage === stageFilter);
        }

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(opp => {
                const customerName = opp.clients
                    ? `${opp.clients.first_name} ${opp.clients.last_name}`
                    : '';
                const company = opp.clients?.company_name || '';

                return (
                    opp.opp_number.toLowerCase().includes(term) ||
                    customerName.toLowerCase().includes(term) ||
                    company.toLowerCase().includes(term) ||
                    (opp.site_address?.toLowerCase().includes(term) || false) ||
                    (opp.sub_status?.toLowerCase().includes(term) || false)
                );
            });
        }

        // Sales rep filter
        if (salesRepFilter !== 'all') {
            filtered = filtered.filter(opp => opp.sales_rep_id === salesRepFilter);
        }

        // Region filter
        if (regionFilter !== 'all') {
            filtered = filtered.filter(opp => opp.region_id === regionFilter);
        }

        setFilteredOpportunities(filtered);
    }, [opportunities, searchTerm, stageFilter, salesRepFilter, regionFilter]);

    const getOpportunitiesByStage = (stage: Opportunity['stage']) => {
        return filteredOpportunities.filter(opp => opp.stage === stage);
    };

    const getPaginatedOpportunities = (stage: Opportunity['stage']) => {
        const stageOpps = getOpportunitiesByStage(stage);
        const page = currentPage[stage] || 1;
        const startIndex = (page - 1) * cardsPerPage;
        const endIndex = startIndex + cardsPerPage;
        return stageOpps.slice(startIndex, endIndex);
    };

    const getTotalPages = (stage: Opportunity['stage']) => {
        const stageOpps = getOpportunitiesByStage(stage);
        return Math.ceil(stageOpps.length / cardsPerPage);
    };

    const handlePageChange = (stage: Opportunity['stage'], newPage: number) => {
        setCurrentPage(prev => ({ ...prev, [stage]: newPage }));
    };

    const handleDragStart = (e: React.DragEvent, opportunity: Opportunity) => {
        setDraggedOpportunity(opportunity);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetStage: Opportunity['stage']) => {
        e.preventDefault();
        
        if (!draggedOpportunity || draggedOpportunity.stage === targetStage) {
            setDraggedOpportunity(null);
            return;
        }

        // Update opportunity stage
        const { error } = await supabase
            .from('opportunities')
            .update({ 
                stage: targetStage,
                updated_at: new Date().toISOString()
            })
            .eq('id', draggedOpportunity.id);

        if (error) {
            console.error('Error updating stage:', error);
            alert('Failed to update stage');
        } else {
            // Auto-create tasks based on stage
            await createAutoTask(draggedOpportunity.id, targetStage);
            
            // Refresh opportunities
            fetchOpportunities();
        }

        setDraggedOpportunity(null);
    };

    const createAutoTask = async (opportunityId: string, stage: Opportunity['stage']) => {
        let taskDescription = '';
        let taskType = '';

        switch (stage) {
            case 'QUALIFIED':
                taskDescription = 'Add Assessment Files & Create Recommendation';
                taskType = 'Product Recommendation';
                break;
            case 'QUOTED':
                taskDescription = 'Send Quote';
                taskType = 'Quote Creation';
                break;
            case 'WON':
                taskDescription = 'Schedule Job';
                taskType = 'Other';
                break;
            case 'LOST':
                // No task for LOST stage
                return;
            default:
                return;
        }

        // Create task
        await supabase
            .from('tasks')
            .insert({
                opportunity_id: opportunityId,
                task_description: taskDescription,
                task_type: taskType,
                status: 'Not Started',
                priority: 'High',
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
            });
    };

    const openDrawer = async (opportunity: Opportunity) => {
        setSelectedOpportunity(opportunity);
        setDrawerOpen(true);
        setActiveTab('overview');
        setEditMode(false);
        setEditForm(opportunity);
        setLoadingDrawerData(true);

        // Fetch tasks
        const { data: tasksData } = await supabase
            .from('tasks')
            .select(`
                *,
                team_members:assigned_to_user_id (first_name, last_name)
            `)
            .eq('opportunity_id', opportunity.id)
            .order('created_at', { ascending: false });

        setTasks(tasksData || []);

        // Fetch attachments
        const { data: attachmentsData } = await supabase
            .from('opportunity_attachments')
            .select('*')
            .eq('opportunity_id', opportunity.id)
            .eq('is_deleted', false)
            .order('uploaded_at', { ascending: false });

        setAttachments(attachmentsData || []);
        setLoadingDrawerData(false);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedOpportunity(null);
        setEditMode(false);
        setEditForm({});
        setTasks([]);
        setAttachments([]);
        setSelectedFiles([]);
        setShowStageDropdown(false);
    };

    const handleEditFormChange = (field: keyof Opportunity, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const saveEdit = async () => {
        if (!selectedOpportunity) return;

        setSavingEdit(true);
        try {
            const { error } = await supabase
                .from('opportunities')
                .update({
                    client_id: editForm.client_id,
                    contact_type: editForm.contact_type,
                    client_type: editForm.client_type,
                    sales_rep_id: editForm.sales_rep_id,
                    site_address: editForm.site_address,
                    site_city: editForm.site_city,
                    site_postcode: editForm.site_postcode,
                    region_id: editForm.region_id,
                    estimated_value: editForm.estimated_value,
                    actual_value: editForm.actual_value,
                    due_date: editForm.due_date,
                    follow_up_date: editForm.follow_up_date,
                    sub_status: editForm.sub_status,
                    notes: editForm.notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedOpportunity.id);

            if (error) throw error;

            // Refresh opportunities with full client data
            await fetchOpportunities();

            // Refresh the selected opportunity with updated client relationship
            const { data: updatedOpp } = await supabase
                .from('opportunities')
                .select(`
                    *,
                    clients (id, first_name, last_name, email, phone, company_name),
                    sales_rep:sales_rep_id (id, first_name, last_name),
                    regions (name)
                `)
                .eq('id', selectedOpportunity.id)
                .single();

            if (updatedOpp) {
                setSelectedOpportunity(updatedOpp);
            }

            setEditMode(false);
            alert('Changes saved successfully');
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Failed to save changes');
        } finally {
            setSavingEdit(false);
        }
    };

    const cancelEdit = () => {
        setEditForm(selectedOpportunity || {});
        setEditMode(false);
    };

    const moveToStage = async (newStage: Opportunity['stage']) => {
        if (!selectedOpportunity) return;

        try {
            // Update opportunity stage
            const { error } = await supabase
                .from('opportunities')
                .update({
                    stage: newStage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedOpportunity.id);

            if (error) throw error;

            // Auto-create tasks based on stage
            await createAutoTask(selectedOpportunity.id, newStage);

            // Refresh opportunities
            await fetchOpportunities();

            // Update selected opportunity
            setSelectedOpportunity({ ...selectedOpportunity, stage: newStage });

            // Close dropdown
            setShowStageDropdown(false);

            alert(`Opportunity moved to ${STAGES.find(s => s.key === newStage)?.label} stage`);
        } catch (error) {
            console.error('Error moving to stage:', error);
            alert('Failed to move to stage');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setSelectedFiles(Array.from(files));
        }
    };

    const uploadFiles = async () => {
        if (!selectedOpportunity || selectedFiles.length === 0) return;

        setUploadingFile(true);

        try {
            for (const file of selectedFiles) {
                const fileName = `opportunities/${selectedOpportunity.id}/${Date.now()}_${file.name}`;
                
                // Upload to storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('opportunity-attachments')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('opportunity-attachments')
                    .getPublicUrl(fileName);

                // Get current user
                const { data: { user } } = await supabase.auth.getUser();

                // Save metadata
                await supabase
                    .from('opportunity_attachments')
                    .insert({
                        opportunity_id: selectedOpportunity.id,
                        file_name: file.name,
                        file_path: fileName,
                        file_url: urlData.publicUrl,
                        file_size: file.size,
                        file_type: file.type,
                        file_category: 'Other',
                        uploaded_by_user_id: user?.id
                    });
            }

            // Refresh attachments
            const { data: attachmentsData } = await supabase
                .from('opportunity_attachments')
                .select('*')
                .eq('opportunity_id', selectedOpportunity.id)
                .eq('is_deleted', false)
                .order('uploaded_at', { ascending: false });

            setAttachments(attachmentsData || []);
            setSelectedFiles([]);
            
            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Failed to upload files');
        } finally {
            setUploadingFile(false);
        }
    };

    const deleteAttachment = async (attachmentId: string, filePath: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            // Soft delete in database
            await supabase
                .from('opportunity_attachments')
                .update({ 
                    is_deleted: true,
                    deleted_at: new Date().toISOString()
                })
                .eq('id', attachmentId);

            // Refresh attachments
            setAttachments(attachments.filter(a => a.id !== attachmentId));

        } catch (error) {
            console.error('Error deleting attachment:', error);
            alert('Failed to delete file');
        }
    };

    const sendToVA = async () => {
        if (!opportunityToSend || !selectedVA) {
            alert('Please select a VA');
            return;
        }

        setSendingToVA(true);

        try {
            // Create task for VA
            const { data: taskData, error: taskError } = await supabase
                .from('tasks')
                .insert({
                    opportunity_id: opportunityToSend.id,
                    task_description: 'Create Product Recommendation',
                    task_type: 'Product Recommendation',
                    status: 'Not Started',
                    priority: 'High',
                    assigned_to_user_id: selectedVA,
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                })
                .select()
                .single();

            if (taskError) throw taskError;

            // Update opportunity recommendation_status
            await supabase
                .from('opportunities')
                .update({ 
                    updated_at: new Date().toISOString()
                })
                .eq('id', opportunityToSend.id);

            alert('Task created and VA notified successfully!');
            
            // Refresh opportunities
            fetchOpportunities();
            
            // Close modal
            setSendToVAModalOpen(false);
            setOpportunityToSend(null);
            setSelectedVA('');

        } catch (error) {
            console.error('Error sending to VA:', error);
            alert('Failed to send to VA');
        } finally {
            setSendingToVA(false);
        }
    };

    const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) return '$0';
        return new Intl.NumberFormat('en-NZ', {
            style: 'currency',
            currency: 'NZD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-NZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatFileSize = (bytes: number) => {
        return (bytes / 1024).toFixed(2) + ' KB';
    };

    const getCustomerName = (opp: Opportunity) => {
        if (opp.clients?.company_name) {
            return opp.clients.company_name;
        }
        return opp.clients 
            ? `${opp.clients.first_name} ${opp.clients.last_name}`
            : 'Unknown';
    };

    const getContactName = (opp: Opportunity) => {
        return opp.clients 
            ? `${opp.clients.first_name} ${opp.clients.last_name}`
            : null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto mb-4"></div>
                    <p className="text-gray-700">Loading opportunities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* PAGE HEADER */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0066CC]">Opportunities</h1>
                        <p className="text-sm text-gray-500 mt-1">Sales Pipeline</p>
                    </div>
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

            {/* TOOLBAR ROW */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left side - Search */}
                    <div className="w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search opportunities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Right side - Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* View Toggle */}
                        <div className="flex bg-gray-100 rounded p-1">
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`px-3 py-1.5 rounded flex items-center gap-2 transition-colors ${
                                    viewMode === 'kanban'
                                        ? 'bg-white text-[#0066CC] shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="text-sm font-medium">Kanban</span>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded flex items-center gap-2 transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-white text-[#0066CC] shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                <List className="w-4 h-4" />
                                <span className="text-sm font-medium">List</span>
                            </button>
                        </div>
                        <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            Export
                        </button>
                        <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            Import
                        </button>
                        <Link
                            href="/opportunities/new"
                            className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] hover:shadow-md transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Opportunity
                        </Link>
                    </div>
                </div>
            </div>

            {/* FILTER ROW */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center gap-6">
                    {/* Stage Filter */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Stage:</span>
                        <button
                            onClick={() => setStageFilter('ALL')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                stageFilter === 'ALL'
                                    ? 'bg-[#0066CC] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        {STAGES.map(stage => (
                            <button
                                key={stage.key}
                                onClick={() => setStageFilter(stage.key)}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                    stageFilter === stage.key
                                        ? 'bg-[#0066CC] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {stage.label}
                            </button>
                        ))}
                    </div>

                    {/* Sales Rep Filter */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Sales Rep:</span>
                        <select
                            value={salesRepFilter}
                            onChange={(e) => setSalesRepFilter(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                        >
                            <option value="all">All Reps</option>
                            {salesRepsList.map(rep => (
                                <option key={rep.id} value={rep.id}>
                                    {rep.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Region Filter */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Region:</span>
                        <select
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                        >
                            <option value="all">All Regions</option>
                            {regionsList.map(region => (
                                <option key={region.id} value={region.id}>
                                    {region.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="p-6">
                {viewMode === 'kanban' ? (
                    /* Kanban Board */
                    <div className="grid grid-cols-5 gap-4">
                        {STAGES.map(stage => {
                            const stageOpps = getOpportunitiesByStage(stage.key);
                            return (
                                <div
                                    key={stage.key}
                                    className="bg-gray-50 rounded-lg"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, stage.key)}
                                >
                                    {/* Column Header */}
                                    <div className={`p-4 rounded-t-lg border-b-2 ${stage.color}`}>
                                        <h3 className="font-semibold text-sm">{stage.label}</h3>
                                        <p className="text-xs mt-1">{stageOpps.length} opportunities</p>
                                    </div>

                                    {/* Cards */}
                                    <div className="p-2 space-y-2 min-h-[400px]">
                                        {getPaginatedOpportunities(stage.key).map(opp => (
                                            <div
                                                key={opp.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, opp)}
                                                onClick={() => openDrawer(opp)}
                                                className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
                                            >
                                                {/* OPP Number */}
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-semibold text-[#0066CC]">
                                                        {opp.opp_number}
                                                    </span>
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                                </div>

                                                {/* Customer Name + Value */}
                                                <div className="flex items-start justify-between mb-1.5 gap-2">
                                                    <h4 className="font-semibold text-sm text-gray-800 line-clamp-1 flex-1">
                                                        {getCustomerName(opp)}
                                                    </h4>
                                                    <span className="text-xs font-semibold text-green-700 whitespace-nowrap">
                                                        {formatCurrency(opp.estimated_value)}
                                                    </span>
                                                </div>

                                                {/* Contact Name (if company exists) */}
                                                {opp.clients?.company_name && (
                                                    <p className="text-xs text-gray-600 mb-1.5 line-clamp-1">
                                                        {getContactName(opp)}
                                                    </p>
                                                )}

                                                {/* Site Address */}
                                                <div className="flex items-start gap-1 mb-1.5">
                                                    <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <p className="text-xs text-gray-600 line-clamp-1">
                                                        {opp.site_address || 'N/A'}, {opp.site_city || ''}
                                                    </p>
                                                </div>

                                                {/* Sub-status + Due Date */}
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    {opp.sub_status && (
                                                        <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                                                            {opp.sub_status}
                                                        </span>
                                                    )}
                                                    {opp.due_date && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3 text-gray-400" />
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(opp.due_date)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Send to VA Button - Only in QUALIFIED stage */}
                                                {opp.stage === 'QUALIFIED' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpportunityToSend(opp);
                                                            if (vaList.length === 1) {
                                                                setSelectedVA(vaList[0].id);
                                                            }
                                                            setSendToVAModalOpen(true);
                                                        }}
                                                        className="w-full mt-1.5 px-2 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded flex items-center justify-center gap-1"
                                                    >
                                                        <Send className="w-3 h-3" />
                                                        Send to VA
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {getTotalPages(stage.key) > 1 && (
                                        <div className="p-2 border-t border-gray-200 bg-gray-50">
                                            <div className="flex items-center justify-between text-xs">
                                                <button
                                                    onClick={() => handlePageChange(stage.key, currentPage[stage.key] - 1)}
                                                    disabled={currentPage[stage.key] === 1}
                                                    className="px-2 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    ← Prev
                                                </button>
                                                <span className="text-gray-600">
                                                    Page {currentPage[stage.key]} of {getTotalPages(stage.key)}
                                                </span>
                                                <button
                                                    onClick={() => handlePageChange(stage.key, currentPage[stage.key] + 1)}
                                                    disabled={currentPage[stage.key] === getTotalPages(stage.key)}
                                                    className="px-2 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* List View */
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#0066CC] text-white">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">Actions</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">OPP#</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">Customer</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">Site Address</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">Region</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">Sales Rep</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">Stage</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">Est. Value</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">Due Date</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">Follow Up</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredOpportunities.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                                No opportunities found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOpportunities.map(opp => {
                                            const stage = STAGES.find(s => s.key === opp.stage);
                                            const salesRep = salesRepsList.find(sr => sr.id === opp.sales_rep_id);
                                            const region = regionsList.find(r => r.id === opp.region_id);

                                            return (
                                                <tr
                                                    key={opp.id}
                                                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                                                    onClick={() => openDrawer(opp)}
                                                >
                                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openDrawer(opp);
                                                                }}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                title="View"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openDrawer(opp);
                                                                }}
                                                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                                                title="Edit"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className="font-medium text-[#0066CC]">{opp.opp_number}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {getCustomerName(opp)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {opp.site_address || '—'}, {opp.site_city || ''}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {region?.name || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {salesRep?.name || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${stage?.color || 'bg-gray-100 text-gray-700'}`}>
                                                            {stage?.label || opp.stage}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-green-700">
                                                        {formatCurrency(opp.estimated_value)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {opp.due_date ? formatDate(opp.due_date) : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {opp.follow_up_date ? formatDate(opp.follow_up_date) : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Side Drawer */}
            {drawerOpen && selectedOpportunity && (
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
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-[#0066CC]">
                                        {selectedOpportunity.opp_number}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {getCustomerName(selectedOpportunity)}
                                    </p>
                                </div>
                                <button
                                    onClick={closeDrawer}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Stage Badge */}
                            <div className="mb-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                    STAGES.find(s => s.key === selectedOpportunity.stage)?.color
                                }`}>
                                    {STAGES.find(s => s.key === selectedOpportunity.stage)?.label}
                                </span>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-4 border-b border-gray-200">
                                {['overview', 'tasks', 'timeline', 'attachments'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`pb-2 px-1 text-sm font-medium capitalize transition-colors ${
                                            activeTab === tab
                                                ? 'text-[#0066CC] border-b-2 border-[#0066CC]'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Drawer Content */}
                        <div className="px-6 py-4">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Stage & Status Section */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Stage & Status</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-2">Pipeline Stage</label>
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                                    STAGES.find(s => s.key === selectedOpportunity.stage)?.color
                                                }`}>
                                                    {STAGES.find(s => s.key === selectedOpportunity.stage)?.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Details */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Customer Information</h3>
                                        {editMode ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                                        Select Contact <span className="text-red-500">*</span>
                                                    </label>
                                                    <p className="text-xs text-gray-500 mb-2">
                                                        Search for a contact by name, email, or phone. Company and contact details will populate automatically.
                                                    </p>
                                                    <ClientSelector
                                                        onClientSelected={(client) => {
                                                            if (client) {
                                                                handleEditFormChange('client_id', client.id);
                                                                // Auto-populate contact type and client type from the selected client
                                                                // These would come from the opportunities record, not the client
                                                                // So we don't auto-populate here, user must select them
                                                            }
                                                        }}
                                                        onClear={() => {
                                                            handleEditFormChange('client_id', null);
                                                        }}
                                                    />
                                                </div>
                                                {/* Show Contact Type and Client Type - Read only if already set, editable if empty */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-2">Contact Type</label>
                                                        {selectedOpportunity.contact_type ? (
                                                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                                                {selectedOpportunity.contact_type}
                                                            </div>
                                                        ) : (
                                                            <select
                                                                value={editForm.contact_type || ''}
                                                                onChange={(e) => handleEditFormChange('contact_type', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                                            >
                                                                <option value="">Select...</option>
                                                                <option value="New">New</option>
                                                                <option value="Existing">Existing</option>
                                                                <option value="Referral">Referral</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-2">Client Type</label>
                                                        {selectedOpportunity.client_type ? (
                                                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                                                {selectedOpportunity.client_type}
                                                            </div>
                                                        ) : (
                                                            <select
                                                                value={editForm.client_type || ''}
                                                                onChange={(e) => handleEditFormChange('client_type', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                                            >
                                                                <option value="">Select...</option>
                                                                <option value="Residential">Residential</option>
                                                                <option value="Commercial">Commercial</option>
                                                                <option value="Government">Government</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 text-sm">
                                                {selectedOpportunity.clients ? (
                                                    <>
                                                        <div className="grid grid-cols-[120px_1fr] gap-2">
                                                            <span className="text-gray-600">Contact Name:</span>
                                                            <span className="font-medium text-[#0066CC]">
                                                                {selectedOpportunity.clients.first_name} {selectedOpportunity.clients.last_name}
                                                            </span>
                                                        </div>
                                                        {selectedOpportunity.clients.company_name && (
                                                            <div className="grid grid-cols-[120px_1fr] gap-2">
                                                                <span className="text-gray-600">Company:</span>
                                                                <span className="font-medium">
                                                                    {selectedOpportunity.clients.company_name}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-[120px_1fr] gap-2">
                                                            <span className="text-gray-600">Email:</span>
                                                            <a href={`mailto:${selectedOpportunity.clients.email}`} className="font-medium text-[#0066CC] hover:underline">
                                                                {selectedOpportunity.clients.email || 'N/A'}
                                                            </a>
                                                        </div>
                                                        <div className="grid grid-cols-[120px_1fr] gap-2">
                                                            <span className="text-gray-600">Phone:</span>
                                                            <a href={`tel:${selectedOpportunity.clients.phone}`} className="font-medium text-[#0066CC] hover:underline">
                                                                {selectedOpportunity.clients.phone || 'N/A'}
                                                            </a>
                                                        </div>
                                                        <div className="grid grid-cols-[120px_1fr] gap-2">
                                                            <span className="text-gray-600">Contact Type:</span>
                                                            <span className="font-medium">{selectedOpportunity.contact_type || 'Not set'}</span>
                                                        </div>
                                                        <div className="grid grid-cols-[120px_1fr] gap-2">
                                                            <span className="text-gray-600">Client Type:</span>
                                                            <span className="font-medium">{selectedOpportunity.client_type || 'Not set'}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                        <p className="text-sm text-yellow-800">
                                                            ⚠️ No client linked to this opportunity. Click Edit to assign a client.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Site Address */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Site Address</h3>
                                        {editMode ? (
                                            <div className="space-y-3">
                                                {/* Show site details if already populated, with clear button */}
                                                {editForm.site_address ? (
                                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {editForm.site_address}
                                                                </p>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    {editForm.site_city} {editForm.site_postcode}
                                                                </p>
                                                                {editForm.region_id && (
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Region: {regionsList.find(r => r.id === editForm.region_id)?.name}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    handleEditFormChange('site_address', '');
                                                                    handleEditFormChange('site_city', '');
                                                                    handleEditFormChange('site_postcode', '');
                                                                    handleEditFormChange('region_id', null);
                                                                }}
                                                                className="p-1 hover:bg-blue-100 rounded"
                                                                title="Clear site"
                                                            >
                                                                <X className="w-4 h-4 text-gray-600" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Choice between Select Existing or Enter Manually */}
                                                        <div className="flex items-center gap-4 mb-4 pb-3 border-b border-gray-200">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    checked={siteEntryMode === 'existing'}
                                                                    onChange={() => setSiteEntryMode('existing')}
                                                                    className="w-4 h-4 text-[#0066CC]"
                                                                />
                                                                <span className="text-sm text-gray-700">Select Existing Site</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    checked={siteEntryMode === 'manual'}
                                                                    onChange={() => setSiteEntryMode('manual')}
                                                                    className="w-4 h-4 text-[#0066CC]"
                                                                />
                                                                <span className="text-sm text-gray-700">Enter Manually</span>
                                                            </label>
                                                        </div>

                                                        {/* Show SiteSelector or Manual Entry based on mode */}
                                                        {siteEntryMode === 'existing' ? (
                                                            <div>
                                                                <SiteSelector
                                                                    onSiteSelected={(site) => {
                                                                        if (site) {
                                                                            handleEditFormChange('site_address', site.address_line_1);
                                                                            if (site.city) handleEditFormChange('site_city', site.city);
                                                                            if (site.postcode) handleEditFormChange('site_postcode', site.postcode);
                                                                            if (site.region_id) handleEditFormChange('region_id', site.region_id);
                                                                        }
                                                                    }}
                                                                    hideCreateButton={true}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div>
                                                                    <label className="block text-xs text-gray-600 mb-2">Street Address</label>
                                                                    <input
                                                                        type="text"
                                                                        value={editForm.site_address || ''}
                                                                        onChange={(e) => handleEditFormChange('site_address', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                                                        placeholder="Street address"
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="block text-xs text-gray-600 mb-2">City</label>
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.site_city || ''}
                                                                            onChange={(e) => handleEditFormChange('site_city', e.target.value)}
                                                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                                                            placeholder="City"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-gray-600 mb-2">Postcode</label>
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.site_postcode || ''}
                                                                            onChange={(e) => handleEditFormChange('site_postcode', e.target.value)}
                                                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                                                            placeholder="Postcode"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs text-gray-600 mb-2">Region</label>
                                                                    <select
                                                                        value={editForm.region_id || ''}
                                                                        onChange={(e) => handleEditFormChange('region_id', e.target.value || null)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                                                    >
                                                                        <option value="">-- Select Region --</option>
                                                                        {regionsList.map(region => (
                                                                            <option key={region.id} value={region.id}>
                                                                                {region.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-700">
                                                <p>{selectedOpportunity.site_address || 'N/A'}</p>
                                                <p>{selectedOpportunity.site_city} {selectedOpportunity.site_postcode}</p>
                                                {selectedOpportunity.regions && (
                                                    <p className="text-xs text-gray-600 mt-1">Region: {selectedOpportunity.regions.name}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sub-Status */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Sub-Status</h3>
                                        {editMode ? (
                                            <input
                                                type="text"
                                                value={editForm.sub_status || ''}
                                                onChange={(e) => handleEditFormChange('sub_status', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                                placeholder="e.g., Follow-up Required, Quote Requested"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-700">{selectedOpportunity.sub_status || 'Not set'}</p>
                                        )}
                                    </div>

                                    {/* Financial Info */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Financial Info</h3>
                                        {editMode ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Estimated Value ($)</label>
                                                    <input
                                                        type="number"
                                                        value={editForm.estimated_value || ''}
                                                        onChange={(e) => handleEditFormChange('estimated_value', parseFloat(e.target.value) || null)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                                        placeholder="18500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Actual Value ($)</label>
                                                    <input
                                                        type="number"
                                                        value={editForm.actual_value || ''}
                                                        onChange={(e) => handleEditFormChange('actual_value', parseFloat(e.target.value) || null)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                                        placeholder="18500"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Estimated Value:</span>
                                                    <span className="font-medium">{formatCurrency(selectedOpportunity.estimated_value)}</span>
                                                </div>
                                                {selectedOpportunity.actual_value && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Actual Value:</span>
                                                        <span className="font-medium">{formatCurrency(selectedOpportunity.actual_value)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sales Rep */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Sales Rep</h3>
                                        {editMode ? (
                                            <select
                                                value={editForm.sales_rep_id || ''}
                                                onChange={(e) => handleEditFormChange('sales_rep_id', e.target.value || null)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                            >
                                                <option value="">-- Select Sales Rep --</option>
                                                {salesRepsList.map(rep => (
                                                    <option key={rep.id} value={rep.id}>
                                                        {rep.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-sm text-gray-700">
                                                {selectedOpportunity.sales_rep
                                                    ? `${selectedOpportunity.sales_rep.first_name} ${selectedOpportunity.sales_rep.last_name}`
                                                    : 'Not assigned'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Due Date */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Due Date</h3>
                                        {editMode ? (
                                            <input
                                                type="date"
                                                value={editForm.due_date?.split('T')[0] || ''}
                                                onChange={(e) => handleEditFormChange('due_date', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-700">{formatDate(selectedOpportunity.due_date)}</p>
                                        )}
                                    </div>

                                    {/* Follow Up Date */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Follow Up Date</h3>
                                        {editMode ? (
                                            <input
                                                type="date"
                                                value={editForm.follow_up_date?.split('T')[0] || ''}
                                                onChange={(e) => handleEditFormChange('follow_up_date', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-700">{formatDate(selectedOpportunity.follow_up_date)}</p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Notes</h3>
                                        {editMode ? (
                                            <textarea
                                                value={editForm.notes || ''}
                                                onChange={(e) => handleEditFormChange('notes', e.target.value)}
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                                placeholder="Add notes about this opportunity..."
                                            />
                                        ) : (
                                            selectedOpportunity.notes ? (
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedOpportunity.notes}</p>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No notes added</p>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tasks Tab */}
                            {activeTab === 'tasks' && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Tasks</h3>
                                    {loadingDrawerData ? (
                                        <p className="text-sm text-gray-500">Loading tasks...</p>
                                    ) : tasks.length === 0 ? (
                                        <p className="text-sm text-gray-500">No tasks yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {tasks.map(task => (
                                                <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="text-sm font-medium text-gray-800">
                                                            {task.task_description}
                                                        </h4>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                                            task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                            task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                                        <span>Type: {task.task_type}</span>
                                                        <span>Priority: {task.priority}</span>
                                                        {task.due_date && (
                                                            <span>Due: {formatDate(task.due_date)}</span>
                                                        )}
                                                    </div>
                                                    {task.team_members && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Assigned to: {task.team_members.first_name} {task.team_members.last_name}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Timeline Tab */}
                            {activeTab === 'timeline' && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Timeline</h3>
                                    <p className="text-sm text-gray-500">Timeline feature coming soon...</p>
                                </div>
                            )}

                            {/* Attachments Tab */}
                            {activeTab === 'attachments' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-gray-800">Attachments</h3>
                                        {selectedOpportunity.stage === 'QUALIFIED' && (
                                            <label className="px-3 py-1.5 bg-[#0066CC] hover:bg-[#0052a3] text-white text-sm rounded-lg cursor-pointer flex items-center gap-2">
                                                <Upload className="w-4 h-4" />
                                                Add File
                                                <input
                                                    id="file-upload"
                                                    type="file"
                                                    multiple
                                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {/* Selected Files (before upload) */}
                                    {selectedFiles.length > 0 && (
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm font-medium text-blue-800 mb-2">
                                                {selectedFiles.length} file(s) selected
                                            </p>
                                            <div className="space-y-1 mb-3">
                                                {selectedFiles.map((file, idx) => (
                                                    <p key={idx} className="text-xs text-blue-700">
                                                        • {file.name} ({formatFileSize(file.size)})
                                                    </p>
                                                ))}
                                            </div>
                                            <button
                                                onClick={uploadFiles}
                                                disabled={uploadingFile}
                                                className="w-full px-4 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white text-sm rounded-lg disabled:opacity-50"
                                            >
                                                {uploadingFile ? 'Uploading...' : 'Upload Files'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Stage restriction message */}
                                    {selectedOpportunity.stage === 'NEW' && (
                                        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <p className="text-sm text-gray-600">
                                                File attachments are available when opportunity is moved to QUALIFIED stage.
                                            </p>
                                        </div>
                                    )}

                                    {/* Uploaded Files List */}
                                    {loadingDrawerData ? (
                                        <p className="text-sm text-gray-500">Loading attachments...</p>
                                    ) : attachments.length === 0 ? (
                                        <p className="text-sm text-gray-500">No attachments yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {attachments.map(att => (
                                                <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                                {att.file_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatFileSize(att.file_size)} • {formatDate(att.uploaded_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={att.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 hover:bg-gray-200 rounded"
                                                            title="Download"
                                                        >
                                                            <Download className="w-4 h-4 text-gray-600" />
                                                        </a>
                                                        {selectedOpportunity.stage === 'QUALIFIED' && (
                                                            <button
                                                                onClick={() => deleteAttachment(att.id, att.file_path)}
                                                                className="p-1.5 hover:bg-red-100 rounded"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-600" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer Actions */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                            {editMode ? (
                                <div className="flex gap-3">
                                    <button
                                        onClick={cancelEdit}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveEdit}
                                        disabled={savingEdit}
                                        className="flex-1 px-4 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {savingEdit ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    {selectedOpportunity.stage === 'QUALIFIED' && (
                                        <button
                                            onClick={() => {
                                                setOpportunityToSend(selectedOpportunity);
                                                if (vaList.length === 1) {
                                                    setSelectedVA(vaList[0].id);
                                                }
                                                setSendToVAModalOpen(true);
                                            }}
                                            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                            Send to VA
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="flex-1 px-4 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowStageDropdown(!showStageDropdown)}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Move to Stage
                                        </button>
                                        {showStageDropdown && (
                                            <div className="absolute bottom-full mb-2 right-0 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                                                {STAGES.filter(s => s.key !== selectedOpportunity.stage).map(stage => (
                                                    <button
                                                        key={stage.key}
                                                        onClick={() => moveToStage(stage.key)}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                                                    >
                                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${stage.color} mr-2`}>
                                                            {stage.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Send to VA Modal */}
            {sendToVAModalOpen && opportunityToSend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={() => {
                            setSendToVAModalOpen(false);
                            setOpportunityToSend(null);
                            setSelectedVA('16bc0e92-2bbd-4e89-95a6-5f82e849047d');
                        }}
                    ></div>

                    {/* Modal */}
                    <div className="relative bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800">Send to VA for Product Recommendation</h3>
                                <button
                                    onClick={() => {
                                        setSendToVAModalOpen(false);
                                        setOpportunityToSend(null);
                                        setSelectedVA('');
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-4 space-y-4">
                            {/* Opportunity Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-blue-800 mb-2">Opportunity Details</h4>
                                <div className="space-y-1 text-sm text-blue-700">
                                    <p><span className="font-medium">OPP #:</span> {opportunityToSend.opp_number}</p>
                                    <p><span className="font-medium">Customer:</span> {getCustomerName(opportunityToSend)}</p>
                                    <p><span className="font-medium">Site:</span> {opportunityToSend.site_address}, {opportunityToSend.site_city}</p>
                                </div>
                            </div>

                            {/* File Reminder */}
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-orange-800 mb-1">Important Reminder</h4>
                                        <p className="text-sm text-orange-700">
                                            Please ensure building plans and assessment files are attached to this opportunity 
                                            before sending to VA. The VA will need these files to create an accurate product recommendation.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setSendToVAModalOpen(false);
                                                setOpportunityToSend(null);
                                                openDrawer(opportunityToSend);
                                                setTimeout(() => setActiveTab('attachments'), 100);
                                            }}
                                            className="mt-2 text-xs text-orange-700 hover:text-orange-900 underline font-medium"
                                        >
                                            Go to Attachments Tab →
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* VA Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select VA <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedVA || ''}
                                    onChange={(e) => setSelectedVA(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                                >
                                    <option value="">-- Select a VA --</option>
                                    {vaList.map(va => (
                                        <option key={va.id} value={va.id}>
                                            {va.first_name} {va.last_name} ({va.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* What Will Happen */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-2">What will happen:</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">✓</span>
                                        <span>A new task "Create Product Recommendation" will be created and assigned to the selected VA</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">✓</span>
                                        <span>The VA will receive an email notification with opportunity details</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">✓</span>
                                        <span>The task will appear in the VA's workspace with priority: High</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">✓</span>
                                        <span>Due date will be set to 7 days from now</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => {
                                    setSendToVAModalOpen(false);
                                    setOpportunityToSend(null);
                                    setSelectedVA('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendToVA}
                                disabled={!selectedVA || sendingToVA}
                                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {sendingToVA ? 'Sending...' : 'Send to VA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}