'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Eye, Edit, ChevronLeft, ChevronRight, Copy, Trash2 } from 'lucide-react';

// Types
interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  opportunity_id: string | null;
  client_name: string;
  company_name: string;
  site_address: string;
  region_id: string | null;
  region_name: string;
  job_type: string;
  status: string;
  quote_date: string;
  follow_up_date: string | null;
  sales_rep_id: string | null;
  sales_rep_name: string;
  total_amount: number;
}

type SortField = 'quote_number' | 'company_name' | 'site_address' | 'region_name' | 'job_type' | 'status' | 'quote_date' | 'total_amount' | 'sales_rep_name' | 'follow_up_date';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

export default function QuotesPage() {
  const router = useRouter();

  // State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [salesRepFilter, setSalesRepFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('quote_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reference data
  const [salesReps, setSalesReps] = useState<Array<{ id: string; name: string }>>([]);
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([]);
  const [referenceDataLoaded, setReferenceDataLoaded] = useState(false);

  // Fetch reference data on mount
  useEffect(() => {
    fetchReferenceData();
  }, []);

  // Fetch quotes when filters change - but only after reference data is loaded
  useEffect(() => {
    if (referenceDataLoaded) {
      fetchQuotes();
    }
  }, [referenceDataLoaded, searchTerm, statusFilter, salesRepFilter, regionFilter, sortField, sortDirection, currentPage]);

  const fetchReferenceData = async () => {
    // Fetch sales reps
    const { data: repsData } = await supabase
      .from('team_members')
      .select('id, first_name, last_name')
      .eq('role', 'Sales Rep')
      .order('first_name');

    if (repsData) {
      setSalesReps(repsData.map(rep => ({
        id: rep.id,
        name: `${rep.first_name} ${rep.last_name}`
      })));
    }

    // Fetch regions
    const { data: regionsData } = await supabase
      .from('regions')
      .select('id, name')
      .order('name');

    if (regionsData) {
      setRegions(regionsData);
    }

    // Mark reference data as loaded
    setReferenceDataLoaded(true);
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query with proper joins following the workflow architecture
      // quotes → sites (for address & region) → assessments → opportunities (for sales rep & follow-up)
      let countQuery = supabase
        .from('quotes')
        .select('id', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('quotes')
        .select(`
          *,
          sites!site_id (
            address_line_1,
            address_line_2,
            city,
            postcode,
            region_id,
            regions!region_id (
              id,
              name
            )
          ),
          assessments!assessment_id (
            id,
            opportunity_id,
            opportunities!opportunity_id (
              sales_rep_id,
              follow_up_date,
              due_date
            )
          )
        `);

      // Apply filters
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter);
        dataQuery = dataQuery.eq('status', statusFilter);
      }

      if (salesRepFilter !== 'all') {
        countQuery = countQuery.eq('assigned_to_sales_rep_id', salesRepFilter);
        dataQuery = dataQuery.eq('assigned_to_sales_rep_id', salesRepFilter);
      }

      // Search filter
      if (searchTerm) {
        const searchPattern = `%${searchTerm}%`;
        countQuery = countQuery.or(`quote_number.ilike.${searchPattern}`);
        dataQuery = dataQuery.or(`quote_number.ilike.${searchPattern}`);
      }

      // Get count
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Sorting - basic fields only (complex joins sorted in memory)
      if (['quote_number', 'quote_date', 'status', 'total_amount'].includes(sortField)) {
        dataQuery = dataQuery.order(sortField, { ascending: sortDirection === 'asc' });
      }

      // Pagination
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      dataQuery = dataQuery.range(offset, offset + ITEMS_PER_PAGE - 1);

      const { data, error: fetchError } = await dataQuery;

      if (fetchError) throw fetchError;

      // Process quotes with related data
      const quotesWithDetails = await Promise.all(
        (data || []).map(async (quote: any) => {
          let clientName = 'Unknown';
          let companyName = '—';
          let siteAddress = '—';
          let regionName = '—';
          let salesRepName = '—';
          let salesRepId = null;
          let followUpDate = null;
          let jobType = '—';

          // 1. SITE ADDRESS & REGION - From sites table (via site_id)
          if (quote.sites) {
            const site = quote.sites;
            const addressParts = [
              site.address_line_1,
              site.address_line_2,
              site.city,
              site.postcode
            ].filter(Boolean);
            siteAddress = addressParts.join(', ') || '—';

            // Get region from nested join
            if (site.regions) {
              regionName = site.regions.name;
            }
          }

          // 2. CLIENT NAME & COMPANY - From client_id
          let clientSalesRepId = null;
          if (quote.client_id) {
            const { data: clientData } = await supabase
              .from('clients')
              .select('first_name, last_name, company_id, sales_rep_id')
              .eq('id', quote.client_id)
              .single();

            if (clientData) {
              clientName = `${clientData.first_name} ${clientData.last_name}`;
              clientSalesRepId = clientData.sales_rep_id; // Store for fallback

              // Fetch company
              if (clientData.company_id) {
                const { data: companyData } = await supabase
                  .from('companies')
                  .select('company_name')
                  .eq('id', clientData.company_id)
                  .single();

                if (companyData) {
                  companyName = companyData.company_name;
                }
              }
            }
          }

          // 3. SALES REP - Priority: quote → opportunity → client
          if (quote.assigned_to_sales_rep_id) {
            // Priority 1: Sales rep assigned directly to quote
            salesRepId = quote.assigned_to_sales_rep_id;
            const rep = salesReps.find(r => r.id === salesRepId);
            if (rep) {
              salesRepName = rep.name;
            }
          } else if (quote.assessments?.opportunities?.sales_rep_id) {
            // Priority 2: Sales rep from opportunity (via assessment)
            salesRepId = quote.assessments.opportunities.sales_rep_id;
            const rep = salesReps.find(r => r.id === salesRepId);
            if (rep) {
              salesRepName = rep.name;
            }
          } else if (clientSalesRepId) {
            // Priority 3: Sales rep from client/contact
            salesRepId = clientSalesRepId;
            const rep = salesReps.find(r => r.id === salesRepId);
            if (rep) {
              salesRepName = rep.name;
            }
          }

          // 4. FOLLOW-UP DATE - From opportunity (via assessment)
          if (quote.assessments?.opportunities) {
            const opp = quote.assessments.opportunities;
            followUpDate = opp.follow_up_date || opp.due_date;
          }

          // 5. JOB TYPE - Determine from quote_line_items products
          const { data: lineItems } = await supabase
            .from('quote_line_items')
            .select('product_id')
            .eq('quote_id', quote.id)
            .limit(1);

          if (lineItems && lineItems.length > 0) {
            const { data: product } = await supabase
              .from('products')
              .select('category')
              .eq('id', lineItems[0].product_id)
              .single();

            if (product?.category) {
              jobType = product.category;
            }
          }

          return {
            id: quote.id,
            quote_number: quote.quote_number || '',
            client_id: quote.client_id || '',
            opportunity_id: quote.assessments?.opportunity_id || null,
            client_name: clientName,
            company_name: companyName,
            site_address: siteAddress,
            region_id: quote.sites?.region_id || null,
            region_name: regionName,
            job_type: jobType,
            status: quote.status || 'Draft',
            quote_date: quote.quote_date || quote.created_at,
            follow_up_date: followUpDate,
            sales_rep_id: salesRepId,
            sales_rep_name: salesRepName,
            total_amount: quote.total_amount || 0,
          };
        })
      );

      // Apply region filter in memory if needed
      let filteredQuotes = quotesWithDetails;
      if (regionFilter !== 'all') {
        filteredQuotes = quotesWithDetails.filter(q => q.region_id === regionFilter);
      }

      // Apply client-side sorting for complex fields
      if (['company_name', 'site_address', 'region_name', 'sales_rep_name', 'job_type', 'follow_up_date'].includes(sortField)) {
        filteredQuotes.sort((a, b) => {
          const aVal = a[sortField as keyof Quote] || '';
          const bVal = b[sortField as keyof Quote] || '';
          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }

      setQuotes(filteredQuotes);
    } catch (err) {
      console.error('Error in fetchQuotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteQuote = async (quoteId: string, quoteNumber: string) => {
    if (!confirm(`Are you sure you want to delete quote ${quoteNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete line items first
      const { error: itemsError } = await supabase
        .from('quote_line_items')
        .delete()
        .eq('quote_id', quoteId);

      if (itemsError) {
        console.error('Error deleting line items:', itemsError);
      }

      // Delete sections
      const { error: sectionsError } = await supabase
        .from('quote_sections')
        .delete()
        .eq('quote_id', quoteId);

      if (sectionsError) {
        console.error('Error deleting sections:', sectionsError);
      }

      // Delete quote
      const { error: quoteError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (quoteError) {
        alert(`Failed to delete quote: ${quoteError.message}`);
        return;
      }

      alert(`Quote ${quoteNumber} deleted successfully`);
      fetchQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote');
    }
  };

  const handleCloneQuote = async (quoteId: string) => {
    try {
      if (!confirm('Clone this quote? A copy will be created with all sections and line items.')) {
        return;
      }

      // Fetch the original quote
      const { data: originalQuote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError || !originalQuote) {
        alert('Failed to fetch quote for cloning');
        return;
      }

      // Fetch sections and line items
      const { data: sections, error: sectionsError } = await supabase
        .from('quote_sections')
        .select('*, quote_line_items(*)')
        .eq('quote_id', quoteId);

      if (sectionsError) {
        alert('Failed to fetch quote sections');
        return;
      }

      // Use "Copy - " prefix for cloned quote number
      const clonedQuoteNumber = `Copy - ${originalQuote.quote_number}`;

      // Create new quote (copy of original)
      // Exclude system-generated and calculated fields
      const {
        id,
        created_at,
        updated_at,
        gross_profit,
        gp_percent,
        gross_profit_percent,
        clients,
        assessments,
        team_members,
        ...quoteData
      } = originalQuote as any;

      const { data: newQuote, error: newQuoteError } = await supabase
        .from('quotes')
        .insert({
          ...quoteData,
          quote_number: clonedQuoteNumber,
          reference: originalQuote.reference || null,
          status: 'Draft',
          sent_at: null,
          accepted_date: null,
          customer_viewed_at: null,
        })
        .select()
        .single();

      if (newQuoteError || !newQuote) {
        console.error('Clone error:', newQuoteError);
        alert(`Failed to create cloned quote: ${newQuoteError?.message || 'Unknown error'}`);
        return;
      }

      // Clone sections and line items
      for (let i = 0; i < (sections || []).length; i++) {
        const section = sections![i];
        const { data: newSection, error: sectionError } = await supabase
          .from('quote_sections')
          .insert({
            quote_id: newQuote.id,
            app_type_id: section.app_type_id,
            section_name: section.section_name || section.custom_name || 'Section',
            custom_name: section.custom_name,
            section_color: section.section_color,
            sort_order: i + 1,
          })
          .select()
          .single();

        if (sectionError || !newSection) {
          console.error('Section clone error:', sectionError);
          continue;
        }

        // Clone line items for this section
        const lineItems = section.quote_line_items || [];
        for (let j = 0; j < lineItems.length; j++) {
          const item = lineItems[j];
          const { error: itemError } = await supabase
            .from('quote_line_items')
            .insert({
              quote_id: newQuote.id,
              section_id: newSection.id,
              product_id: item.product_id,
              description: item.description || (item.is_labour ? 'Labour' : 'Product'),
              quantity: item.quantity || (item.is_labour ? item.area_sqm : item.packs_required),
              unit_price: item.unit_price || item.sell_price || 0,
              line_total: item.line_total || item.line_sell || 0,
              marker: item.marker,
              area_sqm: item.area_sqm,
              is_labour: item.is_labour,
              packs_required: item.packs_required,
              cost_price: item.cost_price,
              sell_price: item.sell_price,
              line_cost: item.line_cost,
              line_sell: item.line_sell,
              margin_percent: item.margin_percent,
              sort_order: j + 1,
            });

          if (itemError) {
            console.error('Line item clone error:', itemError);
          }
        }
      }

      alert(`Quote cloned successfully as ${clonedQuoteNumber}`);
      fetchQuotes(); // Refresh the list
    } catch (error) {
      console.error('Error cloning quote:', error);
      alert('Failed to clone quote');
    }
  };

  // Sort indicator arrow
  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-blue-200">⇅</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === quotes.length && quotes.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(quotes.map(q => q.id)));
    }
  };

  const toggleSelectQuote = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* PAGE HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0066CC]">Quotes</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your quotes and proposals</p>
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
                placeholder="Search quotes..."
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
              href="/quotes/new"
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] hover:shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Quote
            </Link>
          </div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-6">
          {/* Status Filter */}
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
              onClick={() => setStatusFilter('Draft')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === 'Draft'
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setStatusFilter('Sent')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === 'Sent'
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setStatusFilter('Accepted')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === 'Accepted'
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Accepted
            </button>
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
              {salesReps.map(rep => (
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
              {regions.map(region => (
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
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
            <span className="ml-3 text-gray-600">Loading quotes...</span>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0066CC] text-white">
                    <tr>
                      <th className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === quotes.length && quotes.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">
                        Action
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                        onClick={() => handleSort('quote_number')}
                      >
                        Quote No <SortArrow field="quote_number" />
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                        onClick={() => handleSort('company_name')}
                      >
                        Company Name <SortArrow field="company_name" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">
                        Contact Name
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                        onClick={() => handleSort('site_address')}
                      >
                        Site Address <SortArrow field="site_address" />
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                        onClick={() => handleSort('region_name')}
                      >
                        Region <SortArrow field="region_name" />
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                        onClick={() => handleSort('sales_rep_name')}
                      >
                        Sales Rep <SortArrow field="sales_rep_name" />
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                        onClick={() => handleSort('job_type')}
                      >
                        Job Type <SortArrow field="job_type" />
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                        onClick={() => handleSort('status')}
                      >
                        Status <SortArrow field="status" />
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                        onClick={() => handleSort('follow_up_date')}
                      >
                        Follow Up <SortArrow field="follow_up_date" />
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                        onClick={() => handleSort('total_amount')}
                      >
                        Total (Inc GST) <SortArrow field="total_amount" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quotes.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                          No quotes found
                        </td>
                      </tr>
                    ) : (
                      quotes.map((quote, index) => (
                        <tr
                          key={quote.id}
                          className={`hover:bg-blue-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(quote.id)}
                              onChange={() => toggleSelectQuote(quote.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/quotes/${quote.id}`}
                                className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/quotes/${quote.id}`}
                                className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleCloneQuote(quote.id)}
                                className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                                title="Clone Quote"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuote(quote.id, quote.quote_number)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete Quote"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Link
                              href={`/quotes/${quote.id}`}
                              className="text-[#0066CC] hover:underline font-medium"
                            >
                              {quote.quote_number}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {quote.company_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {quote.client_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {quote.site_address}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {quote.region_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {quote.sales_rep_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {quote.job_type}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                              {quote.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDate(quote.follow_up_date)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            ${quote.total_amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 rounded shadow">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} quotes
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded text-sm ${
                            currentPage === pageNum
                              ? 'bg-[#0066CC] text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
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