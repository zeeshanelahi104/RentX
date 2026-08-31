import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { VEHICLE_TYPES, CITIES } from '../../constants/index';
import { addVehicle, uploadVehiclePhotos } from '../../services/vehicleService';
import { useAuthStore } from '../../store/authStore';

const FEATURES = ['AC', 'WiFi', 'GPS', 'Child Seat', 'Music System', 'Charging Port'];

export default function AddVehicleScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [type, setType] = useState('car');
  const [seats, setSeats] = useState('5');
  const [city, setCity] = useState(user?.city || 'Chiniot');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [rates, setRates] = useState({ cityPerDay: '', intercityPerDay: '', weddingPerDay: '', airportFlat: '' });
  const [loading, setLoading] = useState(false);
  const [plateError, setPlateError] = useState('');

  const toggleFeature = (f: string) => setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return showAlert('خرابی', 'تصاویر تک رسائی کی اجازت درکار ہے');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, selectionLimit: 5, quality: 0.8, allowsMultipleSelection: true });
    if (!result.canceled) setPhotos(prev => [...prev, ...result.assets].slice(0, 6));
  };

  const handleSubmit = async () => {
    setPlateError('');
    if (!make || !model || !year || !plate || !rates.cityPerDay) {
      return showAlert('خرابی', 'تمام ضروری معلومات درج کریں');
    }
    setLoading(true);
    try {
      const res = await addVehicle({
        make, model, year: parseInt(year), color, plateNumber: plate,
        type, seats: parseInt(seats), features: selectedFeatures, city,
        rates: {
          cityPerDay: parseInt(rates.cityPerDay),
          intercityPerDay: parseInt(rates.intercityPerDay || rates.cityPerDay),
          weddingPerDay: parseInt(rates.weddingPerDay || rates.cityPerDay),
          airportFlat: parseInt(rates.airportFlat || rates.cityPerDay),
        },
      });

      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((p, i) => formData.append('photos', { uri: p.uri, type: p.mimeType || 'image/jpeg', name: `vehicle_${i}.jpg` } as any));
        await uploadVehiclePhotos(res.data.vehicle._id, formData);
      }

      showAlert('کامیاب!', 'گاڑی شامل کر دی گئی', [{ text: 'ٹھیک ہے', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      if (e.field === 'plateNumber') setPlateError(e.message);
      else showAlert('خرابی', e.message);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, value, onChangeText, placeholder, keyboardType = 'default', error }: any) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, error && styles.inputError]} placeholder={placeholder} placeholderTextColor={COLORS.muted} value={value} onChangeText={onChangeText} keyboardType={keyboardType} />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>گاڑی شامل کریں</Text>
        <View style={{ width: 24 }} />
      </View>

      <Field label="گاڑی کا برانڈ *" value={make} onChangeText={setMake} placeholder="مثال: Toyota" />
      <Field label="ماڈل *" value={model} onChangeText={setModel} placeholder="مثال: Corolla" />
      <Field label="سال *" value={year} onChangeText={setYear} placeholder="مثال: 2020" keyboardType="numeric" />
      <Field label="رنگ" value={color} onChangeText={setColor} placeholder="مثال: سفید" />
      <Field label="نمبر پلیٹ *" value={plate} onChangeText={(v: string) => { setPlate(v); setPlateError(''); }} placeholder="مثال: RTC-123" error={plateError} />
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

      <Text style={styles.sectionLabel}>تصاویر ({photos.length}/6)</Text>
      <TouchableOpacity style={styles.photoBtn} onPress={pickPhotos}>
        <Icon name="camera-plus" size={28} color={COLORS.primary} />
        <Text style={styles.photoBtnText}>تصاویر شامل کریں</Text>
      </TouchableOpacity>
      <View style={styles.photoGrid}>
        {photos.map((p, i) => <Image key={i} source={{ uri: p.uri }} style={styles.photoThumb} />)}
      </View>

      <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitBtnText}>{loading ? 'محفوظ ہو رہا ہے...' : 'گاڑی شامل کریں'}</Text>
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
  inputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 13, color: COLORS.danger, marginTop: 6, marginHorizontal: 20 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  sectionLabel: { fontSize: 17, fontWeight: '700', color: COLORS.text, paddingHorizontal: 20, marginTop: 24, marginBottom: 4 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  featureChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  featureChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  featureText: { fontSize: 13, color: COLORS.text },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.border, borderRadius: 12, margin: 20, padding: 20 },
  photoBtnText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  photoThumb: { width: 90, height: 80, borderRadius: 8 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', margin: 20 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
