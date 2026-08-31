import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { toggleOnline, getMyDriverProfile } from '../../services/driverService';
import { getDriverBookings, acceptBooking, cancelBooking } from '../../services/bookingService';
import { useAuthStore } from '../../store/authStore';

const STATUS_COLOR: any = { pending: '#F9A825', accepted: '#1565C0', active: COLORS.success, completed: '#4CAF50', cancelled: COLORS.danger };

export default function DriverDashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [driver, setDriver] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [driverRes, bookingsRes] = await Promise.all([
        getMyDriverProfile(),
        getDriverBookings(activeTab),
      ]);
      setDriver(driverRes.data.driver);
      setIsOnline(driverRes.data.driver.isOnline);
      setBookings(bookingsRes.data.bookings);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  const handleToggle = async (val: boolean) => {
    try {
      const res = await toggleOnline();
      setIsOnline(res.data.isOnline);
    } catch (e: any) {
      showAlert('خرابی', e.message);
    }
  };

  const handleAccept = async (bookingId: string) => {
    try {
      await acceptBooking(bookingId);
      fetchData();
      navigation.navigate('Chat', { bookingId });
    } catch (e: any) {
      showAlert('خرابی', e.message);
    }
  };

  const handleReject = (bookingId: string) => {
    showAlert('رد کریں؟', 'کیا آپ اس بکنگ کو رد کرنا چاہتے ہیں؟', [
      { text: 'نہیں' },
      { text: 'ہاں', style: 'destructive', onPress: async () => { await cancelBooking(bookingId, 'ڈرائیور نے رد کیا'); fetchData(); } },
    ]);
  };

  const renderBooking = ({ item }: any) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingTop}>
        <View>
          <Text style={styles.customerName}>{item.riderId?.name}</Text>
          <Text style={styles.tripType}>{item.tripType?.replace('_', ' ')} • {item.totalDays} دن</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
      </View>
      <View style={styles.routeRow}>
        <Icon name="map-marker" size={16} color={COLORS.primary} />
        <Text style={styles.routeText}>{item.pickupLocation?.address}</Text>
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amount}>PKR {item.totalAmount?.toLocaleString()}</Text>
        <Text style={styles.earning}>(آپ کو: PKR {item.driverEarning?.toLocaleString()})</Text>
      </View>
      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item._id)}>
            <Text style={styles.rejectBtnText}>رد کریں</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
            <Text style={styles.acceptBtnText}>قبول کریں</Text>
          </TouchableOpacity>
        </View>
      )}
      {item.status === 'accepted' && (
        <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { bookingId: item._id })}>
          <Icon name="chat" size={16} color="#fff" />
          <Text style={styles.chatBtnText}>گفتگو کریں</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>السلام علیکم</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <View style={styles.onlineToggle}>
          <Text style={styles.onlineLabel}>{isOnline ? 'آنلائن' : 'آف لائن'}</Text>
          <Switch value={isOnline} onValueChange={handleToggle} trackColor={{ true: '#A5D6A7', false: '#ccc' }} thumbColor={isOnline ? '#fff' : '#fff'} />
        </View>
      </View>

      {/* Status Banner */}
      {driver && !driver.isVerified && (
        <View style={styles.verifyBanner}>
          <Icon name="clock-outline" size={18} color="#795548" />
          <Text style={styles.verifyText}>تصدیق جاری ہے — 24-48 گھنٹے</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['pending', 'accepted', 'active', 'completed'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {{ pending: 'نئی', accepted: 'قبول', active: 'فعال', completed: 'مکمل' }[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={fetchData}
          refreshing={loading}
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
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  onlineToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', padding: 12, gap: 8 },
  verifyText: { fontSize: 14, color: '#795548', fontWeight: '500' },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  bookingCard: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, padding: 16, elevation: 2 },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  tripType: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  routeText: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  amount: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  earning: { fontSize: 13, color: COLORS.success },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  rejectBtn: { flex: 1, borderWidth: 1.5, borderColor: COLORS.danger, borderRadius: 8, padding: 10, alignItems: 'center' },
  rejectBtnText: { color: COLORS.danger, fontWeight: '700' },
  acceptBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 8, padding: 10, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '700' },
  chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLight, borderRadius: 8, padding: 10, marginTop: 12, gap: 6 },
  chatBtnText: { color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: COLORS.muted },
});
