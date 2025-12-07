'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Send } from 'lucide-react';
import Link from 'next/link';

interface QuoteData {
  id: string;
  quote_number: string;
  client_id: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_company: string | null;
  site_address: string | null;
  city: string | null;
  postcode: string | null;
  job_type: string | null;
  status: string;
  quote_date: string | null;
  valid_until: string | null;
  subtotal: number | null;
  gst_amount: number | null;
  total_amount: number | null;
  margin_percentage: number | null;
  notes: string | null;
}

export default function EditQuotePage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  
  // Form state
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [jobType, setJobType] = useState('');
  const [status, setStatus] = useState('Draft');
  const [quoteDate, setQuoteDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (quoteId) {
      loadQuote();
    }
  }, [quoteId]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (error) throw error;
      
      if (data) {
        setQuote(data);
        // Populate form fields
        setCustomerFirstName(data.customer_first_name || '');
        setCustomerLastName(data.customer_last_name || '');
        setCustomerEmail(data.customer_email || '');
        setCustomerPhone(data.customer_phone || '');
        setCustomerCompany(data.customer_company || '');
        setSiteAddress(data.site_address || '');
        setCity(data.city || '');
        setPostcode(data.postcode || '');
        setJobType(data.job_type || '');
        setStatus(data.status || 'Draft');
        setQuoteDate(data.quote_date || '');
        setValidUntil(data.valid_until || '');
        setNotes(data.notes || '');
      }
    } catch (error: any) {
      console.error('Error loading quote:', error);
      alert(`Error loading quote: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('quotes')
        .update({
          customer_first_name: customerFirstName || null,
          customer_last_name: customerLastName || null,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          customer_company: customerCompany || null,
          site_address: siteAddress || null,
          city: city || null,
          postcode: postcode || null,
          job_type: jobType || null,
          status: status,
          quote_date: quoteDate || null,
          valid_until: validUntil || null,
          notes: notes || null,
        })
        .eq('id', quoteId);

      if (error) throw error;

      alert('Quote updated successfully!');
      router.push(`/quotes/${quoteId}`);
    } catch (error: any) {
      console.error('Error updating quote:', error);
      alert(`Error updating quote: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/quotes" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" />Back to Quotes
          </Link>
          <div className="card">
            <p className="text-center text-gray-600">Quote not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href={`/quotes/${quoteId}`} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" />Back to Quote
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Quote: {quote.quote_number}</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quote Information</h2>
          
          {/* Customer Information Section */}
          <div className="mb-8">
            <h3 className="text-base font-medium text-gray-700 mb-4 pb-2 border-b">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  value={customerFirstName}
                  onChange={(e) => setCustomerFirstName(e.target.value)}
                  className="form-input"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  value={customerLastName}
                  onChange={(e) => setCustomerLastName(e.target.value)}
                  className="form-input"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="form-input"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Company</label>
                <input
                  type="text"
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  className="form-input"
                  placeholder="Enter company name"
                />
              </div>
            </div>
          </div>

          {/* Site & Job Information */}
          <div className="mb-8">
            <h3 className="text-base font-medium text-gray-700 mb-4 pb-2 border-b">Site & Job Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="form-label">Site Address</label>
                <input
                  type="text"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="form-input"
                  placeholder="Enter site address"
                />
              </div>
              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="form-input"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="form-label">Postcode</label>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="form-input"
                  placeholder="Enter postcode"
                />
              </div>
              <div>
                <label className="form-label">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select job type</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <div className="mb-8">
            <h3 className="text-base font-medium text-gray-700 mb-4 pb-2 border-b">Quote Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Quote Date</label>
                <input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                  rows={4}
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link
              href={`/quotes/${quoteId}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052a3] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
