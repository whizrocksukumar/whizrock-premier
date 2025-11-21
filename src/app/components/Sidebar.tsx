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
    <aside style={{ backgroundColor: '#2d3748' }} className="w-72 text-white flex flex-col h-screen">
      {/* Top - Premier Logo with padding */}
      <div className="p-8 border-b border-gray-600">
        <Image
          src="/premier-logo.webp"
          alt="Premier Insulation"
          width={160}
          height={50}
          className="w-auto h-14 mb-3"
          priority
        />
        <p className="text-xs text-gray-300">West Rodney Branch</p>
      </div>

      {/* Navigation - WHITE TEXT, BLUE HOVER */}
      <nav className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-white hover:bg-blue-600'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom - Whizrock Logo with padding */}
      <div className="p-8 border-t border-gray-600" style={{ backgroundColor: '#1a202c' }}>
        <a 
          href="https://whizrock.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-3 text-center"
        >
          <span className="text-xs text-gray-400">Powered by</span>
          <Image
            src="/whizrock-logo.png"
            alt="Whizrock"
            width={100}
            height={30}
            className="h-7 w-auto"
          />
        </a>
      </div>
    </aside>
  )
}