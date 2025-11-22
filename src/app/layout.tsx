import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/app/components/Sidebar'
import { User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Premier Insulation - Quote & Job Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white min-h-screen flex" suppressHydrationWarning>
        <Sidebar />
        <div className="flex-1 flex flex-col bg-white">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-8 py-4 flex items-center justify-between">
              <div className="flex-1"></div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-600 font-medium">
                  Premier West Rodney • Henderson, Auckland
                </span>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-white">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}