import { supabase } from '@/lib/supabase'

export interface Invoice {
  id: string
  client_id: string
  invoice_number?: string
  invoice_date?: string
  due_date?: string
  total_inc_gst?: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  payment_status?: 'unpaid' | 'paid' | 'partial'
  notes?: string
  created_at: string
  updated_at: string
}

export interface InvoiceWithRelations extends Invoice {
  client?: {
    id: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
    company_name?: string
  }
}

export async function fetchInvoiceWithRelations(
  invoiceId: string
): Promise<InvoiceWithRelations> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
        *,
        client:clients(id, first_name, last_name, email, phone, company_name)
      `
      )
      .eq('id', invoiceId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Invoice not found')

    return data as InvoiceWithRelations
  } catch (error) {
    console.error('Error fetching invoice with relations:', error)
    throw error
  }
}

export async function fetchInvoicesByClient(clientId: string): Promise<Invoice[]> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('invoice_date', { ascending: false })

    if (error) throw error
    return (data || []) as Invoice[]
  } catch (error) {
    console.error('Error fetching invoices by client:', error)
    throw error
  }
}

export async function fetchInvoicesByStatus(status: string): Promise<Invoice[]> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', status)
      .order('invoice_date', { ascending: false })

    if (error) throw error
    return (data || []) as Invoice[]
  } catch (error) {
    console.error('Error fetching invoices by status:', error)
    throw error
  }
}

export async function fetchUnpaidInvoices(): Promise<Invoice[]> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .in('status', ['draft', 'sent', 'overdue'])
      .order('due_date', { ascending: true })

    if (error) throw error
    return (data || []) as Invoice[]
  } catch (error) {
    console.error('Error fetching unpaid invoices:', error)
    throw error
  }
}

export async function fetchOverdueInvoices(): Promise<Invoice[]> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'overdue')
      .lt('due_date', today)
      .order('due_date', { ascending: true })

    if (error) throw error
    return (data || []) as Invoice[]
  } catch (error) {
    console.error('Error fetching overdue invoices:', error)
    throw error
  }
}

export async function createInvoice(data: {
  client_id: string
  invoice_date?: string
  due_date?: string
  total_inc_gst?: number
  status?: string
  payment_status?: string
  notes?: string
}): Promise<Invoice> {
  try {
    const { data: invoiceData, error } = await supabase
      .from('invoices')
      .insert({
        ...data,
        status: data.status || 'draft',
        payment_status: data.payment_status || 'unpaid',
      })
      .select()
      .single()

    if (error) throw error
    if (!invoiceData) throw new Error('Invoice creation failed')

    return invoiceData as Invoice
  } catch (error) {
    console.error('Error creating invoice:', error)
    throw error
  }
}

export async function updateInvoice(
  invoiceId: string,
  updates: Partial<Invoice>
): Promise<Invoice> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Invoice update failed')

    return data as Invoice
  } catch (error) {
    console.error('Error updating invoice:', error)
    throw error
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'draft' | 'sent' | 'paid' | 'overdue',
  paymentStatus?: 'unpaid' | 'paid' | 'partial'
): Promise<Invoice> {
  try {
    const updates: any = {
      status,
    }

    if (paymentStatus) {
      updates.payment_status = paymentStatus
    }

    if (status === 'paid') {
      updates.payment_status = 'paid'
    }

    return updateInvoice(invoiceId, updates)
  } catch (error) {
    console.error('Error updating invoice status:', error)
    throw error
  }
}

export async function markInvoiceAsPaid(invoiceId: string): Promise<Invoice> {
  return updateInvoiceStatus(invoiceId, 'paid', 'paid')
}

export async function sendInvoice(invoiceId: string): Promise<Invoice> {
  return updateInvoiceStatus(invoiceId, 'sent', 'unpaid')
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  try {
    const invoice = await fetchInvoiceWithRelations(invoiceId)
    if (invoice.status !== 'draft') {
      throw new Error('Can only delete draft invoices')
    }

    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting invoice:', error)
    throw error
  }
}