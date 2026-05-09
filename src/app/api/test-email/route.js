import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/notifications";

export async function GET() {
  const result = await sendTestEmail();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
