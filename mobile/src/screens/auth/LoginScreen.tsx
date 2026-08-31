import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { login, googleAuth } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useGoogleAuthRequest, isGoogleAuthConfigured } from '../../utils/googleAuth';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();

  const [request, response, promptAsync] = useGoogleAuthRequest();

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      (async () => {
        setLoading(true);
        try {
          const data = await googleAuth(response.params.id_token);
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

  const handleLogin = async () => {
    if (!email.trim() || !password) return showAlert('خرابی', 'ای میل اور پاس ورڈ درج کریں');

    setLoading(true);
    try {
      const data = await login(email.trim().toLowerCase(), password);
      setToken(data.token);
      setUser(data.user);
    } catch (e: any) {
      showAlert('خرابی', e.message);
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
          <Text style={styles.title}>لاگ ان کریں</Text>
          <Text style={styles.subtitle}>اپنے اکاؤنٹ میں لاگ ان کریں</Text>

          <Text style={styles.label}>ای میل</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>پاس ورڈ</Text>
          <TextInput
            style={styles.input}
            placeholder="پاس ورڈ درج کریں"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>لاگ ان کریں</Text>}
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
            <Text style={styles.googleButtonText}>Google سے لاگ ان کریں</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.signupLink}>
            <Text style={styles.signupLinkText}>نیا اکاؤنٹ بنائیں</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.primary, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  appName: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 16, color: COLORS.text },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 4, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.muted },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 14, marginTop: 16 },
  googleButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  signupLink: { marginTop: 20, alignItems: 'center' },
  signupLinkText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
