'use client'

import { Printer, Mail, Download, Share2 } from 'lucide-react'
import { useState } from 'react'

interface ActionButtonsProps {
  onPrint?: () => void
  onEmail?: () => void
  onDownload?: () => void
  onShare?: () => void
  showPrint?: boolean
  showEmail?: boolean
  showDownload?: boolean
  showShare?: boolean
  className?: string
}

export function ActionButtons({
  onPrint,
  onEmail,
  onDownload,
  onShare,
  showPrint = true,
  showEmail = false,
  showDownload = false,
  showShare = false,
  className = ''
}: ActionButtonsProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      {showPrint && (
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      )}
      
      {showEmail && onEmail && (
        <button
          onClick={onEmail}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Email
        </button>
      )}
      
      {showDownload && onDownload && (
        <button
          onClick={onDownload}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      )}
      
      {showShare && onShare && (
        <button
          onClick={onShare}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      )}
    </div>
  )
}

// Individual button components for more flexibility
export function PrintButton({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      window.print()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 ${className}`}
    >
      <Printer className="w-4 h-4" />
      Print
    </button>
  )
}

export function EmailButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 ${className}`}
    >
      <Mail className="w-4 h-4" />
      Email
    </button>
  )
}

export function DownloadButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 ${className}`}
    >
      <Download className="w-4 h-4" />
      Download
    </button>
  )
}

export function ShareButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 ${className}`}
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
  )
}
