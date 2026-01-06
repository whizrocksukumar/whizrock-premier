'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, X, MapPin, Plus, Building2, User, MapPinned } from 'lucide-react'

type SearchMode = 'contact' | 'company' | 'address'

interface ClientSelectorWithSitesProps {
  onClientAndSiteSelected: (client: any, site: any | null) => void
  onClear?: () => void
}

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_id: string | null
  sales_rep_id: string | null
  address_line_1?: string | null
  city?: string | null
  postcode?: string | null
  region_id?: string | null
  companies?: {
    id: string
    company_name: string
  } | null
}

interface Site {
  id: string
  client_id: string | null
  company_id: string | null
  address_line_1: string
  address_line_2: string | null
  city: string
  postcode: string
  region_id: string | null
  property_type: string | null
  regions?: {
    name: string
  } | null
}

interface Company {
  id: string
  company_name: string
  sales_rep_id?: string | null
}

export default function ClientSelectorWithSites({
  onClientAndSiteSelected,
  onClear
}: ClientSelectorWithSitesProps) {
  // Search mode
  const [searchMode, setSearchMode] = useState<SearchMode>('contact')
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  // Results
  const [clients, setClients] = useState<Client[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])

  // Selected state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [clientSites, setClientSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [showSiteSelector, setShowSiteSelector] = useState(false)

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
          setShowDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load all data on mount
  useEffect(() => {
    loadAllData()
  }, [])

  // Fuzzy search helper
  const fuzzyMatch = (searchText: string, targetText: string): boolean => {
    if (!targetText) return false
    const search = searchText.toLowerCase().replace(/\s+/g, '')
    const target = targetText.toLowerCase().replace(/\s+/g, '')
    return target.includes(search)
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [clientsRes, companiesRes] = await Promise.all([
        supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            company_id,
            sales_rep_id,
            address_line_1,
            city,
            postcode,
            region_id,
            companies (
              id,
              company_name
            )
          `)
          .order('first_name'),
        supabase
          .from('companies')
          .select('id, company_name, sales_rep_id')
          .order('company_name')
      ])

      if (clientsRes.data) setClients(clientsRes.data as Client[])
      if (companiesRes.data) setCompanies(companiesRes.data as Company[])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load sites for selected client or company
  const loadSites = async (clientId: string | null, companyId: string | null) => {
    let query = supabase
      .from('sites')
      .select(`
        id,
        client_id,
        company_id,
        address_line_1,
        address_line_2,
        city,
        postcode,
        region_id,
        property_type,
        regions (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (clientId && companyId) {
      // Client with company - get sites for both
      query = query.or(`client_id.eq.${clientId},company_id.eq.${companyId}`)
    } else if (clientId) {
      query = query.eq('client_id', clientId)
    } else if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data } = await query

    if (data) {
      setClientSites(data as Site[])
      setShowSiteSelector(true)
    }
  }

  // Filter results based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients([])
      setFilteredCompanies([])
      return
    }

    const term = searchTerm.toLowerCase().trim()

    if (searchMode === 'contact') {
      const filtered = clients.filter((client) => {
        const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
        const email = (client.email || '').toLowerCase()
        const phone = (client.phone || '').toLowerCase()
        const companyName = client.companies?.company_name?.toLowerCase() || ''

        return (
          fuzzyMatch(term, fullName) ||
          fuzzyMatch(term, email) ||
          fuzzyMatch(term, phone) ||
          fuzzyMatch(term, companyName)
        )
      })
      setFilteredClients(filtered.slice(0, 10))
      setFilteredCompanies([])
    } else if (searchMode === 'company') {
      const filtered = companies.filter((company) =>
        fuzzyMatch(term, company.company_name)
      )
      setFilteredCompanies(filtered.slice(0, 10))
      setFilteredClients([])
    } else if (searchMode === 'address') {
      const filtered = clients.filter((client) => {
        const address = (client.address_line_1 || '').toLowerCase()
        const city = (client.city || '').toLowerCase()
        const postcode = (client.postcode || '').toLowerCase()

        return (
          fuzzyMatch(term, address) ||
          fuzzyMatch(term, city) ||
          fuzzyMatch(term, postcode)
        )
      })
      setFilteredClients(filtered.slice(0, 10))
      setFilteredCompanies([])
    }
  }, [searchTerm, searchMode, clients, companies])

  const handleClientSelect = async (client: Client) => {
    setSelectedClient(client)
    setSelectedCompany(null)
    setSearchTerm(`${client.first_name} ${client.last_name}`)
    setShowDropdown(false)

    // Load client's sites (and company sites if applicable)
    await loadSites(client.id, client.company_id)
  }

  const handleCompanySelect = async (company: Company) => {
    setSelectedCompany(company)
    setSelectedClient(null)
    setSearchTerm(company.company_name)
    setShowDropdown(false)

    // Load company's sites
    await loadSites(null, company.id)

    // Create a pseudo-client object for the callback with company info
    const companyAsClient = {
      id: null,
      company_id: company.id,
      company_name: company.company_name,
      sales_rep_id: company.sales_rep_id,
      first_name: '',
      last_name: '',
      email: '',
      phone: ''
    }
    
    // Don't call callback yet - wait for site selection
  }

  const handleSiteSelect = (site: Site) => {
    setSelectedSite(site)
    setShowSiteSelector(false)
    
    // Prepare client data for callback
    const clientData = selectedClient || {
      id: null,
      company_id: selectedCompany?.id,
      company_name: selectedCompany?.company_name,
      sales_rep_id: selectedCompany?.sales_rep_id,
      first_name: '',
      last_name: '',
      email: '',
      phone: ''
    }
    
    onClientAndSiteSelected(clientData, site)
  }

  const handleCreateNewSite = () => {
    setSelectedSite(null)
    setShowSiteSelector(false)
    
    // Prepare client data for callback
    const clientData = selectedClient || {
      id: null,
      company_id: selectedCompany?.id,
      company_name: selectedCompany?.company_name,
      sales_rep_id: selectedCompany?.sales_rep_id,
      first_name: '',
      last_name: '',
      email: '',
      phone: ''
    }
    
    onClientAndSiteSelected(clientData, null) // null site = create new
  }

  const handleClearSelection = () => {
    setSelectedClient(null)
    setSelectedCompany(null)
    setSelectedSite(null)
    setClientSites([])
    setSearchTerm('')
    setShowDropdown(false)
    setShowSiteSelector(false)
    if (onClear) onClear()
  }

  const hasClientSelection = selectedClient || selectedCompany

  return (
    <div className="space-y-4">
      {/* Client Search */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Client *
        </label>

        {/* Search Mode Tabs */}
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => {
              setSearchMode('contact')
              setSearchTerm('')
              setShowDropdown(false)
            }}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-colors ${
              searchMode === 'contact'
                ? 'bg-[#0066CC] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="w-3 h-3" />
            Contact
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchMode('company')
              setSearchTerm('')
              setShowDropdown(false)
            }}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-colors ${
              searchMode === 'company'
                ? 'bg-[#0066CC] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building2 className="w-3 h-3" />
            Company
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchMode('address')
              setSearchTerm('')
              setShowDropdown(false)
            }}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-colors ${
              searchMode === 'address'
                ? 'bg-[#0066CC] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPinned className="w-3 h-3" />
            Address
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
              setShowSiteSelector(false)
            }}
            onFocus={() => {
              if (!hasClientSelection) setShowDropdown(true)
            }}
            placeholder={
              searchMode === 'contact' ? "Search by name, email, phone..." :
              searchMode === 'company' ? "Search by company name..." :
              "Search by address, city, postcode..."
            }
            disabled={!!hasClientSelection}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent disabled:bg-gray-100"
          />
          {hasClientSelection && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Client/Company Display */}
        {selectedClient && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-gray-900">
              {selectedClient.first_name} {selectedClient.last_name}
            </p>
            {selectedClient.companies?.company_name && (
              <p className="text-xs text-gray-600">{selectedClient.companies.company_name}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {selectedClient.email} | {selectedClient.phone}
            </p>
          </div>
        )}

        {selectedCompany && !selectedClient && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-600" />
              <p className="text-sm font-medium text-gray-900">
                {selectedCompany.company_name}
              </p>
            </div>
          </div>
        )}

        {/* Dropdown Results */}
        {showDropdown && searchTerm.trim() && !hasClientSelection && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : (
              <>
                {/* Contact Results */}
                {searchMode === 'contact' && filteredClients.length > 0 && (
                  <div>
                    <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-700">
                      CONTACTS ({filteredClients.length})
                    </div>
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientSelect(client)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {client.first_name} {client.last_name}
                        </p>
                        {client.companies?.company_name && (
                          <p className="text-xs text-gray-600">{client.companies.company_name}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {client.email} | {client.phone}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Company Results */}
                {searchMode === 'company' && filteredCompanies.length > 0 && (
                  <div>
                    <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-700">
                      COMPANIES ({filteredCompanies.length})
                    </div>
                    {filteredCompanies.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => handleCompanySelect(company)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900">{company.company_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Address Results */}
                {searchMode === 'address' && filteredClients.length > 0 && (
                  <div>
                    <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-700">
                      BY ADDRESS ({filteredClients.length})
                    </div>
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientSelect(client)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {client.address_line_1}, {client.city} {client.postcode}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {filteredClients.length === 0 && filteredCompanies.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No results found. Try a different search term.
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Site Selector (shows after client/company selected) */}
      {hasClientSelection && showSiteSelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Site Address *
          </label>

          {clientSites.length > 0 ? (
            <select
              onChange={(e) => {
                const value = e.target.value
                if (value === '__create_new__') {
                  handleCreateNewSite()
                } else {
                  const site = clientSites.find(s => s.id === value)
                  if (site) handleSiteSelect(site)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
              defaultValue=""
            >
              <option value="" disabled>Select existing site or create new...</option>
              {clientSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.address_line_1}, {site.city} {site.postcode}
                </option>
              ))}
              <option value="__create_new__">+ Create New Site</option>
            </select>
          ) : (
            <button
              type="button"
              onClick={handleCreateNewSite}
              className="w-full flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-gray-300 rounded hover:border-[#0066CC] hover:bg-blue-50 text-[#0066CC] font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Site for {selectedClient?.first_name || selectedCompany?.company_name}
            </button>
          )}
        </div>
      )}

      {/* Selected Site Display */}
      {selectedSite && (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-xs font-semibold text-green-800 mb-1">SELECTED SITE:</p>
          <p className="text-sm font-medium text-gray-900">
            {selectedSite.address_line_1}
            {selectedSite.address_line_2 && `, ${selectedSite.address_line_2}`}
          </p>
          <p className="text-xs text-gray-600">
            {selectedSite.city}, {selectedSite.postcode}
          </p>
        </div>
      )}
    </div>
  )
}