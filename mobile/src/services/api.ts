import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Deployed backend — used whenever we're not actively connected to a local
// Metro dev server (i.e. any standalone/dev-client build not started via
// `expo start`, and any production build).
const DEPLOYED_API_URL = 'https://rentx-bvm4.onrender.com/api';

// Resolves the backend host for local development across web, Android
// emulator, and physical devices via Expo Go/dev client. Real devices/
// emulators can't reach "localhost" (that's the device itself), so we derive
// the dev machine's LAN IP from the Expo dev server's own host address.
const getLocalHost = () => {
  if (Platform.OS === 'web') return 'localhost';
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (debuggerHost) return debuggerHost;
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

// Only use the local backend when actually running against a Metro dev
// server (hostUri is present) — otherwise (standalone builds, or a dev
// client launched without `expo start`) always hit the deployed backend.
const isConnectedToDevServer = !!Constants.expoConfig?.hostUri;

export const BASE_URL = __DEV__ && isConnectedToDevServer
  ? `http://${getLocalHost()}:5000/api`
  : DEPLOYED_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  // Render's free tier spins the backend down after inactivity — the first
  // request after idle can take up to ~50s to wake it back up, so this
  // needs enough headroom to not fail on a cold start.
  timeout: 60000,
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
