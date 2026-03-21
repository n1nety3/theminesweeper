'use client';

import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';

function LeafIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="32" r="4" fill="#5a9e40" />
      <line x1="20" y1="28" x2="20" y2="12" stroke="#5a9e40" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="14" cy="18" rx="6.5" ry="4" transform="rotate(-35 14 18)" fill="#70be50" />
      <ellipse cx="27" cy="16" rx="6.5" ry="4" transform="rotate(35 27 16)" fill="#60ae40" />
    </svg>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#e05030', letterSpacing: '0.04em', paddingLeft: 2 }}>
      {text}
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'email' | 'otp' | 'village';

export default function PlayerModal() {
  const { sendOtp, initSession } = useGame();

  const [step, setStep]           = useState<Step>('email');
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');
  const [villageName, setVillage] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(0);

  const emailRef   = useRef<HTMLInputElement>(null);
  const codeRef    = useRef<HTMLInputElement>(null);
  const villageRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => { if (step === 'otp')     codeRef.current?.focus();    }, [step]);
  useEffect(() => { if (step === 'village') villageRef.current?.focus(); }, [step]);

  const startCountdown = (secs = 60) => {
    setCountdown(secs);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(n => { if (n <= 1) { clearInterval(countdownRef.current!); return 0; } return n - 1; });
    }, 1000);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const addr = email.trim().toLowerCase();
    if (!EMAIL_RE.test(addr)) { setError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      const { isNewUser } = await sendOtp(addr);
      if (isNewUser) {
        setStep('otp');
        startCountdown(60);
      }
      // Returning users are auto-logged in inside sendOtp — no further action needed
    } catch (err) {
      setError((err as Error).message ?? 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code.trim())) { setError('Enter the 6-digit code from your email'); return; }
    // After OTP verified, ask for village name
    setStep('village');
  };

  const handleVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const name = villageName.trim();
    if (name.length < 2) { setError('Village name must be at least 2 characters'); return; }
    setLoading(true);
    try {
      await initSession(email.trim().toLowerCase(), code.trim(), name);
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setError(''); setCode('');
    setLoading(true);
    try {
      await sendOtp(email.trim().toLowerCase());
      startCountdown(60);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    backgroundColor: 'var(--btn-icon-bg)',
    border: '1px solid var(--btn-icon-ring)',
    borderRadius: 8, color: 'var(--text-primary)',
    fontFamily: 'monospace', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  const submitStyle = (disabled: boolean): React.CSSProperties => ({
    marginTop: 4, padding: '11px',
    backgroundColor: disabled ? 'var(--btn-icon-bg)' : '#1a4a28',
    border: 'none', borderRadius: 8,
    color: disabled ? 'var(--text-muted)' : '#7acc50',
    fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
    letterSpacing: '0.08em', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s, background-color 0.15s',
    width: '100%',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'var(--page-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 500,
    }}>
      <div style={{
        backgroundColor: 'var(--bar-bg)', borderRadius: 14,
        padding: '36px 32px', width: 'calc(100% - 48px)', maxWidth: 360,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
      }}>
        <LeafIcon />

        <div style={{
          fontFamily: 'monospace', fontSize: 20, fontWeight: 700,
          letterSpacing: '0.1em', color: 'var(--text-primary)',
          marginTop: 16, marginBottom: 6,
        }}>
          FARM
        </div>

        {step === 'email' && (
          <>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 28 }}>
              Enter your email to play
            </div>
            <form onSubmit={handleEmail} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                ref={emailRef} type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com" autoComplete="email"
                disabled={loading} style={inputStyle}
              />
              {error && <ErrorText text={error} />}
              <button type="submit" disabled={loading || !EMAIL_RE.test(email.trim())} style={submitStyle(loading || !EMAIL_RE.test(email.trim()))}>
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 4, textAlign: 'center' }}>
              Code sent to
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)', marginBottom: 24, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
            <form onSubmit={handleOtp} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                ref={codeRef} type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                placeholder="000000" disabled={loading}
                style={{ ...inputStyle, fontSize: 28, letterSpacing: '0.3em', textAlign: 'center', fontFamily: 'var(--font-vt323, monospace)' }}
              />
              {error && <ErrorText text={error} />}
              <button type="submit" disabled={loading || code.length !== 6} style={submitStyle(loading || code.length !== 6)}>
                Verify
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <button type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }} disabled={loading}
                  style={{ background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', padding: 0, letterSpacing: '0.04em' }}>
                  Change email
                </button>
                <button type="button" onClick={handleResend} disabled={loading || countdown > 0}
                  style={{ background: 'none', border: 'none', cursor: loading || countdown > 0 ? 'not-allowed' : 'pointer', fontFamily: 'monospace', fontSize: 11, color: countdown > 0 ? 'var(--text-muted)' : '#5a9e40', padding: 0, letterSpacing: '0.04em', opacity: loading || countdown > 0 ? 0.5 : 1 }}>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'village' && (
          <>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 28, textAlign: 'center' }}>
              Name your village
            </div>
            <form onSubmit={handleVillage} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                ref={villageRef} type="text" value={villageName}
                onChange={e => { setVillage(e.target.value); setError(''); }}
                placeholder="Green Hollow" maxLength={24}
                disabled={loading} style={inputStyle}
              />
              {error && <ErrorText text={error} />}
              <button type="submit" disabled={loading || villageName.trim().length < 2} style={submitStyle(loading || villageName.trim().length < 2)}>
                {loading ? 'Starting...' : 'Start Game'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
