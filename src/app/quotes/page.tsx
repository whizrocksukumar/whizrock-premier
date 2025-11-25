'use client'

import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import QuotesTable from '../components/QuotesTable'
import QuoteModal from '../components/QuoteModal'
import CustomerModal from '../components/CustomerModal'

interface Quote {
  id: string
  number: string
  date: string
  region: string
  quoteSource: string
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Won' | 'Lost' | 'Tender/Jobs - to price'
  jobType: string
  quotedValue: number
  discountPercentage?: number
  marginPercentage: number
  followUpDate?: string
  jobNumber?: string
  customerName: string
  siteAddress: string
  salesRep: string
  scheduledDate?: string
}

export default function Quotes() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([])
  const [selectedQuoteForModal, setSelectedQuoteForModal] = useState<Quote | null>(null)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleNewQuote = () => {
    window.location.href = '/quotes/new'
    // In real app, open a form modal or navigate to quote creation page
  }

  const handlePrintBulk = () => {
    if (selectedQuotes.length === 0) return
    alert(`Printing ${selectedQuotes.length} quote(s) to PDF`)
    // In real app, generate PDF for selected quotes
  }

  const handleExportBulk = () => {
    if (selectedQuotes.length === 0) return
    alert(`Exporting ${selectedQuotes.length} quote(s) to CSV/Excel`)
    // In real app, export selected quotes to CSV or Excel
  }

  const handleQuoteClick = (quote: Quote) => {
    setSelectedQuoteForModal(quote)
    setIsQuoteModalOpen(true)
  }

  const handleCustomerClick = (customerName: string) => {
    setSelectedCustomerName(customerName)
    setIsCustomerModalOpen(true)
  }

  const handleQuoteModalClose = () => {
    setIsQuoteModalOpen(false)
    setSelectedQuoteForModal(null)
  }

  const handleCustomerModalClose = () => {
    setIsCustomerModalOpen(false)
    setSelectedCustomerName(null)
  }

  const handleStatusChange = (quoteId: string, newStatus: string) => {
    console.log(`Quote ${quoteId} status changed to ${newStatus}`)
    // In real app, update quote status in database
  }

  const handleDeleteQuote = (quoteId: string) => {
    console.log(`Quote ${quoteId} deleted`)
    // In real app, delete quote from database
    handleQuoteModalClose()
  }

  const handleQuoteFromCustomerClick = (quoteNumber: string) => {
    alert(`Viewing quote ${quoteNumber} from customer modal`)
    // In real app, find and open the quote modal for this quote
    handleCustomerModalClose()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header with Search and Actions */}
      <PageHeader
        title="Quotes"
        subtitle="View, edit, and create new quotes."
        searchPlaceholder="Search by Quote # or Customer..."
        onSearch={handleSearch}
        onNewClick={handleNewQuote}
        onPrintClick={handlePrintBulk}
        onExportClick={handleExportBulk}
        selectedCount={selectedQuotes.length}
        user="User"
        onLogout={() => alert('Logout clicked')}
      />

      {/* Main Content */}
      <div className="p-8">
        {/* Quotes Table */}
        <QuotesTable
          onQuoteClick={handleQuoteClick}
          onCustomerClick={handleCustomerClick}
          selectedQuotes={selectedQuotes}
          onSelectionChange={setSelectedQuotes}
          searchQuery={searchQuery}
        />
      </div>

      {/* Quote Modal */}
      <QuoteModal
        quote={selectedQuoteForModal}
        isOpen={isQuoteModalOpen}
        onClose={handleQuoteModalClose}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteQuote}
      />

      {/* Customer Modal */}
      <CustomerModal
        customerName={selectedCustomerName}
        isOpen={isCustomerModalOpen}
        onClose={handleCustomerModalClose}
        onQuoteClick={handleQuoteFromCustomerClick}
      />
    </div>
  )
}
