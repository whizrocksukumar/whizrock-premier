'use client'

import { Search, Plus, Download, Printer } from 'lucide-react'
import { useState } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onNewClick?: () => void
  onPrintClick?: () => void
  onExportClick?: () => void
  actions?: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
    disabled?: boolean
  }[]
  selectedCount?: number
  user?: string
  onLogout?: () => void
}

export default function PageHeader({
  title,
  subtitle,
  searchPlaceholder = 'Search...',
  onSearch,
  onNewClick,
  onPrintClick,
  onExportClick,
  actions = [],
  selectedCount = 0,
  user = 'User',
  onLogout,
}: PageHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Title Row */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        
        {/* User Profile - Right Side */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">U</span>
            </div>
            <span className="text-sm font-medium text-gray-700">{user}</span>
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-gray-600 hover:text-gray-900 transition font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Search & Actions Row */}
      <div className="px-8 py-4 border-t border-gray-100 flex items-center gap-4">
        {/* Search Box - 30% width */}
        <div className="w-3/10 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
          />
        </div>

        {/* Action Buttons - 70% width, right aligned */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* New Button */}
          {onNewClick && (
            <button
              onClick={onNewClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          )}

          {/* Print Button - Disabled if no selection */}
          {onPrintClick && (
            <button
              onClick={onPrintClick}
              disabled={selectedCount === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${
                selectedCount === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          )}

          {/* Export Button - Disabled if no selection */}
          {onExportClick && (
            <button
              onClick={onExportClick}
              disabled={selectedCount === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${
                selectedCount === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}

          {/* Custom Actions */}
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${
                action.disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selection Info */}
      {selectedCount > 0 && (
        <div className="px-8 py-3 bg-blue-50 border-t border-blue-200 text-sm text-blue-700 font-medium">
          {selectedCount} quote{selectedCount !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}