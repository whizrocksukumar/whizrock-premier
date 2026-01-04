import { supabase } from '@/lib/supabase';

/**
 * Invoice object structure returned from helper functions
 */
export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_sell_inc_gst: number;
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  amount_paid: number;
  job_id: string;
  is_overdue: boolean;
}

/**
 * Invoice notification preference
 */
export interface InvoiceNotificationPreference {
  id: string;
  client_id: string;
  send_overdue_reminders: boolean;
  overdue_reminder_days: number; // Days after due date
  send_delivery_confirmation: boolean;
  email_address: string;
  created_at: string;
  updated_at: string;
}

/**
 * Invoice activity log for tracking
 */
export interface InvoiceActivityLog {
  id: string;
  invoice_id: string;
  action: 'created' | 'sent' | 'viewed' | 'payment_received' | 'overdue_reminder_sent' | 'cancelled';
  performed_by_user_id: string;
  timestamp: string;
  notes: string;
}

/**
 * Fetch all invoices for a specific client
 * Used in Client Detail Page
 */
export async function fetchInvoicesByClient(clientId: string): Promise<Invoice[]> {
  try {
    const now = new Date();

    // Query invoices with all needed fields
    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
        id,
        invoice_number,
        invoice_date,
        due_date,
        total_sell_inc_gst,
        status,
        payment_status,
        amount_paid,
        job_id
        `
      )
      .eq('client_id', clientId)
      .order('invoice_date', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    // Transform data and calculate is_overdue
    const invoices: Invoice[] = data.map((invoice: any) => {
      const dueDate = new Date(invoice.due_date);
      const isPaid = invoice.payment_status === 'paid';
      const isOverdue = dueDate < now && !isPaid;

      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        total_sell_inc_gst: invoice.total_sell_inc_gst || 0,
        status: invoice.status || 'draft',
        payment_status: invoice.payment_status || 'unpaid',
        amount_paid: invoice.amount_paid || 0,
        job_id: invoice.job_id,
        is_overdue: isOverdue,
      };
    });

    return invoices;
  } catch (error) {
    console.error('Error fetching invoices by client:', error);
    throw error;
  }
}

/**
 * Fetch invoice with all details (for invoice detail page)
 */
export async function fetchInvoiceDetail(invoiceId: string) {
  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;
    if (!invoice) throw new Error('Invoice not found');

    // Fetch line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('line_order', { ascending: true });

    if (lineItemsError) throw lineItemsError;

    // Fetch job details if linked
    let jobDetails = null;
    if (invoice.job_id) {
      const { data: job } = await supabase
        .from('jobs')
        .select('id, job_number, scheduled_date')
        .eq('id', invoice.job_id)
        .single();
      jobDetails = job;
    }

    // Fetch quote details if linked
    let quoteDetails = null;
    if (invoice.quote_id) {
      const { data: quote } = await supabase
        .from('quotes')
        .select('id, quote_number')
        .eq('id', invoice.quote_id)
        .single();
      quoteDetails = quote;
    }

    return {
      ...invoice,
      lineItems: lineItems || [],
      jobDetails,
      quoteDetails,
    };
  } catch (error) {
    console.error('Error fetching invoice detail:', error);
    throw error;
  }
}

/**
 * Calculate invoice summary statistics for client
 * Used in Client Detail Activity Summary
 */
export async function fetchClientInvoiceSummary(clientId: string) {
  try {
    const now = new Date();

    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
        id,
        total_sell_inc_gst,
        amount_paid,
        status,
        payment_status,
        due_date
        `
      )
      .eq('client_id', clientId);

    if (error) throw error;
    if (!data) {
      return {
        invoices_total: 0,
        invoices_unpaid_amount: 0,
        invoices_overdue_amount: 0,
        invoices_revenue_total: 0,
      };
    }

    let invoices_unpaid_amount = 0;
    let invoices_overdue_amount = 0;
    let invoices_revenue_total = 0;

    data.forEach((invoice: any) => {
      const invoiceAmount = invoice.total_sell_inc_gst || 0;
      const paid = invoice.amount_paid || 0;
      const unpaidAmount = invoiceAmount - paid;
      const dueDate = new Date(invoice.due_date);
      const isPaid = invoice.payment_status === 'paid';

      // Count towards revenue total (all sent invoices)
      if (invoice.status !== 'draft' && invoice.status !== 'cancelled') {
        invoices_revenue_total += invoiceAmount;
      }

      // Calculate unpaid amount
      if (unpaidAmount > 0) {
        invoices_unpaid_amount += unpaidAmount;

        // Calculate overdue amount
        if (dueDate < now && !isPaid) {
          invoices_overdue_amount += unpaidAmount;
        }
      }
    });

    return {
      invoices_total: data.length,
      invoices_unpaid_amount: Math.round(invoices_unpaid_amount * 100) / 100,
      invoices_overdue_amount: Math.round(invoices_overdue_amount * 100) / 100,
      invoices_revenue_total: Math.round(invoices_revenue_total * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching invoice summary:', error);
    throw error;
  }
}

/**
 * Get overdue invoices across all clients (for dashboard/alerts)
 */
export async function fetchOverdueInvoices() {
  try {
    const now = new Date();

    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, due_date, total_sell_inc_gst, amount_paid, client_id')
      .lt('due_date', now.toISOString())
      .neq('payment_status', 'paid')
      .order('due_date', { ascending: true });

    if (error) throw error;
    
    // Fetch client details separately
    const clientIds = [...new Set((data || []).map(i => i.client_id))];
    const { data: clients } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email')
      .in('id', clientIds);

    const clientMap = new Map(clients?.map(c => [c.id, c]) || []);

    return (data || []).map(invoice => ({
      ...invoice,
      clients: clientMap.get(invoice.client_id),
    }));
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    throw error;
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', invoiceId);

    if (error) throw error;

    // Log activity
    await logInvoiceActivity(invoiceId, 'sent', null, `Invoice status updated to ${status}`);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}

/**
 * Record payment against invoice
 */
export async function recordInvoicePayment(
  invoiceId: string,
  amountPaid: number,
  notes?: string
): Promise<void> {
  try {
    // Fetch current invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('amount_paid, total_sell_inc_gst')
      .eq('id', invoiceId)
      .single();

    if (fetchError) throw fetchError;

    const newAmountPaid = (invoice.amount_paid || 0) + amountPaid;
    const totalAmount = invoice.total_sell_inc_gst;
    let newStatus = 'unpaid';
    let newPaymentStatus = 'unpaid';

    if (newAmountPaid >= totalAmount) {
      newPaymentStatus = 'paid';
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newPaymentStatus = 'partially_paid';
      newStatus = 'partially_paid';
    }

    // Update invoice
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        payment_status: newPaymentStatus,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) throw updateError;

    // Log activity
    await logInvoiceActivity(
      invoiceId,
      'payment_received',
      null,
      `Payment of ${amountPaid} recorded. ${notes || ''}`
    );
  } catch (error) {
    console.error('Error recording invoice payment:', error);
    throw error;
  }
}

/**
 * Get notification preferences for a client
 */
export async function fetchClientNotificationPreferences(
  clientId: string
): Promise<InvoiceNotificationPreference | null> {
  try {
    const { data, error } = await supabase
      .from('invoice_notification_preferences')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Not found - return null
      return null;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
}

/**
 * Create or update notification preferences for a client
 */
export async function updateClientNotificationPreferences(
  clientId: string,
  preferences: Partial<InvoiceNotificationPreference>
): Promise<void> {
  try {
    // Check if preferences exist
    const existing = await fetchClientNotificationPreferences(clientId);

    if (existing) {
      // Update
      const { error } = await supabase
        .from('invoice_notification_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', clientId);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase
        .from('invoice_notification_preferences')
        .insert({
          client_id: clientId,
          ...preferences,
        });

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

/**
 * Log invoice activity (for audit trail and notifications)
 */
export async function logInvoiceActivity(
  invoiceId: string,
  action: 'created' | 'sent' | 'viewed' | 'payment_received' | 'overdue_reminder_sent' | 'cancelled',
  userId: string | null,
  notes?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('invoice_activity_log')
      .insert({
        invoice_id: invoiceId,
        action,
        performed_by_user_id: userId,
        notes: notes || null,
        timestamp: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging invoice activity:', error);
    // Don't throw - logging should not break operations
  }
}

/**
 * Get invoice activity history
 */
export async function fetchInvoiceActivityHistory(invoiceId: string): Promise<InvoiceActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('invoice_activity_log')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching invoice activity history:', error);
    throw error;
  }
}

/**
 * Send overdue invoice reminder (integration point for email service)
 * This will be called by Supabase Edge Function or scheduled task
 */
export async function sendOverdueReminder(invoiceId: string, clientEmail: string): Promise<void> {
  try {
    // Fetch invoice details for email
    const invoiceDetail = await fetchInvoiceDetail(invoiceId);

    // Call Resend API via Edge Function
    // This is a placeholder - actual implementation would call your email service
    const response = await fetch('/api/send-overdue-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId,
        clientEmail,
        invoiceNumber: invoiceDetail.invoice_number,
        amount: invoiceDetail.total_sell_inc_gst - invoiceDetail.amount_paid,
        dueDate: invoiceDetail.due_date,
      }),
    });

    if (!response.ok) throw new Error('Failed to send reminder');

    // Log the activity
    await logInvoiceActivity(invoiceId, 'overdue_reminder_sent', null, 'Overdue reminder sent via email');
  } catch (error) {
    console.error('Error sending overdue reminder:', error);
    throw error;
  }
}

/**
 * Check and send overdue reminders for invoices past due date
 * (Should be called by scheduled Supabase function)
 */
export async function checkAndSendOverdueReminders(): Promise<void> {
  try {
    const overdueInvoices = await fetchOverdueInvoices();

    for (const invoice of overdueInvoices) {
      const client = invoice.clients;
      if (client?.email) {
        // Check notification preferences
        const prefs = await fetchClientNotificationPreferences(client.id);

        if (prefs?.send_overdue_reminders) {
          // Check if reminder was already sent (via activity log)
          const activities = await fetchInvoiceActivityHistory(invoice.id);
          const reminderSent = activities.some(a => a.action === 'overdue_reminder_sent');

          if (!reminderSent) {
            await sendOverdueReminder(invoice.id, client.email);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking overdue invoices:', error);
  }
}