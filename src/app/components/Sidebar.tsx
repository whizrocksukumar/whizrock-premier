'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, FileText, Briefcase, Calendar, ClipboardCheck, 
  AlertTriangle, FileCheck, Wrench, Package, Users,
  LogOut
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
    <aside className="w-64 bg-white text-gray-800 flex flex-col h-screen border-r border-gray-200 shadow-lg">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">Premier</h1>
        <p className="text-xs text-gray-500 mt-1 font-medium">Insulation Management</p>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">User</p>
            <p className="text-xs text-gray-500 truncate">user@premier.local</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}