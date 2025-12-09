'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Home, Users, FileText, ClipboardList, Package,
  Wrench, Calendar, Box, Settings, AlertTriangle, Building2
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/customers', label: 'Contacts', icon: Users },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/opportunities', label: 'Opportunities', icon: FileText },
  { href: '/assessments', label: 'Assessments', icon: ClipboardList },
  { href: '/va-workspace', label: 'VA Workspace', icon: Package },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/jobs', label: 'Jobs', icon: Wrench },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/inventory', label: 'Inventory', icon: Box },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white text-gray-800 flex flex-col h-screen border-r border-gray-200 shadow-lg">
      {/* Header Section - Premier Logo */}
      <div className="p-6 border-b border-gray-200">
        <Image
          src="/premier-logo.webp"
          alt="Premier Insulation"
          width={180}
          height={50}
          className="object-contain"
        />
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Section - Powered by Whizrock */}
      <div className="p-4 border-t border-gray-200">
        <a
          href="https://whizrock.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <Image
            src="/whizrock-icon.png"
            alt="Whizrock"
            width={24}
            height={24}
            className="object-contain"
          />
          <span>Powered by Whizrock</span>
        </a>
      </div>
    </aside>
  )
}