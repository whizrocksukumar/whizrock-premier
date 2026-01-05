'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, X, ChevronRight } from 'lucide-react'
import ConsolidatedAddClientDrawer from './forms/ConsolidatedAddClientDrawer'

type SearchMode = 'contact' | 'company' | 'address'
type CreateMode = 'standalone' | 'from-contact' | 'from-company'

interface Site {
  id: string
  site_name: string
  company_id: string | null
  client_id: string | null
  address_line_1: string
  address_line_2?: string | null
  city: string
  region_id?: string | null
  postcode: string
  property_type?: string | null
  notes?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  company_name?: string
  client_name?: string
  region_name?: string
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  company_id: string | null
}

interface Company {
  id: string
  company_name: string
}

interface Region {
  id: string
  name: string
}

interface SiteSelectorProps {
  onSiteSelected: (site: Site) => void
  onClose?: () => void
  hideCreateButton?: boolean
}

export default function SiteSelector({ onSiteSelected, onClose, hideCreateButton = false }: SiteSelectorProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('contact')
  const [createMode, setCreateMode] = useState<CreateMode | null>(null)

  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Site[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)

  // Contact/Company selection
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)

  // Create new site form
  const [siteForm, setSiteForm] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    region_id: '',
    postcode: '',
    property_type: '',
    notes: '',
  })

  // Lookups
  const [regions, setRegions] = useState<Region[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Initialize
  useEffect(() => {
    loadLookupData()
  }, [])

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-contact-dropdown]')) setShowContactDropdown(false)
      if (!target.closest('[data-company-dropdown]')) setShowCompanyDropdown(false)
      if (!target.closest('[data-search-results]')) setShowResults(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fuzzy search
  const fuzzySearch = (items: any[], term: string, fields: string[]): any[] => {
    if (!term) return items
    const lowerTerm = term.toLowerCase()
    return items.filter(item =>
      fields.some(field => {
        const value = item[field]?.toString().toLowerCase() || ''
        return value.includes(lowerTerm)
      })
    )
  }

  // Auto-search when contact selected
  useEffect(() => {
    if (searchMode === 'contact' && selectedContact) {
      performSearch()
    }
  }, [selectedContact, searchMode])

  // Auto-search when company selected
  useEffect(() => {
    if (searchMode === 'company' && selectedCompany) {
      performSearch()
    }
  }, [selectedCompany, searchMode])

  const loadLookupData = async () => {
    try {
      const [contactsRes, companiesRes, regionsRes] = await Promise.all([
        supabase.from('clients').select('id, first_name, last_name, company_id'),
        supabase.from('companies').select('id, company_name'),
        supabase.from('regions').select('id, name'),
      ])

      if (contactsRes.data) {
        setContacts(contactsRes.data as Contact[])
        setFilteredContacts(contactsRes.data as Contact[])
      }
      if (companiesRes.data) {
        setCompanies(companiesRes.data as Company[])
        setFilteredCompanies(companiesRes.data as Company[])
      }
      if (regionsRes.data) setRegions(regionsRes.data as Region[])
    } catch (err) {
      console.error('Error loading lookup data:', err)
    }
  }

  const performSearch = async () => {
    setSearching(true)
    setError('')

    try {
      if (searchMode === 'contact' && selectedContact) {
        // Search for sites linked to this contact
        const { data, error: err } = await supabase
          .from('sites')
          .select('*')
          .eq('client_id', selectedContact.id)

        if (err) throw err
        setSearchResults(data as Site[])
      } else if (searchMode === 'company' && selectedCompany) {
        // Search for sites in two ways:
        // 1. Sites directly linked to company (company_id)
        // 2. Sites linked to clients who belong to this company (client_id where client.company_id matches)

        // First, get all clients belonging to this company
        const { data: companyClients, error: clientsErr } = await supabase
          .from('clients')
          .select('id')
          .eq('company_id', selectedCompany.id)

        if (clientsErr) throw clientsErr

        const clientIds = companyClients?.map(c => c.id) || []

        // Now fetch sites that are either:
        // - Directly linked to company, OR
        // - Linked to any client in this company
        const { data: allSites, error: sitesErr } = await supabase
          .from('sites')
          .select('*')

        if (sitesErr) throw sitesErr

        // Filter sites: company_id matches OR client_id is in the list of company clients
        const filtered = (allSites || []).filter(
          s => s.company_id === selectedCompany.id || (s.client_id && clientIds.includes(s.client_id))
        )

        setSearchResults(filtered as Site[])
      } else if (searchMode === 'address' && searchTerm) {
        const { data, error: err } = await supabase
          .from('sites')
          .select('*')

        if (err) throw err

        const filtered = (data || []).filter(
          s =>
            s.address_line_1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.postcode?.includes(searchTerm)
        )

        setSearchResults(filtered as Site[])
      } else {
        setSearchResults([])
      }
    } catch (err: any) {
      console.error('Error searching sites:', err)
      setError(err.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleSiteSelected = (site: Site) => {
    onSiteSelected(site)
    if (onClose) onClose()
  }

  const handleSaveNewSite = async () => {
    setError('')

    // Validation
    if (!siteForm.address_line_1.trim()) {
      setError('Address is required')
      return
    }
    if (!siteForm.city.trim()) {
      setError('City is required')
      return
    }
    if (!siteForm.postcode.trim()) {
      setError('Postcode is required')
      return
    }

    // Determine client and company based on mode
    const client_id = createMode === 'from-contact' ? selectedContact?.id : null
    const company_id =
      createMode === 'from-company'
        ? selectedCompany?.id
        : createMode === 'from-contact'
          ? selectedContact?.company_id
          : null

    if (!client_id && !company_id) {
      setError('Must link to at least one Contact or Company')
      return
    }

    try {
      setSaving(true)

      const siteName = `SITE-${Math.random().toString(36).substring(7).toUpperCase()}`

      // Create site
      const { data: newSite, error: insertError } = await supabase
        .from('sites')
        .insert({
          site_name: siteName,
          client_id: client_id || null,
          company_id: company_id || null,
          address_line_1: siteForm.address_line_1.trim(),
          address_line_2: siteForm.address_line_2.trim() || null,
          city: siteForm.city.trim(),
          region_id: siteForm.region_id || null,
          postcode: siteForm.postcode.trim(),
          property_type: siteForm.property_type.trim() || null,
          notes: siteForm.notes.trim() || null,
          is_active: true,
        })
        .select()
        .single()

      if (insertError) throw insertError
      if (!newSite) throw new Error('Site creation returned no data')

      // Find company name if needed
      let company_name: string | undefined
      if (company_id) {
        const company = companies.find(c => c.id === company_id)
        company_name = company?.company_name
      }

      // Find client name and company if needed
      let client_name: string | undefined
      if (client_id) {
        const contact = contacts.find(c => c.id === client_id)
        if (contact) {
          client_name = `${contact.first_name} ${contact.last_name}`
          if (!company_name && contact.company_id) {
            const company = companies.find(c => c.id === contact.company_id)
            company_name = company?.company_name
          }
        }
      }

      // Find region name
      const region_name = siteForm.region_id
        ? regions.find(r => r.id === siteForm.region_id)?.name
        : undefined

      // Build response object carefully
      const fullSite: Site = {
        id: newSite.id,
        site_name: newSite.site_name,
        company_id: newSite.company_id,
        client_id: newSite.client_id,
        address_line_1: newSite.address_line_1,
        address_line_2: newSite.address_line_2,
        city: newSite.city,
        region_id: newSite.region_id,
        postcode: newSite.postcode,
        property_type: newSite.property_type,
        notes: newSite.notes,
        is_active: newSite.is_active,
        company_name,
        client_name,
        region_name,
      }

      handleSiteSelected(fullSite)
    } catch (err: any) {
      console.error('Error creating site:', err)
      setError(err.message || 'Failed to create site')
    } finally {
      setSaving(false)
    }
  }

  // RENDER SEARCH MODE
  if (!createMode) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Select or Create Site</h2>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Search Mode Selection - ONE LINE */}
        <div className="flex items-center gap-6 mb-6 pb-4 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Search by:</span>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={searchMode === 'contact'}
                onChange={() => {
                  setSearchMode('contact')
                  setSearchTerm('')
                  setSearchResults([])
                  setSelectedCompany(null)
                  setShowResults(false)
                }}
                className="w-4 h-4 text-[#0066CC]"
              />
              <span className="text-sm text-gray-700">Contact</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={searchMode === 'company'}
                onChange={() => {
                  setSearchMode('company')
                  setSearchTerm('')
                  setSearchResults([])
                  setSelectedContact(null)
                  setShowResults(false)
                }}
                className="w-4 h-4 text-[#0066CC]"
              />
              <span className="text-sm text-gray-700">Company</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={searchMode === 'address'}
                onChange={() => {
                  setSearchMode('address')
                  setSearchTerm('')
                  setSearchResults([])
                  setSelectedContact(null)
                  setSelectedCompany(null)
                  setShowResults(false)
                }}
                className="w-4 h-4 text-[#0066CC]"
              />
              <span className="text-sm text-gray-700">Address</span>
            </label>
          </div>
        </div>

        {/* Search/Selection by Mode */}
        <div className="mb-4" data-contact-dropdown>
          {searchMode === 'contact' && (
            <div>
              <input
                type="text"
                placeholder="Type contact name..."
                onFocus={() => {
                  setShowContactDropdown(true)
                  setFilteredContacts(contacts)
                }}
                onChange={e => {
                  setFilteredContacts(fuzzySearch(contacts, e.target.value, ['first_name', 'last_name']))
                  setShowContactDropdown(true)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
              />

              {showContactDropdown && (
                <div className="absolute z-50 w-96 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedContact(c)
                          setShowContactDropdown(false)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                      >
                        {c.first_name} {c.last_name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No contacts found</div>
                  )}
                </div>
              )}

              {selectedContact && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {selectedContact.first_name} {selectedContact.last_name}
                    </span>
                    <button
                      onClick={() => setSelectedContact(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-4" data-company-dropdown>
          {searchMode === 'company' && (
            <div>
              <input
                type="text"
                placeholder="Type company name..."
                onFocus={() => {
                  setShowCompanyDropdown(true)
                  setFilteredCompanies(companies)
                }}
                onChange={e => {
                  setFilteredCompanies(fuzzySearch(companies, e.target.value, ['company_name']))
                  setShowCompanyDropdown(true)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
              />

              {showCompanyDropdown && (
                <div className="absolute z-50 w-96 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCompany(c)
                          setShowCompanyDropdown(false)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                      >
                        {c.company_name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No companies found</div>
                  )}
                </div>
              )}

              {selectedCompany && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{selectedCompany.company_name}</span>
                    <button
                      onClick={() => setSelectedCompany(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {searchMode === 'address' && (
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by street, city, or postcode..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  setShowResults(true)
                }}
                onFocus={() => {
                  setShowResults(true)
                  if (searchTerm) performSearch()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}

        {/* Search Results */}
        {(selectedContact || selectedCompany || searchMode === 'address') && (
          <div data-search-results>
            {searching ? (
              <div className="p-3 text-center text-gray-500 text-sm">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  {searchResults.length} site(s) found
                </p>
                {searchResults.map(site => (
                  <button
                    key={site.id}
                    onClick={() => handleSiteSelected(site)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-[#0066CC] transition-colors text-sm"
                  >
                    <p className="font-medium text-gray-900">
                      {site.address_line_1}
                      {site.address_line_2 ? `, ${site.address_line_2}` : ''}
                    </p>
                    <p className="text-xs text-gray-600">
                      {site.city} {site.postcode}
                    </p>
                    {(site.company_name || site.client_name) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {site.company_name && <span>Coy: {site.company_name} • </span>}
                        {site.client_name && <span>Contact: {site.client_name}</span>}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : searchTerm || selectedContact || selectedCompany ? (
              <div className="p-3 text-center text-gray-500 text-sm mb-4">No sites found</div>
            ) : null}
          </div>
        )}

        {/* Create New Site Button - Hidden when hideCreateButton is true */}
        {!hideCreateButton && (
          <>
            {(searchMode === 'address' || (!selectedContact && !selectedCompany)) && (
              <button
                onClick={() => setCreateMode('standalone')}
                className="w-full px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] font-medium text-sm"
              >
                + Create New Site
              </button>
            )}

            {selectedContact && (
              <button
                onClick={() => setCreateMode('from-contact')}
                className="w-full px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] font-medium text-sm mt-2"
              >
                + Add New Site for {selectedContact.first_name}
              </button>
            )}

            {selectedCompany && (
              <button
                onClick={() => setCreateMode('from-company')}
                className="w-full px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] font-medium text-sm mt-2"
              >
                + Add New Site for {selectedCompany.company_name}
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  // RENDER CREATE MODE - WITH AUTO-POPULATED FIELDS
  const isFromContact = createMode === 'from-contact'
  const isFromCompany = createMode === 'from-company'

  return (
    <div className="w-full bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Create New Site</h2>
        <button
          onClick={() => setCreateMode(null)}
          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Contact - Auto-filled or Read-only if from-contact */}
        {isFromContact && selectedContact && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-gray-900">
                {selectedContact.first_name} {selectedContact.last_name}
              </p>
            </div>
          </div>
        )}

        {/* Company - Auto-filled or Read-only if from-company */}
        {isFromCompany && selectedCompany && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-gray-900">{selectedCompany.company_name}</p>
            </div>
          </div>
        )}

        {/* If from-contact, also show company */}
        {isFromContact && selectedContact?.company_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-gray-900">
                {companies.find(c => c.id === selectedContact.company_id)?.company_name}
              </p>
            </div>
          </div>
        )}

        {/* Site Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={siteForm.address_line_1}
            onChange={e => setSiteForm(prev => ({ ...prev, address_line_1: e.target.value }))}
            placeholder="123 Main Street"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
          <input
            type="text"
            value={siteForm.address_line_2}
            onChange={e => setSiteForm(prev => ({ ...prev, address_line_2: e.target.value }))}
            placeholder="Apt, suite, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={siteForm.city}
              onChange={e => setSiteForm(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Auckland"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
            <select
              value={siteForm.region_id}
              onChange={e => setSiteForm(prev => ({ ...prev, region_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
            >
              <option value="">Select region</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postcode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={siteForm.postcode}
              onChange={e => setSiteForm(prev => ({ ...prev, postcode: e.target.value }))}
              placeholder="1010"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            value={siteForm.property_type}
            onChange={e => setSiteForm(prev => ({ ...prev, property_type: e.target.value }))}
            placeholder="e.g., Residential"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            value={siteForm.notes}
            onChange={e => setSiteForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
            placeholder="Additional notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <button
            onClick={() => setCreateMode(null)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
          >
            Back
          </button>
          <button
            onClick={handleSaveNewSite}
            disabled={saving}
            className="px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] disabled:opacity-50 font-medium text-sm"
          >
            {saving ? 'Saving...' : 'Save Site'}
          </button>
        </div>
      </div>

      {/* Drawer for creating contact/company */}
      <ConsolidatedAddClientDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}