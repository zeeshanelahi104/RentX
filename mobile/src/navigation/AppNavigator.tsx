import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants/colors';
import { registerForPushNotifications, attachNotificationListeners } from '../utils/notifications';
import { navigationRef } from './navigationRef';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import SelectRoleScreen from '../screens/auth/SelectRoleScreen';

// Role-based Tabs
import RiderTabs from './RiderTabs';
import DriverTabs from './DriverTabs';

// Shared screens (navigated to from tabs)
import VehicleDetailScreen from '../screens/customer/VehicleDetailScreen';
import BookingScreen from '../screens/customer/BookingScreen';
import BookingConfirmScreen from '../screens/customer/BookingConfirmScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import RatingScreen from '../screens/shared/RatingScreen';
import HelpSupportScreen from '../screens/shared/HelpSupportScreen';
import AboutScreen from '../screens/shared/AboutScreen';
import DriverOnboardingScreen from '../screens/driver/DriverOnboardingScreen';
import AddVehicleScreen from '../screens/driver/AddVehicleScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, isBootstrapping, hasDriverProfile, bootstrap, checkDriverProfile } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (user?.isProfileComplete) registerForPushNotifications();
    if (user?.isProfileComplete && user.role === 'driver') checkDriverProfile();
  }, [user?._id, user?.isProfileComplete, user?.role]);

  useEffect(() => attachNotificationListeners(), []);

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // ── NOT LOGGED IN ──
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : !user.isProfileComplete ? (
          // ── LOGGED IN VIA GOOGLE, ROLE/CITY NOT PICKED YET ──
          <Stack.Screen name="SelectRole" component={SelectRoleScreen} />
        ) : user.role === 'driver' && !hasDriverProfile ? (
          // ── DRIVER ROLE, NOT YET ONBOARDED ──
          <>
            <Stack.Screen name="DriverOnboarding" component={DriverOnboardingScreen} />
            <Stack.Screen name="DriverTabs" component={DriverTabs} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Rating" component={RatingScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
          </>
        ) : user.role === 'driver' ? (
          // ── DRIVER ROLE, ONBOARDED ──
          <>
            <Stack.Screen name="DriverTabs" component={DriverTabs} />
            <Stack.Screen name="DriverOnboarding" component={DriverOnboardingScreen} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Rating" component={RatingScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
          </>
        ) : (
          // ── RIDER ROLE ──
          <>
            <Stack.Screen name="RiderTabs" component={RiderTabs} />
            <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Rating" component={RatingScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
