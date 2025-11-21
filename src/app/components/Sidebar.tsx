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
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-slate-700">
        <p className="text-sm font-semibold text-slate-300">PREMIER</p>
        <p className="text-xs text-slate-400">West Rodney</p>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-orange-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700 mb-4">
        <a 
          href="https://whizrock.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition"
        >
          <span>Powered by</span>
          <Image
            src="/whizrock-logo.png"
            alt="Whizrock"
            width={80}
            height={24}
            className="h-6 w-auto"
          />
        </a>
      </div>
    </aside>
  )
}