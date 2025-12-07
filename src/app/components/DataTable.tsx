'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Eye, Edit, Trash2, ChevronUp, ChevronDown, Plus, Upload, Download, Printer } from 'lucide-react'

interface Column {
  name: string
  label: string
  sortable?: boolean
  type?: 'string' | 'date' | 'status' | 'number'
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onNew?: () => void
  onImport?: () => void
  onExport?: () => void
  onPrint?: () => void
  title: string
  subtitle?: string
  loading?: boolean
}

export const DataTable = ({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  onNew,
  onImport,
  onExport,
  onPrint,
  title,
  subtitle,
  loading = false
}: DataTableProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const searchLower = searchQuery.toLowerCase()
      return columns.some(col => {
        const value = row[col.name]
        return value && String(value).toLowerCase().includes(searchLower)
      })
    })
  }, [data, searchQuery, columns])

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      
      const column = columns.find(c => c.name === sortColumn)
      
      if (column?.type === 'number') {
        return sortDirection === 'asc' 
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal)
      }
      
      if (column?.type === 'date') {
        return sortDirection === 'asc'
          ? new Date(aVal).getTime() - new Date(bVal).getTime()
          : new Date(bVal).getTime() - new Date(aVal).getTime()
      }

      const comparison = String(aVal).localeCompare(String(bVal))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection, columns])

  const paginatedData = useMemo(() => {
    if (rowsPerPage === -1) return sortedData
    const start = (currentPage - 1) * rowsPerPage
    return sortedData.slice(start, start + rowsPerPage)
  }, [sortedData, currentPage, rowsPerPage])

  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(sortedData.length / rowsPerPage)

  const handleSort = (columnName: string) => {
    const column = columns.find(c => c.name === columnName)
    if (!column?.sortable) return

    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnName)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(row => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (deleteConfirm && onDelete) {
      onDelete(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('draft')) return 'status-draft'
    if (statusLower.includes('scheduled') || statusLower.includes('sent')) return 'status-sent'
    if (statusLower.includes('completed') || statusLower.includes('accepted')) return 'status-accepted'
    if (statusLower.includes('cancelled') || statusLower.includes('rejected')) return 'badge' 
    return 'status-pending'
  }

  const formatValue = (value: any, type?: string) => {
    if (!value) return '-'
    
    if (type === 'date') {
      return new Date(value).toLocaleDateString('en-NZ')
    }
    
    if (type === 'number') {
      return Number(value).toLocaleString()
    }
    
    return value
  }

  if (loading) {
    return (
      <div className="page-content">
        <div className="flex items-center justify-center" style={{minHeight: '400px'}}>
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          <div className="page-actions">
            {onNew && (
              <button onClick={onNew} className="btn-primary">
                <Plus className="w-4 h-4" />
                New
              </button>
            )}
            {onImport && (
              <button onClick={onImport} className="btn-secondary">
                <Upload className="w-4 h-4" />
                Import
              </button>
            )}
            {onExport && (
              <button onClick={onExport} className="btn-secondary">
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
            {onPrint && (
              <button onClick={onPrint} className="btn-secondary">
                <Printer className="w-4 h-4" />
                Print
              </button>
            )}
          </div>
        </div>

        <div className="relative mt-4" style={{maxWidth: '400px'}}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color: 'var(--color-neutral-400)'}} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{paddingLeft: '2.5rem'}}
          />
        </div>
      </div>

      {sortedData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No items found</div>
          <p className="empty-state-description">
            {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating a new item'}
          </p>
          {onNew && !searchQuery && (
            <button onClick={onNew} className="btn-primary">
              <Plus className="w-4 h-4" />
              Create New
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th style={{width: '40px'}}>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row.id))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.name}
                      className={col.sortable ? 'sortable' : ''}
                      onClick={() => col.sortable && handleSort(col.name)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        {col.sortable && sortColumn === col.name && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4" /> : 
                            <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th style={{textAlign: 'center', width: '140px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                      />
                    </td>
                    {columns.map((col) => (
                      <td key={col.name}>
                        {col.type === 'status' ? (
                          <span className={getStatusBadge(row[col.name])}>
                            {formatValue(row[col.name], col.type)}
                          </span>
                        ) : col.name === 'customer_name' && row.customer_name_link ? (
                          <Link href={row.customer_name_link} className="text-[#0066CC] hover:underline">
                            {formatValue(row[col.name], col.type)}
                          </Link>
                        ) : col.name === 'customer_company' && row.company_id && row[col.name] !== '—' ? (
                          <Link href={`/companies/${row.company_id}`} className="text-[#0066CC] hover:underline">
                            {formatValue(row[col.name], col.type)}
                          </Link>
                        ) : (
                          formatValue(row[col.name], col.type)
                        )}
                      </td>
                    ))}
                    <td>
                      <div className="table-cell-actions" style={{justifyContent: 'center'}}>
                        {onView && (
                          <button
                            onClick={() => onView(row.id)}
                            className="btn-ghost btn-sm"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row.id)}
                            className="btn-ghost btn-sm"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDeleteClick(row.id)}
                            className="btn-ghost btn-sm"
                            title="Delete"
                            style={{color: 'var(--color-accent-error)'}}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm" style={{color: 'var(--color-neutral-600)'}}>
              Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * (rowsPerPage === -1 ? sortedData.length : rowsPerPage) + 1} - {Math.min(currentPage * (rowsPerPage === -1 ? sortedData.length : rowsPerPage), sortedData.length)} of {sortedData.length} total
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{color: 'var(--color-neutral-600)'}}>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="form-select"
                  style={{width: 'auto', padding: '0.25rem 0.5rem'}}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="-1">All</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary btn-sm"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button onClick={() => setDeleteConfirm(null)} className="modal-close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this item? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}