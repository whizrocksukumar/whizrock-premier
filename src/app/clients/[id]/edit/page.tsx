'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id?: string;
  contact_type?: string;
  client_type_id?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postal_code?: string;
  region_id?: string;
  status: string;
  follow_up_date?: string;
}

interface Company {
  id: string;
  name: string;
}

export default function EditCustomer({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState<Customer>({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_id: '',
    contact_type: 'Primary Contact',
    client_type_id: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postal_code: '',
    region_id: '',
    status: 'Active',
    follow_up_date: '',
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load customer data
      const { data: customer, error: customerError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single();

      if (customerError) throw customerError;
      
      setFormData(customer);

      // Load companies list
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      
      setCompanies(companiesData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('clients')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          company_id: formData.company_id || null,
          contact_type: formData.contact_type,
          client_type_id: formData.client_type_id || null,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2,
          city: formData.city,
          postal_code: formData.postal_code,
          region_id: formData.region_id,
          status: formData.status,
          follow_up_date: formData.follow_up_date || null,
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      router.push(`/clients/${params.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Row */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href={`/clients/${params.id}`}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Customer
              </h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Update customer information
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <select
                      name="company_id"
                      value={formData.company_id || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    >
                      <option value="">No Company</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Type
                    </label>
                    <select
                      name="contact_type"
                      value={formData.contact_type || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    >
                      <option value="Primary Contact">Primary Contact</option>
                      <option value="Secondary Contact">Secondary Contact</option>
                      <option value="Billing Contact">Billing Contact</option>
                      <option value="Property Manager">Property Manager</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Prospect">Prospect</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow Up Date
                    </label>
                    <input
                      type="date"
                      name="follow_up_date"
                      value={formData.follow_up_date || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Address Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      name="address_line_1"
                      value={formData.address_line_1 || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      name="address_line_2"
                      value={formData.address_line_2 || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region
                    </label>
                    <input
                      type="text"
                      name="region_id"
                      value={formData.region_id || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Link
                href={`/clients/${params.id}`}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
