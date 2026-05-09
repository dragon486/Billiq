import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let dbStatus = "connected";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "disconnected";
  }

  const status = dbStatus === "connected" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      db: dbStatus,
      ts: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
    },
    { status: status === "ok" ? 200 : 503 }
  );
}
