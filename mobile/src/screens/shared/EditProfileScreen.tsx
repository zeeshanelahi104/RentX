import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { CITIES } from '../../constants/index';
import { showAlert } from '../../utils/alert';
import { updateProfile, uploadProfilePhoto } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { appendImageToFormData } from '../../utils/formDataImage';

export default function EditProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || 'Chiniot');
  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return showAlert('خرابی', 'تصاویر تک رسائی کی اجازت درکار ہے');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const handleSave = async () => {
    if (!name.trim()) return showAlert('خرابی', 'براہ کرم اپنا نام درج کریں');

    setLoading(true);
    try {
      const res = await updateProfile({ name: name.trim(), city });
      let updatedUser = res.data.user;

      if (photo) {
        const formData = new FormData();
        await appendImageToFormData(formData, 'photo', photo, 'profile.jpg');
        const photoRes = await uploadProfilePhoto(formData);
        updatedUser = { ...updatedUser, profilePhoto: photoRes.data.profilePhoto };
      }

      setUser(updatedUser);
      showAlert('کامیاب!', 'آپ کی پروفائل اپ ڈیٹ ہو گئی', [{ text: 'ٹھیک ہے', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      showAlert('خرابی', e.message);
    } finally {
      setLoading(false);
    }
  };

  const displayPhoto = photo?.uri || user?.profilePhoto;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>پروفائل میں تبدیلی</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto}>
        {displayPhoto ? (
          <Image source={{ uri: displayPhoto }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Icon name="account" size={48} color="#fff" />
          </View>
        )}
        <View style={styles.cameraBadge}>
          <Icon name="camera" size={16} color="#fff" />
        </View>
      </TouchableOpacity>

      <Text style={styles.label}>نام</Text>
      <TextInput
        style={styles.input}
        placeholder="اپنا نام درج کریں"
        placeholderTextColor={COLORS.muted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>ای میل / فون نمبر</Text>
      <View style={[styles.input, styles.inputDisabled]}>
        <Text style={styles.disabledText}>{user?.email || user?.phone}</Text>
      </View>

      <Text style={styles.label}>شہر</Text>
      <View style={styles.cityGrid}>
        {CITIES.map(c => (
          <TouchableOpacity key={c.name} style={[styles.cityChip, city === c.name && styles.cityChipActive]} onPress={() => setCity(c.name)}>
            <Text style={[styles.cityChipText, city === c.name && styles.cityChipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>محفوظ کریں</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 40, marginBottom: 24 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  avatarWrap: { alignSelf: 'center', marginBottom: 28 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: 14, padding: 6, borderWidth: 2, borderColor: '#fff' },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 16, color: COLORS.text },
  inputDisabled: { backgroundColor: COLORS.background },
  disabledText: { fontSize: 16, color: COLORS.muted },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  cityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  cityChipText: { fontSize: 14, color: COLORS.text },
  cityChipTextActive: { color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
