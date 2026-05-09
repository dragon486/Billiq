import { NextResponse } from "next/server";
import { countAudience } from "@/lib/audience";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const shopId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    const count = await countAudience(shopId, type);
    return NextResponse.json({ count });
  } catch (err) {
    console.error("[audience-count]", err.message);
    return NextResponse.json({ count: 0 });
  }
}
