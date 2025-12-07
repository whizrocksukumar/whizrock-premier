'use client';

import { useState } from 'react';
import { X, Mail, Printer, Download, FileText, DollarSign } from 'lucide-react';
import { generateQuotePDF, downloadPDF, printPDF, sendQuoteByEmail } from '@/lib/pdf/quote-pdf-utils';

interface QuoteSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: any;
  onSuccess?: () => void;
}

export default function QuoteSendModal({ isOpen, onClose, quote, onSuccess }: QuoteSendModalProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'print' | 'download'>('email');
  const [pdfType, setPdfType] = useState<'no-pricing' | 'with-pricing'>('no-pricing');
  const [sending, setSending] = useState(false);
  const [emailTo, setEmailTo] = useState(quote?.customer_email || '');
  const [emailSubject, setEmailSubject] = useState(`Quote #${quote?.quote_number} from Premier Insulation`);

  if (!isOpen) return null;

  const handleEmailSend = async () => {
    try {
      setSending(true);
      
      // Generate PDF with selected pricing option
      const showPricing = pdfType === 'with-pricing';
      const pdfBlob = await generateQuotePDF(quote, showPricing);

      // Send email
      await sendQuoteByEmail({
        to: emailTo,
        subject: emailSubject,
        customerName: quote.customer_name,
        quoteNumber: quote.quote_number,
        pdfBlob: pdfBlob,
      });

      alert('Quote sent successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error sending quote:', error);
      alert(`Failed to send quote: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handlePrint = async () => {
    try {
      setSending(true);
      const showPricing = pdfType === 'with-pricing';
      const pdfBlob = await generateQuotePDF(quote, showPricing);
      printPDF(pdfBlob);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error printing quote:', error);
      alert(`Failed to print quote: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async () => {
    try {
      setSending(true);
      const showPricing = pdfType === 'with-pricing';
      const pdfBlob = await generateQuotePDF(quote, showPricing);
      downloadPDF(pdfBlob, `Quote-${quote.quote_number}.pdf`);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error downloading quote:', error);
      alert(`Failed to download quote: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleAction = () => {
    switch (activeTab) {
      case 'email':
        return handleEmailSend();
      case 'print':
        return handlePrint();
      case 'download':
        return handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send Quote</h2>
            <p className="text-sm text-gray-500 mt-1">Quote #{quote?.quote_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'email'
                ? 'text-[#0066CC] border-b-2 border-[#0066CC] bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Email
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'print'
                ? 'text-[#0066CC] border-b-2 border-[#0066CC] bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Printer className="w-4 h-4 inline mr-2" />
            Print
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'download'
                ? 'text-[#0066CC] border-b-2 border-[#0066CC] bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* PDF Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              PDF Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPdfType('no-pricing')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  pdfType === 'no-pricing'
                    ? 'border-[#0066CC] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2 text-[#0066CC]" />
                <p className="font-medium text-sm text-gray-900">Standard Quote</p>
                <p className="text-xs text-gray-500 mt-1">
                  No line item pricing shown. Total only at the end.
                </p>
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                  Recommended
                </span>
              </button>

              <button
                onClick={() => setPdfType('with-pricing')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  pdfType === 'with-pricing'
                    ? 'border-[#0066CC] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-[#0066CC]" />
                <p className="font-medium text-sm text-gray-900">Detailed Quote</p>
                <p className="text-xs text-gray-500 mt-1">
                  Full breakdown with unit prices and line totals.
                </p>
              </button>
            </div>
          </div>

          {/* Email Form */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Email Preview:</strong> A professional email will be sent with your quote attached as a PDF. The email includes your company branding and contact information.
                </p>
              </div>
            </div>
          )}

          {/* Print Info */}
          {activeTab === 'print' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Print Settings:</strong> The quote will open in a new window with your selected format. You can then print it using your browser's print dialog.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li>• Recommended: Print in color for best appearance</li>
                <li>• Paper size: A4</li>
                <li>• Margins: Default</li>
              </ul>
            </div>
          )}

          {/* Download Info */}
          {activeTab === 'download' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Download:</strong> The quote will be downloaded as a PDF file to your computer. You can then email it manually or print it later.
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Filename: <span className="font-mono bg-white px-2 py-1 rounded">Quote-{quote?.quote_number}.pdf</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAction}
            disabled={sending || (activeTab === 'email' && !emailTo)}
            className="px-6 py-2 text-sm font-medium text-white bg-[#0066CC] rounded-lg hover:bg-[#0052a3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                {activeTab === 'email' && <Mail className="w-4 h-4" />}
                {activeTab === 'print' && <Printer className="w-4 h-4" />}
                {activeTab === 'download' && <Download className="w-4 h-4" />}
                {activeTab === 'email' && 'Send Email'}
                {activeTab === 'print' && 'Print Quote'}
                {activeTab === 'download' && 'Download PDF'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
