import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/app/components/Sidebar'
import Image from 'next/image'
import { User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Premier Insulation - Quote & Job Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">Premier Insulation</h1>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-600">
                  Premier West Rodney • Henderson, Auckland
                </span>
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
      </body>
    </html>
  )
}