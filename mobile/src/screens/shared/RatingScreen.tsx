import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { rateBooking } from '../../services/bookingService';

export default function RatingScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) return showAlert('', 'براہ کرم ستارے دیں');
    setLoading(true);
    try {
      await rateBooking(bookingId, score, comment);
      showAlert('شکریہ', 'آپ کی ریٹنگ محفوظ ہو گئی', [
        { text: 'ٹھیک ہے', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      showAlert('خرابی', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ڈرائیور کو ریٹنگ دیں</Text>
      <Text style={styles.subtitle}>آپ کا تجربہ کیسا رہا؟</Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(s => (
          <TouchableOpacity key={s} onPress={() => setScore(s)}>
            <Icon name={s <= score ? 'star' : 'star-outline'} size={48} color={s <= score ? '#FFD700' : COLORS.border} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.scoreLabel}>
        {score === 0 ? '' : ['', 'بہت برا', 'برا', 'ٹھیک', 'اچھا', 'بہترین'][score]}
      </Text>

      <TextInput
        style={styles.commentInput}
        placeholder="اپنا تجربہ بتائیں (اختیاری)"
        placeholderTextColor={COLORS.muted}
        multiline
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitBtnText}>{loading ? 'محفوظ ہو رہا ہے...' : 'ریٹنگ جمع کریں'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.skipText}>چھوڑیں</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 32, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 40 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  scoreLabel: { fontSize: 20, fontWeight: '700', color: COLORS.primary, height: 30, marginBottom: 24 },
  commentInput: { width: '100%', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, height: 100, textAlignVertical: 'top', marginBottom: 24 },
  submitBtn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 14 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipText: { color: COLORS.muted, fontSize: 15 },
});
