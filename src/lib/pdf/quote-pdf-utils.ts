import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from './quote-pdf-generator';

interface QuoteEmailData {
  to: string;
  subject: string;
  customerName: string;
  quoteNumber: string;
  pdfBlob: Blob;
}

/**
 * Generate PDF blob from quote data
 */
export async function generateQuotePDF(quoteData: any, showPricing: boolean = false): Promise<Blob> {
  const document = <QuotePDF quote={quoteData} showPricing={showPricing} />;
  const blob = await pdf(document).toBlob();
  return blob;
}

/**
 * Download PDF to user's computer
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open PDF in new window for printing
 */
export function printPDF(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url);
  
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  } else {
    alert('Please allow popups to print the PDF');
  }
}

/**
 * Send quote via email
 * Note: This requires a backend API endpoint to actually send the email
 */
export async function sendQuoteByEmail(emailData: QuoteEmailData): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('to', emailData.to);
    formData.append('subject', emailData.subject);
    formData.append('customerName', emailData.customerName);
    formData.append('quoteNumber', emailData.quoteNumber);
    formData.append('pdf', emailData.pdfBlob, `Quote-${emailData.quoteNumber}.pdf`);

    const response = await fetch('/api/send-quote-email', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Get email template for quote
 */
export function getQuoteEmailTemplate(customerName: string, quoteNumber: string): string {
  return `
Dear ${customerName},

Thank you for your interest in Premier Insulation.

Please find attached your quotation #${quoteNumber}.

This quote is valid for 30 days from the date of issue. If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.

We look forward to working with you on your insulation project.

Best regards,

Premier Insulation Team
West Auckland • Rodney
Phone: 0800 PREMIER
Email: quotes@premierinsulation.co.nz
www.premierinsulation.co.nz
  `.trim();
}
