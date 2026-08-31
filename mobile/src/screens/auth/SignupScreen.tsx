import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { CITIES } from '../../constants/index';
import { showAlert } from '../../utils/alert';
import { register, googleAuth } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useGoogleAuthRequest, isGoogleAuthConfigured } from '../../utils/googleAuth';

const ROLES = [
  { id: 'rider', label: 'رائیڈر', labelEn: 'Rider', desc: 'گاڑی بک کریں' },
  { id: 'driver', label: 'ڈرائیور', labelEn: 'Driver', desc: 'گاڑی کرایے پر دیں' },
];

export default function SignupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'rider' | 'driver'>('rider');
  const [city, setCity] = useState('Chiniot');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const { setUser, setToken } = useAuthStore();

  const [request, response, promptAsync] = useGoogleAuthRequest();

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      (async () => {
        setLoading(true);
        try {
          const data = await googleAuth(response.params.id_token, role, city);
          setToken(data.token);
          setUser(data.user);
        } catch (e: any) {
          showAlert('خرابی', e.message);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [response]);

  const handleSubmit = async () => {
    setFieldErrors({});
    if (!name.trim()) return showAlert('خرابی', 'براہ کرم اپنا نام درج کریں');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return showAlert('خرابی', 'درست ای میل درج کریں');
    if (password.length < 8) return showAlert('خرابی', 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے');

    setLoading(true);
    try {
      const data = await register({ name: name.trim(), email: email.trim().toLowerCase(), password, role, city });
      setToken(data.token);
      setUser(data.user);
    } catch (e: any) {
      if (e.field === 'email') setFieldErrors({ email: e.message });
      else showAlert('خرابی', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.appName}>RentX</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>اکاؤنٹ بنائیں</Text>
          <Text style={styles.subtitle}>شروع کرنے کے لیے اپنی معلومات درج کریں</Text>

          <Text style={styles.label}>آپ کا نام</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: احمد علی"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>ای میل</Text>
          <TextInput
            style={[styles.input, fieldErrors.email && styles.inputError]}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(v) => { setEmail(v); setFieldErrors({}); }}
          />
          {!!fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}

          <Text style={styles.label}>پاس ورڈ</Text>
          <TextInput
            style={styles.input}
            placeholder="کم از کم 8 حروف"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>آپ کون ہیں؟</Text>
          <View style={styles.roleRow}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[styles.roleCard, role === r.id && styles.roleCardActive]}
                onPress={() => setRole(r.id as any)}
              >
                <Text style={[styles.roleLabel, role === r.id && styles.roleLabelActive]}>{r.label}</Text>
                <Text style={[styles.roleLabelEn, role === r.id && styles.roleLabelActive]}>{r.labelEn}</Text>
                <Text style={[styles.roleDesc, role === r.id && styles.roleDescActive]}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>آپ کا شہر</Text>
          <View style={styles.cityGrid}>
            {CITIES.map(c => (
              <TouchableOpacity
                key={c.name}
                style={[styles.cityChip, city === c.name && styles.cityChipActive]}
                onPress={() => setCity(c.name)}
              >
                <Text style={[styles.cityChipText, city === c.name && styles.cityChipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>اکاؤنٹ بنائیں</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>یا</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, !isGoogleAuthConfigured && styles.buttonDisabled]}
            onPress={() => promptAsync()}
            disabled={!request || loading || !isGoogleAuthConfigured}
          >
            <Icon name="google" size={20} color={COLORS.text} />
            <Text style={styles.googleButtonText}>Google سے سائن اپ کریں</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.primary, justifyContent: 'center', padding: 24, paddingVertical: 48 },
  header: { alignItems: 'center', marginBottom: 24 },
  appName: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 16, color: COLORS.text },
  inputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 13, color: COLORS.danger, marginTop: 6 },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleCard: { flex: 1, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  roleCardActive: { borderColor: COLORS.primary, backgroundColor: '#EFF6EE' },
  roleLabel: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  roleLabelEn: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  roleLabelActive: { color: COLORS.primary },
  roleDesc: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  roleDescActive: { color: COLORS.primaryLight },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  cityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  cityChipText: { fontSize: 14, color: COLORS.text },
  cityChipTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 4, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.muted },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 14, marginTop: 16 },
  googleButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
