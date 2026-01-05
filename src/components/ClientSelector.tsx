'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import ConsolidatedAddClientDrawer from '@/components/forms/ConsolidatedAddClientDrawer'

type SearchMode = 'contact' | 'company' | 'address'

interface ClientSelectorProps {
  onClientSelected: (client: any) => void
  onClear?: () => void
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

export default function ClientSelector({ onClientSelected, onClear }: ClientSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

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

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Check if returning from /clients/new with new client ID
  useEffect(() => {
    const newClientId = searchParams.get('newClientId')
    const newContactId = searchParams.get('newContactId')
    if (newClientId || newContactId) {
      fetchClient(newClientId || newContactId!)
      // Clean up the URL
      const currentPath = window.location.pathname
      window.history.replaceState({}, '', currentPath)
    }
  }, [searchParams])

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
  const fuzzySearch = (items: any[], term: string, fields: string[]): any[] => {
    if (!term) return items
    const lowerTerm = term.toLowerCase()
    return items.filter(item =>
      fields.some(field => {
        const value = field.includes('.')
          ? field.split('.').reduce((obj, key) => obj?.[key], item)
          : item[field]
        return value?.toString().toLowerCase().includes(lowerTerm)
      })
    )
  }

  async function loadAllData() {
    try {
      setLoading(true)
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
            companies (company_name),
            regions (name)
          `)
          .order('last_name'),
        supabase
          .from('companies')
          .select('id, company_name')
          .order('company_name')
      ])

      if (clientsRes.data) {
        const typedData: Client[] = clientsRes.data.map((c: any) => ({
          id: String(c.id),
          first_name: String(c.first_name ?? ''),
          last_name: String(c.last_name ?? ''),
          email: String(c.email ?? ''),
          phone: String(c.phone ?? ''),
          company_id: c.company_id ?? null,
          address_line_1: c.address_line_1 ?? null,
          city: c.city ?? null,
          postcode: c.postcode ?? null,
          region_id: c.region_id ?? null,
          companies: c.companies ? { company_name: c.companies.company_name } : null,
          regions: c.regions ? { name: c.regions.name } : null,
        }))
        setClients(typedData)
        setFilteredClients(typedData)
      }

      if (companiesRes.data) {
        setCompanies(companiesRes.data as Company[])
        setFilteredCompanies(companiesRes.data as Company[])
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchClient(clientId: string) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          companies (company_name),
          regions (name)
        `)
        .eq('id', clientId)
        .single()

      if (error) throw error
      setSelectedClient(data)
      onClientSelected(data)
    } catch (err) {
      console.error('Error fetching client:', err)
    }
  }

  // Handle search input change
  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setShowDropdown(true)

    if (searchMode === 'contact') {
      const filtered = fuzzySearch(clients, term, [
        'first_name',
        'last_name',
        'email',
        'phone',
        'companies.company_name'
      ])
      setFilteredClients(filtered)
    } else if (searchMode === 'company') {
      const filtered = fuzzySearch(companies, term, ['company_name'])
      setFilteredCompanies(filtered)
    } else if (searchMode === 'address') {
      const filtered = fuzzySearch(clients, term, [
        'address_line_1',
        'city',
        'postcode'
      ])
      setFilteredClients(filtered)
    }
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setSelectedCompany(null)
    setSearchTerm('')
    setShowDropdown(false)
    onClientSelected(client)
  }

  const handleCompanySelect = (company: Company) => {
    // When selecting by company, find the first client from that company
    const clientFromCompany = clients.find(c => c.company_id === company.id)

    if (clientFromCompany) {
      setSelectedClient(clientFromCompany)
      setSelectedCompany(company)
      setSearchTerm('')
      setShowDropdown(false)
      onClientSelected(clientFromCompany)
    }
  }

  const handleClearSelection = () => {
    setSelectedClient(null)
    setSelectedCompany(null)
    setSearchTerm('')
    setShowDropdown(false)
    if (onClear) onClear()
    onClientSelected(null)
  }

  const handleCreateNewClient = () => {
    setDrawerOpen(true)
    setShowDropdown(false)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    // Reload clients data after closing drawer
    loadAllData()
  }

  const getCompanyName = (client: Client) => {
    return client.companies?.company_name || '—'
  }

  return (
    <>
      <div className="space-y-3">
        {selectedClient ? (
        // Selected Client Display
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedClient.first_name} {selectedClient.last_name}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {getCompanyName(selectedClient)} | {selectedClient.phone} | {selectedClient.email}
            </p>
            {selectedClient.address_line_1 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedClient.address_line_1}, {selectedClient.city} {selectedClient.postcode}
              </p>
            )}
          </div>
          <button
            onClick={handleClearSelection}
            className="p-1 hover:bg-blue-100 rounded"
            title="Clear selection"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ) : (
        <>
          {/* Search Mode Radio Buttons */}
          <div className="flex items-center gap-6 pb-3 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Search by:</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={searchMode === 'contact'}
                  onChange={() => {
                    setSearchMode('contact')
                    setSearchTerm('')
                    setShowDropdown(false)
                  }}
                  className="w-4 h-4 text-[#0066CC]"
                />
                <span className="text-sm text-gray-700">Contact</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={searchMode === 'company'}
                  onChange={() => {
                    setSearchMode('company')
                    setSearchTerm('')
                    setShowDropdown(false)
                  }}
                  className="w-4 h-4 text-[#0066CC]"
                />
                <span className="text-sm text-gray-700">Company</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={searchMode === 'address'}
                  onChange={() => {
                    setSearchMode('address')
                    setSearchTerm('')
                    setShowDropdown(false)
                  }}
                  className="w-4 h-4 text-[#0066CC]"
                />
                <span className="text-sm text-gray-700">Address</span>
              </label>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={
                  searchMode === 'contact'
                    ? 'Search by name, email, phone, or company...'
                    : searchMode === 'company'
                    ? 'Search by company name...'
                    : 'Search by address, city, or postcode...'
                }
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  setShowDropdown(true)
                  if (!searchTerm) {
                    if (searchMode === 'contact') setFilteredClients(clients)
                    if (searchMode === 'company') setFilteredCompanies(companies)
                    if (searchMode === 'address') setFilteredClients(clients)
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC] text-sm"
              />
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    Loading...
                  </div>
                ) : searchMode === 'contact' || searchMode === 'address' ? (
                  <>
                    {filteredClients.length === 0 ? (
                      <div className="p-3 text-center">
                        <p className="text-gray-600 text-sm mb-2">
                          No clients found
                        </p>
                        <button
                          onClick={handleCreateNewClient}
                          className="flex items-center justify-center gap-1 w-full px-3 py-2 text-[#0066CC] hover:bg-blue-50 text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Create New Client
                        </button>
                      </div>
                    ) : (
                      <>
                        {filteredClients.slice(0, 10).map(client => (
                          <button
                            key={client.id}
                            onClick={() => handleClientSelect(client)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {client.first_name} {client.last_name}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {getCompanyName(client)} | {client.phone} | {client.email}
                            </div>
                            {searchMode === 'address' && client.address_line_1 && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {client.address_line_1}, {client.city} {client.postcode}
                              </div>
                            )}
                          </button>
                        ))}
                        <div className="border-t border-gray-100 p-2">
                          <button
                            onClick={handleCreateNewClient}
                            className="w-full flex items-center justify-center gap-1 px-3 py-2 text-[#0066CC] hover:bg-blue-50 text-sm font-medium rounded"
                          >
                            <Plus className="w-4 h-4" />
                            Create New Client
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  // Company mode
                  <>
                    {filteredCompanies.length === 0 ? (
                      <div className="p-3 text-center">
                        <p className="text-gray-600 text-sm mb-2">
                          No companies found
                        </p>
                      </div>
                    ) : (
                      <>
                        {filteredCompanies.slice(0, 10).map(company => (
                          <button
                            key={company.id}
                            onClick={() => handleCompanySelect(company)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {company.company_name}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {clients.filter(c => c.company_id === company.id).length} contact(s)
                            </div>
                          </button>
                        ))}
                        <div className="border-t border-gray-100 p-2">
                          <button
                            onClick={handleCreateNewClient}
                            className="w-full flex items-center justify-center gap-1 px-3 py-2 text-[#0066CC] hover:bg-blue-50 text-sm font-medium rounded"
                          >
                            <Plus className="w-4 h-4" />
                            Create New Client
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
        )}
      </div>

      {/* Add Client Drawer */}
      <ConsolidatedAddClientDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
      />
    </>
  )
}
