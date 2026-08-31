import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    showAlert('لاگ آؤٹ', 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟', [
      { text: 'نہیں' },
      { text: 'ہاں', onPress: logout, style: 'destructive' },
    ]);
  };

  const MenuItem = ({ icon, label, onPress, danger }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={22} color={danger ? COLORS.danger : COLORS.primary} />
      <Text style={[styles.menuLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      <Icon name="chevron-right" size={20} color={COLORS.muted} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Icon name="account" size={52} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone || user?.email}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Icon name="map-marker" size={14} color={COLORS.secondary} />
            <Text style={styles.badgeText}>{user?.city}</Text>
          </View>
          <View style={styles.badge}>
            <Icon name={user?.role === 'driver' ? 'car' : 'account'} size={14} color={COLORS.secondary} />
            <Text style={styles.badgeText}>{user?.role === 'driver' ? 'ڈرائیور' : 'رائیڈر'}</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.badgeText}>{user?.rating?.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        {user?.role === 'driver' && (
          <>
            <MenuItem icon="car-plus" label="گاڑی شامل کریں" onPress={() => navigation.navigate('AddVehicle')} />
            <MenuItem icon="file-document" label="ڈرائیور پروفائل" onPress={() => navigation.navigate('DriverOnboarding')} />
          </>
        )}
        <MenuItem
          icon="calendar-check"
          label="میری بکنگز"
          onPress={() => navigation.navigate(user?.role === 'driver' ? 'Dashboard' : 'Bookings')}
        />
        <MenuItem icon="help-circle" label="مدد اور سپورٹ" onPress={() => navigation.navigate('HelpSupport')} />
        <MenuItem icon="information" label="ایپ کے بارے میں" onPress={() => navigation.navigate('About')} />
        <MenuItem icon="logout" label="لاگ آؤٹ" onPress={handleLogout} danger />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: { backgroundColor: COLORS.primary, padding: 32, alignItems: 'center', paddingTop: 60 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  phone: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  section: { backgroundColor: '#fff', marginTop: 16, borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 14 },
  menuLabel: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '500' },
});
