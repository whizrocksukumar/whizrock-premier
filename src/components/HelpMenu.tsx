'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { HelpCircle, Book, FileText, Package, AlertCircle, Briefcase, X } from 'lucide-react'

export default function HelpMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const helpSections = [
    {
      title: 'Getting Started',
      icon: Book,
      href: '/help',
      description: 'Learn the basics'
    },
    {
      title: 'Quotes',
      icon: FileText,
      href: '/help/quotes',
      description: 'Create and manage quotes'
    },
    {
      title: 'Jobs',
      icon: Briefcase,
      href: '/help/jobs',
      description: 'Track job progress'
    },
    {
      title: 'Incidents',
      icon: AlertCircle,
      href: '/help/incidents',
      description: 'Report and track issues'
    },
    {
      title: 'Inventory',
      icon: Package,
      href: '/help/inventory',
      description: 'Manage stock levels'
    }
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Help & Documentation"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm font-medium hidden md:inline">Help</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Help & Documentation</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {helpSections.map((section) => {
              const Icon = section.icon
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{section.title}</p>
                    <p className="text-xs text-gray-500">{section.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              Need more help?{' '}
              <a href="mailto:support@premierinsulation.co.nz" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
