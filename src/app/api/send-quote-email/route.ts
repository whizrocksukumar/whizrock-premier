import { NextRequest, NextResponse } from "next/server";
import { sendQuoteToCustomer } from "@/lib/email-service";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { quoteId } = await request.json();

    if (!quoteId) {
      return NextResponse.json(
        { ok: false, error: "quoteId is required" },
        { status: 400 }
      );
    }

    // Fetch quote with related data
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        *,
        opportunities (
          client_id,
          company_id,
          sales_rep_id,
          clients (first_name, last_name, email),
          companies (company_name, primary_email)
        ),
        team_members!quotes_sales_rep_id_fkey (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { ok: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    // Get customer email and name
    let customerEmail = "";
    let customerName = "";

    if (quote.opportunities?.clients) {
      customerEmail = quote.opportunities.clients.email || "";
      customerName = `${quote.opportunities.clients.first_name} ${quote.opportunities.clients.last_name}`;
    } else if (quote.opportunities?.companies) {
      customerEmail = quote.opportunities.companies.primary_email || "";
      customerName = quote.opportunities.companies.company_name || "";
    } else {
      customerEmail = quote.customer_email || "";
      customerName = `${quote.customer_first_name || ""} ${quote.customer_last_name || ""}`.trim();
    }

    if (!customerEmail) {
      return NextResponse.json(
        { ok: false, error: "No customer email available" },
        { status: 400 }
      );
    }

    // Get sales rep details
    const salesRep = quote.team_members;
    const salesRepName = salesRep
      ? `${salesRep.first_name} ${salesRep.last_name}`
      : "Whizrock Premier Sales Team";
    const salesRepEmail = salesRep?.email || "sales@whizrockpremier.co.nz";
    const salesRepPhone = salesRep?.phone || "";

    // Send email using email service
    const result = await sendQuoteToCustomer({
      customerEmail,
      customerName,
      quoteNumber: quote.quote_number,
      quoteAmount: quote.total_inc_gst || 0,
      siteAddress: quote.site_address || "N/A",
      salesRepName,
      salesRepEmail,
      salesRepPhone,
      viewQuoteUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/quotes/${quote.id}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 }
      );
    }

    // Update quote to mark as sent
    await supabase
      .from("quotes")
      .update({
        sent_at: new Date().toISOString(),
        sent_to_email: customerEmail,
      })
      .eq("id", quoteId);

    return NextResponse.json({
      ok: true,
      message: "Quote sent successfully",
      messageId: result.messageId,
      sentTo: customerEmail,
    });
  } catch (error: any) {
    console.error("send-quote-email error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to send quote" },
      { status: 500 }
    );
  }
}
