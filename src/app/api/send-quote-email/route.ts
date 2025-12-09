import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  console.warn("send-to-va API disabled in this deployment (Resend not configured).");

  return NextResponse.json(
    {
      ok: false,
      error: "send-to-va API is temporarily disabled in this environment."
    },
    { status: 200 }
  );
}
