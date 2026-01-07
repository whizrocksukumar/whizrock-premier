import { NextRequest, NextResponse } from "next/server";
import { sendRecommendationApprovalRequest } from "@/lib/email-service";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * VA submits recommendation for Premier user approval
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recommendationId = params.id;

    // Fetch recommendation with related data
    const { data: recommendation, error: recError } = await supabase
      .from("product_recommendations")
      .select(`
        *,
        assessments (
          *,
          opportunities (
            client_id,
            company_id,
            sales_rep_id,
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

    // Get Premier user (sales rep or default admin)
    let premierUser = null;
    if (recommendation.assessments?.opportunities?.sales_rep_id) {
      const { data: salesRep } = await supabase
        .from("team_members")
        .select("email, first_name, last_name")
        .eq("id", recommendation.assessments.opportunities.sales_rep_id)
        .single();
      premierUser = salesRep;
    }

    // Fallback to admin if no sales rep
    if (!premierUser) {
      const { data: admins } = await supabase
        .from("team_members")
        .select("email, first_name, last_name")
        .eq("role", "Admin")
        .eq("is_active", true)
        .limit(1);
      premierUser = admins?.[0];
    }

    if (!premierUser) {
      return NextResponse.json(
        { ok: false, error: "No Premier user found for approval" },
        { status: 400 }
      );
    }

    // Get VA name from created_by
    const { data: vaUser } = await supabase
      .from("team_members")
      .select("first_name, last_name")
      .eq("email", recommendation.created_by)
      .single();

    const vaName = vaUser
      ? `${vaUser.first_name} ${vaUser.last_name}`
      : "VA Team";

    // Get customer name
    let customerName = "";
    const opportunity = recommendation.assessments?.opportunities;
    if (opportunity?.clients) {
      customerName = `${opportunity.clients.first_name} ${opportunity.clients.last_name}`;
    } else if (opportunity?.companies) {
      customerName = opportunity.companies.company_name || "";
    }

    // Send approval request email
    const emailResult = await sendRecommendationApprovalRequest({
      premierEmail: premierUser.email,
      premierName: `${premierUser.first_name} ${premierUser.last_name}`,
      recommendationId: recommendation.id,
      vaName,
      customerName,
      siteAddress: recommendation.assessments?.site_address || "N/A",
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { ok: false, error: emailResult.error },
        { status: 500 }
      );
    }

    // Update recommendation status
    await supabase
      .from("product_recommendations")
      .update({
        approval_status: "Pending",
        submitted_for_approval_at: new Date().toISOString(),
      })
      .eq("id", recommendationId);

    // Create approval task
    await supabase.from("tasks").insert({
      task_description: `Review and approve product recommendation for ${customerName}`,
      assigned_to_user_id: premierUser.email,
      related_entity_type: "product_recommendation",
      related_entity_id: recommendationId,
      due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day
      priority: "High",
      status: "Pending",
    });

    return NextResponse.json({
      ok: true,
      message: "Recommendation submitted for approval",
      messageId: emailResult.messageId,
      approver: premierUser.email,
    });
  } catch (error: any) {
    console.error("Submit for approval error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to submit for approval" },
      { status: 500 }
    );
  }
}
