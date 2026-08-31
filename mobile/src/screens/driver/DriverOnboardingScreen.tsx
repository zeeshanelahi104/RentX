import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { CITIES } from '../../constants/index';
import { onboardDriver, uploadDriverDocs, getMyDriverProfile } from '../../services/driverService';
import { useAuthStore } from '../../store/authStore';

export default function DriverOnboardingScreen({ navigation }: any) {
  const { user, checkDriverProfile, logout } = useAuthStore();
  const [cnic, setCnic] = useState('');
  const [license, setLicense] = useState('');
  const [city, setCity] = useState(user?.city || 'Chiniot');
  const [bio, setBio] = useState('');
  const [cnicFront, setCnicFront] = useState<any>(null);
  const [cnicBack, setCnicBack] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [step, setStep] = useState(1);
  const [cnicError, setCnicError] = useState('');

  // Resume an in-progress application for this account instead of showing a blank
  // form again (this account may have already submitted step 1 previously).
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyDriverProfile();
        const driver = res.data.driver;
        setCnic(driver.cnicNumber || '');
        setLicense(driver.licenseNumber || '');
        setCity(driver.city || city);
        setBio(driver.bio || '');
        if (driver.cnicFrontPhoto && driver.cnicBackPhoto) {
          navigation.replace('DriverTabs');
        } else {
          setStep(2);
        }
      } catch {
        // No existing profile — proceed with the blank form.
      } finally {
        setCheckingExisting(false);
      }
    })();
  }, []);

  const pickImage = async (setter: any) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return showAlert('خرابی', 'تصاویر تک رسائی کی اجازت درکار ہے');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setter(result.assets[0]);
  };

  const handleStep1 = async () => {
    setCnicError('');
    if (!cnic.trim() || cnic.length < 13) return showAlert('خرابی', 'درست CNIC نمبر درج کریں (13 ہندسے)');

    setLoading(true);
    try {
      await onboardDriver({ cnicNumber: cnic.replace(/-/g, ''), licenseNumber: license, city, bio });
      await checkDriverProfile();
      setStep(2);
    } catch (e: any) {
      if (e.message === 'Driver profile already exists') {
        // Step 1 was already submitted (e.g. user went back to review it) — just proceed.
        await checkDriverProfile();
        setStep(2);
      } else if (e.field === 'cnicNumber') {
        setCnicError(e.message);
      } else {
        showAlert('خرابی', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!cnicFront || !cnicBack) return showAlert('خرابی', 'CNIC کی دونوں تصاویر ضروری ہیں');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('cnicFront', { uri: cnicFront.uri, type: cnicFront.mimeType || 'image/jpeg', name: 'cnic_front.jpg' } as any);
      formData.append('cnicBack', { uri: cnicBack.uri, type: cnicBack.mimeType || 'image/jpeg', name: 'cnic_back.jpg' } as any);
      if (license) formData.append('license', { uri: cnicFront.uri, type: cnicFront.mimeType || 'image/jpeg', name: 'license.jpg' } as any);

      await uploadDriverDocs(formData);
      showAlert('شکریہ!', 'آپ کی درخواست موصول ہو گئی۔ تصدیق میں 24-48 گھنٹے لگ سکتے ہیں', [
        { text: 'ٹھیک ہے', onPress: () => navigation.replace('DriverTabs') },
      ]);
    } catch (e: any) {
      showAlert('خرابی', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const handleBack = () => {
    // Step back within the form first, so users can review/edit step 1 fields.
    if (step === 2) {
      setStep(1);
      return;
    }
    // Reached from Profile (already onboarded, revisiting this screen) — just go back to it.
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    // Reached as the root screen (driver hasn't onboarded yet) — no home to return to,
    // so the only way "back" makes sense is switching accounts.
    showAlert('لاگ آؤٹ', 'واپس جانے کے لیے لاگ آؤٹ کرنا ضروری ہے۔ کیا آپ لاگ آؤٹ کرنا چاہتے ہیں؟', [
      { text: 'نہیں' },
      { text: 'ہاں', onPress: logout, style: 'destructive' },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ڈرائیور رجسٹریشن</Text>
        <Text style={styles.stepLabel}>مرحلہ {step}/2</Text>
      </View>

      {step === 1 ? (
        <>
          <Text style={styles.sectionTitle}>ذاتی معلومات</Text>

          <Text style={styles.label}>CNIC نمبر *</Text>
          <TextInput
            style={[styles.input, cnicError && styles.inputError]}
            placeholder="XXXXX-XXXXXXX-X"
            placeholderTextColor={COLORS.muted}
            keyboardType="numeric"
            value={cnic}
            onChangeText={(v) => { setCnic(v); setCnicError(''); }}
            maxLength={15}
          />
          {!!cnicError && <Text style={styles.errorText}>{cnicError}</Text>}

          <Text style={styles.label}>ڈرائیونگ لائسنس (اختیاری)</Text>
          <TextInput style={styles.input} placeholder="لائسنس نمبر" placeholderTextColor={COLORS.muted} value={license} onChangeText={setLicense} />

          <Text style={styles.label}>شہر *</Text>
          <View style={styles.cityGrid}>
            {CITIES.map(c => (
              <TouchableOpacity key={c.name} style={[styles.cityChip, city === c.name && styles.cityChipActive]} onPress={() => setCity(c.name)}>
                <Text style={[styles.cityChipText, city === c.name && styles.cityChipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>اپنے بارے میں (اختیاری)</Text>
          <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="مثال: 10 سال کا تجربہ، شادی اور سفر کا ماہر" placeholderTextColor={COLORS.muted} value={bio} onChangeText={setBio} />

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleStep1} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'محفوظ...' : 'اگلا مرحلہ →'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>دستاویزات اپ لوڈ کریں</Text>

          <Text style={styles.label}>CNIC اگلی طرف *</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setCnicFront)}>
            {cnicFront ? <Image source={{ uri: cnicFront.uri }} style={styles.docPreview} /> : <><Icon name="camera" size={36} color={COLORS.muted} /><Text style={styles.uploadText}>تصویر منتخب کریں</Text></>}
          </TouchableOpacity>

          <Text style={styles.label}>CNIC پچھلی طرف *</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setCnicBack)}>
            {cnicBack ? <Image source={{ uri: cnicBack.uri }} style={styles.docPreview} /> : <><Icon name="camera" size={36} color={COLORS.muted} /><Text style={styles.uploadText}>تصویر منتخب کریں</Text></>}
          </TouchableOpacity>

          <View style={styles.notice}>
            <Icon name="information" size={18} color={COLORS.secondary} />
            <Text style={styles.noticeText}>تصدیق میں 24-48 گھنٹے لگتے ہیں۔ آپ کا ڈیٹا محفوظ ہے۔</Text>
          </View>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleStep2} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'اپ لوڈ ہو رہا ہے...' : 'جمع کروائیں'}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 40, marginBottom: 24 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  stepLabel: { fontSize: 14, color: COLORS.muted, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text },
  inputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 13, color: COLORS.danger, marginTop: 6 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  cityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  cityChipText: { fontSize: 14, color: COLORS.text },
  cityChipTextActive: { color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  uploadBox: { borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 12, height: 130, justifyContent: 'center', alignItems: 'center', gap: 8, overflow: 'hidden' },
  uploadText: { fontSize: 14, color: COLORS.muted },
  docPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  notice: { flexDirection: 'row', backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, gap: 8, marginTop: 16, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 13, color: '#795548', lineHeight: 20 },
});
