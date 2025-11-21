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
    <html lang="en">
      <body className="bg-gray-100 min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {/* Clean Header — Premier logo only */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <Image
                src="/premier-logo.webp"
                alt="Premier Insulation"
                width={180}
                height={60}
                className="h-14 w-auto"
                priority
              />
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-600 font-medium">
                  Premier West Rodney • Henderson, Auckland
                </span>
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  )
}