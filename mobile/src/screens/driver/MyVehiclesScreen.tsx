import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getMyVehicles, updateVehicle } from '../../services/vehicleService';

export default function MyVehiclesScreen({ navigation }: any) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await getMyVehicles();
      setVehicles(res.data.vehicles);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const toggleAvailability = async (vehicle: any) => {
    await updateVehicle(vehicle._id, { isAvailable: !vehicle.isAvailable });
    fetchVehicles();
  };

  const renderVehicle = ({ item }: any) => (
    <View style={styles.card}>
      <Image source={{ uri: item.photos?.[0] || 'https://via.placeholder.com/300x150' }} style={styles.image} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.name}>{item.year} {item.make} {item.model}</Text>
          <TouchableOpacity style={[styles.availBadge, { backgroundColor: item.isAvailable ? '#E8F5E9' : '#FFEBEE' }]} onPress={() => toggleAvailability(item)}>
            <Text style={[styles.availText, { color: item.isAvailable ? COLORS.success : COLORS.danger }]}>
              {item.isAvailable ? 'دستیاب' : 'غیر دستیاب'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.plate}>{item.plateNumber}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>شہر: </Text>
          <Text style={styles.priceVal}>PKR {item.rates?.cityPerDay?.toLocaleString()}/دن</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>میری گاڑیاں</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddVehicle', { onAdded: fetchVehicles })}>
          <Icon name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={fetchVehicles}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="car-off" size={60} color={COLORS.muted} />
              <Text style={styles.emptyText}>کوئی گاڑی نہیں</Text>
              <TouchableOpacity style={styles.addVehicleBtn} onPress={() => navigation.navigate('AddVehicle')}>
                <Text style={styles.addVehicleBtnText}>گاڑی شامل کریں</Text>
              </TouchableOpacity>
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
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 14, elevation: 2, overflow: 'hidden' },
  image: { width: '100%', height: 150, resizeMode: 'cover' },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  availBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  availText: { fontSize: 12, fontWeight: '600' },
  plate: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  priceLabel: { fontSize: 14, color: COLORS.textSecondary },
  priceVal: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  empty: { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyText: { fontSize: 16, color: COLORS.muted },
  addVehicleBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  addVehicleBtnText: { color: '#fff', fontWeight: '700' },
});
