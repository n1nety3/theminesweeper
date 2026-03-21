import { NextRequest, NextResponse } from 'next/server';
import { getGameDb } from '@/lib/gameDb';

interface CellPayload {
  cell_key: string;
  status: string;
  ts: number;
  harvests: number;
  laser_hits: number;
  pumped_ms: number;
}

interface ZonePayload {
  gx: number;
  gy: number;
}

interface PlacedPumpPayload {
  id: string;
  gx: number; gy: number; row: number; col: number;
}

// POST /api/session/save — persist full game state
export async function POST(req: NextRequest) {
  const sql = getGameDb();
  // Silently succeed when DB is not configured (offline-friendly)
  if (!sql) return NextResponse.json({ ok: true });

  const body = await req.json();
  const {
    sessionId, score, seeds, water, grain, crops, activeGx, activeGy,
    laserBattery, pumps, placedPumps,
    cells, zones,
  } = body as {
    sessionId: string;
    score: number; seeds: number; water: number;
    grain: number; // client sends as 'grain' (DB column name kept for compat)
    crops: number;
    activeGx: number; activeGy: number;
    laserBattery: number;
    pumps: number;
    placedPumps: PlacedPumpPayload[];
    cells: CellPayload[];
    zones: ZonePayload[];
  };

  if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 });

  // 1. Update session resources + score
  await sql`
    UPDATE game_sessions
    SET    score         = ${score},
           seeds         = ${seeds},
           water         = ${water},
           grain         = ${grain},
           crops         = ${crops ?? 0},
           active_gx     = ${activeGx},
           active_gy     = ${activeGy},
           laser_battery = ${laserBattery ?? 100},
           pumps         = ${pumps ?? 1},
           placed_pumps  = ${JSON.stringify(placedPumps ?? [])}::jsonb,
           updated_at    = NOW()
    WHERE  id = ${sessionId}
  `;

  // 2. Replace cell states (delete-then-insert; dataset is small)
  await sql`DELETE FROM cell_states WHERE session_id = ${sessionId}`;

  if (cells.length > 0) {
    const keys       = cells.map(c => c.cell_key);
    const statuses   = cells.map(c => c.status);
    const timestamps = cells.map(c => c.ts);
    const harvests   = cells.map(c => c.harvests ?? 0);
    const laserHits  = cells.map(c => c.laser_hits ?? 0);
    const pumpedMs   = cells.map(c => c.pumped_ms ?? 0);

    await sql`
      INSERT INTO cell_states (session_id, cell_key, status, ts, harvests, laser_hits, pumped_ms)
      SELECT ${sessionId},
             unnest(${keys}::text[]),
             unnest(${statuses}::text[]),
             unnest(${timestamps}::bigint[]),
             unnest(${harvests}::int[]),
             unnest(${laserHits}::smallint[]),
             unnest(${pumpedMs}::int[])
    `;
  }

  // 3. Replace unlocked zones
  await sql`DELETE FROM unlocked_zones WHERE session_id = ${sessionId}`;

  for (const z of zones) {
    await sql`
      INSERT INTO unlocked_zones (session_id, gx, gy)
      VALUES (${sessionId}, ${z.gx}, ${z.gy})
    `;
  }

  return NextResponse.json({ ok: true });
}
