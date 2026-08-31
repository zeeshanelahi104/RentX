import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { verifyOTP, sendOTP } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

export default function OTPVerifyScreen({ route, navigation }: any) {
  const { phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef<TextInput[]>([]);
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    const interval = setInterval(() => setResendTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (val: string, idx: number) => {
    const digits = val.replace(/\D/g, '');

    if (digits.length > 1) {
      const newOtp = [...otp];
      let i = idx;
      for (const d of digits) {
        if (i > 5) break;
        newOtp[i] = d;
        i++;
      }
      setOtp(newOtp);
      inputs.current[Math.min(i, 5)]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[idx] = digits;
    setOtp(newOtp);
    if (digits && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleBackspace = (val: string, idx: number) => {
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return showAlert('خرابی', '6 ہندسوں کا OTP کوڈ درج کریں');

    setLoading(true);
    try {
      const data = await verifyOTP(phone, code);
      setToken(data.token);
      setUser(data.user);
    } catch (e: any) {
      showAlert('خرابی', e.message || 'OTP غلط ہے');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await sendOTP(phone);
    setResendTimer(60);
    showAlert('', 'نیا OTP بھیج دیا گیا');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← واپس</Text>
        </TouchableOpacity>

        <Text style={styles.title}>OTP تصدیق</Text>
        <Text style={styles.subtitle}>+92{phone} پر بھیجا گیا کوڈ درج کریں</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={ref => { if (ref) inputs.current[idx] = ref; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              maxLength={6}
              keyboardType="number-pad"
              value={digit}
              onChangeText={val => handleChange(val, idx)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') handleBackspace(digit, idx);
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'تصدیق ہو رہی ہے...' : 'تصدیق کریں'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
          <Text style={[styles.resend, resendTimer > 0 && styles.resendDisabled]}>
            {resendTimer > 0 ? `دوبارہ بھیجیں (${resendTimer}s)` : 'OTP دوبارہ بھیجیں'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 32 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, marginBottom: 40 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  otpBox: { width: 50, height: 58, borderWidth: 2, borderColor: COLORS.border, borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: '#EFF6EE' },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  resend: { textAlign: 'center', color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  resendDisabled: { color: COLORS.muted },
});
