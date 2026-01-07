import { NextRequest, NextResponse } from "next/server";
import { sendRecommendationApprovedToVA } from "@/lib/email-service";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Premier user approves or rejects recommendation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recommendationId = params.id;
    const { action, approvedBy, rejectionReason } = await request.json();

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { ok: false, error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Fetch recommendation
    const { data: recommendation, error: recError } = await supabase
      .from("product_recommendations")
      .select(`
        *,
        assessments (
          opportunities (
            clients (first_name, last_name),
            companies (company_name)
          )
        )
      `)
      .eq("id", recommendationId)
      .single();

    if (recError || !recommendation) {
      return NextResponse.json(
        { ok: false, error: "Recommendation not found" },
        { status: 404 }
      );
    }

    if (recommendation.approval_status !== "Pending") {
      return NextResponse.json(
        { ok: false, error: "Recommendation is not pending approval" },
        { status: 400 }
      );
    }

    // Get approver details
    const { data: approver } = await supabase
      .from("team_members")
      .select("first_name, last_name, email")
      .eq("email", approvedBy)
      .single();

    const approverName = approver
      ? `${approver.first_name} ${approver.last_name}`
      : "Premier Team";

    if (action === "approve") {
      // Update recommendation to approved
      await supabase
        .from("product_recommendations")
        .update({
          approval_status: "Approved",
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq("id", recommendationId);

      // Get VA email
      const { data: vaUser } = await supabase
        .from("team_members")
        .select("email, first_name, last_name")
        .eq("email", recommendation.created_by)
        .single();

      if (vaUser) {
        // Get customer name
        let customerName = "";
        const opportunity = recommendation.assessments?.opportunities;
        if (opportunity?.clients) {
          customerName = `${opportunity.clients.first_name} ${opportunity.clients.last_name}`;
        } else if (opportunity?.companies) {
          customerName = opportunity.companies.company_name || "";
        }

        // Send approval email to VA
        const emailResult = await sendRecommendationApprovedToVA({
          vaEmail: vaUser.email,
          vaName: `${vaUser.first_name} ${vaUser.last_name}`,
          recommendationId: recommendation.id,
          approverName,
          customerName,
          dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        });

        if (!emailResult.success) {
          console.error("Failed to send approval email:", emailResult.error);
        }

        // Create task for VA to finalize
        await supabase.from("tasks").insert({
          task_description: `Finalize approved recommendation for ${customerName}`,
          assigned_to_user_id: vaUser.email,
          related_entity_type: "product_recommendation",
          related_entity_id: recommendationId,
          due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "High",
          status: "Pending",
        });

        return NextResponse.json({
          ok: true,
          message: "Recommendation approved and VA notified",
          messageId: emailResult.messageId,
        });
      }

      return NextResponse.json({
        ok: true,
        message: "Recommendation approved",
      });
    } else {
      // Reject recommendation
      await supabase
        .from("product_recommendations")
        .update({
          approval_status: "Rejected",
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", recommendationId);

      // TODO: Optionally notify VA about rejection
      // Could add sendRecommendationRejectedToVA() function

      return NextResponse.json({
        ok: true,
        message: "Recommendation rejected",
      });
    }
  } catch (error: any) {
    console.error("Approve/reject recommendation error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to process approval" },
      { status: 500 }
    );
  }
}
