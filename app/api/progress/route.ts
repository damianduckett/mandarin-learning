import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { databaseConfigured, getDb } from "@/lib/db";

async function currentUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id;
}

export async function GET() {
  if (!databaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getDb();
  const rows = await sql`SELECT progress FROM user_progress WHERE user_id = ${userId} LIMIT 1`;
  return Response.json({ progress: rows[0]?.progress ?? null });
}


export async function PUT(request: Request) {
  if (!databaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body?.progress || typeof body.progress !== "object") return Response.json({ error: "Invalid progress" }, { status: 400 });
  const serialized = JSON.stringify(body.progress);
  if (serialized.length > 2_000_000) return Response.json({ error: "Progress payload is too large" }, { status: 413 });
  const sql = getDb();
  await sql`INSERT INTO user_progress (user_id, progress, updated_at)
    VALUES (${userId}, ${serialized}::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE SET progress = EXCLUDED.progress, updated_at = NOW()`;
  return Response.json({ saved: true });
}
