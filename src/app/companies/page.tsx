'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit, Eye, X, ChevronDown } from 'lucide-react'

interface Company {
  id: string
  company_name: string
  industry: string | null
  phone: string | null
  email: string | null
  website: string | null
  address_line_1: string | null
  city: string | null
  region_id: string | null
  region_name?: string
  sales_rep_id: string | null
  sales_rep_name?: string
  follow_up_date: string | null
  is_active: boolean
  created_at: string
  contact_count?: number
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  contact_type: string | null
  title: string | null
}

interface CompanyFormData {
  company_name: string
  industry: string
  phone: string
  email: string
  website: string
  address_line_1: string
  address_line_2: string
  city: string
  postcode: string
  region_id: string
  sales_rep_id: string
  follow_up_date: string
  is_active: boolean
}

type SortField = 'company_name' | 'industry' | 'region_name' | 'phone' | 'email' | 'sales_rep_name' | 'follow_up_date'
type SortDirection = 'asc' | 'desc'

const CONTACT_TYPES = ['Primary Contact', 'Sales Contact', 'Accounts Contact']

export default function CompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([])
  const [salesReps, setSalesReps] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [salesRepFilter, setSalesRepFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('company_name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CompanyFormData>({
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
    sales_rep_id: '',
    follow_up_date: '',
    is_active: true
  })

  // Company contacts state
  const [companyContacts, setCompanyContacts] = useState<Array<{ contact: Contact; contact_type: string }>>([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [selectedContactType, setSelectedContactType] = useState<string>('Primary Contact')
  const [showCustomContactType, setShowCustomContactType] = useState(false)
  const [customContactType, setCustomContactType] = useState('')
  const [contactSearch, setContactSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [searchTerm, statusFilter, sortField, sortDirection])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')

      if (companiesError) throw companiesError

      // Fetch regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('id, name')
        .order('name')

      if (regionsError) throw regionsError

      // Fetch sales reps
      const { data: salesRepsData, error: salesRepsError } = await supabase
        .from('team_members')
        .select('id, first_name, last_name')
        .eq('role', 'Sales Rep')
        .order('first_name')

      if (salesRepsError) throw salesRepsError

      // Fetch all contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, contact_type, title')
        .order('first_name')

      if (contactsError) throw contactsError

      // Get region map
      const regionMap: Record<string, string> = {}
      regionsData?.forEach(r => {
        regionMap[r.id] = r.name
      })

      // Get sales rep map
      const salesRepMap: Record<string, string> = {}
      salesRepsData?.forEach(rep => {
        salesRepMap[rep.id] = `${rep.first_name} ${rep.last_name}`
      })

      // Get contact count for each company
      const companiesWithCount = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)

          return {
            ...company,
            region_name: company.region_id ? regionMap[company.region_id] : null,
            sales_rep_name: company.sales_rep_id ? salesRepMap[company.sales_rep_id] : null,
            contact_count: count || 0
          }
        })
      )

      // Apply filters
      let filtered = companiesWithCount

      // Status filter
      if (statusFilter === 'active') {
        filtered = filtered.filter(c => c.is_active)
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(c => !c.is_active)
      }

      // Sales rep filter
      if (salesRepFilter !== 'all') {
        filtered = filtered.filter(c => c.sales_rep_id === salesRepFilter)
      }

      // Region filter
      if (regionFilter !== 'all') {
        filtered = filtered.filter(c => c.region_id === regionFilter)
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        filtered = filtered.filter(company =>
          company.company_name?.toLowerCase().includes(searchLower) ||
          company.industry?.toLowerCase().includes(searchLower) ||
          company.email?.toLowerCase().includes(searchLower) ||
          company.phone?.includes(searchTerm) ||
          company.city?.toLowerCase().includes(searchLower)
        )
      }

      // Sort
      filtered.sort((a, b) => {
        const aVal = a[sortField] || ''
        const bVal = b[sortField] || ''

        const comparison = aVal.toString().localeCompare(bVal.toString(), undefined, {
          numeric: true,
          sensitivity: 'base'
        })

        return sortDirection === 'asc' ? comparison : -comparison
      })

      setCompanies(filtered)
      setAllContacts(contactsData || [])
      setRegions(regionsData || [])
      setSalesReps((salesRepsData || []).map(rep => ({
        id: rep.id,
        name: `${rep.first_name} ${rep.last_name}`
      })))
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const openDrawer = (company?: Company) => {
    if (company) {
      setEditingId(company.id)
      setFormData({
        company_name: company.company_name,
        industry: company.industry || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        address_line_1: company.address_line_1 || '',
        address_line_2: '',
        city: company.city || '',
        postcode: '',
        region_id: company.region_id || '',
        sales_rep_id: company.sales_rep_id || '',
        follow_up_date: company.follow_up_date || '',
        is_active: company.is_active
      })
      // Fetch company contacts
      fetchCompanyContacts(company.id)
    } else {
      setEditingId(null)
      setFormData({
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
        sales_rep_id: '',
        follow_up_date: '',
        is_active: true
      })
      setCompanyContacts([])
    }
    setFormError(null)
    setShowAddContact(false)
    setSelectedContact('')
    setSelectedContactType('Primary Contact')
    setShowCustomContactType(false)
    setCustomContactType('')
    setContactSearch('')
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setFormError(null)
  }

  const fetchCompanyContacts = async (companyId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, contact_type, title')
        .eq('company_id', companyId)
        .order('first_name')

      if (err) throw err

      const contactsWithType = (data || []).map(contact => ({
        contact,
        contact_type: contact.contact_type || 'Primary Contact'
      }))

      setCompanyContacts(contactsWithType)
    } catch (err) {
      console.error('Error fetching company contacts:', err)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.company_name.trim()) {
      setFormError('Company name is required')
      return false
    }
    if (formData.email && !formData.email.includes('@')) {
      setFormError('Please enter a valid email address')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const normalizedWebsite = formData.website.trim() 
      ? (formData.website.startsWith('http') 
          ? formData.website 
          : `https://${formData.website}`)
      : null

    const dataToSave = {
      company_name: formData.company_name.trim(),
      industry: formData.industry.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      website: normalizedWebsite,  // ← USE NORMALIZED VERSION HERE
      address_line_1: formData.address_line_1.trim() || null,
      address_line_2: formData.address_line_2.trim() || null,
      city: formData.city.trim() || null,
      postcode: formData.postcode.trim() || null,
      region_id: formData.region_id || null,
      sales_rep_id: formData.sales_rep_id || null,
      follow_up_date: formData.follow_up_date || null,
      is_active: formData.is_active
    }

      if (editingId) {
        // Update
        const { error: updateError } = await supabase
          .from('companies')
          .update(dataToSave)
          .eq('id', editingId)

        if (updateError) throw updateError
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('companies')
          .insert(dataToSave)

        if (insertError) throw insertError
      }

      fetchData()
      closeDrawer()
    } catch (err: any) {
      console.error('Error saving company:', err)
      setFormError(err.message || 'Failed to save company')
    } finally {
      setSaving(false)
    }
  }

  const handleAddContact = async () => {
    if (!selectedContact && !contactSearch.trim()) {
      setFormError('Please select or enter a contact name')
      return
    }

    const finalContactType = showCustomContactType ? customContactType.trim() : selectedContactType

    if (!finalContactType) {
      setFormError('Please select or enter a contact type')
      return
    }

    setSaving(true)

    try {
      if (selectedContact) {
        // Update existing contact's contact_type
        const { error: updateError } = await supabase
          .from('clients')
          .update({ contact_type: finalContactType })
          .eq('id', selectedContact)

        if (updateError) throw updateError

        // Refresh company contacts
        if (editingId) {
          fetchCompanyContacts(editingId)
        }
      } else {
        // Create new contact
        const [firstName, ...lastNameParts] = contactSearch.trim().split(' ')
        const lastName = lastNameParts.join(' ') || ''

        const { error: insertError } = await supabase
          .from('clients')
          .insert({
            first_name: firstName,
            last_name: lastName,
            company_id: editingId || null,
            contact_type: finalContactType
          })

        if (insertError) throw insertError

        // Refresh company contacts
        if (editingId) {
          fetchCompanyContacts(editingId)
        }

        // Refresh all contacts
        fetchData()
      }

      // Reset add contact form
      setShowAddContact(false)
      setSelectedContact('')
      setSelectedContactType('Primary Contact')
      setShowCustomContactType(false)
      setCustomContactType('')
      setContactSearch('')
      setFormError(null)
    } catch (err: any) {
      console.error('Error adding contact:', err)
      setFormError(err.message || 'Failed to add contact')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveContact = async (contactId: string) => {
    if (!confirm('Remove this contact from the company?')) return

    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ company_id: null })
        .eq('id', contactId)

      if (updateError) throw updateError

      if (editingId) {
        fetchCompanyContacts(editingId)
      }
    } catch (err: any) {
      console.error('Error removing contact:', err)
      setFormError(err.message || 'Failed to remove contact')
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-blue-200">⇅</span>
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === companies.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(companies.map(c => c.id)))
    }
  }

  const toggleSelectCompany = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const filteredContacts = allContacts.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase()
    return fullName.includes(contactSearch.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* PAGE HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0066CC]">Companies</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your company database</p>
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
                placeholder="Search companies..."
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
              onClick={() => openDrawer()}
              className="px-4 py-2 text-sm bg-[#0066CC] text-white rounded hover:bg-[#0052a3] hover:shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Company
            </button>
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
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-600 mb-4">
          Showing {companies.length} companies
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066CC]"></div>
            <span className="ml-3 text-gray-600">Loading companies...</span>
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
                        checked={selectedIds.size === companies.length && companies.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold whitespace-nowrap">
                      Action
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('company_name')}
                    >
                      Company Name <SortArrow field="company_name" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('industry')}
                    >
                      Industry <SortArrow field="industry" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('sales_rep_name')}
                    >
                      Sales Rep <SortArrow field="sales_rep_name" />
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-[#0055aa]"
                      onClick={() => handleSort('region_name')}
                    >
                      Region <SortArrow field="region_name" />
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
                    <th className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap">
                      Contacts
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
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                        No companies found
                      </td>
                    </tr>
                  ) : (
                    companies.map((company, index) => (
                      <tr
                        key={company.id}
                        className={`hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="text-center px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(company.id)}
                            onChange={() => toggleSelectCompany(company.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/companies/${company.id}`}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => openDrawer(company)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/companies/${company.id}`}
                            className="text-[#0066CC] hover:underline font-medium"
                          >
                            {company.company_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {company.industry || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {company.sales_rep_name || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {company.region_name || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {company.phone || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {company.email || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-[#0066CC] text-white text-xs font-semibold rounded-full">
                            {company.contact_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(company.follow_up_date)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* DRAWER - Rest of the code remains identical to before */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 cursor-pointer"
            onClick={closeDrawer}
          ></div>

          {/* Drawer Panel */}
          <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Company' : 'Add New Company'}
              </h2>
              <button
                onClick={closeDrawer}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Drawer Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                      value={formData.company_name}
                      onChange={handleFormChange}
                      placeholder="ABC Construction Ltd"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleFormChange}
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
                      value={formData.phone}
                      onChange={handleFormChange}
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
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="contact@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      name="website"
                      value={formData.website}
                      onChange={handleFormChange}
                      placeholder="www.company.com"
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
                      value={formData.address_line_1}
                      onChange={handleFormChange}
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
                      onChange={handleFormChange}
                      placeholder="Suite, unit (optional)"
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
                        value={formData.city}
                        onChange={handleFormChange}
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
                        onChange={handleFormChange}
                        placeholder="1010"
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
                      value={formData.region_id}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                    >
                      <option value="">-- Select a region --</option>
                      {regions.map(region => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sales Rep */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Sales Representative
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Sales Rep
                </label>
                <select
                  name="sales_rep_id"
                  value={formData.sales_rep_id}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                >
                  <option value="">-- Select sales rep (optional) --</option>
                  {salesReps.map(rep => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Assign a sales representative to manage this company</p>
              </div>

              {/* Follow Up Date */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Follow Up
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow Up Date
                </label>
                <input
                  type="date"
                  name="follow_up_date"
                  value={formData.follow_up_date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Set a reminder date for follow-up</p>
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
                    checked={formData.is_active}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-[#0066CC] rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              {/* Company Contacts */}
              {editingId && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Contacts <span className="text-xs font-normal text-gray-500">({companyContacts.length})</span>
                  </h3>

                  {/* Existing Contacts List */}
                  {companyContacts.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {companyContacts.map(({ contact, contact_type }) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {contact_type} {contact.title ? `• ${contact.title}` : ''}
                            </p>
                            {contact.email && <p className="text-xs text-gray-500">{contact.email}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveContact(contact.id)}
                            className="ml-2 p-1 hover:bg-red-100 rounded text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Contact Form */}
                  {!showAddContact ? (
                    <button
                      type="button"
                      onClick={() => setShowAddContact(true)}
                      className="w-full px-3 py-2 border border-[#0066CC] text-[#0066CC] rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Contact
                    </button>
                  ) : (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Select or Create Contact
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            onFocus={() => setSelectedContact('')}
                            placeholder="Search or type contact name..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                          />
                          {contactSearch && filteredContacts.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                              {filteredContacts.map(contact => (
                                <button
                                  key={contact.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedContact(contact.id)
                                    setContactSearch(`${contact.first_name} ${contact.last_name}`)
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 text-sm"
                                >
                                  <p className="font-medium text-gray-900">
                                    {contact.first_name} {contact.last_name}
                                  </p>
                                  <p className="text-xs text-gray-500">{contact.email}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Contact Type
                        </label>
                        {!showCustomContactType ? (
                          <div className="space-y-2">
                            <select
                              value={selectedContactType}
                              onChange={(e) => setSelectedContactType(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                            >
                              {CONTACT_TYPES.map(type => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                              <option value="">-- Other --</option>
                            </select>
                            {selectedContactType === '' && (
                              <button
                                type="button"
                                onClick={() => setShowCustomContactType(true)}
                                className="text-xs text-[#0066CC] hover:underline"
                              >
                                Add custom type
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={customContactType}
                              onChange={(e) => setCustomContactType(e.target.value)}
                              placeholder="e.g., Facilities Manager"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomContactType(false)
                                setCustomContactType('')
                              }}
                              className="text-xs text-gray-600 hover:underline"
                            >
                              Use preset type
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddContact(false)
                            setSelectedContact('')
                            setContactSearch('')
                            setShowCustomContactType(false)
                            setCustomContactType('')
                            setFormError(null)
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddContact}
                          disabled={saving}
                          className="flex-1 px-3 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg disabled:opacity-50 text-sm font-medium"
                        >
                          {saving ? 'Adding...' : 'Add Contact'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Drawer Buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
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
                  {saving ? 'Saving...' : editingId ? 'Update Company' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}