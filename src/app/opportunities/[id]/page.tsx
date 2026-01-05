'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Edit, AlertCircle, Save, X } from 'lucide-react'
import ClientSelector from '@/components/ClientSelector'
import SiteSelector from '@/components/SiteSelector'

interface OpportunityDetail {
  id: string
  opp_number: string
  client_id: string | null
  contact_type: string | null
  client_type: string | null
  sales_rep_id: string | null
  site_address: string | null
  site_city: string | null
  site_postcode: string | null
  region_id: string | null
  stage: string
  sub_status: string | null
  estimated_value: number | null
  actual_value: number | null
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  is_active: boolean
  clients?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    company_name: string | null
  } | null
  sales_rep?: {
    id: string
    first_name: string
    last_name: string
  } | null
  regions?: {
    name: string
  } | null
}

const stageColors: Record<string, string> = {
  'NEW': 'bg-blue-100 text-blue-800',
  'QUALIFIED': 'bg-yellow-100 text-yellow-800',
  'QUOTED': 'bg-purple-100 text-purple-800',
  'WON': 'bg-green-100 text-green-800',
  'LOST': 'bg-red-100 text-red-800'
}

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<OpportunityDetail>>({})

  // Reference data
  const [salesRepsList, setSalesRepsList] = useState<Array<{id: string, name: string}>>([])
  const [regionsList, setRegionsList] = useState<Array<{id: string, name: string}>>([])

  useEffect(() => {
    fetchOpportunity()
    fetchSalesReps()
    fetchRegions()
  }, [params.id])

  const fetchOpportunity = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          clients (id, first_name, last_name, email, phone, company_name),
          sales_rep:sales_rep_id (id, first_name, last_name),
          regions (name)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setOpportunity(data as OpportunityDetail)
      setEditForm(data)
    } catch (err) {
      console.error('Error fetching opportunity:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesReps = async () => {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('id, name')
      .order('name')

    if (!error && data) {
      setSalesRepsList(data)
    }
  }

  const fetchRegions = async () => {
    const { data, error } = await supabase
      .from('regions')
      .select('id, name')
      .order('name')

    if (!error && data) {
      setRegionsList(data)
    }
  }

  const handleEditFormChange = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleEditMode = () => {
    if (editMode) {
      // Cancel - reset form
      setEditForm(opportunity || {})
    }
    setEditMode(!editMode)
  }

  const saveEdit = async () => {
    if (!opportunity) return

    setSavingEdit(true)
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({
          client_id: editForm.client_id,
          contact_type: editForm.contact_type,
          client_type: editForm.client_type,
          sales_rep_id: editForm.sales_rep_id,
          site_address: editForm.site_address,
          site_city: editForm.site_city,
          site_postcode: editForm.site_postcode,
          region_id: editForm.region_id,
          estimated_value: editForm.estimated_value,
          actual_value: editForm.actual_value,
          due_date: editForm.due_date,
          sub_status: editForm.sub_status,
          notes: editForm.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunity.id)

      if (error) throw error

      // Refresh opportunity with updated data
      await fetchOpportunity()
      setEditMode(false)
      alert('Changes saved successfully')
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Failed to save changes')
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Opportunity Not Found</h2>
          <Link href="/opportunities" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Opportunities
          </Link>
        </div>
      </div>
    )
  }

  const customerName = opportunity.clients
    ? `${opportunity.clients.first_name} ${opportunity.clients.last_name}`
    : 'Unknown'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/opportunities" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">{opportunity.opp_number}</h1>
              <p className="text-sm text-gray-500">{customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageColors[opportunity.stage] || 'bg-gray-100 text-gray-800'}`}>
              {opportunity.stage}
            </span>
            {editMode ? (
              <>
                <button
                  onClick={toggleEditMode}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-50"
                  disabled={savingEdit}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                  disabled={savingEdit}
                >
                  <Save className="w-4 h-4" />
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={toggleEditMode}
                className="px-4 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg flex items-center gap-2 text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h2>
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">Select Client</label>
                <ClientSelector
                  onClientSelected={(client) => {
                    if (client) {
                      handleEditFormChange('client_id', client.id)
                    }
                  }}
                  onClear={() => {
                    handleEditFormChange('client_id', null)
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Contact Type</label>
                <select
                  value={editForm.contact_type || ''}
                  onChange={(e) => handleEditFormChange('contact_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                >
                  <option value="">Select...</option>
                  <option value="New">New</option>
                  <option value="Existing">Existing</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Client Type</label>
                <select
                  value={editForm.client_type || ''}
                  onChange={(e) => handleEditFormChange('client_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                >
                  <option value="">Select...</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Government">Government</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {opportunity.clients ? (
                <>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-600">Contact Name:</span>
                    <span className="font-medium text-[#0066CC]">
                      {opportunity.clients.first_name} {opportunity.clients.last_name}
                    </span>
                  </div>
                  {opportunity.clients.company_name && (
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium">
                        {opportunity.clients.company_name}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-600">Email:</span>
                    <a href={`mailto:${opportunity.clients.email}`} className="font-medium text-[#0066CC] hover:underline">
                      {opportunity.clients.email || 'N/A'}
                    </a>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-600">Phone:</span>
                    <a href={`tel:${opportunity.clients.phone}`} className="font-medium text-[#0066CC] hover:underline">
                      {opportunity.clients.phone || 'N/A'}
                    </a>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-600">Contact Type:</span>
                    <span className="font-medium">{opportunity.contact_type || 'Not set'}</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-600">Client Type:</span>
                    <span className="font-medium">{opportunity.client_type || 'Not set'}</span>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No client linked to this opportunity. Click Edit to assign a client.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Site Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Site Address</h2>
          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-2">Search Existing Sites</label>
                <SiteSelector
                  onSiteSelected={(site) => {
                    if (site) {
                      handleEditFormChange('site_address', site.address_line_1)
                      if (site.city) handleEditFormChange('site_city', site.city)
                      if (site.postcode) handleEditFormChange('site_postcode', site.postcode)
                      if (site.region_id) handleEditFormChange('region_id', site.region_id)
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Or Enter Manually</label>
                <input
                  type="text"
                  value={editForm.site_address || ''}
                  onChange={(e) => handleEditFormChange('site_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={editForm.site_city || ''}
                  onChange={(e) => handleEditFormChange('site_city', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={editForm.site_postcode || ''}
                  onChange={(e) => handleEditFormChange('site_postcode', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  placeholder="Postcode"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Region</label>
                <select
                  value={editForm.region_id || ''}
                  onChange={(e) => handleEditFormChange('region_id', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                >
                  <option value="">-- Select Region --</option>
                  {regionsList.map(region => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-700 space-y-1">
              <p>{opportunity.site_address || 'N/A'}</p>
              {(opportunity.site_city || opportunity.site_postcode) && (
                <p>{opportunity.site_city} {opportunity.site_postcode}</p>
              )}
              {opportunity.regions && (
                <p className="text-xs text-gray-600 mt-1">Region: {opportunity.regions.name}</p>
              )}
            </div>
          )}
        </div>

        {/* Status & Financial */}
        <div className="grid grid-cols-2 gap-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Status</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-500 text-xs font-medium">Pipeline Stage</label>
                <p className={`mt-2 px-3 py-1 rounded-full inline-block text-xs font-medium ${stageColors[opportunity.stage] || 'bg-gray-100 text-gray-800'}`}>
                  {opportunity.stage}
                </p>
              </div>
              {editMode ? (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sub-Status</label>
                  <input
                    type="text"
                    value={editForm.sub_status || ''}
                    onChange={(e) => handleEditFormChange('sub_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                    placeholder="Enter sub-status"
                  />
                </div>
              ) : (
                opportunity.sub_status && (
                  <div>
                    <label className="text-gray-500 text-xs font-medium">Sub-Status</label>
                    <p className="text-gray-800 mt-1">{opportunity.sub_status}</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Financial */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Financial</h3>
            <div className="space-y-3 text-sm">
              {editMode ? (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Estimated Value</label>
                    <input
                      type="number"
                      value={editForm.estimated_value || ''}
                      onChange={(e) => handleEditFormChange('estimated_value', parseFloat(e.target.value) || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Actual Value</label>
                    <input
                      type="number"
                      value={editForm.actual_value || ''}
                      onChange={(e) => handleEditFormChange('actual_value', parseFloat(e.target.value) || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-gray-500 text-xs font-medium">Estimated Value</label>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      ${opportunity.estimated_value?.toLocaleString('en-NZ', { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                  </div>
                  {opportunity.actual_value && (
                    <div>
                      <label className="text-gray-500 text-xs font-medium">Actual Value</label>
                      <p className="text-xl font-bold text-blue-600 mt-1">
                        ${opportunity.actual_value.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sales Rep */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Sales Rep</h3>
          {editMode ? (
            <select
              value={editForm.sales_rep_id || ''}
              onChange={(e) => handleEditFormChange('sales_rep_id', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            >
              <option value="">-- Select Sales Rep --</option>
              {salesRepsList.map(rep => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-700">
              {opportunity.sales_rep
                ? `${opportunity.sales_rep.first_name} ${opportunity.sales_rep.last_name}`
                : 'Not assigned'}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Important Dates</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-500 text-xs font-medium">Created</label>
              <p className="text-gray-800 mt-1">
                {new Date(opportunity.created_at).toLocaleDateString('en-NZ', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            {editMode ? (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Target Close Date</label>
                <input
                  type="date"
                  value={editForm.due_date?.split('T')[0] || ''}
                  onChange={(e) => handleEditFormChange('due_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
            ) : (
              opportunity.due_date && (
                <div>
                  <label className="text-gray-500 text-xs font-medium">Target Close Date</label>
                  <p className="text-gray-800 mt-1">
                    {new Date(opportunity.due_date).toLocaleDateString('en-NZ', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Notes</h3>
          {editMode ? (
            <textarea
              value={editForm.notes || ''}
              onChange={(e) => handleEditFormChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC] min-h-[100px]"
              placeholder="Add notes about this opportunity..."
            />
          ) : (
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {opportunity.notes || 'No notes added'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
