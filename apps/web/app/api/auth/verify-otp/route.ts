import { NextRequest, NextResponse } from 'next/server';
import { getGameDb } from '@/lib/gameDb';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/verify-otp — verify OTP, upsert user, return/create session
export async function POST(req: NextRequest) {
  const sql = getGameDb();
  if (!sql) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { email, code, deviceInfo, villageName } = await req.json();
  const addr = (email ?? '').trim().toLowerCase();
  const trimCode = (code ?? '').trim();

  if (!EMAIL_RE.test(addr)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(trimCode)) {
    return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
  }

  // Look up a valid, unused, non-expired code
  const rows = await sql`
    SELECT id FROM otp_codes
    WHERE  email      = ${addr}
      AND  code       = ${trimCode}
      AND  used       = FALSE
      AND  expires_at > NOW()
    ORDER  BY created_at DESC
    LIMIT  1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
  }

  // Mark code as used
  await sql`UPDATE otp_codes SET used = TRUE WHERE id = ${rows[0].id}`;

  // Create user with the chosen village name (or fall back to email prefix)
  const farmName = (villageName ?? '').trim().slice(0, 24) ||
    addr.split('@')[0].replace(/[^a-z0-9_\- ]/gi, '').trim().slice(0, 24) || 'Farmer';

  const userRows = await sql`
    INSERT INTO users (email, farm_name, device_info, last_seen_at)
    VALUES (${addr}, ${farmName}, ${deviceInfo ? JSON.stringify(deviceInfo) : null}::jsonb, NOW())
    ON CONFLICT (email) DO UPDATE
      SET last_seen_at = NOW(),
          device_info  = COALESCE(${deviceInfo ? JSON.stringify(deviceInfo) : null}::jsonb, users.device_info)
    RETURNING id, farm_name
  `;
  const user = userRows[0];

  // Get existing session or create a new one
  const sessionRows = await sql`
    SELECT id FROM game_sessions
    WHERE  user_id = ${user.id}
    ORDER  BY updated_at DESC
    LIMIT  1
  `;

  let sessionId: string;

  if (sessionRows.length > 0) {
    sessionId = sessionRows[0].id;
  } else {
    const newSession = await sql`
      INSERT INTO game_sessions (user_id)
      VALUES (${user.id})
      RETURNING id
    `;
    sessionId = newSession[0].id;

    // Seed default unlocked zone (0,0)
    await sql`
      INSERT INTO unlocked_zones (session_id, gx, gy)
      VALUES (${sessionId}, 0, 0)
    `;
  }

  return NextResponse.json({ sessionId, farmName: user.farm_name });
}
