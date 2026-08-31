import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { CITIES } from '../../constants/index';
import { completeProfile } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

const ROLES = [
  { id: 'rider', label: 'رائیڈر', labelEn: 'Rider', desc: 'گاڑی بک کریں' },
  { id: 'driver', label: 'ڈرائیور', labelEn: 'Driver', desc: 'گاڑی کرایے پر دیں' },
];

export default function SelectRoleScreen() {
  const [role, setRole] = useState<'rider' | 'driver'>('rider');
  const [city, setCity] = useState('Chiniot');
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuthStore();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await completeProfile({ role, city });
      setUser(res.data.user);
    } catch (e: any) {
      showAlert('خرابی', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>خوش آمدید, {user?.name}!</Text>
      <Text style={styles.subtitle}>شروع کرنے کے لیے مزید معلومات درکار ہیں</Text>

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
            <Text style={[styles.cityChipText, city === c.name && styles.cityChipTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'محفوظ ہو رہا ہے...' : 'شروع کریں'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 6, marginBottom: 32 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 10, marginTop: 20 },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleCard: { flex: 1, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, padding: 16, alignItems: 'center' },
  roleCardActive: { borderColor: COLORS.primary, backgroundColor: '#EFF6EE' },
  roleLabel: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  roleLabelEn: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  roleLabelActive: { color: COLORS.primary },
  roleDesc: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  roleDescActive: { color: COLORS.primaryLight },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  cityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  cityChipText: { fontSize: 15, color: COLORS.text },
  cityChipTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 36 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
