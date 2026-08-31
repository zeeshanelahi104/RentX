import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Resolves the backend host across web, Android emulator, and physical devices via Expo Go.
// Real devices/emulators can't reach "localhost" (that's the device itself), so we derive
// the dev machine's LAN IP from the Expo dev server's own host address.
const getHost = () => {
  if (Platform.OS === 'web') return 'localhost';
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (debuggerHost) return debuggerHost;
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

export const BASE_URL = `http://${getHost()}:5000/api`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('rentx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    const wrapped = new Error(message) as Error & { field?: string; status?: number };
    wrapped.field = error.response?.data?.field;
    wrapped.status = error.response?.status;
    return Promise.reject(wrapped);
  }
);

export default api;
