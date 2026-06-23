import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../utils/theme';
import { wp, ms } from '../utils/responsive';
import WederLogo from '../components/WederLogo';

// ── Floating-label field ──────────────────────────────────────────────────────
const Field = ({ label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[f.wrap, focused && f.focused]}>
      <Text style={[f.label, focused && f.labelOn]}>{label}</Text>
      <TextInput
        style={f.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        placeholderTextColor={COLORS.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
};
const f = StyleSheet.create({
  wrap:    { borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.md, paddingHorizontal: ms(14), paddingTop: ms(10), paddingBottom: ms(10), marginBottom: ms(14), backgroundColor: COLORS.surface1 },
  focused: { borderColor: COLORS.gold, backgroundColor: COLORS.goldBg },
  label:   { ...TYPOGRAPHY.tiny, color: COLORS.textMuted, marginBottom: ms(4) },
  labelOn: { color: COLORS.gold },
  input:   { ...TYPOGRAPHY.body, color: COLORS.textPrimary, padding: 0, minHeight: ms(22) },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const btnScale = useRef(new Animated.Value(1)).current;

  const pulse = () => Animated.sequence([
    Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
    Animated.timing(btnScale, { toValue: 1,    duration: 80, useNativeDriver: true }),
  ]).start();

  const handleLogin = async () => {
    pulse();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await loginUser({ email, password });
      await login(res.data.token, res.data.user);
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <View style={s.root}>
      {/* Decorative blobs */}
      <View style={s.blob1} />
      <View style={s.blob2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: insets.top + ms(32), paddingBottom: insets.bottom + ms(24) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.logoArea}>
            <WederLogo variant="lg" />
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.title}>Welcome back</Text>
            <Text style={s.sub}>Sign in to continue planning</Text>

            {!!error && (
              <View style={s.errBox}>
                <Text style={s.errText}>⚠️  {error}</Text>
              </View>
            )}

            <Field label="Email address" value={email}    onChangeText={setEmail}    keyboardType="email-address" />
            <Field label="Password"      value={password} onChangeText={setPassword} secureTextEntry />

            <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: ms(4) }}>
              <TouchableOpacity style={s.btn} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
                {loading
                  ? <ActivityIndicator color={COLORS.deep} />
                  : <Text style={s.btnText}>Sign In</Text>}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={s.switchLink} onPress={() => navigation.navigate('Register')}>
              <Text style={s.switchText}>
                Don't have an account?{'  '}
                <Text style={s.switchBold}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo hint */}
          <View style={s.demo}>
            <Text style={s.demoTag}>DEMO CREDENTIALS</Text>
            <Text style={s.demoVal}>demo.client@weder.demo  ·  demo1234</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: COLORS.deep },
  blob1: { position: 'absolute', width: wp(75), height: wp(75), borderRadius: wp(37.5), backgroundColor: 'rgba(201,168,76,0.07)', top: -wp(18), right: -wp(18) },
  blob2: { position: 'absolute', width: wp(55), height: wp(55), borderRadius: wp(27.5), backgroundColor: 'rgba(232,84,122,0.06)', bottom: wp(10), left: -wp(12) },

  scroll:    { flexGrow: 1, paddingHorizontal: wp(6) },
  logoArea:  { alignItems: 'center', marginBottom: ms(32) },

  card:      { backgroundColor: COLORS.surface2, borderRadius: RADIUS.xl, padding: ms(22), borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.lg },
  title:     { ...TYPOGRAPHY.h2, color: COLORS.textPrimary, marginBottom: ms(4) },
  sub:       { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: ms(22) },

  errBox:    { backgroundColor: COLORS.redBg, borderRadius: RADIUS.sm, padding: ms(12), marginBottom: ms(16), borderLeftWidth: 3, borderLeftColor: COLORS.red },
  errText:   { ...TYPOGRAPHY.captionB, color: COLORS.red },

  btn:       { backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, height: ms(52), alignItems: 'center', justifyContent: 'center', ...SHADOWS.gold },
  btnText:   { ...TYPOGRAPHY.h4, color: COLORS.deep, letterSpacing: 1.2 },

  switchLink:{ alignItems: 'center', marginTop: ms(20) },
  switchText:{ ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  switchBold:{ color: COLORS.gold, fontWeight: '700' },

  demo:      { marginTop: ms(24), alignItems: 'center', backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, paddingVertical: ms(14), paddingHorizontal: ms(20), borderWidth: 1, borderColor: COLORS.borderLight },
  demoTag:   { ...TYPOGRAPHY.label, color: COLORS.gold, marginBottom: ms(4) },
  demoVal:   { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
});
