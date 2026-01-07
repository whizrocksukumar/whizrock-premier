import { NextRequest, NextResponse } from "next/server";
import { createJobFromQuote } from "@/lib/utils/create-job-from-quote";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Accept quote and auto-create job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;

    // Verify quote exists and is not already accepted
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { ok: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    if (quote.status === "Accepted" || quote.status === "Won") {
      return NextResponse.json(
        { ok: false, error: "Quote has already been accepted" },
        { status: 400 }
      );
    }

    // Update quote to Accepted
    await supabase
      .from("quotes")
      .update({
        status: "Accepted",
        accepted_date: new Date().toISOString(),
      })
      .eq("id", quoteId);

    // Auto-create job using helper function
    const jobResult = await createJobFromQuote(quoteId);

    if (!jobResult.success) {
      return NextResponse.json(
        { ok: false, error: jobResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Quote accepted and job created successfully",
      job: jobResult.job,
      jobNumber: jobResult.jobNumber,
    });
  } catch (error: any) {
    console.error("Accept quote error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to accept quote" },
      { status: 500 }
    );
  }
}
