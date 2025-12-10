'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Edit, Mail, Phone, Building2, Trash2, Plus, X } from 'lucide-react';

interface CustomerDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company_id: string | null;
  contact_type: string | null;
  status: string | null;
  created_at: string;
}

interface Company {
  id: string;
  company_name: string;
  industry: string | null;
}

interface RelatedContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  contact_type: string | null;
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

interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: string;
  contact_type: string;
  status: string;
}

export default function CustomerDetailPage({
  params
}: {
  params: { id: string }
}) {
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [relatedContacts, setRelatedContacts] = useState<RelatedContact[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formError, setFormError] = useState('');

  const [editForm, setEditForm] = useState<CustomerFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_id: '',
    contact_type: '',
    status: 'active'
  });

  useEffect(() => {
    loadCustomer();
  }, [params.id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setLoadingError('');

      const { data: customerData, error: customerError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single();

      if (customerError) throw customerError;
      if (!customerData) throw new Error('Customer not found');

      setCustomer(customerData);

      setEditForm({
        first_name: customerData.first_name || '',
        last_name: customerData.last_name || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        company_id: customerData.company_id || '',
        contact_type: customerData.contact_type || '',
        status: customerData.status || 'active'
      });

      // Get company if exists
      if (customerData.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('id, company_name, industry')
          .eq('id', customerData.company_id)
          .single();
        setCompany(companyData);

        // Get related contacts at same company
        const { data: relatedContactsData } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, phone, contact_type')
          .eq('company_id', customerData.company_id)
          .neq('id', params.id)
          .order('first_name');
        setRelatedContacts(relatedContactsData || []);
      }

      // Get all companies for dropdown
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, company_name, industry')
        .order('company_name');
      setCompanies(companiesData || []);

      // Get quotes for this customer
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('id, quote_number, quote_date, status, total_amount, site_address')
        .eq('client_id', customerData.id)
        .order('quote_date', { ascending: false });
      setQuotes(quotesData || []);

      // Get assessments for this customer
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('id, reference_number, scheduled_date, status')
        .eq('client_id', customerData.id)
        .order('scheduled_date', { ascending: false });
      setAssessments(assessmentsData || []);

      // Get jobs for this customer
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, job_number, scheduled_date, status')
        .eq('client_id', customerData.id)
        .order('scheduled_date', { ascending: false });
      setJobs(jobsData || []);
    } catch (err: any) {
      console.error('Error loading customer:', err);
      setLoadingError(err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      setFormError('First name and last name are required');
      return;
    }

    if (!editForm.email.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!editForm.email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
          company_id: editForm.company_id || null,
          contact_type: editForm.contact_type || null,
          status: editForm.status
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      await loadCustomer();
      setDrawerOpen(false);
    } catch (err: any) {
      console.error('Error saving customer:', err);
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    setDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', params.id);

      if (deleteError) throw deleteError;

      router.push('/customers');
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      setFormError(err.message || 'Failed to delete customer');
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
        <span className="ml-3 text-gray-600">Loading contact...</span>
      </div>
    );
  }

  if (loadingError || !customer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Link href="/customers" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Contacts
          </Link>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {loadingError || 'Customer not found'}
          </div>
        </div>
      </div>
    );
  }

  const fullName = `${customer.first_name} ${customer.last_name}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/customers" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Contacts
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {company ? (
                <>
                  {company.company_name} • {customer.contact_type || 'Contact'}
                </>
              ) : (
                customer.contact_type || 'Contact'
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              {customer.first_name[0]}{customer.last_name[0]}
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
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-[#0066CC]">
                <Mail className="w-4 h-4" />
                {customer.email}
              </a>
            )}
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {customer.phone}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
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
        {/* Contact Info + Activity Summary - Compact inline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Contact Info - COMPACT INLINE 2-column layout */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow h-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-12">
                  {/* Column 1 */}
                  <div>
                    <div className="space-y-3">
                      <div className="flex">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32">First Name</span>
                        <p className="text-gray-900">{customer.first_name}</p>
                      </div>
                      <div className="flex">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Email</span>
                        <p className="text-gray-900">
                          {customer.email ? (
                            <a href={`mailto:${customer.email}`} className="text-[#0066CC] hover:underline">
                              {customer.email}
                            </a>
                          ) : '—'}
                        </p>
                      </div>
                      <div className="flex">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Contact Type</span>
                        <p className="text-gray-900">{customer.contact_type || '—'}</p>
                      </div>
                      {company && (
                        <div className="flex">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Company</span>
                          <p className="text-gray-900">
                            <Link 
                              href={`/companies/${company.id}`}
                              className="text-[#0066CC] hover:underline"
                            >
                              {company.company_name}
                            </Link>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div>
                    <div className="space-y-3">
                      <div className="flex">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Last Name</span>
                        <p className="text-gray-900">{customer.last_name}</p>
                      </div>
                      <div className="flex">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Phone</span>
                        <p className="text-gray-900">{customer.phone || '—'}</p>
                      </div>
                      <div className="flex">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Date Added</span>
                        <p className="text-gray-900">{formatDate(customer.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary - Filterable Links */}
          <div>
            <div className="bg-white rounded-lg shadow h-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Activity Summary</h2>
              </div>
              <div className="p-6 space-y-3">
                <Link 
                  href={`/quotes?customer_id=${customer.id}`} 
                  className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer group"
                >
                  <span className="text-gray-600 group-hover:text-[#0066CC]">Quotes</span>
                  <span className="font-semibold text-[#0066CC]">{quotes.length}</span>
                </Link>
                <Link 
                  href={`/assessments?customer_id=${customer.id}`} 
                  className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer group"
                >
                  <span className="text-gray-600 group-hover:text-[#0066CC]">Assessments</span>
                  <span className="font-semibold text-[#0066CC]">{assessments.length}</span>
                </Link>
                <Link 
                  href={`/jobs?customer_id=${customer.id}`} 
                  className="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer group"
                >
                  <span className="text-gray-600 group-hover:text-[#0066CC]">Jobs</span>
                  <span className="font-semibold text-[#0066CC]">{jobs.length}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Contacts Section - if company exists */}
        {company && relatedContacts.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Other Contacts at {company.company_name}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatedContacts.map((contact: RelatedContact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/customers/${contact.id}`} className="text-[#0066CC] hover:underline font-medium">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/customers/${contact.id}`}
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
          </div>
        )}

        {/* Quotes Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
            <Link
              href={`/quotes/add-new-quote?customer_id=${customer.id}&customer_name=${encodeURIComponent(fullName)}`}
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
                href={`/quotes/add-new-quote?customer_id=${customer.id}&customer_name=${encodeURIComponent(fullName)}`}
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
              href={`/assessments/new?customer_id=${customer.id}&customer_name=${encodeURIComponent(fullName)}`}
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
                href={`/assessments/new?customer_id=${customer.id}&customer_name=${encodeURIComponent(fullName)}`}
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
              href={`/jobs/new?customer_id=${customer.id}&customer_name=${encodeURIComponent(fullName)}`}
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
                href={`/jobs/new?customer_id=${customer.id}&customer_name=${encodeURIComponent(fullName)}`}
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
              <h2 className="text-lg font-semibold text-gray-900">Edit Contact</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Drawer Content */}
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={editForm.first_name}
                        onChange={handleEditFormChange}
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
                        value={editForm.last_name}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <select
                        name="company_id"
                        value={editForm.company_id}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                      >
                        <option value="">-- Select company --</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.company_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Type
                      </label>
                      <input
                        type="text"
                        name="contact_type"
                        value={editForm.contact_type}
                        onChange={handleEditFormChange}
                        placeholder="e.g., Owner, Manager, Contractor"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Contact</h3>
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
                onClick={handleDeleteCustomer}
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