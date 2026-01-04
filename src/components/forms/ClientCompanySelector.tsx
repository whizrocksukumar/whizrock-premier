'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, X, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import AddNewContactDrawer from './AddNewContactDrawer'
import AddNewCompanyDrawer from './AddNewCompanyDrawer'
import AddCompanyWithContactDrawer from './AddCompanyWithContactDrawer'

interface ClientCompanySelectorProps {
  onClientSelected: (client: SelectedClient | null) => void
  excludeDrawers?: boolean // Set true if using drawers elsewhere
}

interface SelectedClient {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company_id: string | null
  // Option B: Company details included
  company_name?: string | null
  company_phone?: string | null
  company_email?: string | null
  company_industry?: string | null
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company_id: string | null
  companies?: {
    company_name?: string
    phone?: string | null
    email?: string | null
    industry?: string | null
  } | null
}

interface Company {
  id: string
  company_name: string
  phone: string | null
  email: string | null
  industry: string | null
}

type SearchMode = 'contact' | 'company'
type DrawerType = 'contact' | 'company' | 'company-with-contact' | null

const EMPTY_SELECTED: SelectedClient | null = null

export default function ClientCompanySelector({ onClientSelected, excludeDrawers = false }: ClientCompanySelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Search mode and state
  const [searchMode, setSearchMode] = useState<SearchMode>('contact')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  // Contact search results
  const [contacts, setContacts] = useState<Contact[]>([])

  // Company search results
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companyContacts, setCompanyContacts] = useState<Contact[]>([])
  const [loadingCompanyContacts, setLoadingCompanyContacts] = useState(false)

  // Drawer states
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null)

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check if returning from drawer with new contact/company
  useEffect(() => {
    const newContactId = searchParams.get('newContactId')
    const newCompanyId = searchParams.get('newCompanyId')

    if (newContactId) {
      fetchAndSelectContact(newContactId)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (newCompanyId) {
      fetchAndSelectCompany(newCompanyId)
      window.history.replaceState({}, '', window.location.pathname)
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

  // Fuzzy search when search term changes
  useEffect(() => {
    if (searchTerm.length > 0) {
      if (searchMode === 'contact') {
        searchContacts(searchTerm)
      } else {
        searchCompanies(searchTerm)
      }
    } else {
      setContacts([])
      setCompanies([])
      setSelectedCompany(null)
      setCompanyContacts([])
      setShowDropdown(false)
    }
  }, [searchTerm, searchMode])

  // ============================================================================
  // CONTACT MODE FUNCTIONS
  // ============================================================================

  async function searchContacts(term: string) {
    try {
      setLoading(true)
      const searchLower = term.toLowerCase()

      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          company_id,
          companies (company_name, phone, email, industry)
        `)
        .or(
          `first_name.ilike.%${searchLower}%,` +
          `last_name.ilike.%${searchLower}%,` +
          `email.ilike.%${searchLower}%,` +
          `phone.ilike.%${searchLower}%`
        )
        .limit(10)

      if (error) throw error

      setContacts((data || []) as Contact[])
      setShowDropdown(true)
    } catch (err) {
      console.error('Error searching contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAndSelectContact(contactId: string) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          company_id,
          companies (company_name, phone, email, industry)
        `)
        .eq('id', contactId)
        .single()

      if (error) throw error

      const selectedContact = buildSelectedClient(data as Contact)
      setSelectedClient(selectedContact)
      onClientSelected(selectedContact)
      setSearchTerm('')
    } catch (err) {
      console.error('Error fetching contact:', err)
    }
  }

  function handleSelectContact(contact: Contact) {
    const selectedContact = buildSelectedClient(contact)
    setSelectedClient(selectedContact)
    onClientSelected(selectedContact)
    setSearchTerm('')
    setShowDropdown(false)
  }

  // ============================================================================
  // COMPANY MODE FUNCTIONS
  // ============================================================================

  async function searchCompanies(term: string) {
    try {
      setLoading(true)
      const searchLower = term.toLowerCase()

      const { data, error } = await supabase
        .from('companies')
        .select('id, company_name, phone, email, industry')
        .or(
          `company_name.ilike.%${searchLower}%,` +
          `industry.ilike.%${searchLower}%,` +
          `email.ilike.%${searchLower}%,` +
          `phone.ilike.%${searchLower}%`
        )
        .limit(10)

      if (error) throw error

      setCompanies((data || []) as Company[])
      setShowDropdown(true)
    } catch (err) {
      console.error('Error searching companies:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectCompany(company: Company) {
    setSelectedCompany(company)
    setShowDropdown(false)
    setSearchTerm('')

    // Fetch contacts for this company
    await fetchCompanyContacts(company.id)
  }

  async function fetchCompanyContacts(companyId: string) {
    try {
      setLoadingCompanyContacts(true)

      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          company_id,
          companies (company_name, phone, email, industry)
        `)
        .eq('company_id', companyId)
        .order('first_name')

      if (error) throw error

      setCompanyContacts((data || []) as Contact[])
    } catch (err) {
      console.error('Error fetching company contacts:', err)
    } finally {
      setLoadingCompanyContacts(false)
    }
  }

  async function fetchAndSelectCompany(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, company_name, phone, email, industry')
        .eq('id', companyId)
        .single()

      if (error) throw error

      const company = data as Company
      setSelectedCompany(company)
      await fetchCompanyContacts(company.id)
    } catch (err) {
      console.error('Error fetching company:', err)
    }
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  function buildSelectedClient(contact: Contact): SelectedClient {
    return {
      id: contact.id,
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || null,
      phone: contact.phone || null,
      company_id: contact.company_id || null,
      // Option B: Include company details
      company_name: contact.companies?.company_name || null,
      company_phone: contact.companies?.phone || null,
      company_email: contact.companies?.email || null,
      company_industry: contact.companies?.industry || null,
    }
  }

  function handleClearSelection() {
    setSelectedClient(null)
    setSearchTerm('')
    setSelectedCompany(null)
    setCompanyContacts([])
    setShowDropdown(false)
    onClientSelected(null)
  }

  function getDisplayName(contact: Contact): string {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
  }

  function getCompanyDisplayName(contact: Contact): string {
    return contact.companies?.company_name || '—'
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // Selected Client View
  if (selectedClient) {
    return (
      <>
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {selectedClient.first_name} {selectedClient.last_name}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {selectedClient.company_name || '—'} | {selectedClient.phone || '—'} | {selectedClient.email || '—'}
            </p>
          </div>
          <button
            onClick={handleClearSelection}
            className="p-1 hover:bg-blue-100 rounded ml-2"
            title="Clear selection"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Drawers */}
        {!excludeDrawers && (
          <>
            <AddNewContactDrawer isOpen={activeDrawer === 'contact'} onClose={() => setActiveDrawer(null)} />
            <AddNewCompanyDrawer isOpen={activeDrawer === 'company'} onClose={() => setActiveDrawer(null)} />
            <AddCompanyWithContactDrawer isOpen={activeDrawer === 'company-with-contact'} onClose={() => setActiveDrawer(null)} />
          </>
        )}
      </>
    )
  }

  // Search View
  return (
    <>
      <div className="space-y-3">
        {/* Radio Button Toggle */}
        <div className="flex gap-4 px-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={searchMode === 'contact'}
              onChange={() => {
                setSearchMode('contact')
                setSearchTerm('')
              }}
              className="w-4 h-4 text-[#0066CC]"
            />
            <span className="text-sm font-medium text-gray-700">Search by Contact</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={searchMode === 'company'}
              onChange={() => {
                setSearchMode('company')
                setSearchTerm('')
              }}
              className="w-4 h-4 text-[#0066CC]"
            />
            <span className="text-sm font-medium text-gray-700">Search by Company</span>
          </label>
        </div>

        {/* Search Input */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchMode === 'contact' ? 'Search by name, email, or phone...' : 'Search by company name, industry...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => (searchTerm || selectedCompany) && setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>

          {/* CONTACT MODE RESULTS */}
          {searchMode === 'contact' && showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500 text-sm">Searching contacts...</div>
              ) : contacts.length === 0 && searchTerm ? (
                <div className="p-3 text-center">
                  <p className="text-gray-600 text-sm mb-2">No contacts found matching "{searchTerm}"</p>
                  <button
                    onClick={() => setActiveDrawer('contact')}
                    className="flex items-center justify-center gap-1 w-full px-3 py-2 text-[#0066CC] hover:bg-blue-50 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Contact
                  </button>
                </div>
              ) : (
                <>
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{getDisplayName(contact)}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {getCompanyDisplayName(contact)} | {contact.phone || '—'} | {contact.email || '—'}
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 p-2">
                    <button
                      onClick={() => setActiveDrawer('contact')}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 text-[#0066CC] hover:bg-blue-50 text-sm font-medium rounded"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Contact
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* COMPANY MODE: COMPANY SEARCH RESULTS */}
          {searchMode === 'company' && showDropdown && !selectedCompany && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500 text-sm">Searching companies...</div>
              ) : companies.length === 0 && searchTerm ? (
                <div className="p-3 text-center">
                  <p className="text-gray-600 text-sm mb-2">No companies found matching "{searchTerm}"</p>
                  <button
                    onClick={() => setActiveDrawer('company-with-contact')}
                    className="flex items-center justify-center gap-1 w-full px-3 py-2 text-[#0066CC] hover:bg-blue-50 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Company
                  </button>
                </div>
              ) : (
                <>
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{company.company_name}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {company.industry || '—'} | {company.phone || '—'} | {company.email || '—'}
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 p-2">
                    <button
                      onClick={() => setActiveDrawer('company-with-contact')}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 text-[#0066CC] hover:bg-blue-50 text-sm font-medium rounded"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Company
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* COMPANY MODE: SHOW SELECTED COMPANY & ITS CONTACTS */}
          {searchMode === 'company' && selectedCompany && (
            <div className="mt-3 space-y-3">
              {/* Selected Company Display */}
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedCompany.company_name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {selectedCompany.industry || '—'} | {selectedCompany.phone || '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCompany(null)
                      setCompanyContacts([])
                      setSearchTerm('')
                    }}
                    className="p-1 hover:bg-orange-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Contacts List */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Select Contact</p>

                {loadingCompanyContacts ? (
                  <div className="p-3 text-center text-gray-500 text-sm">Loading contacts...</div>
                ) : companyContacts.length === 0 ? (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-2">No contacts linked to this company</p>
                    <button
                      onClick={() => setActiveDrawer('contact')}
                      className="flex items-center justify-center gap-1 w-full px-3 py-2 text-[#0066CC] hover:bg-blue-50 text-sm font-medium rounded"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Contact
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {companyContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className="w-full text-left p-2 hover:bg-gray-50 border border-gray-200 rounded transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 flex items-center justify-between">
                          <span>{getDisplayName(contact)}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {contact.phone || '—'} | {contact.email || '—'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      {!excludeDrawers && (
        <>
          <AddNewContactDrawer
            isOpen={activeDrawer === 'contact'}
            onClose={() => setActiveDrawer(null)}
            suggestedCompanyId={selectedCompany?.id}
          />
          <AddNewCompanyDrawer isOpen={activeDrawer === 'company'} onClose={() => setActiveDrawer(null)} />
          <AddCompanyWithContactDrawer
            isOpen={activeDrawer === 'company-with-contact'}
            onClose={() => setActiveDrawer(null)}
          />
        </>
      )}
    </>
  )
}
