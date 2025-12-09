'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus } from 'lucide-react'
import AddCompanyModal from '@/components/AddCompanyModal'

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  company_id: string
  address_line_1: string
  address_line_2: string
  city: string
  postcode: string
  region: string
  status: string
}

interface Company {
  id: string
  name: string
}

const REGIONS = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Tauranga',
  'Hamilton',
  'Dunedin',
  'Palmerston North',
  'Rotorua',
  'Nelson',
  'Invercargill'
]

export default function NewCustomerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCompanyModal, setShowCompanyModal] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_id: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
    region: '',
    status: 'active'
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      setCompanies(data || [])
    } catch (err) {
      console.error('Error fetching companies:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCompanyAdded = (newCompany: { id: string; name: string }) => {
    setCompanies(prev => [...prev, newCompany].sort((a, b) => a.name.localeCompare(b.name)))
    setFormData(prev => ({ ...prev, company_id: newCompany.id }))
  }

  const validateForm = (): boolean => {
    if (!formData.first_name.trim()) {
      setError('First name is required')
      return false
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }
    if (!formData.phone.trim()) {
      setError('Phone is required')
      return false
    }
    if (!formData.address_line_1.trim()) {
      setError('Address is required')
      return false
    }
    if (!formData.region) {
      setError('Region is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const { data, error: insertError } = await supabase
        .from('clients')
        .insert({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          company_id: formData.company_id || null,
          address_line_1: formData.address_line_1.trim(),
          address_line_2: formData.address_line_2.trim() || null,
          city: formData.city.trim() || null,
          postcode: formData.postcode.trim() || null,
          region: formData.region,
          status: formData.status
        })
        .select()
        .single()

      if (insertError) throw insertError

      if (redirectTo) {
        router.push(`${redirectTo}?newClientId=${data.id}`)
      } else {
        router.push('/customers')
      }
    } catch (err: any) {
      console.error('Error creating customer:', err)
      setError(err.message || 'Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Card Container */}
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg border border-gray-200">
        
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-[#0066CC]">Add New Customer</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create a new customer record</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
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
                  value={formData.last_name}
                  onChange={handleChange}
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
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.phone}
                  onChange={handleChange}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <div className="flex gap-2">
                <select
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleChange}
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
                  onClick={() => setShowCompanyModal(true)}
                  className="px-3 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                  title="Add new company"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave empty if this is a residential customer</p>
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
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address_line_1"
                  value={formData.address_line_1}
                  onChange={handleChange}
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
                  value={formData.address_line_2}
                  onChange={handleChange}
                  placeholder="Apt, suite, unit (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
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
                    value={formData.postcode}
                    onChange={handleChange}
                    placeholder="1010"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                  >
                    <option value="">-- Select a region --</option>
                    {REGIONS.map(region => (
                      <option key={region} value={region}>
                        {region}
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
                  checked={formData.status === 'active'}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#0066CC]"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#0066CC]"
                />
                <span className="ml-2 text-sm text-gray-700">Inactive</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="prospect"
                  checked={formData.status === 'prospect'}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#0066CC]"
                />
                <span className="ml-2 text-sm text-gray-700">Prospect</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {saving ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal */}
      <AddCompanyModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onCompanyAdded={handleCompanyAdded}
      />
    </div>
  )
}