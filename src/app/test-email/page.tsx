'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAssessmentEmail = async () => {
    setLoading(true);
    try {
      // Replace with a real assessment ID from your database
      const response = await fetch('/api/assessments/YOUR_ASSESSMENT_ID/complete', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    }
    setLoading(false);
  };

  const testQuoteEmail = async () => {
    setLoading(true);
    try {
      // Replace with a real quote ID from your database
      const response = await fetch('/api/send-quote-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: 'YOUR_QUOTE_ID' }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Email Testing Page</h1>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Assessment Completion Email</h2>
          <p className="text-gray-600 mb-4">
            Sends email to VA when assessment is marked complete
          </p>
          <button
            onClick={testAssessmentEmail}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Test Assessment Email'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Quote Email to Customer</h2>
          <p className="text-gray-600 mb-4">
            Sends quote email to customer
          </p>
          <button
            onClick={testQuoteEmail}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Test Quote Email'}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
          <li>Replace 'YOUR_ASSESSMENT_ID' and 'YOUR_QUOTE_ID' with real IDs from your database</li>
          <li>Check your Resend dashboard to see if emails are being sent</li>
          <li>Verify the recipient email addresses exist in your database</li>
          <li>This page should be removed before production deployment</li>
        </ol>
      </div>
    </div>
  );
}
