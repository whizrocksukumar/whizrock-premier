'use client';

import Link from 'next/link';
import { ArrowLeft, Download, Mail, Printer } from 'lucide-react';

interface CertificateActionsProps {
  jobId: string;
}

export default function CertificateActions({ jobId }: CertificateActionsProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    alert('PDF download functionality coming soon!');
  };

  const handleEmailCustomer = () => {
    // TODO: Implement email functionality
    alert('Email functionality coming soon!');
  };

  return (
    <div className="max-w-5xl mx-auto mb-6 px-6 print:hidden">
      <div className="flex items-center justify-between">
        <Link
          href={`/jobs/${jobId}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleEmailCustomer}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email to Customer
          </button>
        </div>
      </div>
    </div>
  );
}
