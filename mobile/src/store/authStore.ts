import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe, logout as logoutService } from '../services/authService';
import { getMyDriverProfile } from '../services/driverService';

export interface User {
  _id: string;
  phone?: string;
  email: string;
  name: string;
  role: 'rider' | 'driver' | 'admin';
  city: string;
  profilePhoto?: string;
  rating: number;
  isProfileComplete: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  hasDriverProfile: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  checkDriverProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isBootstrapping: true,
  hasDriverProfile: false,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    AsyncStorage.setItem('rentx_token', token);
    set({ token });
  },

  logout: async () => {
    await logoutService();
    set({ user: null, token: null, hasDriverProfile: false });
  },

  bootstrap: async () => {
    try {
      const token = await AsyncStorage.getItem('rentx_token');
      if (!token) return set({ isBootstrapping: false });

      set({ token });
      const res = await getMe();
      set({ user: res.data.user });
      if (res.data.user.role === 'driver') await get().checkDriverProfile();
    } catch (e: any) {
      // Only a real auth rejection (expired/invalid token) should log the user out.
      // Network errors, timeouts, or the backend being briefly unreachable must not —
      // the token is still valid and the user shouldn't be forced to log in again.
      if (e.status === 401) {
        await AsyncStorage.removeItem('rentx_token');
        set({ user: null, token: null, hasDriverProfile: false });
      }
    } finally {
      set({ isBootstrapping: false });
    }
  },

  checkDriverProfile: async () => {
    try {
      await getMyDriverProfile();
      set({ hasDriverProfile: true });
    } catch {
      set({ hasDriverProfile: false });
    }
  },
}));
