import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export default function BookingConfirmScreen({ route, navigation }: any) {
  const { booking } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Icon name="check-circle" size={64} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>بکنگ کامیاب!</Text>
        <Text style={styles.subtitle}>آپ کی بکنگ ڈرائیور کو بھیج دی گئی ہے</Text>

        <View style={styles.detailBox}>
          <DetailRow label="بکنگ نمبر" value={`#${booking._id?.slice(-6).toUpperCase()}`} />
          <DetailRow label="قیمت" value={`PKR ${booking.totalAmount?.toLocaleString()}`} />
          <DetailRow label="ادائیگی" value={booking.paymentMethod === 'cash' ? 'نقد' : booking.paymentMethod} />
          <DetailRow label="حیثیت" value="ڈرائیور کا انتظار" />
        </View>

        <Text style={styles.info}>ڈرائیور 10 منٹ میں جواب دے گا۔ اگر قبول نہ ہو تو خود بخود منسوخ ہو جائے گا</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Bookings')}>
        <Text style={styles.primaryBtnText}>میری بکنگز دیکھیں</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.secondaryBtnText}>ہوم پر جائیں</Text>
      </TouchableOpacity>
    </View>
  );
}

const DetailRow = ({ label, value }: any) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF6EE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  detailBox: { width: '100%', backgroundColor: COLORS.background, borderRadius: 12, padding: 16, gap: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 14, color: COLORS.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  info: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 16, lineHeight: 20 },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  secondaryBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
});
