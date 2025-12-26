'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Edit, Mail, Phone, Globe, Building2, Trash2, Plus, X } from 'lucide-react';

interface CompanyDetail {
  id: string;
  company_name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  region_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  contact_type: string | null;
  created_at: string;
}

interface Region {
  id: string;
  name: string;
}

interface Quote {
  id: string;
  quote_number: string;
  quote_date: string;
  site_address: string | null;
  total_amount: number | null;
  status: string | null;
}

interface Assessment {
  id: string;
  reference_number: string;
  scheduled_date: string;
  status: string | null;
}

interface Job {
  id: string;
  job_number: string;
  scheduled_date: string;
  status: string | null;
}

interface CompanyFormData {
  company_name: string;
  industry: string;
  phone: string;
  email: string;
  website: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  postcode: string;
  region_id: string;
  is_active: boolean;
}

export default function CompanyDetailPage({
  params
}: {
  params: { id: string }
}) {
  const router = useRouter();

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [region, setRegion] = useState<Region | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formError, setFormError] = useState('');

  const [editForm, setEditForm] = useState<CompanyFormData>({
    company_name: '',
    industry: '',
    phone: '',
    email: '',
    website: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
    region_id: '',
    is_active: true
  });

  useEffect(() => {
    loadCompany();
  }, [params.id]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setLoadingError('');

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', params.id)
        .single();

      if (companyError) throw companyError;
      if (!companyData) throw new Error('Company not found');

      setCompany(companyData);

      setEditForm({
        company_name: companyData.company_name || '',
        industry: companyData.industry || '',
        phone: companyData.phone || '',
        email: companyData.email || '',
        website: companyData.website || '',
        address_line_1: companyData.address_line_1 || '',
        address_line_2: companyData.address_line_2 || '',
        city: companyData.city || '',
        postcode: companyData.postcode || '',
        region_id: companyData.region_id || '',
        is_active: companyData.is_active
      });

      if (companyData.region_id) {
        const { data: regionData } = await supabase
          .from('regions')
          .select('*')
          .eq('id', companyData.region_id)
          .single();
        setRegion(regionData);
      }

      const { data: regionsData } = await supabase
        .from('regions')
        .select('*')
        .order('name');
      setRegions(regionsData || []);

      // Get all contacts for this company
      const { data: contactsData } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, contact_type, created_at')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      setContacts(contactsData || []);

      // Get quotes for all contacts in this company
      if (contactsData && contactsData.length > 0) {
        const contactIds = contactsData.map(c => c.id);
        const { data: quotesData } = await supabase
          .from('quotes')
          .select('id, quote_number, quote_date, status, total_amount, site_address')
          .in('client_id', contactIds)
          .order('quote_date', { ascending: false });

        setQuotes(quotesData || []);

        // Get assessments for all contacts in this company
        const { data: assessmentsData } = await supabase
          .from('assessments')
          .select('id, reference_number, scheduled_date, status')
          .in('client_id', contactIds)
          .order('scheduled_date', { ascending: false });

        setAssessments(assessmentsData || []);

        // Get jobs for all contacts in this company
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('id, job_number, scheduled_date, status')
          .in('client_id', contactIds)
          .order('scheduled_date', { ascending: false });

        setJobs(jobsData || []);
      }
    } catch (err: any) {
      console.error('Error loading company:', err);
      setLoadingError(err.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!editForm.company_name.trim()) {
      setFormError('Company name is required');
      return;
    }

    if (editForm.email && !editForm.email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          company_name: editForm.company_name.trim(),
          industry: editForm.industry.trim() || null,
          phone: editForm.phone.trim() || null,
          email: editForm.email.trim() || null,
          website: editForm.website.trim() || null,
          address_line_1: editForm.address_line_1.trim() || null,
          address_line_2: editForm.address_line_2.trim() || null,
          city: editForm.city.trim() || null,
          postcode: editForm.postcode.trim() || null,
          region_id: editForm.region_id || null,
          is_active: editForm.is_active
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      await loadCompany();
      setDrawerOpen(false);
    } catch (err: any) {
      console.error('Error saving company:', err);
      setFormError(err.message || 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async () => {
    setDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', params.id);

      if (deleteError) throw deleteError;

      router.push('/companies');
    } catch (err: any) {
      console.error('Error deleting company:', err);
      setFormError(err.message || 'Failed to delete company');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return 'bg-gray-500 text-white';
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') return 'bg-green-500 text-white';
    if (statusLower === 'inactive') return 'bg-gray-500 text-white';
    if (statusLower === 'draft') return 'bg-blue-500 text-white';
    if (statusLower === 'sent') return 'bg-yellow-500 text-white';
    if (statusLower === 'accepted') return 'bg-green-500 text-white';
    if (statusLower === 'completed') return 'bg-green-500 text-white';
    if (statusLower === 'scheduled') return 'bg-blue-500 text-white';
    if (statusLower === 'in progress') return 'bg-orange-500 text-white';
    if (statusLower === 'cancelled') return 'bg-red-500 text-white';
    return 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
        <span className="ml-3 text-gray-600">Loading company...</span>
      </div>
    );
  }

  if (loadingError || !company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Link href="/companies" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </Link>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {loadingError || 'Company not found'}
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = [
    company.address_line_1,
    company.address_line_2,
    company.city,
    company.postcode
  ].filter(Boolean).join(', ') || '—';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/companies" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Companies
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{company.company_name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {company.industry || 'No industry specified'} • {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
            </p>
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

      {/* TOOLBAR */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {company.website && (
              <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#0066CC]">
                <Globe className="w-4 h-4" />
                {company.website}
              </a>
            )}
            {company.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {company.phone}
              </span>
            )}
            {company.email && (
              <a href={`mailto:${company.email}`} className="flex items-center gap-1 hover:text-[#0066CC]">
                <Mail className="w-4 h-4" />
                {company.email}
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/clients/new?company_id=${company.id}`}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              Add Contact
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        {/* Company Info + Activity Summary - 2 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Company Info Card - Spans 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow h-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
              </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-12">
                      {/* Column 1 */}
                      <div>
                        <div className="space-y-3">
                          <div className="flex">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Industry</span>
                            <p className="text-gray-900">{company.industry || '—'}</p>
                          </div>
                          <div className="flex">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Phone</span>
                            <p className="text-gray-900">{company.phone || '—'}</p>
                          </div>
                          <div className="flex">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Email</span>
                            <p className="text-gray-900">
                              {company.email ? (
                                <a href={`mailto:${company.email}`} className="text-[#0066CC] hover:underline">
                                  {company.email}
                                </a>
                              ) : '—'}
                            </p>
                          </div>
                          <div className="flex">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Website</span>
                            <p className="text-gray-900">
                              {company.website ? (
                                <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-[#0066CC] hover:underline">
                                  {company.website}
                                </a>
                              ) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Column 2 */}
                      <div>
                        <div className="space-y-3">
                          <div className="flex">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Address</span>
                            <p className="text-gray-900">{fullAddress}</p>
                          </div>
                          <div className="flex">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Region</span>
                            <p className="text-gray-900">{region?.name || '—'}</p>
                          </div>
                          <div className="flex">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-20">City</span>
                            <p className="text-gray-900">{company.city || '—'}</p>
                          </div>
                          <div className="flex">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Status</span>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${company.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {company.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
            </div>
          </div>

          {/* Activity Summary Card */}
          <div>
            <div className="bg-white rounded-lg shadow h-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Activity Summary</h2>
              </div>
              <div className="p-6 space-y-3">
                <Link 
                  href={`/clients?company_id=${company.id}`} 
                  className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer group"
                >
                  <span className="text-gray-600 group-hover:text-[#0066CC]">Contacts</span>
                  <span className="font-semibold text-[#0066CC]">{contacts.length}</span>
                </Link>
                <Link 
                  href={`/quotes?company_id=${company.id}`} 
                  className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer group"
                >
                  <span className="text-gray-600 group-hover:text-[#0066CC]">Quotes</span>
                  <span className="font-semibold text-[#0066CC]">{quotes.length}</span>
                </Link>
                <Link 
                  href={`/assessments?company_id=${company.id}`} 
                  className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer group"
                >
                  <span className="text-gray-600 group-hover:text-[#0066CC]">Assessments</span>
                  <span className="font-semibold text-[#0066CC]">{assessments.length}</span>
                </Link>
                <Link 
                  href={`/jobs?company_id=${company.id}`} 
                  className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer group"
                >
                  <span className="text-gray-600 group-hover:text-[#0066CC]">Jobs</span>
                  <span className="font-semibold text-[#0066CC]">{jobs.length}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
            <Link
              href={`/clients/new?company_id=${company.id}`}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </Link>
          </div>

          {contacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Since</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact: Contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/clients/${contact.id}`} className="text-[#0066CC] hover:underline font-medium">
                          {contact.first_name} {contact.last_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a href={`mailto:${contact.email}`} className="hover:text-[#0066CC]">
                          {contact.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {contact.phone || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {contact.contact_type || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(contact.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/clients/${contact.id}`}
                          className="text-[#0066CC] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-4">No contacts yet</p>
              <Link
                href={`/clients/new?company_id=${company.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Add First Contact
              </Link>
            </div>
          )}
        </div>

        {/* Quotes Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
            <Link
              href={`/quotes/add-new-quote?company_id=${company.id}`}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Quote
            </Link>
          </div>
          {quotes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {quote.quote_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(quote.quote_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {quote.site_address || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(quote.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(quote.status)}`}>
                          {quote.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="text-[#0066CC] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-4">No quotes yet</p>
              <Link
                href={`/quotes/add-new-quote?company_id=${company.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Create First Quote
              </Link>
            </div>
          )}
        </div>

        {/* Assessments Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Assessments</h2>
            <Link
              href={`/assessments/new?company_id=${company.id}`}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Assessment
            </Link>
          </div>
          {assessments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assessment.reference_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(assessment.scheduled_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(assessment.status)}`}>
                          {assessment.status || 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/assessments/${assessment.id}`}
                          className="text-[#0066CC] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-4">No assessments yet</p>
              <Link
                href={`/assessments/new?company_id=${company.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Schedule First Assessment
              </Link>
            </div>
          )}
        </div>

        {/* Jobs Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Jobs</h2>
            <Link
              href={`/jobs/new?company_id=${company.id}`}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Job
            </Link>
          </div>
          {jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {job.job_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(job.scheduled_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(job.status)}`}>
                          {job.status || 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-[#0066CC] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-4">No jobs yet</p>
              <Link
                href={`/jobs/new?company_id=${company.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Create First Job
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* EDIT DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 cursor-pointer"
            onClick={() => setDrawerOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit Company</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Drawer Content */}
            <form onSubmit={handleSaveCompany} className="p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              {/* Company Information */}
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
                      name="company_name"
                      value={editForm.company_name}
                      onChange={handleEditFormChange}
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
                      value={editForm.industry}
                      onChange={handleEditFormChange}
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
                      value={editForm.phone}
                      onChange={handleEditFormChange}
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
                      value={editForm.email}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={editForm.website}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Address Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      name="address_line_1"
                      value={editForm.address_line_1}
                      onChange={handleEditFormChange}
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
                      value={editForm.address_line_2}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={editForm.city}
                        onChange={handleEditFormChange}
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
                        value={editForm.postcode}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <select
                      name="region_id"
                      value={editForm.region_id}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    >
                      <option value="">-- Select region --</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Status
                </h3>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={editForm.is_active}
                    onChange={handleEditFormChange}
                    className="w-4 h-4 text-[#0066CC] rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Company</h3>
            <p className="text-gray-600 mb-6">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}