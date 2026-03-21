import { NextRequest, NextResponse } from 'next/server';
import { getGameDb } from '@/lib/gameDb';

// POST /api/session — unused (auth now via /api/auth/verify-otp)
export async function POST() {
  return NextResponse.json({ error: 'Use /api/auth/verify-otp to create sessions' }, { status: 410 });
}

// GET /api/session?id=<sessionId> — load full session state
export async function GET(req: NextRequest) {
  const sql = getGameDb();
  if (!sql) {
    return NextResponse.json(
      { error: 'Database not configured (FARM_DATABASE_URL unset). Set this env var in Netlify site settings.' },
      { status: 503 },
    );
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Session ID required' }, { status: 400 });

  const rows = await sql`
    SELECT gs.id, gs.score, gs.seeds, gs.water, gs.grain, gs.crops, gs.active_gx, gs.active_gy,
           gs.laser_battery, gs.pumps, gs.placed_pumps,
           u.farm_name AS name
    FROM   game_sessions gs
    JOIN   users u ON u.id = gs.user_id
    WHERE  gs.id = ${id}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const cells = await sql`
    SELECT cell_key, status, ts, harvests, laser_hits, pumped_ms
    FROM   cell_states
    WHERE  session_id = ${id}
  `;

  const zones = await sql`
    SELECT gx, gy FROM unlocked_zones WHERE session_id = ${id}
  `;

  return NextResponse.json({ session: rows[0], cells, zones });
}
