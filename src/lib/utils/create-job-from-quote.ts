/**
 * Create a job from an accepted quote
 * Auto-copies quote line items to job line items
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createJobFromQuote(quoteId: string) {
  try {
    // Fetch quote with related data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_line_items (*)
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== 'Accepted') {
      throw new Error('Only accepted quotes can be converted to jobs');
    }

    // Generate job number
    const { data: lastJob } = await supabase
      .from('jobs')
      .select('job_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let jobNumber = 'J-2025-0001';
    if (lastJob?.job_number) {
      const match = lastJob.job_number.match(/J-\d{4}-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        jobNumber = `J-2025-${nextNum.toString().padStart(4, '0')}`;
      }
    }

    // Create job header
    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert({
        job_number: jobNumber,
        quote_id: quoteId,
        assessment_id: quote.assessment_id,
        opportunity_id: quote.opportunity_id,
        customer_first_name: quote.customer_first_name || '',
        customer_last_name: quote.customer_last_name || '',
        customer_email: quote.customer_email || '',
        customer_phone: quote.customer_phone || '',
        customer_company: quote.customer_company || '',
        site_address: quote.site_address,
        city: quote.city,
        postcode: quote.postcode,
        status: 'Draft',
        quoted_amount: quote.total_inc_gst,
        actual_amount: 0,
        warranty_period_months: 12,
      })
      .select()
      .single();

    if (jobError || !newJob) {
      throw new Error(`Failed to create job: ${jobError?.message}`);
    }

    // Copy quote line items to job line items
    const lineItems = quote.quote_line_items || [];
    const jobLineItems = lineItems
      .filter((item: any) => !item.is_labour) // Skip labour items for now
      .map((item: any) => ({
        job_id: newJob.id,
        product_code: item.product?.sku || '',
        description: item.description,
        quantity_quoted: item.quantity || item.packs_required || 0,
        quantity_actual: 0,
        unit: item.product?.unit || 'pack',
        unit_cost: item.cost_price || 0,
        line_cost: item.line_cost || 0,
      }));

    if (jobLineItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('job_line_items')
        .insert(jobLineItems);

      if (itemsError) {
        console.error('Job line items creation error:', itemsError);
      }
    }

    // Update quote status to reflect job creation
    await supabase
      .from('quotes')
      .update({
        status: 'Won',
        job_id: newJob.id,
      })
      .eq('id', quoteId);

    // Update opportunity status
    if (quote.opportunity_id) {
      await supabase
        .from('opportunities')
        .update({
          stage: 'WON',
          job_id: newJob.id,
        })
        .eq('id', quote.opportunity_id);
    }

    // Create task for assigning installer crew
    if (quote.sales_rep_id) {
      await supabase.from('tasks').insert({
        task_description: `Assign installer crew for job ${jobNumber}`,
        assigned_to_user_id: quote.sales_rep_id,
        related_entity_type: 'job',
        related_entity_id: newJob.id,
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day
        priority: 'High',
        status: 'Pending',
      });
    }

    return {
      success: true,
      job: newJob,
      jobNumber,
    };

  } catch (error: any) {
    console.error('createJobFromQuote error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create job',
    };
  }
}
