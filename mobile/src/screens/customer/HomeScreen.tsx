import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TRIP_TYPES, CITIES } from '../../constants/index';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [selectedCity, setSelectedCity] = useState(user?.city || 'Chiniot');
  const [selectedTrip, setSelectedTrip] = useState('city_day');
  const [showCities, setShowCities] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>السلام علیکم 👋</Text>
          <Text style={styles.userName}>{user?.name || 'رائیڈر'}</Text>
        </View>
        <View style={styles.cityBtn}>
          <Icon name="map-marker" size={16} color="#fff" />
          <TouchableOpacity onPress={() => setShowCities(!showCities)}>
            <Text style={styles.cityBtnText}>{selectedCity} ▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* City Dropdown */}
      {showCities && (
        <View style={styles.cityDropdown}>
          {CITIES.map(c => (
            <TouchableOpacity key={c.name} style={styles.cityItem}
              onPress={() => { setSelectedCity(c.name); setShowCities(false); }}>
              <Text style={styles.cityItemText}>{c.label} — {c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>سفر کریں آسانی سے</Text>
          <Text style={styles.heroSub}>تصدیق شدہ ڈرائیوروں کے ساتھ</Text>
        </View>

        {/* Trip Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>سفر کی قسم</Text>
          <View style={styles.tripGrid}>
            {TRIP_TYPES.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={[styles.tripCard, selectedTrip === trip.id && styles.tripCardActive]}
                onPress={() => setSelectedTrip(trip.id)}
              >
                <Icon name={trip.icon as any} size={32} color={selectedTrip === trip.id ? '#fff' : COLORS.primary} />
                <Text style={[styles.tripLabel, selectedTrip === trip.id && { color: '#fff' }]}>{trip.label}</Text>
                <Text style={[styles.tripLabelEn, selectedTrip === trip.id && { color: 'rgba(255,255,255,0.8)' }]}>{trip.labelEn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => navigation.navigate('Search', { tripType: selectedTrip, city: selectedCity })}
        >
          <Icon name="magnify" size={24} color="#fff" />
          <Text style={styles.searchBtnText}>گاڑیاں تلاش کریں</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { num: '50+', label: 'تصدیق شدہ ڈرائیور' },
            { num: '4,500', label: 'PKR سے شروع' },
            { num: '24/7', label: 'سپورٹ' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>کیسے کام کرتا ہے؟</Text>
          {[
            { icon: 'magnify', step: '1', text: 'گاڑی تلاش کریں' },
            { icon: 'calendar-check', step: '2', text: 'بک کریں' },
            { icon: 'car', step: '3', text: 'سفر لطف اندوز ہوں' },
          ].map((s) => (
            <View key={s.step} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{s.step}</Text>
              </View>
              <Icon name={s.icon as any} size={22} color={COLORS.primary} style={{ marginRight: 12 }} />
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  userName: { color: '#fff', fontSize: 22, fontWeight: '700' },
  cityBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  cityBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cityDropdown: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, elevation: 6, zIndex: 99 },
  cityItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cityItemText: { fontSize: 15, color: COLORS.text },
  heroBanner: { backgroundColor: COLORS.secondary, margin: 16, borderRadius: 16, padding: 20 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  tripGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tripCard: { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center', elevation: 2 },
  tripCardActive: { backgroundColor: COLORS.primary },
  tripLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 8 },
  tripLabelEn: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.secondary, marginHorizontal: 16, marginVertical: 16, padding: 16, borderRadius: 14, gap: 10 },
  searchBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2, textAlign: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumText: { color: '#fff', fontWeight: '700' },
  stepText: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
});
