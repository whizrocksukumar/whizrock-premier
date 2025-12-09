'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ClientSelectorProps {
  onClientSelected: (client: Client | null) => void
}

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_id: string | null
  companies?: { name: string }[] | null
}


export default function ClientSelector({ onClientSelected }: ClientSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check if returning from /customers/new with new client ID
  useEffect(() => {
    const newClientId = searchParams.get('newClientId')
    if (newClientId) {
      fetchClient(newClientId)
      // Clean up the URL
      window.history.replaceState({}, '', '/assessments/new')
    }
  }, [searchParams])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fuzzy search clients
  useEffect(() => {
    if (searchTerm.length > 0) {
      searchClients(searchTerm)
    } else {
      setClients([])
      setShowDropdown(false)
    }
  }, [searchTerm])

  async function fetchClient(clientId: string) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          phone,
          company_id,
          companies (name)
        `
        )
        .eq('id', clientId)
        .single()

      if (error) throw error

      const client = data as Client
      setSelectedClient(client)
      onClientSelected(client)
    } catch (err) {
      console.error('Error fetching client:', err)
    }
  }

async function searchClients(term: string) {
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
        companies (name)
      `)
      .or(
        `first_name.ilike.%${searchLower}%,` +
        `last_name.ilike.%${searchLower}%,` +
        `email.ilike.%${searchLower}%,` +
        `phone.ilike.%${searchLower}%`
      )
      .limit(10)

   if (error) throw error

const typedData: Client[] = (data || []).map((c: any) => ({
  id: String(c.id),
  first_name: String(c.first_name ?? ''),
  last_name: String(c.last_name ?? ''),
  email: String(c.email ?? ''),
  phone: String(c.phone ?? ''),
  company_id: c.company_id ?? null,
  companies: (c.companies || []).map((co: any) => ({
    name: String(co.name ?? ''),
  })),
}))

setClients(typedData)
setShowDropdown(true)


  } catch (err) {
    console.error('Error searching clients:', err)
  } finally {
    setLoading(false)
  }
}


  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setSearchTerm('')
    setShowDropdown(false)
    onClientSelected(client)
  }

  const handleClearSelection = () => {
    setSelectedClient(null)
    setSearchTerm('')
    setShowDropdown(false)
    onClientSelected(null)
  }

  const handleCreateNewClient = () => {
    router.push('/customers/new?redirectTo=assessments/new')
  }

  const getCompanyName = (client: Client) => {
  if (client.companies && client.companies.length > 0) {
    return client.companies[0].name || '—'
  }
  return '—'
}

  return (
    <div className="space-y-2">
      {selectedClient ? (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedClient.first_name} {selectedClient.last_name}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {getCompanyName(selectedClient)} | {selectedClient.phone} | {selectedClient.email}
            </p>
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
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search clients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm && setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  Searching clients...
                </div>
              ) : clients.length === 0 && searchTerm ? (
                <div className="p-3 text-center">
                  <p className="text-gray-600 text-sm mb-2">
                    No clients found matching "{searchTerm}"
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
                  {clients.map((client) => (
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
