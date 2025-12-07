import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      opportunityId,
      recommendationId,
      recommendationNumber,
      salesRepId,
      salesRepName,
      salesRepEmail,
      vaName,
      customerName,
      contactPerson,
      oppNumber,
      sectionCount,
      totalArea,
      totalPacks,
    } = body;

    if (!opportunityId || !recommendationId || !salesRepId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Update opportunity recommendation_status to 'Submitted'
    const { error: oppUpdateError } = await supabase
      .from('opportunities')
      .update({ 
        recommendation_status: 'Submitted',
        product_recommendation_id: recommendationId,
        updated_at: new Date().toISOString()
      })
      .eq('id', opportunityId);

    if (oppUpdateError) {
      console.error('Failed to update opportunity:', oppUpdateError);
      return NextResponse.json(
        { error: 'Failed to update opportunity status', details: oppUpdateError },
        { status: 500 }
      );
    }

    // 2. Create task for sales rep with due date = today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { error: taskError } = await supabase
      .from('tasks')
      .insert({
        opportunity_id: opportunityId,
        task_description: `Review VA product recommendation ${recommendationNumber} and convert to quote`,
        task_type: 'Review Recommendation',
        assigned_to_user_id: salesRepId,
        created_by_user_id: salesRepId, // System-created, assigned to sales rep
        due_date: today,
        status: 'Not Started',
        priority: 'High',
        completion_percent: 0,
        notes: `VA ${vaName} has submitted a product recommendation with ${sectionCount} section(s), ${totalArea} m² total area, and ${totalPacks} packs required. Please review and convert to a formal quote with pricing.`,
        is_active: true,
      });

    if (taskError) {
      console.error('Failed to create task:', taskError);
      // Continue anyway - email notification is more critical
    }

    // 3. Send email notification to sales rep
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 25px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 30px; background-color: #ffffff; border: 1px solid #ddd; border-top: none; }
            .info-row { display: flex; margin: 12px 0; padding: 10px; background-color: #f9f9f9; border-radius: 4px; }
            .info-label { font-weight: bold; min-width: 180px; color: #555; }
            .info-value { color: #333; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { background-color: #e8f5e9; padding: 15px; border-radius: 5px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #28a745; }
            .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
            .button { display: inline-block; padding: 14px 28px; background-color: #0066CC; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .urgent-badge { background-color: #dc3545; color: white; padding: 5px 15px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ Product Recommendation Submitted</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">${recommendationNumber}</p>
            </div>
            
            <div class="content">
              <p>Hi ${salesRepName},</p>
              
              <p><strong>${vaName}</strong> has completed and submitted a product recommendation for your review.</p>
              
              <div style="margin: 25px 0; text-align: center;">
                <span class="urgent-badge">⏰ ACTION REQUIRED TODAY</span>
              </div>

              <h3 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 8px;">📋 Opportunity Details</h3>
              
              <div class="info-row">
                <div class="info-label">Opportunity #:</div>
                <div class="info-value">${oppNumber}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Customer:</div>
                <div class="info-value">${customerName}</div>
              </div>
              
              ${contactPerson ? `
                <div class="info-row">
                  <div class="info-label">Contact Person:</div>
                  <div class="info-value">${contactPerson}</div>
                </div>
              ` : ''}
              
              <div class="info-row">
                <div class="info-label">Recommendation #:</div>
                <div class="info-value">${recommendationNumber}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Prepared By:</div>
                <div class="info-value">${vaName} (VA)</div>
              </div>

              <h3 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 8px; margin-top: 30px;">📊 Recommendation Summary</h3>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${sectionCount}</div>
                  <div class="stat-label">Sections</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${totalArea}</div>
                  <div class="stat-label">Total m²</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${totalPacks}</div>
                  <div class="stat-label">Total Packs</div>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/opportunities/${opportunityId}" class="button">
                  📝 Review & Convert to Quote
                </a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>⚡ Next Steps (Due Today):</strong><br>
                1. Review the product recommendation details<br>
                2. Click the button above to view the opportunity<br>
                3. Convert recommendation to quote by adding pricing<br>
                4. Send quote to customer
              </p>

              <p style="color: #999; font-size: 13px; margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 4px;">
                💡 <strong>Note:</strong> The VA has NOT added pricing to this recommendation. 
                You will need to select the appropriate pricing tier and review/adjust costs 
                before sending the quote to the customer.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Premier Insulation - Opportunities Management</strong><br>
              This is an automated notification from the VA Workspace.<br>
              Task created: Review Recommendation (Due: Today)</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Premier Insulation <noreply@premierinsulation.co.nz>',
      to: [salesRepEmail],
      subject: `✅ VA Recommendation Ready - ${recommendationNumber} (${customerName}) - ACTION REQUIRED`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      // Don't fail the request if email fails - status was already updated
      return NextResponse.json(
        { 
          success: true, 
          warning: 'Status updated but email notification failed',
          emailError: error 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        messageId: data?.id,
        taskCreated: !taskError,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error in va-submit-recommendation API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
