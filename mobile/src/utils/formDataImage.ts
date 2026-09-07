import { Platform } from 'react-native';

// On native, RN's FormData polyfill turns a {uri, type, name} object into a real
// file part. On web, FormData is the browser's real implementation, which only
// accepts a Blob/File — passing a plain object just stringifies to "[object Object]"
// and silently uploads nothing. So on web we fetch() the picker's local/blob URI
// to get actual bytes first.
export async function appendImageToFormData(
  formData: FormData,
  field: string,
  asset: { uri: string; mimeType?: string },
  filename: string
) {
  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    formData.append(field, blob, filename);
  } else {
    formData.append(field, { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: filename } as any);
  }
}
