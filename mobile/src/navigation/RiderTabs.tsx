import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

import HomeScreen from '../screens/customer/HomeScreen';
import VehicleListScreen from '../screens/customer/VehicleListScreen';
import BookingHistoryScreen from '../screens/customer/BookingHistoryScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function RiderTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 4 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Home: 'home',
            Search: 'magnify',
            Bookings: 'calendar-check',
            Profile: 'account',
          };
          return <Icon name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'ہوم' }} />
      <Tab.Screen name="Search" component={VehicleListScreen} options={{ tabBarLabel: 'تلاش' }} />
      <Tab.Screen name="Bookings" component={BookingHistoryScreen} options={{ tabBarLabel: 'بکنگز' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'پروفائل' }} />
    </Tab.Navigator>
  );
}
