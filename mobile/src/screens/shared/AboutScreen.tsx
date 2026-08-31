import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import Constants from 'expo-constants';

export default function AboutScreen({ navigation }: any) {
  const version = Constants.expoConfig?.version || '1.0.0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ایپ کے بارے میں</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Icon name="car" size={48} color="#fff" />
        </View>
        <Text style={styles.appName}>RentX</Text>
        <Text style={styles.version}>Version {version}</Text>
        <Text style={styles.description}>
          RentX ایک مقامی گاڑی کرایہ پلیٹ فارم ہے جو آپ کو قابل اعتماد ڈرائیورز اور گاڑیوں سے جوڑتا ہے۔
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 48 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  content: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appName: { fontSize: 26, fontWeight: '900', color: COLORS.text },
  version: { fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 20 },
  description: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24, textAlign: 'center' },
});
