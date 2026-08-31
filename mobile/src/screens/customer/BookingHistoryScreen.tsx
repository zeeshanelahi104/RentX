import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getMyBookings } from '../../services/bookingService';

const STATUS_TABS = [
  { id: '', label: 'سب' },
  { id: 'pending', label: 'زیر التواء' },
  { id: 'active', label: 'فعال' },
  { id: 'completed', label: 'مکمل' },
  { id: 'cancelled', label: 'منسوخ' },
];

const STATUS_COLORS: any = {
  pending: '#F9A825', accepted: '#1565C0', active: '#2E7D32',
  completed: '#4CAF50', cancelled: '#E53935',
};

export default function BookingHistoryScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getMyBookings(activeTab || undefined);
      setBookings(res.data.bookings);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const renderBooking = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Chat', { bookingId: item._id })}>
      <View style={styles.cardTop}>
        <Text style={styles.vehicleName}>
          {item.vehicleId?.year} {item.vehicleId?.make} {item.vehicleId?.model}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.route}>{item.pickupLocation?.address}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.amount}>PKR {item.totalAmount?.toLocaleString()}</Text>
        <Text style={styles.date}>{new Date(item.startDate).toLocaleDateString('ur-PK')}</Text>
      </View>
      {item.status === 'completed' && !item.riderRating && (
        <TouchableOpacity style={styles.rateBtn} onPress={() => navigation.navigate('Rating', { bookingId: item._id })}>
          <Icon name="star-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.rateBtnText}>ریٹنگ دیں</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>میری بکنگز</Text>
      </View>

      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={i => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.tab, activeTab === item.id && styles.tabActive]} onPress={() => setActiveTab(item.id)}>
            <Text style={[styles.tabText, activeTab === item.id && styles.tabTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="calendar-blank" size={60} color={COLORS.muted} />
              <Text style={styles.emptyText}>کوئی بکنگ نہیں</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 48 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  tabRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, padding: 16, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleName: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  route: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  amount: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  date: { fontSize: 13, color: COLORS.muted },
  rateBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  rateBtnText: { color: COLORS.secondary, fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: COLORS.muted },
});
