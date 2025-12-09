'use client'

import React from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

export interface PageAction {
  label: string
  icon?: LucideIcon
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'tertiary'
  className?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: PageAction[]
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  searchValue?: string
  children?: React.ReactNode
}

export default function PageHeader({
  title,
  description,
  icon: Icon,
  actions = [],
  searchPlaceholder,
  onSearch,
  searchValue,
  children
}: PageHeaderProps) {
  
  const getButtonClasses = (variant: PageAction['variant'] = 'secondary') => {
    const base = "px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
    
    switch (variant) {
      case 'primary':
        return `${base} bg-[#0066CC] text-white hover:bg-[#0052a3]`
      case 'secondary':
        return `${base} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300`
      case 'tertiary':
        return `${base} bg-white text-gray-700 hover:bg-gray-50 border border-gray-300`
      default:
        return `${base} bg-gray-100 text-gray-700 hover:bg-gray-200`
    }
  }

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Title and Actions Row */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-7 h-7 text-[#0066CC]" />}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-3">
            {actions.map((action, index) => {
              const ButtonIcon = action.icon
              const classes = action.className || getButtonClasses(action.variant)
              
              if (action.href) {
                return (
                  <Link
                    key={index}
                    href={action.href}
                    className={classes}
                  >
                    {ButtonIcon && <ButtonIcon className="w-4 h-4" />}
                    {action.label}
                  </Link>
                )
              }
              
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={classes}
                >
                  {ButtonIcon && <ButtonIcon className="w-4 h-4" />}
                  {action.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Search and Filters Row */}
      {(searchPlaceholder || children) && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-4">
            {/* Search Input */}
            {searchPlaceholder && onSearch && (
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue || ''}
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-sm"
                />
              </div>
            )}
            
            {/* Custom Filter Controls */}
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
