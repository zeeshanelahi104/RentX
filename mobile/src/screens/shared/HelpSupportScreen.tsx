import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';

const WHATSAPP_NUMBER = '+923084931790';

export default function HelpSupportScreen({ navigation }: any) {
  const openWhatsApp = async () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) Linking.openURL(url);
    else showAlert('خرابی', 'WhatsApp نہیں کھل سکا');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مدد اور سپورٹ</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          کسی بھی مسئلے یا سوال کے لیے ہم سے WhatsApp پر رابطہ کریں۔ ہماری ٹیم آپ کی مدد کے لیے حاضر ہے۔
        </Text>

        <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp}>
          <View style={styles.iconCircle}>
            <Icon name="whatsapp" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>WhatsApp پر رابطہ کریں</Text>
            <Text style={styles.contactValue}>{WHATSAPP_NUMBER}</Text>
          </View>
          <Icon name="chevron-right" size={22} color={COLORS.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 48 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  content: { padding: 24 },
  description: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 24, textAlign: 'right' },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 14, padding: 16, gap: 14 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center' },
  contactLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text, textAlign: 'right' },
  contactValue: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2, textAlign: 'right' },
});
