import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      opportunityId,
      vaEmail,
      vaName,
      oppNumber,
      customerName,
      contactPerson,
      siteAddress,
      clientType,
      estimatedValue,
      notes,
      attachmentUrls, // Array of {filename, url}
      salesRepName,
      salesRepEmail,
    } = body;

    if (!opportunityId || !vaEmail || !oppNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build attachments section HTML
    let attachmentsHtml = '';
    if (attachmentUrls && attachmentUrls.length > 0) {
      attachmentsHtml = `
        <div style="margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333;">📎 Attached Files (${attachmentUrls.length})</h3>
          <ul style="list-style: none; padding: 0;">
            ${attachmentUrls.map((file: any) => `
              <li style="margin: 8px 0;">
                <a href="${file.url}" target="_blank" style="color: #0066CC; text-decoration: none;">
                  📄 ${file.filename}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Email HTML body
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF6B35; color: white; padding: 25px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 30px; background-color: #ffffff; border: 1px solid #ddd; border-top: none; }
            .info-row { display: flex; margin: 12px 0; padding: 10px; background-color: #f9f9f9; border-radius: 4px; }
            .info-label { font-weight: bold; min-width: 150px; color: #555; }
            .info-value { color: #333; }
            .notes-section { margin: 20px 0; padding: 15px; background-color: #fffbea; border-left: 4px solid #FF6B35; border-radius: 4px; }
            .button { display: inline-block; padding: 14px 28px; background-color: #0066CC; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; margin-top: 30px; }
            .urgent-badge { background-color: #FF6B35; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎯 New Product Recommendation Request</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Opportunity ${oppNumber}</p>
            </div>
            
            <div class="content">
              <p>Hi ${vaName},</p>
              
              <p>You have been assigned a new product recommendation request from <strong>${salesRepName}</strong>.</p>
              
              <div style="margin: 25px 0;">
                <span class="urgent-badge">ACTION REQUIRED</span>
              </div>

              <h3 style="color: #0066CC; border-bottom: 2px solid #0066CC; padding-bottom: 8px;">📋 Opportunity Details</h3>
              
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
                <div class="info-label">Client Type:</div>
                <div class="info-value">${clientType || 'N/A'}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Site Address:</div>
                <div class="info-value">${siteAddress || 'N/A'}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Estimated Value:</div>
                <div class="info-value">$${estimatedValue ? parseFloat(estimatedValue).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Sales Rep:</div>
                <div class="info-value">${salesRepName} (${salesRepEmail})</div>
              </div>

              ${notes ? `
                <div class="notes-section">
                  <h4 style="margin-top: 0; color: #FF6B35;">📝 Special Instructions</h4>
                  <p style="margin: 0; white-space: pre-wrap;">${notes}</p>
                </div>
              ` : ''}

              ${attachmentsHtml}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/va-workspace/new?opportunityId=${opportunityId}" class="button">
                  🚀 Create Product Recommendation
                </a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Next Steps:</strong><br>
                1. Review the opportunity details and attachments<br>
                2. Click the button above to open VA Workspace<br>
                3. Create product recommendation (no pricing needed)<br>
                4. Submit for sales rep review
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Premier Insulation - VA Workspace</strong><br>
              This is an automated notification. Please do not reply to this email.<br>
              Questions? Contact ${salesRepEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Premier Insulation <noreply@premierinsulation.co.nz>',
      to: [vaEmail],
      cc: [salesRepEmail],
      subject: `🎯 New Product Recommendation Request - ${oppNumber} (${customerName})`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    // Update opportunity status to "Sent to VA"
    const { error: updateError } = await supabase
      .from('opportunities')
      .update({ 
        recommendation_status: 'Sent to VA',
        updated_at: new Date().toISOString()
      })
      .eq('id', opportunityId);

    if (updateError) {
      console.error('Failed to update opportunity status:', updateError);
      // Don't fail the request if status update fails, email was sent
    }

    // Get VA user ID from email
    const { data: vaUser, error: vaUserError } = await supabase
      .from('team_members')
      .select('id')
      .eq('email', vaEmail)
      .single();

    // Create task for VA user
    if (vaUser && !vaUserError) {
      const today = new Date().toISOString().split('T')[0];
      
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          opportunity_id: opportunityId,
          task_description: `Create product recommendation for ${customerName}${contactPerson ? ` (Contact: ${contactPerson})` : ''}`,
          task_type: 'Create Recommendation',
          assigned_to_user_id: vaUser.id,
          created_by_user_id: vaUser.id, // System-created, assigned to VA
          due_date: today,
          status: 'Not Started',
          priority: 'High',
          completion_percent: 0,
          notes: `Opportunity ${oppNumber} has been sent to VA for product recommendation.\n\nClient Details:\n- Site: ${siteAddress || 'N/A'}\n- Type: ${clientType || 'N/A'}\n- Est. Value: $${estimatedValue || '0'}\n\n${notes ? 'Special Instructions:\n' + notes : ''}`,
          is_active: true,
        });

      if (taskError) {
        console.error('Failed to create VA task:', taskError);
        // Continue anyway - email was sent successfully
      }
    }

    return NextResponse.json(
      { success: true, messageId: data?.id, taskCreated: !!(vaUser && !vaUserError) },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error in send-to-va API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
