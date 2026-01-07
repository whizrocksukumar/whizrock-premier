import { NextRequest, NextResponse } from "next/server";
import { createQuoteFromRecommendation } from "@/lib/utils/create-quote-from-recommendation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * VA submits recommendation for finalization
 * This auto-creates a draft quote for sales rep to add pricing
 */
export async function POST(request: NextRequest) {
  try {
    const { recommendationId } = await request.json();

    if (!recommendationId) {
      return NextResponse.json(
        { ok: false, error: "recommendationId is required" },
        { status: 400 }
      );
    }

    // Verify recommendation exists and is approved
    const { data: recommendation, error: recError } = await supabase
      .from("product_recommendations")
      .select("*")
      .eq("id", recommendationId)
      .single();

    if (recError || !recommendation) {
      return NextResponse.json(
        { ok: false, error: "Recommendation not found" },
        { status: 404 }
      );
    }

    if (recommendation.approval_status !== "Approved") {
      return NextResponse.json(
        { ok: false, error: "Only approved recommendations can be submitted" },
        { status: 400 }
      );
    }

    // Update recommendation status to Finalized
    await supabase
      .from("product_recommendations")
      .update({
        recommendation_status: "Finalized",
        finalized_at: new Date().toISOString(),
      })
      .eq("id", recommendationId);

    // Auto-create draft quote using helper function
    const quoteResult = await createQuoteFromRecommendation(recommendationId);

    if (!quoteResult.success) {
      return NextResponse.json(
        { ok: false, error: quoteResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Recommendation submitted and quote created successfully",
      quote: quoteResult.quote,
      quoteNumber: quoteResult.quoteNumber,
    });
  } catch (error: any) {
    console.error("va-submit-recommendation error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to submit recommendation" },
      { status: 500 }
    );
  }
}
