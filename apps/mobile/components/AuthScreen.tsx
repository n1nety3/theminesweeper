import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { useTheme } from '../contexts/ThemeContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LeafSvg() {
  // Simple inline leaf shape using View layers
  return (
    <View style={leafStyles.wrap}>
      <View style={leafStyles.stem} />
      <View style={leafStyles.leafL} />
      <View style={leafStyles.leafR} />
      <View style={leafStyles.dot} />
    </View>
  );
}

const leafStyles = StyleSheet.create({
  wrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stem: { position: 'absolute', width: 2.5, height: 16, backgroundColor: '#5a9e40', bottom: 4, borderRadius: 2 },
  dot:  { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#5a9e40', bottom: 0 },
  leafL: { position: 'absolute', width: 13, height: 8, borderRadius: 8, backgroundColor: '#70be50', left: 4, top: 10, transform: [{ rotate: '-35deg' }] },
  leafR: { position: 'absolute', width: 13, height: 8, borderRadius: 8, backgroundColor: '#60ae40', right: 4, top: 6, transform: [{ rotate: '35deg' }] },
});

export default function AuthScreen() {
  const { sendOtp, initSession } = useGame();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep]       = useState<'email' | 'otp'>('email');
  const [email, setEmail]     = useState('');
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transition = (to: 'email' | 'otp') => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(to), 150);
  };

  const startCountdown = (secs = 60) => {
    setCountdown(secs);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(n => {
        if (n <= 1) { clearInterval(countdownRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  const handleSendCode = async () => {
    setError('');
    const addr = email.trim().toLowerCase();
    if (!EMAIL_RE.test(addr)) { setError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      await sendOtp(addr);
      transition('otp');
      startCountdown(60);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    const c = code.trim();
    if (!/^\d{6}$/.test(c)) { setError('Enter the 6-digit code from your email'); return; }
    setLoading(true);
    try {
      await initSession(email.trim().toLowerCase(), c);
    } catch (e) {
      setError((e as Error).message ?? 'Something went wrong');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setError(''); setCode(''); setLoading(true);
    try {
      await sendOtp(email.trim().toLowerCase());
      startCountdown(60);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  const s = styles(theme);

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.card}>
        <LeafSvg />
        <Text style={s.title}>FARM</Text>

        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          {step === 'email' ? (
            <>
              <Text style={s.subtitle}>Enter your email to continue</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                placeholder="you@example.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
              {error ? <Text style={s.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[s.btn, (!EMAIL_RE.test(email.trim()) || loading) && s.btnDisabled]}
                onPress={handleSendCode}
                disabled={!EMAIL_RE.test(email.trim()) || loading}
                activeOpacity={0.8}
              >
                <Text style={s.btnText}>{loading ? 'SENDING...' : 'SEND CODE'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.subtitle}>Code sent to</Text>
              <Text style={s.emailDisplay} numberOfLines={1}>{email}</Text>
              <TextInput
                style={[s.input, s.codeInput]}
                value={code}
                onChangeText={v => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="000000"
                placeholderTextColor={theme.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                autoFocus
              />
              {error ? <Text style={s.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[s.btn, (code.length !== 6 || loading) && s.btnDisabled]}
                onPress={handleVerify}
                disabled={code.length !== 6 || loading}
                activeOpacity={0.8}
              >
                <Text style={s.btnText}>{loading ? 'VERIFYING...' : 'VERIFY'}</Text>
              </TouchableOpacity>
              <View style={s.row}>
                <TouchableOpacity onPress={() => { transition('email'); setCode(''); setError(''); }} disabled={loading}>
                  <Text style={s.link}>Change email</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleResend} disabled={loading || countdown > 0}>
                  <Text style={[s.link, (loading || countdown > 0) && s.linkDim]}>
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (theme: ReturnType<typeof import('../contexts/ThemeContext').useTheme>['theme']) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.pageBg, justifyContent: 'center', alignItems: 'center' },
    card: {
      backgroundColor: theme.barBg, borderRadius: 14,
      padding: 28, width: '100%', maxWidth: 360,
      alignItems: 'center', marginHorizontal: 24,
    },
    title: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 20, fontWeight: '700', letterSpacing: 2,
      color: theme.textPrimary, marginTop: 12, marginBottom: 4,
    },
    subtitle: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 11, color: theme.textMuted, letterSpacing: 1, marginBottom: 16, marginTop: 8,
    },
    emailDisplay: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 13, color: theme.textPrimary, marginBottom: 16,
    },
    input: {
      width: '100%', padding: 10,
      backgroundColor: theme.btnIconBg,
      borderWidth: 1, borderColor: theme.btnIconRing,
      borderRadius: 8, color: theme.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14, marginBottom: 8,
    },
    codeInput: { fontSize: 28, letterSpacing: 12, textAlign: 'center' },
    error: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 10, color: '#e05030', paddingBottom: 4,
    },
    btn: {
      backgroundColor: '#1a4a28', borderRadius: 8,
      paddingVertical: 12, alignItems: 'center', marginTop: 4,
    },
    btnDisabled: { backgroundColor: theme.btnIconBg, opacity: 0.5 },
    btnText: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 13, fontWeight: '700', color: '#7acc50', letterSpacing: 1,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    link: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 11, color: theme.accent,
    },
    linkDim: { color: theme.textMuted },
  });
