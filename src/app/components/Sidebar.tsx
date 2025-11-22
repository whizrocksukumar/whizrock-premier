'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  Home, FileText, Briefcase, Calendar, ClipboardCheck, 
  AlertTriangle, FileCheck, Wrench, Package, Users 
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/assessments', label: 'Insulation Assessments', icon: ClipboardCheck },
  { href: '/incidents', label: 'Accidents & Near Misses', icon: AlertTriangle },
  { href: '/certificates', label: 'Completion Certificates', icon: FileCheck },
  { href: '/ps3', label: 'Recycle Bin', icon: Wrench },
  { href: '/inventory', label: 'VA Workspace', icon: Package },
  { href: '/customers', label: 'Customers', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    // Increased width to w-80 (320px) and ensured dark background
    <aside className="w-64 bg-white text-gray-800 flex flex-col h-screen border-r border-gray-200">
      {/* Top - Premier Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-700">Premier Insulation</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
      </nav>

      {/* Bottom - User/Logout etc. can go here */}
      <div className="p-4 border-t border-gray-200">
        {/* Placeholder for user info */}
      </div>
    </aside>
  )
}
