import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { VEHICLE_TYPES } from '../../constants/index';
import { getVehicles } from '../../services/vehicleService';

export default function VehicleListScreen({ route, navigation }: any) {
  const { tripType, city } = route.params || {};
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await getVehicles({ city, tripType, type: filterType || undefined });
      setVehicles(res.data.vehicles);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, [filterType]);

  const getPriceKey = () => {
    const map: any = { city_day: 'cityPerDay', wedding: 'weddingPerDay', intercity: 'intercityPerDay', airport: 'airportFlat' };
    return map[tripType] || 'cityPerDay';
  };

  const renderVehicle = ({ item }: any) => {
    const driver = item.driverId;
    const user = driver?.userId;
    const price = item.rates?.[getPriceKey()];

    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VehicleDetail', { vehicle: item, tripType })}>
        <Image source={{ uri: item.photos?.[0] || 'https://via.placeholder.com/400x200' }} style={styles.image} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.vehicleName}>{item.year} {item.make} {item.model}</Text>
            <View style={styles.ratingPill}>
              <Icon name="star" size={13} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating?.toFixed(1)}</Text>
            </View>
          </View>
          <View style={styles.driverRow}>
            <Icon name="account" size={15} color={COLORS.muted} />
            <Text style={styles.driverName}>{user?.name || 'ڈرائیور'}</Text>
            <Icon name="star" size={13} color="#FFD700" style={{ marginLeft: 8 }} />
            <Text style={styles.driverRating}>{user?.rating?.toFixed(1)}</Text>
          </View>
          <View style={styles.features}>
            <View style={styles.chip}><Icon name="car-seat" size={13} color={COLORS.primary} /><Text style={styles.chipText}> {item.seats} نشستیں</Text></View>
            {item.features?.slice(0, 2).map((f: string) => (
              <View key={f} style={styles.chip}><Text style={styles.chipText}>{f}</Text></View>
            ))}
          </View>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.price}>PKR {price?.toLocaleString()}</Text>
              <Text style={styles.perDay}>{tripType === 'airport' ? 'فلیٹ' : '/دن'}</Text>
            </View>
            <TouchableOpacity style={styles.bookBtn}
              onPress={() => navigation.navigate('Booking', { vehicle: item, tripType })}>
              <Text style={styles.bookBtnText}>بک کریں</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>گاڑیاں ({city})</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Vehicle Type Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, !filterType && styles.filterChipActive]} onPress={() => setFilterType('')}>
          <Text style={[styles.filterText, !filterType && styles.filterTextActive]}>سب</Text>
        </TouchableOpacity>
        {VEHICLE_TYPES.map(vt => (
          <TouchableOpacity key={vt.id} style={[styles.filterChip, filterType === vt.id && styles.filterChipActive]} onPress={() => setFilterType(vt.id)}>
            <Text style={[styles.filterText, filterType === vt.id && styles.filterTextActive]}>{vt.labelEn}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="car-off" size={60} color={COLORS.muted} />
              <Text style={styles.emptyText}>اس وقت کوئی گاڑی دستیاب نہیں</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, elevation: 3, overflow: 'hidden' },
  image: { width: '100%', height: 190 },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleName: { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDE7', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, gap: 3 },
  ratingText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  driverRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  driverName: { fontSize: 14, color: COLORS.textSecondary },
  driverRating: { fontSize: 13, color: COLORS.textSecondary },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6EE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  price: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  perDay: { fontSize: 12, color: COLORS.muted },
  bookBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: COLORS.muted, textAlign: 'center' },
});
