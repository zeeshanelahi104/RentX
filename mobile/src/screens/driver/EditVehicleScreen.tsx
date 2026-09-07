import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { VEHICLE_TYPES, CITIES } from '../../constants/index';
import { updateVehicle } from '../../services/vehicleService';

const FEATURES = ['AC', 'WiFi', 'GPS', 'Child Seat', 'Music System', 'Charging Port'];

export default function EditVehicleScreen({ route, navigation }: any) {
  const { vehicle, onUpdated } = route.params;
  const [make, setMake] = useState(vehicle.make || '');
  const [model, setModel] = useState(vehicle.model || '');
  const [year, setYear] = useState(String(vehicle.year || ''));
  const [color, setColor] = useState(vehicle.color || '');
  const [type, setType] = useState(vehicle.type || 'car');
  const [seats, setSeats] = useState(String(vehicle.seats || '5'));
  const [city, setCity] = useState(vehicle.city || 'Chiniot');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(vehicle.features || []);
  const [rates, setRates] = useState({
    cityPerDay: String(vehicle.rates?.cityPerDay || ''),
    intercityPerDay: String(vehicle.rates?.intercityPerDay || ''),
    weddingPerDay: String(vehicle.rates?.weddingPerDay || ''),
    airportFlat: String(vehicle.rates?.airportFlat || ''),
  });
  const [loading, setLoading] = useState(false);

  const toggleFeature = (f: string) => setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const handleSubmit = async () => {
    if (!make || !model || !year || !rates.cityPerDay) {
      return showAlert('خرابی', 'تمام ضروری معلومات درج کریں');
    }
    setLoading(true);
    try {
      await updateVehicle(vehicle._id, {
        make, model, year: parseInt(year), color,
        type, seats: parseInt(seats), features: selectedFeatures, city,
        rates: {
          cityPerDay: parseInt(rates.cityPerDay),
          intercityPerDay: parseInt(rates.intercityPerDay || rates.cityPerDay),
          weddingPerDay: parseInt(rates.weddingPerDay || rates.cityPerDay),
          airportFlat: parseInt(rates.airportFlat || rates.cityPerDay),
        },
      });

      onUpdated?.();
      showAlert('کامیاب!', 'گاڑی کی تفصیلات محفوظ ہو گئیں', [{ text: 'ٹھیک ہے', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      showAlert('خرابی', e.message);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={COLORS.muted} value={value} onChangeText={onChangeText} keyboardType={keyboardType} />
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>گاڑی میں ترمیم کریں</Text>
        <View style={{ width: 24 }} />
      </View>

      <Field label="گاڑی کا برانڈ *" value={make} onChangeText={setMake} placeholder="مثال: Toyota" />
      <Field label="ماڈل *" value={model} onChangeText={setModel} placeholder="مثال: Corolla" />
      <Field label="سال *" value={year} onChangeText={setYear} placeholder="مثال: 2020" keyboardType="numeric" />
      <Field label="رنگ" value={color} onChangeText={setColor} placeholder="مثال: سفید" />

      <Text style={styles.label}>نمبر پلیٹ</Text>
      <View style={[styles.input, styles.lockedField]}>
        <Text style={styles.lockedText}>{vehicle.plateNumber}</Text>
        <Icon name="lock-outline" size={16} color={COLORS.muted} />
      </View>

      <Field label="نشستیں" value={seats} onChangeText={setSeats} placeholder="5" keyboardType="numeric" />

      <Text style={styles.label}>گاڑی کی قسم</Text>
      <View style={styles.typeRow}>
        {VEHICLE_TYPES.map(vt => (
          <TouchableOpacity key={vt.id} style={[styles.typeChip, type === vt.id && styles.typeChipActive]} onPress={() => setType(vt.id)}>
            <Icon name={vt.icon as any} size={20} color={type === vt.id ? '#fff' : COLORS.primary} />
            <Text style={[styles.typeChipText, type === vt.id && { color: '#fff' }]}>{vt.labelEn}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>شہر</Text>
      <View style={styles.cityGrid}>
        {CITIES.map(c => (
          <TouchableOpacity key={c.name} style={[styles.cityChip, city === c.name && styles.cityChipActive]} onPress={() => setCity(c.name)}>
            <Text style={[styles.cityChipText, city === c.name && styles.cityChipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>قیمتیں (PKR)</Text>
      <Field label="شہری سفر فی دن *" value={rates.cityPerDay} onChangeText={(v: string) => setRates(r => ({ ...r, cityPerDay: v }))} placeholder="مثال: 5000" keyboardType="numeric" />
      <Field label="بین شہری فی دن" value={rates.intercityPerDay} onChangeText={(v: string) => setRates(r => ({ ...r, intercityPerDay: v }))} placeholder="مثال: 7000" keyboardType="numeric" />
      <Field label="شادی فی دن" value={rates.weddingPerDay} onChangeText={(v: string) => setRates(r => ({ ...r, weddingPerDay: v }))} placeholder="مثال: 8000" keyboardType="numeric" />
      <Field label="ایئرپورٹ (فلیٹ)" value={rates.airportFlat} onChangeText={(v: string) => setRates(r => ({ ...r, airportFlat: v }))} placeholder="مثال: 4000" keyboardType="numeric" />

      <Text style={styles.sectionLabel}>خصوصیات</Text>
      <View style={styles.featuresGrid}>
        {FEATURES.map(f => (
          <TouchableOpacity key={f} style={[styles.featureChip, selectedFeatures.includes(f) && styles.featureChipActive]} onPress={() => toggleFeature(f)}>
            <Text style={[styles.featureText, selectedFeatures.includes(f) && { color: '#fff' }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitBtnText}>{loading ? 'محفوظ ہو رہا ہے...' : 'تبدیلیاں محفوظ کریں'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },
  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16, paddingHorizontal: 20 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text, marginHorizontal: 20 },
  lockedField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.background },
  lockedText: { fontSize: 15, color: COLORS.textSecondary },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  cityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  cityChipText: { fontSize: 14, color: COLORS.text },
  cityChipTextActive: { color: '#fff', fontWeight: '600' },
  sectionLabel: { fontSize: 17, fontWeight: '700', color: COLORS.text, paddingHorizontal: 20, marginTop: 24, marginBottom: 4 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  featureChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  featureChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  featureText: { fontSize: 13, color: COLORS.text },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', margin: 20 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
