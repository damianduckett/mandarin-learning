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
  const cards=await sql`SELECT phrase_id,"due"::text AS due,stability,difficulty,elapsed_days,scheduled_days,reps,lapses,learning_steps,state,last_review::text AS last_review FROM fsrs_cards WHERE user_id=${userId}`;
  const progress=rows[0]?.progress ?? {cards:{}};
  for(const c of cards){ progress.cards[c.phrase_id]={phraseId:c.phrase_id,dueAt:c.due,lastReviewedAt:c.last_review??new Date(0).toISOString(),stability:Number(c.stability),difficulty:Number(c.difficulty),elapsedDays:c.elapsed_days,scheduledDays:c.scheduled_days,reps:c.reps,lapses:c.lapses,learningSteps:c.learning_steps,state:c.state}; }
  return Response.json({ progress });
}

export async function POST(request:Request){
  if(!databaseConfigured())return Response.json({error:"Database is not configured"},{status:503});
  const userId=await currentUserId(); if(!userId)return Response.json({error:"Unauthorized"},{status:401});
  const body=await request.json(); const {phraseId,card,event}=body||{};
  if(!Number.isInteger(phraseId)||!card||!event?.clientEventId)return Response.json({error:"Invalid review"},{status:400});
  const sql=getDb();
  const inserted=await sql`INSERT INTO review_events(user_id,phrase_id,client_event_id,reviewed_at,rating,correct,previous_due,new_due) VALUES(${userId},${phraseId},${event.clientEventId},${event.reviewedAt},${event.rating},${event.correct},${event.previousDue},${event.newDue}) ON CONFLICT(user_id,client_event_id) DO NOTHING RETURNING id`;
  if(!inserted.length)return Response.json({duplicate:true});
  await sql`INSERT INTO fsrs_cards(user_id,phrase_id,due,stability,difficulty,elapsed_days,scheduled_days,reps,lapses,learning_steps,state,last_review,last_sync_at) VALUES(${userId},${phraseId},${card.dueAt},${card.stability},${card.difficulty},${card.elapsedDays},${card.scheduledDays},${card.reps},${card.lapses},${card.learningSteps},${card.state},${card.lastReviewedAt},NOW()) ON CONFLICT(user_id,phrase_id) DO UPDATE SET due=EXCLUDED.due,stability=EXCLUDED.stability,difficulty=EXCLUDED.difficulty,elapsed_days=EXCLUDED.elapsed_days,scheduled_days=EXCLUDED.scheduled_days,reps=EXCLUDED.reps,lapses=EXCLUDED.lapses,learning_steps=EXCLUDED.learning_steps,state=EXCLUDED.state,last_review=EXCLUDED.last_review,last_sync_at=NOW()`;
  return Response.json({saved:true});
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
