import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { getSubscriptionStatus, initiateSubscriptionPayment } from '../../services/driverService';

const STATUS_LABEL: Record<string, string> = {
  active: 'فعال',
  expired: 'ختم ہو گئی',
  none: 'غیر فعال',
};

const STATUS_COLOR: Record<string, string> = {
  active: COLORS.success,
  expired: COLORS.danger,
  none: COLORS.muted,
};

export default function SubscriptionScreen({ navigation }: any) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getSubscriptionStatus();
      setSubscription(res.data.subscription);
    } catch (e: any) {
      showAlert('خرابی', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await initiateSubscriptionPayment();
      if (res.data.mode === 'free') {
        showAlert('کامیاب!', 'آپ کا پہلا مہینہ مفت میں فعال کر دیا گیا ہے۔');
      } else if (res.data.mode === 'manual') {
        showAlert('ادائیگی کی ہدایات', res.data.instructions);
      } else if (res.data.mode === 'gateway') {
        showAlert('ادائیگی', res.data.checkoutUrl ? 'چیک آؤٹ لنک تیار ہے' : 'ادائیگی شروع کر دی گئی ہے');
      }
      await fetchStatus();
    } catch (e: any) {
      showAlert('خرابی', e.message);
    } finally {
      setPaying(false);
    }
  };

  const handleShare = async () => {
    if (!subscription?.referralCode) return;
    try {
      await Share.share({
        message: `RentX پر ڈرائیور بنیں! میرا ریفرل کوڈ استعمال کریں: ${subscription.referralCode}`,
      });
    } catch {}
  };

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />;

  const status = subscription?.status || 'none';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سبسکرپشن</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.statusCard}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[status] }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABEL[status]}</Text>
        </View>
        {subscription?.expiresAt && (
          <Text style={styles.expiryText}>
            {status === 'active' ? 'میعاد ختم:' : 'ختم ہوئی:'} {new Date(subscription.expiresAt).toLocaleDateString('ur-PK')}
          </Text>
        )}
        {status === 'active' && (
          <Text style={styles.daysRemaining}>{subscription.daysRemaining} دن باقی</Text>
        )}
      </View>

      {subscription?.pendingReferralDiscount && (
        <View style={styles.discountBanner}>
          <Icon name="gift-outline" size={20} color={COLORS.success} />
          <Text style={styles.discountText}>اگلے مہینے 30% رعایت ملے گی</Text>
        </View>
      )}

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>اگلی ادائیگی</Text>
        <Text style={styles.priceAmount}>PKR {subscription?.nextPaymentAmount?.toLocaleString() ?? 0}</Text>
        <TouchableOpacity style={[styles.payBtn, paying && { opacity: 0.6 }]} onPress={handlePay} disabled={paying}>
          {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>ابھی ادا کریں</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.referralCard}>
        <Text style={styles.referralTitle}>ریفرل کوڈ</Text>
        <Text style={styles.referralCode}>{subscription?.referralCode}</Text>
        <Text style={styles.referralHint}>دوسرے ڈرائیورز کو مدعو کریں، جب وہ سبسکرپشن ادا کریں تو آپ کو اگلے مہینے 30% رعایت ملے گی</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Icon name="share-variant-outline" size={18} color={COLORS.primary} />
          <Text style={styles.shareBtnText}>کوڈ شیئر کریں</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statusCard: { backgroundColor: '#fff', margin: 16, borderRadius: 18, padding: 24, alignItems: 'center', elevation: 2 },
  statusBadge: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  statusBadgeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  expiryText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },
  daysRemaining: { marginTop: 4, fontSize: 20, fontWeight: '800', color: COLORS.text },
  discountBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8F5E9', marginHorizontal: 16, borderRadius: 12, padding: 14 },
  discountText: { color: COLORS.success, fontWeight: '600', fontSize: 14 },
  priceCard: { backgroundColor: '#fff', margin: 16, borderRadius: 18, padding: 20, alignItems: 'center', elevation: 2 },
  priceLabel: { fontSize: 14, color: COLORS.textSecondary },
  priceAmount: { fontSize: 30, fontWeight: '900', color: COLORS.primary, marginTop: 4 },
  payBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 16 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  referralCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 18, padding: 20, elevation: 2 },
  referralTitle: { fontSize: 14, color: COLORS.textSecondary },
  referralCode: { fontSize: 26, fontWeight: '900', color: COLORS.text, marginTop: 4, letterSpacing: 2 },
  referralHint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 10, lineHeight: 20 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, justifyContent: 'center', marginTop: 14 },
  shareBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
});
