'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

type Mode = 'contact' | 'company' | 'both'

interface Region {
  id: string
  name: string
  code: string
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
}

interface ClientType {
  id: string
  name: string
}

interface AddClientDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function ConsolidatedAddClientDrawer({ isOpen, onClose }: AddClientDrawerProps) {
  const [mode, setMode] = useState<Mode>('contact')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Contact fields
  const [contactData, setContactData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    title: '',
    contact_type: '',
    preferred_contact_method: '',
    do_not_contact: false,
    contact_tags: '',
    client_type_id: '',
    status: 'Prospect',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
    region_id: '',
    property_type: '',
    notes: '',
    sales_rep_id: '',
    is_primary_contact: false,
  })

  // Company fields
  const [companyData, setCompanyData] = useState({
    company_name: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
    region_id: '',
    notes: '',
    is_active: true,
    country: 'New Zealand',
  })

  // Dropdowns
  const [regions, setRegions] = useState<Region[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [clientTypes, setClientTypes] = useState<ClientType[]>([])

  // Load lookups
  useEffect(() => {
    if (isOpen) {
      loadLookupData()
      resetForms()
    }
  }, [isOpen])

  const loadLookupData = async () => {
    try {
      // Load regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('id, name, code')
        .order('name')

      if (!regionsError && regionsData) setRegions(regionsData)

      // Load team members (for sales_rep_id)
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name')

      if (!teamError && teamData) setTeamMembers(teamData)

      // Load client types (if table exists)
      const { data: typesData, error: typesError } = await supabase
        .from('client_types')
        .select('id, name')
        .order('name')

      if (!typesError && typesData) setClientTypes(typesData)
    } catch (err) {
      console.error('Error loading lookups:', err)
    }
  }

  const resetForms = () => {
    setContactData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      title: '',
      contact_type: '',
      preferred_contact_method: '',
      do_not_contact: false,
      contact_tags: '',
      client_type_id: '',
      status: 'Prospect',
      address_line_1: '',
      address_line_2: '',
      city: '',
      postcode: '',
      region_id: '',
      property_type: '',
      notes: '',
      sales_rep_id: '',
      is_primary_contact: false,
    })

    setCompanyData({
      company_name: '',
      industry: '',
      website: '',
      phone: '',
      email: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      postcode: '',
      region_id: '',
      notes: '',
      is_active: true,
      country: 'New Zealand',
    })

    setError('')
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setContactData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setCompanyData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const validateContactForm = (): boolean => {
    if (!contactData.first_name.trim()) {
      setError('First name is required')
      return false
    }
    if (!contactData.last_name.trim()) {
      setError('Last name is required')
      return false
    }
    if (contactData.email && !contactData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }
    return true
  }

  const validateCompanyForm = (): boolean => {
    if (!companyData.company_name.trim()) {
      setError('Company name is required')
      return false
    }
    if (companyData.email && !companyData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      setSaving(true)

      let createdCompanyId: string | null = null
      let createdContactId: string | null = null

      // Create company if needed
      if (mode === 'company' || mode === 'both') {
        if (!validateCompanyForm()) {
          setSaving(false)
          return
        }

        const { data: companyResult, error: companyError } = await supabase
          .from('companies')
          .insert({
            company_name: companyData.company_name.trim(),
            industry: companyData.industry.trim() || null,
            website: companyData.website.trim() || null,
            phone: companyData.phone.trim() || null,
            email: companyData.email.trim() || null,
            address_line_1: companyData.address_line_1.trim() || null,
            address_line_2: companyData.address_line_2.trim() || null,
            city: companyData.city.trim() || null,
            postcode: companyData.postcode.trim() || null,
            region_id: companyData.region_id || null,
            notes: companyData.notes.trim() || null,
            is_active: companyData.is_active,
            country: companyData.country.trim() || 'New Zealand',
          })
          .select('id')
          .single()

        if (companyError) throw companyError
        createdCompanyId = companyResult?.id || null
      }

      // Create contact if needed
      if (mode === 'contact' || mode === 'both') {
        if (!validateContactForm()) {
          setSaving(false)
          return
        }

        const { data: contactResult, error: contactError } = await supabase
          .from('clients')
          .insert({
            first_name: contactData.first_name.trim(),
            last_name: contactData.last_name.trim(),
            email: contactData.email.trim() || null,
            phone: contactData.phone.trim() || null,
            title: contactData.title.trim() || null,
            contact_type: contactData.contact_type || null,
            preferred_contact_method: contactData.preferred_contact_method || null,
            do_not_contact: contactData.do_not_contact,
            contact_tags: contactData.contact_tags.trim() || null,
            client_type_id: contactData.client_type_id || null,
            status: contactData.status,
            address_line_1: contactData.address_line_1.trim() || null,
            address_line_2: contactData.address_line_2.trim() || null,
            city: contactData.city.trim() || null,
            postcode: contactData.postcode.trim() || null,
            region_id: contactData.region_id || null,
            property_type: contactData.property_type.trim() || null,
            notes: contactData.notes.trim() || null,
            sales_rep_id: contactData.sales_rep_id || null,
            is_primary_contact: contactData.is_primary_contact,
            company_id: createdCompanyId || null,
          })
          .select('id')
          .single()

        if (contactError) throw contactError
        createdContactId = contactResult?.id || null
      }

      // Success - redirect with new ID
      const currentPath = window.location.pathname
      if (createdContactId) {
        window.location.href = `${currentPath}?newContactId=${createdContactId}`
      } else if (createdCompanyId) {
        window.location.href = `${currentPath}?newCompanyId=${createdCompanyId}`
      }
    } catch (err: any) {
      console.error('Error creating:', err)
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 cursor-pointer" onClick={onClose}></div>

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-[700px] bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add New Client</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* Mode Selection */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">What would you like to create?</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  checked={mode === 'contact'}
                  onChange={() => {
                    setMode('contact')
                    setError('')
                  }}
                  className="w-4 h-4 text-[#0066CC]"
                />
                <span className="text-sm font-medium text-gray-700">New Contact Only</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  checked={mode === 'company'}
                  onChange={() => {
                    setMode('company')
                    setError('')
                  }}
                  className="w-4 h-4 text-[#0066CC]"
                />
                <span className="text-sm font-medium text-gray-700">New Company Only</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  checked={mode === 'both'}
                  onChange={() => {
                    setMode('both')
                    setError('')
                  }}
                  className="w-4 h-4 text-[#0066CC]"
                />
                <span className="text-sm font-medium text-gray-700">New Company & Contact</span>
              </label>
            </div>
          </div>

          {/* CONTACT SECTION */}
          {(mode === 'contact' || mode === 'both') && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Contact Information</h3>

              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={contactData.first_name}
                      onChange={handleContactChange}
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
                      value={contactData.last_name}
                      onChange={handleContactChange}
                      placeholder="Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={contactData.email}
                      onChange={handleContactChange}
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={contactData.phone}
                      onChange={handleContactChange}
                      placeholder="+64 9 123 4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                </div>

                {/* Title and Contact Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={contactData.title}
                      onChange={handleContactChange}
                      placeholder="e.g., Managing Director"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Type</label>
                    <input
                      type="text"
                      name="contact_type"
                      value={contactData.contact_type}
                      onChange={handleContactChange}
                      placeholder="e.g., Primary Contact"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                </div>

                {/* Preferred Contact Method and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact Method</label>
                    <select
                      name="preferred_contact_method"
                      value={contactData.preferred_contact_method}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    >
                      <option value="">Select method</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={contactData.status}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    >
                      <option value="Active">Active</option>
                      <option value="Prospect">Prospect</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Client Type and Sales Rep */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                    <select
                      name="client_type_id"
                      value={contactData.client_type_id}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    >
                      <option value="">Select client type</option>
                      {clientTypes.map((ct) => (
                        <option key={ct.id} value={ct.id}>
                          {ct.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Rep</label>
                    <select
                      name="sales_rep_id"
                      value={contactData.sales_rep_id}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    >
                      <option value="">Select sales rep</option>
                      {teamMembers.map((tm) => (
                        <option key={tm.id} value={tm.id}>
                          {tm.first_name} {tm.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    name="address_line_1"
                    value={contactData.address_line_1}
                    onChange={handleContactChange}
                    placeholder="123 Main Street"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="address_line_2"
                    value={contactData.address_line_2}
                    onChange={handleContactChange}
                    placeholder="Apt, suite, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={contactData.city}
                      onChange={handleContactChange}
                      placeholder="Auckland"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                    <input
                      type="text"
                      name="postcode"
                      value={contactData.postcode}
                      onChange={handleContactChange}
                      placeholder="1010"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <select
                      name="region_id"
                      value={contactData.region_id}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    >
                      <option value="">Select region</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                    <input
                      type="text"
                      name="property_type"
                      value={contactData.property_type}
                      onChange={handleContactChange}
                      placeholder="e.g., Residential"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Tags</label>
                    <input
                      type="text"
                      name="contact_tags"
                      value={contactData.contact_tags}
                      onChange={handleContactChange}
                      placeholder="e.g., VIP, Urgent"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="do_not_contact"
                      checked={contactData.do_not_contact}
                      onChange={handleContactChange}
                      className="w-4 h-4 text-[#0066CC]"
                    />
                    <span className="text-sm text-gray-700">Do Not Contact</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_primary_contact"
                      checked={contactData.is_primary_contact}
                      onChange={handleContactChange}
                      className="w-4 h-4 text-[#0066CC]"
                    />
                    <span className="text-sm text-gray-700">Is Primary Contact</span>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={contactData.notes}
                    onChange={handleContactChange}
                    rows={3}
                    placeholder="Additional notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* COMPANY SECTION */}
          {(mode === 'company' || mode === 'both') && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Company Information</h3>

              <div className="space-y-4">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={companyData.company_name}
                    onChange={handleCompanyChange}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                  />
                </div>

                {/* Industry and Website */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select
                      name="industry"
                      value={companyData.industry}
                      onChange={handleCompanyChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    >
                      <option value="">Select industry</option>
                      <option value="Construction">Construction</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="HVAC">HVAC</option>
                      <option value="Roofing">Roofing</option>
                      <option value="Property Development">Property Development</option>
                      <option value="Property Management">Property Management</option>
                      <option value="Architecture">Architecture</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Installation Services">Installation Services</option>
                      <option value="Renovation">Renovation</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial Construction">Commercial Construction</option>
                      <option value="Sustainable Construction">Sustainable Construction</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={companyData.website}
                      onChange={handleCompanyChange}
                      placeholder="www.example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                </div>

                {/* Phone and Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={companyData.phone}
                      onChange={handleCompanyChange}
                      placeholder="+64 9 123 4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={companyData.email}
                      onChange={handleCompanyChange}
                      placeholder="contact@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                </div>

                {/* Address Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    name="address_line_1"
                    value={companyData.address_line_1}
                    onChange={handleCompanyChange}
                    placeholder="123 Main Street"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="address_line_2"
                    value={companyData.address_line_2}
                    onChange={handleCompanyChange}
                    placeholder="Apt, suite, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={companyData.city}
                      onChange={handleCompanyChange}
                      placeholder="Auckland"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                    <input
                      type="text"
                      name="postcode"
                      value={companyData.postcode}
                      onChange={handleCompanyChange}
                      placeholder="1010"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <select
                      name="region_id"
                      value={companyData.region_id}
                      onChange={handleCompanyChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    >
                      <option value="">Select region</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={companyData.country}
                    onChange={handleCompanyChange}
                    placeholder="New Zealand"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                  />
                </div>

                {/* Active Status */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={companyData.is_active}
                      onChange={handleCompanyChange}
                      className="w-4 h-4 text-[#0066CC]"
                    />
                    <span className="text-sm text-gray-700">Is Active</span>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={companyData.notes}
                    onChange={handleCompanyChange}
                    rows={3}
                    placeholder="Additional notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
