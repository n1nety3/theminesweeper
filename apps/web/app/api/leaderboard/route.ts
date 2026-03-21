import { NextResponse } from 'next/server';
import { getGameDb } from '@/lib/gameDb';

// GET /api/leaderboard — top 10 scores from global scoreboard
export async function GET() {
  const sql = getGameDb();
  if (!sql) return NextResponse.json({ entries: [] });

  const rows = await sql`
    SELECT session_id, village_name AS name, score
    FROM   scoreboard
    ORDER  BY score DESC
    LIMIT  10
  `;

  return NextResponse.json({ entries: rows });
}
