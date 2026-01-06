
# addnewquote-changes.md

## Why this change is being done

The Add New Quote and Quote Edit flow was originally designed to **create and update a single quote record**.
While functionally correct, this approach caused a **loss of audit history** whenever a quote was negotiated, revised, or resent.

From a business, legal, and operational standpoint, this is risky:
- There is no clarity on which quote version was sent or discussed
- Earlier versions are overwritten and lost
- Terms & Conditions may change over time, affecting historical quotes

This change introduces **proper quote versioning and audit integrity** while preserving all existing UI, routes, and calculations.

No layouts are changed.  
No routes are changed.  
No existing logic is removed.

The VS Code agent should **read this file and apply the changes surgically** to the existing codebase.

---

## Behaviour After Changes

### Save Draft
- Overwrites the current draft
- Uses:
  - version_number = 0
  - is_draft = true
  - is_current = true
- Drafts are editable and not part of audit history

### Create & Send (Final)
- Creates a new quote row
- Increments version number (1, 2, 3…)
- Marks previous final version as not current
- Freezes Terms & Conditions for that version
- Final versions are immutable

---

## File 1: Add New Quote Page (changes only)

### Helper Function (add above handleSaveDraft)

```ts
const getNextQuoteVersion = async (quoteNumber: string) => {
  const { data } = await supabase
    .from('quotes')
    .select('version_number')
    .eq('quote_number', quoteNumber)
    .eq('is_draft', false)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  return (data?.version_number || 0) + 1;
};
```

---

### handleSaveDraft (ensure these fields are present)

```ts
version_number: 0,
is_draft: true,
is_current: true,
parent_quote_id: null,
```

No other logic should be changed.

---

### handleSendToClient (replace function body)

```ts
const handleSendToClient = async () => {
  try {
    setSaving(true);

    if (!quoteNumber) {
      alert('Quote number is required before sending');
      return;
    }

    const nextVersion = await getNextQuoteVersion(quoteNumber);

    await supabase
      .from('quotes')
      .update({ is_current: false })
      .eq('quote_number', quoteNumber)
      .eq('is_current', true);

    const { data: finalQuote, error } = await supabase
      .from('quotes')
      .insert({
        quote_number: quoteNumber,
        client_id: clientId,
        site_address: siteAddress,
        city,
        postcode,
        region_id: regionId,
        job_type: jobType,
        sales_rep_id: salesRepId || null,
        status: 'Sent',
        quote_date: quoteDate,
        valid_until: validUntil,
        notes,
        pricing_tier: pricingTier,
        markup_percent: markupPercent,
        waste_percent: wastePercent,
        labour_rate: labourRate,
        total_cost_ex_gst: parseFloat(totals.totalCostExGST),
        total_sell_ex_gst: parseFloat(totals.totalSellExGST),
        gst_amount: parseFloat(totals.gstAmount),
        total_inc_gst: parseFloat(totals.totalIncGST),
        gross_profit: parseFloat(totals.grossProfit),
        gross_profit_percent: parseFloat(totals.grossProfitPercent),
        subtotal: parseFloat(totals.totalSellExGST),
        total_amount: parseFloat(totals.totalIncGST),
        version_number: nextVersion,
        is_draft: false,
        is_current: true,
        finalised_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    const { data: terms } = await supabase
      .from('quote_terms_master')
      .select('title, body')
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (terms) {
      await supabase.from('quote_terms_snapshot').insert({
        quote_id: finalQuote.id,
        title: terms.title,
        body: terms.body,
      });
    }

    router.push(`/quotes/${finalQuote.id}`);
  } catch (err: any) {
    alert(err.message);
  } finally {
    setSaving(false);
  }
};
```

---

## File 2: Quote Detail Page
**Path:** `src/app/quotes/[id]/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function QuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [terms, setTerms] = useState<any>(null);

  useEffect(() => {
    loadQuote();
  }, []);

  async function loadQuote() {
    const { data } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    setQuote(data);

    if (!data.is_draft) {
      const { data: t } = await supabase
        .from('quote_terms_snapshot')
        .select('*')
        .eq('quote_id', data.id)
        .single();

      setTerms(t);
    }
  }

  if (!quote) return null;

  const displayNumber =
    quote.version_number > 1
      ? `${quote.quote_number}.${quote.version_number}`
      : quote.quote_number;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">
        Quote {displayNumber}
      </h1>

      <p>Status: {quote.status}</p>

      <button
        className="btn-secondary mt-4"
        onClick={() => router.push(`/quotes/${quote.id}/edit`)}
      >
        Revise Quote
      </button>

      {terms && (
        <div className="mt-8 text-sm">
          <h3 className="font-semibold mb-2">{terms.title}</h3>
          <pre className="whitespace-pre-wrap">{terms.body}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## File 3: Quote Edit Page (behavioural rule)

- If `is_draft === false`, fields must be read-only
- Add a **Revise Quote** button that clones the quote into a new draft

This preserves audit history while allowing negotiation.

---

## Final Notes

These changes:
- Do NOT alter UI layout
- Do NOT alter routing
- Do NOT alter calculations
- DO add audit-grade versioning

This document is intended to be read by a VS Code agent or developer and applied with precision.
