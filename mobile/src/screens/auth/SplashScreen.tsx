import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function SplashScreen({ navigation }: any) {
  const scale = new Animated.Value(0.5);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Login'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoBox, { transform: [{ scale }], opacity }]}>
        <Text style={styles.logo}>RentX</Text>
        <Text style={styles.tagline}>آپ کا سفر، آپ کی پسند</Text>
        <Text style={styles.taglineEn}>Your Journey, Your Choice</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  logoBox: { alignItems: 'center' },
  logo: { fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  tagline: { fontSize: 18, color: 'rgba(255,255,255,0.85)', marginTop: 8 },
  taglineEn: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
});
