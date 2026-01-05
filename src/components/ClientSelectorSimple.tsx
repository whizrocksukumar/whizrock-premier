'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, X } from 'lucide-react'

type SearchMode = 'contact' | 'company' | 'address'

interface ClientSelectorSimpleProps {
  onClientSelected: (client: any) => void
  onClear?: () => void
  placeholder?: string
  label?: string
}

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_id: string | null
  address_line_1?: string | null
  city?: string | null
  postcode?: string | null
  region_id?: string | null
  companies?: {
    company_name: string
  } | null
  regions?: {
    name: string
  } | null
}

interface Company {
  id: string
  company_name: string
}

/**
 * Simplified Client Selector without "Create New Client" button
 * Use this in embedded contexts (e.g., inside Create Site form) to avoid duplicate site creation
 */
export default function ClientSelectorSimple({
  onClientSelected,
  onClear,
  placeholder = "Search by name, email, phone, or company...",
  label = "Select Client"
}: ClientSelectorSimpleProps) {
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

  // Load all clients and companies
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
            address_line_1,
            city,
            postcode,
            region_id,
            companies (
              company_name
            ),
            regions (
              name
            )
          `)
          .order('first_name'),
        supabase.from('companies').select('id, company_name').order('company_name')
      ])

      if (clientsRes.data) setClients(clientsRes.data as Client[])
      if (companiesRes.data) setCompanies(companiesRes.data as Company[])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
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

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setSelectedCompany(null)
    setSearchTerm(`${client.first_name} ${client.last_name}`)
    setShowDropdown(false)
    onClientSelected(client)
  }

  const handleCompanySelect = async (company: Company) => {
    setSelectedCompany(company)
    setSelectedClient(null)
    setSearchTerm(company.company_name)
    setShowDropdown(false)

    // Fetch primary contact for this company
    const { data: primaryContact } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', company.id)
      .limit(1)
      .single()

    if (primaryContact) {
      onClientSelected(primaryContact)
    }
  }

  const handleClearSelection = () => {
    setSelectedClient(null)
    setSelectedCompany(null)
    setSearchTerm('')
    setShowDropdown(false)
    if (onClear) onClear()
  }

  const hasSelection = selectedClient || selectedCompany

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} *
      </label>

      {/* Search Modes */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setSearchMode('contact')}
          className={`px-3 py-1 text-xs rounded ${
            searchMode === 'contact'
              ? 'bg-[#0066CC] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Contact
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('company')}
          className={`px-3 py-1 text-xs rounded ${
            searchMode === 'company'
              ? 'bg-[#0066CC] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Company
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('address')}
          className={`px-3 py-1 text-xs rounded ${
            searchMode === 'address'
              ? 'bg-[#0066CC] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
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
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
        />
        {hasSelection && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected Client Display */}
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

      {/* Dropdown Results */}
      {showDropdown && searchTerm.trim() && (
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
                      <p className="text-sm font-medium text-gray-900">{company.company_name}</p>
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
  )
}
