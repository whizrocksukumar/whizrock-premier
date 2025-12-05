import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function QuotesPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Quotes</h1>
            <p className="page-subtitle">Manage customer quotes and proposals</p>
          </div>
          <Link href="/quotes/new" className="btn-primary">
            <Plus size={20} />
            New Quote
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Quotes Page - Under Construction</div>
          <p className="empty-state-description">
            The quotes management system is currently being built. Check back soon for a complete quote management experience.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
