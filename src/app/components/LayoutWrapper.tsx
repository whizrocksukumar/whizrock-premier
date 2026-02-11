'use client'

import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import HelpMenu from '@/components/HelpMenu'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [isEmbedded, setIsEmbedded] = useState(false)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const embeddedParam = params.get('embedded') === 'true'
      const iframeDetected = window.self !== window.top

      setIsEmbedded(embeddedParam || iframeDetected)
    } catch {
      setIsEmbedded(false)
    }
  }, [])

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      {!isEmbedded && <Sidebar />}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {!isEmbedded && (
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end shadow-sm">
            <HelpMenu />
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div
            className={
              isEmbedded
                ? 'w-full px-2 py-4'
                : 'mx-auto w-full max-w-[90%] px-4 py-6'
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
