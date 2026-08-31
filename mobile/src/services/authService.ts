import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeToken = async (res: any) => {
  if (res.data.token) {
    await AsyncStorage.setItem('rentx_token', res.data.token);
  }
  return res.data;
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  role: 'rider' | 'driver';
  city: string;
}) => {
  const res = await api.post('/auth/register', data);
  return storeToken(res);
};

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return storeToken(res);
};

export const googleAuth = async (idToken: string, role?: 'rider' | 'driver', city?: string) => {
  const res = await api.post('/auth/google', { idToken, role, city });
  return storeToken(res);
};

export const completeProfile = (data: { role: 'rider' | 'driver'; city: string }) =>
  api.patch('/auth/complete-profile', data);

export const getMe = () => api.get('/auth/me');

export const updateFCMToken = (fcmToken: string) =>
  api.patch('/auth/fcm-token', { fcmToken });

export const logout = async () => {
  await AsyncStorage.removeItem('rentx_token');
};
