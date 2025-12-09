'use client'

import { Printer, Download, Upload, Mail, Share2, FileText } from 'lucide-react'

interface ActionButtonProps {
  onClick?: () => void
  disabled?: boolean
  className?: string
}

/**
 * Standard Print Button - Triggers window.print()
 */
export function PrintButton({ onClick, disabled, className }: ActionButtonProps) {
  const handlePrint = () => {
    if (onClick) {
      onClick()
    } else {
      window.print()
    }
  }
  
  return (
    <button
      onClick={handlePrint}
      disabled={disabled}
      className={className || "px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      <Printer className="w-4 h-4" />
      Print
    </button>
  )
}

/**
 * Standard Export/Download Button
 */
export function ExportButton({ onClick, disabled, className }: ActionButtonProps) {
  const handleExport = () => {
    if (onClick) {
      onClick()
    } else {
      alert('Export functionality coming soon')
    }
  }
  
  return (
    <button
      onClick={handleExport}
      disabled={disabled}
      className={className || "px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      <Download className="w-4 h-4" />
      Export
    </button>
  )
}

/**
 * Standard Import Button
 */
export function ImportButton({ onClick, disabled, className }: ActionButtonProps) {
  const handleImport = () => {
    if (onClick) {
      onClick()
    } else {
      alert('Import functionality coming soon')
    }
  }
  
  return (
    <button
      onClick={handleImport}
      disabled={disabled}
      className={className || "px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      <Upload className="w-4 h-4" />
      Import
    </button>
  )
}

/**
 * Standard Email/Send Button
 */
export function EmailButton({ onClick, disabled, className }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className || "px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      <Mail className="w-4 h-4" />
      Email
    </button>
  )
}

/**
 * Standard Share Button
 */
export function ShareButton({ onClick, disabled, className }: ActionButtonProps) {
  const handleShare = () => {
    if (onClick) {
      onClick()
    } else if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href
      }).catch(() => {})
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }
  
  return (
    <button
      onClick={handleShare}
      disabled={disabled}
      className={className || "px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
  )
}

/**
 * Standard Download PDF Button
 */
export function DownloadPDFButton({ onClick, disabled, className }: ActionButtonProps) {
  const handleDownload = () => {
    if (onClick) {
      onClick()
    } else {
      alert('PDF download functionality coming soon')
    }
  }
  
  return (
    <button
      onClick={handleDownload}
      disabled={disabled}
      className={className || "px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      <FileText className="w-4 h-4" />
      Download PDF
    </button>
  )
}
