import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getGameDb } from '@/lib/gameDb';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/send-otp
// Returning users get auto-logged in (no OTP needed).
// New users get an OTP email.
export async function POST(req: NextRequest) {
  const sql = getGameDb();
  if (!sql) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { email } = await req.json();
  const addr = (email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(addr)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // Check if this is a returning user
  const existing = await sql`
    SELECT u.id, u.farm_name, gs.id AS session_id
    FROM   users u
    LEFT JOIN game_sessions gs ON gs.user_id = u.id
    WHERE  u.email = ${addr}
    ORDER  BY gs.updated_at DESC
    LIMIT  1
  `;

  if (existing.length > 0 && existing[0].session_id) {
    // Returning user — auto login, no OTP required
    // Update last seen
    await sql`UPDATE users SET last_seen_at = NOW() WHERE id = ${existing[0].id}`;
    return NextResponse.json({
      isNewUser:  false,
      sessionId:  existing[0].session_id,
      farmName:   existing[0].farm_name,
    });
  }

  // New user — send OTP
  const apiKey = process.env.RESEND_API_KEY;
  const emailConfigured = apiKey && !apiKey.startsWith('re_placeholder');
  const code = emailConfigured
    ? String(Math.floor(100000 + Math.random() * 900000))
    : '000000';
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await sql`UPDATE otp_codes SET used = TRUE WHERE email = ${addr} AND used = FALSE`;
  await sql`INSERT INTO otp_codes (email, code, expires_at) VALUES (${addr}, ${code}, ${expiresAt.toISOString()})`;

  const from = process.env.EMAIL_FROM ?? 'noreply@yourdomain.com';
  if (emailConfigured) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to:      addr,
      subject: 'Your FARM login code',
      html: `
        <div style="font-family:monospace;max-width:400px;margin:0 auto;padding:32px 24px;background:#0e1a0e;border-radius:12px;">
          <div style="font-size:28px;font-weight:700;color:#70be50;letter-spacing:0.08em;margin-bottom:8px;">FARM</div>
          <div style="font-size:13px;color:#8aaa78;margin-bottom:28px;">Your login code</div>
          <div style="font-size:40px;font-weight:700;letter-spacing:0.25em;color:#f9c424;background:#1a2e1a;padding:18px 24px;border-radius:8px;text-align:center;">${code}</div>
          <div style="font-size:12px;color:#5a7a50;margin-top:20px;">Valid for 10 minutes. Do not share this code.</div>
        </div>
      `,
    });
  } else {
    console.log(`[OTP dev] ${addr} → ${code} (email not configured, use 000000)`);
  }

  return NextResponse.json({ isNewUser: true });
}
