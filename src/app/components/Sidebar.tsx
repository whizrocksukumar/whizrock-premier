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
  { href: '/calendar', label: 'Job Calendars', icon: Calendar },
  { href: '/assessments', label: 'Insulation Assessments', icon: ClipboardCheck },
  { href: '/incidents', label: 'Accidents / Incidents', icon: AlertTriangle },
  { href: '/certificates', label: 'Completion Certificates', icon: FileCheck },
  { href: '/ps3', label: 'PS3 Management', icon: Wrench },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/customers', label: 'Customers', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 bg-gray-900 text-white flex flex-col h-screen">
      {/* Top - Premier */}
      <div className="p-6 border-b border-gray-800">
        <Image
          src="/premier-logo.webp"
          alt="Premier Insulation"
          width={160}
          height={50}
          className="w-auto h-12"
          priority
        />
        <p className="text-xs text-gray-400 mt-2">West Rodney</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                isActive
                  ? 'bg-orange-600 text-white font-semibold shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom - Whizrock */}
      <div className="p-6 border-t border-gray-800">
        <a 
          href="https://whizrock.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition"
        >
          <span>Powered by</span>
          <Image
            src="/whizrock-logo.png"
            alt="Whizrock"
            width={90}
            height={28}
            className="h-7 w-auto"
          />
        </a>
      </div>
    </aside>
  )
}