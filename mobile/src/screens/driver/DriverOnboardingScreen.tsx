import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { CITIES } from '../../constants/index';
import { onboardDriver, updateDriverProfile, uploadDriverDocs, getMyDriverProfile } from '../../services/driverService';
import { useAuthStore } from '../../store/authStore';
import { appendImageToFormData } from '../../utils/formDataImage';

export default function DriverOnboardingScreen({ navigation, route }: any) {
  const { user, checkDriverProfile, logout } = useAuthStore();
  // Reached via Profile → "ڈرائیور پروفائل" once already onboarded: edit in place,
  // don't run the fresh-signup redirect/wizard flow below.
  const isEditMode = !!route?.params?.editMode;
  const [cnic, setCnic] = useState('');
  const [license, setLicense] = useState('');
  const [city, setCity] = useState(user?.city || 'Chiniot');
  const [bio, setBio] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [cnicFront, setCnicFront] = useState<any>(null);
  const [cnicBack, setCnicBack] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [step, setStep] = useState(1);
  const [cnicError, setCnicError] = useState('');
  const [isFullyOnboarded, setIsFullyOnboarded] = useState(false);

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
          if (isEditMode) {
            setIsFullyOnboarded(true);
          } else {
            navigation.replace('DriverTabs');
          }
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
      await onboardDriver({ cnicNumber: cnic.replace(/-/g, ''), licenseNumber: license, city, bio, referralCode: referralCode.trim() || undefined });
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

  const handleEditSave = async () => {
    setCnicError('');
    if (!cnic.trim() || cnic.length < 13) return showAlert('خرابی', 'درست CNIC نمبر درج کریں (13 ہندسے)');

    setLoading(true);
    try {
      await updateDriverProfile({ cnicNumber: cnic.replace(/-/g, ''), licenseNumber: license, city, bio });
      showAlert('کامیاب!', 'آپ کی ڈرائیور پروفائل اپ ڈیٹ ہو گئی', [{ text: 'ٹھیک ہے', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      if (e.field === 'cnicNumber') setCnicError(e.message);
      else showAlert('خرابی', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!cnicFront || !cnicBack) return showAlert('خرابی', 'CNIC کی دونوں تصاویر ضروری ہیں');

    setLoading(true);
    try {
      const formData = new FormData();
      await appendImageToFormData(formData, 'cnicFront', cnicFront, 'cnic_front.jpg');
      await appendImageToFormData(formData, 'cnicBack', cnicBack, 'cnic_back.jpg');
      if (license) await appendImageToFormData(formData, 'license', cnicFront, 'license.jpg');

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

  const infoFields = (
    <>
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
      {isFullyOnboarded && <Text style={styles.hintText}>CNIC نمبر بدلنے پر پروفائل دوبارہ تصدیق کے لیے بھیجی جائے گی</Text>}

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

      {!isFullyOnboarded && (
        <>
          <Text style={styles.label}>ریفرل کوڈ (اختیاری)</Text>
          <TextInput
            style={styles.input}
            placeholder="کسی دوست کا ریفرل کوڈ درج کریں"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="characters"
            value={referralCode}
            onChangeText={setReferralCode}
          />
        </>
      )}
    </>
  );

  if (isFullyOnboarded) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ڈرائیور پروفائل</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.sectionTitle}>ذاتی معلومات میں تبدیلی</Text>
        {infoFields}

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleEditSave} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'محفوظ...' : 'محفوظ کریں'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

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
          {infoFields}

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
  hintText: { fontSize: 12, color: COLORS.muted, marginTop: 6 },
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
