import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, ImageStyle, StyleProp } from 'react-native';

interface AspectImageProps {
  uri: string;
  width: number;
  minHeight?: number;
  maxHeight?: number;
  style?: StyleProp<ImageStyle>;
}

// Fills the given width and sizes height to the image's real aspect ratio,
// so the full photo always shows with no cropping and no letterboxing.
export default function AspectImage({ uri, width, minHeight = 150, maxHeight = 320, style }: AspectImageProps) {
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    let cancelled = false;
    Image.getSize(
      uri,
      (w, h) => {
        if (cancelled || !w || !h) return;
        const scaled = (width * h) / w;
        setHeight(Math.min(Math.max(scaled, minHeight), maxHeight));
      },
      () => { if (!cancelled) setHeight(minHeight); }
    );
    return () => { cancelled = true; };
  }, [uri, width]);

  return (
    <View style={[styles.wrapper, { width, height }]}>
      <Image source={{ uri }} style={[styles.image, style]} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#F2F2F2', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
