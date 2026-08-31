import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { PAYMENT_METHODS } from '../../constants/index';
import { createBooking } from '../../services/bookingService';

export default function BookingScreen({ route, navigation }: any) {
  const { vehicle, tripType } = route.params;
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
  const priceMap: any = { city_day: vehicle.rates?.cityPerDay, wedding: vehicle.rates?.weddingPerDay, intercity: vehicle.rates?.intercityPerDay, airport: vehicle.rates?.airportFlat };
  const dailyRate = priceMap[tripType] || vehicle.rates?.cityPerDay;
  const totalAmount = tripType === 'airport' ? dailyRate : dailyRate * totalDays;
  const commission = Math.round(totalAmount * 0.15);
  const driverEarning = totalAmount - commission;

  const formatDate = (d: Date) => d.toLocaleDateString('ur-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleBooking = async () => {
    if (!pickup.trim()) return showAlert('خرابی', 'پک اپ لوکیشن درج کریں');

    setLoading(true);
    try {
      const res = await createBooking({
        vehicleId: vehicle._id,
        tripType,
        pickupLocation: pickup,
        dropLocation: drop,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentMethod,
        notes,
      });
      navigation.replace('BookingConfirm', { booking: res.data.booking });
    } catch (e: any) {
      showAlert('خرابی', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>بکنگ کریں</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Vehicle Summary */}
        <View style={styles.vehicleCard}>
          <Icon name="car" size={28} color={COLORS.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.vehicleLabel}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
            <Text style={styles.vehicleSub}>{vehicle.color} • {vehicle.seats} نشستیں</Text>
          </View>
        </View>

        {/* Locations */}
        <Text style={styles.label}>پک اپ لوکیشن *</Text>
        <TextInput style={styles.input} placeholder="مثال: گھر نمبر 5، خیابان، چنیوٹ" placeholderTextColor={COLORS.muted} value={pickup} onChangeText={setPickup} />

        <Text style={styles.label}>ڈراپ لوکیشن</Text>
        <TextInput style={styles.input} placeholder="منزل (اختیاری)" placeholderTextColor={COLORS.muted} value={drop} onChangeText={setDrop} />

        {/* Dates */}
        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>شروع تاریخ</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStart(true)}>
              <Icon name="calendar" size={18} color={COLORS.primary} />
              <Text style={styles.dateBtnText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
          </View>
          {tripType !== 'airport' && (
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.label}>ختم تاریخ</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEnd(true)}>
                <Icon name="calendar" size={18} color={COLORS.primary} />
                <Text style={styles.dateBtnText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showStart && (
          <DateTimePicker value={startDate} mode="date" minimumDate={new Date()}
            onChange={(_, d) => { setShowStart(false); if (d) setStartDate(d); }} />
        )}
        {showEnd && (
          <DateTimePicker value={endDate} mode="date" minimumDate={startDate}
            onChange={(_, d) => { setShowEnd(false); if (d) setEndDate(d); }} />
        )}

        {/* Payment */}
        <Text style={styles.label}>ادائیگی کا طریقہ</Text>
        <View style={styles.paymentRow}>
          {PAYMENT_METHODS.map(pm => (
            <TouchableOpacity key={pm.id}
              style={[styles.payChip, paymentMethod === pm.id && styles.payChipActive]}
              onPress={() => setPaymentMethod(pm.id)}>
              <Text style={[styles.payChipText, paymentMethod === pm.id && styles.payChipTextActive]}>{pm.labelEn}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.label}>خصوصی ہدایات (اختیاری)</Text>
        <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="مثال: AC رکھیں، وقت پر آئیں" placeholderTextColor={COLORS.muted} value={notes} onChangeText={setNotes} />

        {/* Price Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>قیمت کا خلاصہ</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>PKR {dailyRate?.toLocaleString()} × {tripType === 'airport' ? '1 سفر' : `${totalDays} دن`}</Text><Text style={styles.summaryVal}>PKR {totalAmount?.toLocaleString()}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>پلیٹ فارم فیس (15%)</Text><Text style={styles.summaryVal}>PKR {commission?.toLocaleString()}</Text></View>
          <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>کل ادائیگی</Text><Text style={styles.totalVal}>PKR {totalAmount?.toLocaleString()}</Text></View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.bookBtn, loading && { opacity: 0.6 }]} onPress={handleBooking} disabled={loading}>
          <Text style={styles.bookBtnText}>{loading ? 'بک ہو رہا ہے...' : `بک کریں — PKR ${totalAmount?.toLocaleString()}`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 100 },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, padding: 16, marginBottom: 20 },
  vehicleLabel: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  vehicleSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, gap: 8 },
  dateBtnText: { fontSize: 14, color: COLORS.text },
  paymentRow: { flexDirection: 'row', gap: 10 },
  payChip: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 10, alignItems: 'center' },
  payChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  payChipText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  payChipTextActive: { color: '#fff' },
  summary: { backgroundColor: COLORS.background, borderRadius: 14, padding: 16, marginTop: 24 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: COLORS.textSecondary },
  summaryVal: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  totalVal: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
