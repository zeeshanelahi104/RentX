import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { sendOTP } from '../../services/authService';

export default function PhoneInputScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      return showAlert('خرابی', 'براہ کرم صحیح 10 ہندسوں کا نمبر درج کریں (e.g. 3001234567)');
    }

    setLoading(true);
    try {
      await sendOTP(digits);
      navigation.navigate('OTPVerify', { phone: digits });
    } catch (e: any) {
      showAlert('خرابی', e.message || 'OTP بھیجنے میں مسئلہ ہوا');
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
          <Text style={styles.subtitle}>اپنا موبائل نمبر درج کریں</Text>

          <View style={styles.phoneRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>🇵🇰 +92</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="3001234567"
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Text style={styles.hint}>ہم آپ کو ایک OTP کوڈ بھیجیں گے</Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'بھیج رہے ہیں...' : 'OTP بھیجیں'}</Text>
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
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  phoneRow: { flexDirection: 'row', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' },
  prefix: { backgroundColor: COLORS.background, paddingHorizontal: 14, justifyContent: 'center', borderRightWidth: 1, borderRightColor: COLORS.border },
  prefixText: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  input: { flex: 1, fontSize: 18, paddingHorizontal: 14, paddingVertical: 14, color: COLORS.text },
  hint: { fontSize: 13, color: COLORS.muted, marginTop: 10, marginBottom: 24, textAlign: 'center' },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
