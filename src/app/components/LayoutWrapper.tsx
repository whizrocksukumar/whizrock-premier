'use client'

import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import HelpMenu from '@/components/HelpMenu'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [isInIframe, setIsInIframe] = useState(false)

  useEffect(() => {
    // Check if the app is running inside an iframe
    const checkIfInIframe = () => {
      try {
        return window.self !== window.top
      } catch (e) {
        return true
      }
    }
    setIsInIframe(checkIfInIframe())
  }, [])

  return (
    <>
      {/* Sidebar - Hidden when in iframe */}
      {!isInIframe && <Sidebar />}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Hidden when in iframe */}
        {!isInIframe && (
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end shadow-sm">
            <HelpMenu />
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className={`mx-auto w-full ${isInIframe ? 'max-w-full' : 'max-w-[90%]'} px-4 py-6`}>
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
