# Quote PDF System - Quick Start

## Installation Steps

Run these commands in order:

```bash
# 1. Install new dependencies
npm install @react-pdf/renderer@^3.4.0 resend@^3.2.0

# 2. Create environment file
# Create .env.local in project root with:
RESEND_API_KEY=your_api_key_here

# 3. Restart development server
npm run dev
```

## Get Resend API Key

1. Go to https://resend.com
2. Sign up for free account
3. Navigate to API Keys section
4. Create new API key
5. Copy and paste into `.env.local`

## Verify Installation

1. Navigate to any quote: http://localhost:3000/quotes/[any-quote-id]
2. Look for green "Send Quote" button
3. Click it to open the modal
4. Test PDF generation with "Download" tab

## Troubleshooting

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### PDF not generating
- Check browser console for errors
- Verify logo path: `/public/premier-insulation-logo-orange` exists
- Try with simplified data first

### Email not sending
- Confirm RESEND_API_KEY is set correctly
- Check API key permissions in Resend dashboard  
- Use test domain for development

## Quick Test

```typescript
// Test PDF generation directly in browser console:
import { generateQuotePDF } from '@/lib/pdf/quote-pdf-utils';

const testQuote = {
  quote_number: 'TEST-001',
  quote_date: new Date().toISOString(),
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '021-555-0100',
  site_address: '123 Test Street',
  city: 'Auckland',
  postcode: '1010',
  job_type: 'Residential',
  subtotal: 1000,
  gst_amount: 150,
  total_amount: 1150,
  sections: []
};

const pdf = await generateQuotePDF(testQuote, false);
console.log('PDF generated:', pdf);
```

## Next Steps

1. Install dependencies
2. Configure Resend API key
3. Test PDF generation
4. Test email sending
5. Customize colors/branding as needed
6. Update terms & conditions if required

For detailed documentation, see:
- `PDF_SYSTEM_README.md` - Complete setup guide
- `QUOTE_PDF_SYSTEM_SUMMARY.md` - System architecture and features
