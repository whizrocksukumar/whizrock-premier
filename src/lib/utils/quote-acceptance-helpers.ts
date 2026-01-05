import { supabase } from '../supabase';

interface AcceptanceResult {
  success: boolean;
  message: string;
  jobNumber?: string;
  error?: string;
}

/**
 * Format date as dd-mm-yyyy
 */
export const formatDateDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Generate next job number in sequence J-100001, J-100002, etc.
 */
async function generateNextJobNumber(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('job_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 100001;
    if (data && data.length > 0 && data[0].job_number) {
      // Extract number from format "J-100001"
      const lastNumber = parseInt(data[0].job_number.replace('J-', ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `J-${String(nextNumber).padStart(6, '0')}`;
  } catch (err) {
    console.error('Error generating job number:', err);
    throw new Error('Failed to generate job number');
  }
}

/**
 * Accept a quote and automatically create a draft job
 * @param quoteId - UUID of the quote to accept
 * @param userId - UUID of the logged-in user accepting the quote
 * @returns AcceptanceResult with status and job number if successful
 */
export async function acceptQuote(
  quoteId: string,
  userId: string
): Promise<AcceptanceResult> {
  try {
    // Fetch quote details
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select(`
        *,
        clients!client_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        sites!site_id (
          address_line_1,
          city,
          postcode
        )
      `)
      .eq('id', quoteId)
      .single();

    if (fetchError || !quote) {
      return {
        success: false,
        message: 'Quote not found',
        error: fetchError?.message
      };
    }

    // Validate quote status (must be Draft or Sent)
    if (quote.status !== 'Draft' && quote.status !== 'Sent') {
      return {
        success: false,
        message: `Cannot accept quote with status "${quote.status}". Only Draft or Sent quotes can be accepted.`
      };
    }

    // Generate next job number
    const jobNumber = await generateNextJobNumber();

    // Get total amount from quote (use total_sell + gst_amount or similar)
    const quotedAmount = quote.total_amount || quote.total_sell || 0;

    // Prepare job data
    const jobData = {
      job_number: jobNumber,
      quote_id: quoteId,
      status: 'Draft',
      customer_first_name: quote.clients?.first_name || '',
      customer_last_name: quote.clients?.last_name || '',
      customer_email: quote.clients?.email || '',
      customer_phone: quote.clients?.phone || '',
      customer_company: quote.customer_company || '',
      site_address: quote.sites?.address_line_1 || quote.site_address || '',
      city: quote.sites?.city || quote.city || '',
      postcode: quote.sites?.postcode || quote.postcode || '',
      quoted_amount: quotedAmount,
      created_by_user_id: userId,
      assessment_id: quote.assessment_id || null,
      opportunity_id: quote.opportunity_id || null
    };

    // Create job
    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single();

    if (jobError || !newJob) {
      return {
        success: false,
        message: 'Failed to create job',
        error: jobError?.message
      };
    }

    // Update quote status
    const today = new Date();
    const acceptedDate = today.toISOString(); // Store as ISO in DB

    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'Accepted',
        accepted_date: acceptedDate,
        accepted_by_user_id: userId,
        updated_at: acceptedDate
      })
      .eq('id', quoteId);

    if (updateError) {
      // Rollback: delete the job that was just created
      await supabase.from('jobs').delete().eq('id', newJob.id);
      
      return {
        success: false,
        message: 'Failed to update quote status',
        error: updateError.message
      };
    }

    // Get user name for success message
    const { data: userData } = await supabase
      .from('users') // or auth.users - adjust based on your setup
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    const userName = userData 
      ? `${userData.first_name} ${userData.last_name}`.trim() 
      : 'User';

    return {
      success: true,
      message: `Quote accepted by ${userName} on ${formatDateDDMMYYYY(today)}! Draft job ${jobNumber} created.`,
      jobNumber: jobNumber
    };

  } catch (err: any) {
    console.error('Error accepting quote:', err);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: err.message
    };
  }
}
