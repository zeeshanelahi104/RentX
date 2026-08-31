import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getEarnings } from '../../services/driverService';

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEarnings().then(res => setEarnings(res.data.earnings)).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>میری کمائی</Text>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.mainLabel}>کل کمائی</Text>
        <Text style={styles.mainAmount}>PKR {earnings?.total?.toLocaleString() || '0'}</Text>
        <Text style={styles.tripsLabel}>{earnings?.totalTrips || 0} مکمل سفر</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Icon name="calendar-today" size={24} color={COLORS.primary} />
          <Text style={styles.statLabel}>آج</Text>
          <Text style={styles.statAmount}>PKR {earnings?.today?.toLocaleString() || '0'}</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="calendar-month" size={24} color={COLORS.secondary} />
          <Text style={styles.statLabel}>اس مہینے</Text>
          <Text style={styles.statAmount}>PKR {earnings?.thisMonth?.toLocaleString() || '0'}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Icon name="information-outline" size={20} color={COLORS.primary} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.infoTitle}>کمیشن کا طریقہ</Text>
          <Text style={styles.infoText}>RentX ہر بکنگ سے 15% کمیشن لیتا ہے۔ باقی 85% آپ کی کمائی ہے۔</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 48 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  mainCard: { backgroundColor: COLORS.primary, margin: 16, borderRadius: 20, padding: 28, alignItems: 'center' },
  mainLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  mainAmount: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 4 },
  tripsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center', elevation: 2, gap: 6 },
  statLabel: { fontSize: 13, color: COLORS.textSecondary },
  statAmount: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  infoCard: { flexDirection: 'row', backgroundColor: '#EFF6EE', margin: 16, borderRadius: 12, padding: 16, alignItems: 'flex-start' },
  infoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
