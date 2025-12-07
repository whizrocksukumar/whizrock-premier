'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import QuoteSendModal from '@/components/QuoteSendModal';

interface QuoteSendButtonProps {
  quote: any;
}

export default function QuoteSendButton({ quote }: QuoteSendButtonProps) {
  const [showSendModal, setShowSendModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowSendModal(true)}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        Send Quote
      </button>

      <QuoteSendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        quote={quote}
        onSuccess={() => {
          // Optionally refresh the page or update status
          window.location.reload();
        }}
      />
    </>
  );
}
