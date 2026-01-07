/**
 * Email Service using Resend API
 * Centralized email sending with template support
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.Resend_API_KEY);

const FROM_EMAIL = 'noreply@whizrockpremier.co.nz';
const FROM_NAME = 'Whizrock Premier';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      reply_to: options.replyTo,
      attachments: options.attachments,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Email send failed: ${error.message}`);
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Template variables replacement helper
 */
export function replaceTemplateVars(template: string, vars: Record<string, any>): string {
  let result = template;

  Object.keys(vars).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(vars[key] || ''));
  });

  return result;
}

/**
 * Send assessment completion email to VA
 */
export async function sendAssessmentCompletedToVA(params: {
  vaEmail: string;
  vaName: string;
  assessmentId: string;
  assessmentReference: string;
  customerName: string;
  siteAddress: string;
  assessmentDate: string;
  dashboardUrl: string;
}) {
  const template = await import('./email-templates/assessment-completed-va');

  const html = replaceTemplateVars(template.html, {
    va_name: params.vaName,
    customer_name: params.customerName,
    site_address: params.siteAddress,
    assessment_reference: params.assessmentReference,
    assessment_date: params.assessmentDate,
    dashboard_url: params.dashboardUrl,
    create_recommendation_url: `${params.dashboardUrl}/product-recommendations/new?assessmentId=${params.assessmentId}`,
  });

  return sendEmail({
    to: params.vaEmail,
    subject: `New Assessment Completed - ${params.assessmentReference}`,
    html,
  });
}

/**
 * Send recommendation approval request to Premier user
 */
export async function sendRecommendationApprovalRequest(params: {
  premierEmail: string;
  premierName: string;
  recommendationId: string;
  vaName: string;
  customerName: string;
  siteAddress: string;
  dashboardUrl: string;
}) {
  const template = await import('./email-templates/recommendation-needs-approval');

  const html = replaceTemplateVars(template.html, {
    premier_name: params.premierName,
    va_name: params.vaName,
    customer_name: params.customerName,
    site_address: params.siteAddress,
    review_url: `${params.dashboardUrl}/product-recommendations/${params.recommendationId}`,
  });

  return sendEmail({
    to: params.premierEmail,
    subject: `Recommendation Ready for Approval - ${params.customerName}`,
    html,
  });
}

/**
 * Send recommendation approved notification to VA
 */
export async function sendRecommendationApprovedToVA(params: {
  vaEmail: string;
  vaName: string;
  recommendationId: string;
  approverName: string;
  customerName: string;
  dashboardUrl: string;
}) {
  const template = await import('./email-templates/recommendation-approved');

  const html = replaceTemplateVars(template.html, {
    va_name: params.vaName,
    approver_name: params.approverName,
    customer_name: params.customerName,
    finalize_url: `${params.dashboardUrl}/product-recommendations/${params.recommendationId}`,
  });

  return sendEmail({
    to: params.vaEmail,
    subject: `Recommendation Approved - ${params.customerName}`,
    html,
  });
}

/**
 * Send quote to customer
 */
export async function sendQuoteToCustomer(params: {
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  quoteAmount: number;
  siteAddress: string;
  salesRepName: string;
  salesRepEmail: string;
  salesRepPhone: string;
  quotePdfUrl?: string;
  viewQuoteUrl: string;
}) {
  const template = await import('./email-templates/quote-to-customer');

  const html = replaceTemplateVars(template.html, {
    customer_name: params.customerName,
    quote_number: params.quoteNumber,
    quote_amount: new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(params.quoteAmount),
    site_address: params.siteAddress,
    sales_rep_name: params.salesRepName,
    sales_rep_email: params.salesRepEmail,
    sales_rep_phone: params.salesRepPhone,
    view_quote_url: params.viewQuoteUrl,
  });

  const attachments = params.quotePdfUrl ? [{
    filename: `Quote-${params.quoteNumber}.pdf`,
    content: params.quotePdfUrl, // URL or Buffer
  }] : undefined;

  return sendEmail({
    to: params.customerEmail,
    subject: `Your Insulation Quote ${params.quoteNumber}`,
    html,
    replyTo: params.salesRepEmail,
    attachments,
  });
}

/**
 * Send job completion certificate to customer
 */
export async function sendCertificateToCustomer(params: {
  customerEmail: string;
  customerName: string;
  certificateNumber: string;
  jobCompletionDate: string;
  siteAddress: string;
  warrantyMonths: number;
  certificatePdfUrl?: string;
  viewCertificateUrl: string;
}) {
  const template = await import('./email-templates/certificate-to-customer');

  const html = replaceTemplateVars(template.html, {
    customer_name: params.customerName,
    certificate_number: params.certificateNumber,
    job_completion_date: params.jobCompletionDate,
    site_address: params.siteAddress,
    warranty_months: String(params.warrantyMonths),
    view_certificate_url: params.viewCertificateUrl,
  });

  const attachments = params.certificatePdfUrl ? [{
    filename: `Certificate-${params.certificateNumber}.pdf`,
    content: params.certificatePdfUrl,
  }] : undefined;

  return sendEmail({
    to: params.customerEmail,
    subject: `Your Job Completion Certificate ${params.certificateNumber}`,
    html,
    attachments,
  });
}

/**
 * Send installer notification
 */
export async function sendInstallerNotification(params: {
  installerEmail: string;
  installerName: string;
  jobNumber: string;
  customerName: string;
  siteAddress: string;
  scheduledDate: string;
  dashboardUrl: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0066CC; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">New Job Assigned</h1>
      </div>

      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${params.installerName},</p>

        <p>You have been assigned to a new installation job:</p>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Job Number:</strong> ${params.jobNumber}</p>
          <p><strong>Customer:</strong> ${params.customerName}</p>
          <p><strong>Site Address:</strong> ${params.siteAddress}</p>
          <p><strong>Scheduled Date:</strong> ${params.scheduledDate}</p>
        </div>

        <p>
          <a href="${params.dashboardUrl}/jobs/${params.jobNumber}"
             style="display: inline-block; background-color: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
            View Job Details
          </a>
        </p>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Please confirm your availability and review the job requirements in your dashboard.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>Whizrock Premier Insulation Services</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: params.installerEmail,
    subject: `New Job Assigned - ${params.jobNumber}`,
    html,
  });
}
