import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function VehicleDetailScreen({ route, navigation }: any) {
  const { vehicle, tripType } = route.params;
  const [activePhoto, setActivePhoto] = useState(0);
  const driver = vehicle.driverId;
  const user = driver?.userId;

  const priceMap: any = {
    city_day: vehicle.rates?.cityPerDay,
    wedding: vehicle.rates?.weddingPerDay,
    intercity: vehicle.rates?.intercityPerDay,
    airport: vehicle.rates?.airportFlat,
  };
  const price = priceMap[tripType] || vehicle.rates?.cityPerDay;
  const photos = vehicle.photos?.length ? vehicle.photos : ['https://via.placeholder.com/400x250'];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView>
        {/* Photo Carousel */}
        <View>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => <Image source={{ uri: item }} style={[styles.photo, { width }]} />}
            keyExtractor={(_, i) => i.toString()}
          />
          <View style={styles.dotRow}>
            {photos.map((_: any, i: number) => (
              <View key={i} style={[styles.dot, i === activePhoto && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Title */}
          <View style={styles.titleRow}>
            <Text style={styles.vehicleName}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
            <View style={styles.ratingPill}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{vehicle.rating?.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoChip}><Icon name="car-seat" size={16} color={COLORS.primary} /><Text style={styles.infoChipText}> {vehicle.seats} نشستیں</Text></View>
            <View style={styles.infoChip}><Icon name="palette" size={16} color={COLORS.primary} /><Text style={styles.infoChipText}> {vehicle.color}</Text></View>
            <View style={styles.infoChip}><Icon name="tag" size={16} color={COLORS.primary} /><Text style={styles.infoChipText}> {vehicle.plateNumber}</Text></View>
          </View>

          {/* Features */}
          {vehicle.features?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>خصوصیات</Text>
              <View style={styles.featuresRow}>
                {vehicle.features.map((f: string) => (
                  <View key={f} style={styles.featureChip}>
                    <Icon name="check-circle" size={14} color={COLORS.primary} />
                    <Text style={styles.featureText}> {f}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Driver Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ڈرائیور</Text>
            <View style={styles.driverCard}>
              <Icon name="account-circle" size={48} color={COLORS.primary} />
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={styles.driverName}>{user?.name}</Text>
                <View style={styles.driverStats}>
                  <Icon name="star" size={14} color="#FFD700" />
                  <Text style={styles.driverStat}>{user?.rating?.toFixed(1)} ریٹنگ</Text>
                  <Text style={styles.dot2}>•</Text>
                  <Text style={styles.driverStat}>{driver?.totalTrips || 0} سفر</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>قیمتیں</Text>
            {[
              { label: 'شہر کا سفر/دن', val: vehicle.rates?.cityPerDay },
              { label: 'بین شہری/دن', val: vehicle.rates?.intercityPerDay },
              { label: 'شادی/دن', val: vehicle.rates?.weddingPerDay },
              { label: 'ایئرپورٹ', val: vehicle.rates?.airportFlat },
            ].map(r => (
              <View key={r.label} style={styles.priceRow}>
                <Text style={styles.priceLabel}>{r.label}</Text>
                <Text style={styles.priceVal}>PKR {r.val?.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.cta}>
        <View>
          <Text style={styles.ctaPrice}>PKR {price?.toLocaleString()}</Text>
          <Text style={styles.ctaLabel}>{tripType === 'airport' ? 'فلیٹ ریٹ' : 'فی دن'}</Text>
        </View>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('Booking', { vehicle, tripType })}
        >
          <Text style={styles.ctaBtnText}>ابھی بک کریں</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { height: 260, resizeMode: 'cover' },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, position: 'absolute', bottom: 12, width: '100%' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 20 },
  backBtn: { position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8 },
  body: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleName: { fontSize: 22, fontWeight: '800', color: COLORS.text, flex: 1 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDE7', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  infoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  infoChipText: { fontSize: 13, color: COLORS.text },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6EE', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  featureText: { fontSize: 13, color: COLORS.primary },
  driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 14, padding: 16 },
  driverName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  driverStats: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  driverStat: { fontSize: 13, color: COLORS.textSecondary },
  dot2: { color: COLORS.muted },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  priceLabel: { fontSize: 15, color: COLORS.textSecondary },
  priceVal: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  cta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 8 },
  ctaPrice: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  ctaLabel: { fontSize: 12, color: COLORS.muted },
  ctaBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  ctaBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
