import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key
// You'll need to add RESEND_API_KEY to your .env.local file
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const to = formData.get('to') as string;
    const subject = formData.get('subject') as string;
    const customerName = formData.get('customerName') as string;
    const quoteNumber = formData.get('quoteNumber') as string;
    const pdfFile = formData.get('pdf') as Blob;

    if (!to || !subject || !pdfFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert blob to buffer
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    // Email HTML body
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0066CC; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
            .button { display: inline-block; padding: 12px 24px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Premier Insulation</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              
              <p>Thank you for your interest in Premier Insulation.</p>
              
              <p>Please find attached your quotation <strong>#${quoteNumber}</strong>.</p>
              
              <p>This quote is valid for 30 days from the date of issue. If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.</p>
              
              <p>We look forward to working with you on your insulation project.</p>
              
              <p>Best regards,<br>
              <strong>Premier Insulation Team</strong></p>
            </div>
            <div class="footer">
              <p><strong>Premier Insulation</strong><br>
              West Auckland • Rodney<br>
              Phone: 0800 PREMIER | Email: quotes@premierinsulation.co.nz<br>
              www.premierinsulation.co.nz</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Premier Insulation <quotes@premierinsulation.co.nz>',
      to: [to],
      subject: subject,
      html: emailHtml,
      attachments: [
        {
          filename: `Quote-${quoteNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error in send-quote-email API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
