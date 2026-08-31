import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

import DriverDashboardScreen from '../screens/driver/DriverDashboardScreen';
import MyVehiclesScreen from '../screens/driver/MyVehiclesScreen';
import EarningsScreen from '../screens/driver/EarningsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 4 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Dashboard: 'view-dashboard',
            Vehicles: 'car',
            Earnings: 'cash',
            Profile: 'account',
          };
          return <Icon name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DriverDashboardScreen} options={{ tabBarLabel: 'ڈیش بورڈ' }} />
      <Tab.Screen name="Vehicles" component={MyVehiclesScreen} options={{ tabBarLabel: 'گاڑیاں' }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} options={{ tabBarLabel: 'کمائی' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'پروفائل' }} />
    </Tab.Navigator>
  );
}
