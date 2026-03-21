import { NextRequest, NextResponse } from 'next/server';
import { getGameDb } from '@/lib/gameDb';

// POST /api/scoreboard — record a final score when a game ends
export async function POST(req: NextRequest) {
  const sql = getGameDb();
  if (!sql) return NextResponse.json({ ok: true }); // offline-friendly

  const { sessionId, villageName, score } = await req.json();
  if (!villageName || typeof score !== 'number') {
    return NextResponse.json({ error: 'villageName and score required' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO scoreboard (session_id, village_name, score)
    VALUES (${sessionId ?? null}::uuid, ${String(villageName).trim().slice(0, 24)}, ${score})
    RETURNING id
  `;

  return NextResponse.json({ ok: true, entryId: rows[0].id });
}
