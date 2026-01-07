/**
 * Create a draft quote from a product recommendation
 * Auto-copies sections and line items
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createQuoteFromRecommendation(recommendationId: string) {
  try {
    // Fetch recommendation with related data
    const { data: recommendation, error: recError } = await supabase
      .from('product_recommendations')
      .select(`
        *,
        recommendation_sections (*),
        opportunities (
          *,
          clients (*),
          companies (*),
          assessments (*)
        )
      `)
      .eq('id', recommendationId)
      .single();

    if (recError || !recommendation) {
      throw new Error('Recommendation not found');
    }

    const opportunity = recommendation.opportunities;
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    // Generate quote number
    const { data: lastQuote } = await supabase
      .from('quotes')
      .select('quote_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let quoteNumber = 'Q-2025-0001';
    if (lastQuote?.quote_number) {
      const match = lastQuote.quote_number.match(/Q-\d{4}-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        quoteNumber = `Q-2025-${nextNum.toString().padStart(4, '0')}`;
      }
    }

    // Create quote header
    const { data: newQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        quote_number: quoteNumber,
        quote_date: new Date().toISOString(),
        client_id: opportunity.client_id,
        company_id: opportunity.company_id,
        site_id: opportunity.site_id,
        site_address: opportunity.site_address,
        city: opportunity.city,
        postcode: opportunity.postcode,
        region_id: opportunity.region_id,
        sales_rep_id: opportunity.sales_rep_id,
        job_type_id: opportunity.job_type_id,
        assessment_id: recommendation.assessment_id,
        recommendation_id: recommendationId,
        status: 'Draft',
        pricing_tier: 'Retail',
        markup_percent: 37.5,
        labour_rate_per_sqm: 3.00,
        waste_percent: 10,
        total_cost_ex_gst: 0,
        total_sell_ex_gst: 0,
        gst_amount: 0,
        total_inc_gst: 0,
        version: 1,
      })
      .select()
      .single();

    if (quoteError || !newQuote) {
      throw new Error(`Failed to create quote: ${quoteError?.message}`);
    }

    // Fetch recommendation sections with items
    const { data: sections, error: sectionsError } = await supabase
      .from('recommendation_sections')
      .select(`
        *,
        recommendation_items (*)
      `)
      .eq('recommendation_id', recommendationId)
      .order('sort_order');

    if (sectionsError) {
      throw new Error(`Failed to fetch sections: ${sectionsError.message}`);
    }

    // Copy sections and items to quote
    for (let i = 0; i < (sections || []).length; i++) {
      const section = sections[i];

      // Create quote section
      const { data: newSection, error: sectionError } = await supabase
        .from('quote_sections')
        .insert({
          quote_id: newQuote.id,
          app_type_id: section.app_type_id,
          section_name: section.section_name,
          custom_name: section.custom_name,
          section_color: section.section_color || '#ffffff',
          sort_order: i + 1,
        })
        .select()
        .single();

      if (sectionError || !newSection) {
        console.error('Section creation error:', sectionError);
        continue;
      }

      // Copy line items
      const items = section.recommendation_items || [];
      const lineItemsToInsert = items.map((item: any, idx: number) => ({
        quote_id: newQuote.id,
        section_id: newSection.id,
        product_id: item.product_id,
        description: item.product_description || 'Product',
        quantity: item.quantity,
        unit_price: 0, // User must add pricing
        line_total: 0,
        area_sqm: item.area_sqm || 0,
        is_labour: false,
        packs_required: item.quantity,
        cost_price: 0,
        sell_price: 0,
        line_cost: 0,
        line_sell: 0,
        margin_percent: 0,
        sort_order: idx + 1,
      }));

      if (lineItemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('quote_line_items')
          .insert(lineItemsToInsert);

        if (itemsError) {
          console.error('Line items creation error:', itemsError);
        }
      }
    }

    // Create task for sales rep to add pricing
    if (opportunity.sales_rep_id) {
      await supabase.from('tasks').insert({
        task_description: `Add pricing to quote ${quoteNumber}`,
        assigned_to_user_id: opportunity.sales_rep_id,
        related_entity_type: 'quote',
        related_entity_id: newQuote.id,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
        priority: 'High',
        status: 'Pending',
      });
    }

    return {
      success: true,
      quote: newQuote,
      quoteNumber,
    };

  } catch (error: any) {
    console.error('createQuoteFromRecommendation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create quote',
    };
  }
}
