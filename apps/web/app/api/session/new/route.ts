import { NextRequest, NextResponse } from 'next/server';
import { getGameDb } from '@/lib/gameDb';

// POST /api/session/new — end the current game, save score to scoreboard,
// reset the session with a new village name.
export async function POST(req: NextRequest) {
  const sql = getGameDb();
  if (!sql) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { sessionId, villageName, score } = await req.json();
  if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 });

  const finalName = (villageName ?? '').trim().slice(0, 24) || 'Farmer';

  // Look up the user who owns this session
  const sessionRows = await sql`
    SELECT gs.user_id, gs.score AS old_score
    FROM   game_sessions gs
    WHERE  gs.id = ${sessionId}
  `;
  if (sessionRows.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { user_id: userId, old_score: oldScore } = sessionRows[0];

  // Save the final score to the global scoreboard
  const finalScore = typeof score === 'number' ? score : (oldScore ?? 0);
  await sql`
    INSERT INTO scoreboard (session_id, village_name, score)
    VALUES (${sessionId}::uuid, ${finalName}, ${finalScore})
  `;

  // Update the user's village name
  await sql`UPDATE users SET farm_name = ${finalName}, last_seen_at = NOW() WHERE id = ${userId}`;

  // Reset the existing session to fresh state (no new row — same session ID reused)
  await sql`
    UPDATE game_sessions
    SET score = 0, seeds = 8, water = 5, grain = 5, crops = 0,
        active_gx = 0, active_gy = 0,
        laser_battery = 100, pumps = 1, placed_pumps = '[]'::jsonb,
        updated_at = NOW()
    WHERE id = ${sessionId}
  `;

  // Wipe old cell states and zones
  await sql`DELETE FROM cell_states   WHERE session_id = ${sessionId}`;
  await sql`DELETE FROM unlocked_zones WHERE session_id = ${sessionId}`;

  // Seed home zone
  await sql`INSERT INTO unlocked_zones (session_id, gx, gy) VALUES (${sessionId}, 0, 0)`;

  return NextResponse.json({ sessionId, farmName: finalName });
}
