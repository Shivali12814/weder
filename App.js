import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';

// Auth
import LoginScreen    from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Client
import DashboardScreen from './src/screens/DashboardScreen';
import BookingsScreen  from './src/screens/BookingsScreen';
import DahejScreen     from './src/screens/DahejScreen';
import TasksScreen     from './src/screens/TasksScreen';
import GuestsScreen    from './src/screens/GuestsScreen';
import BudgetScreen    from './src/screens/BudgetScreen';
import SettingsScreen  from './src/screens/SettingsScreen';
import BrowseVendors   from './src/screens/client/BrowseVendors';
import SendRequest     from './src/screens/client/SendRequest';

// Vendor
import VendorDashboard    from './src/screens/vendor/VendorDashboard';
import VendorRequests     from './src/screens/vendor/VendorRequests';
import VendorServices     from './src/screens/vendor/VendorServices';
import VendorProfile      from './src/screens/vendor/VendorProfile';
import VendorDetailScreen from './src/screens/client/VendorDetailScreen';

import { COLORS, TYPOGRAPHY } from './src/utils/theme';
import { ms } from './src/utils/responsive';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const HEADER_OPTS = {
  headerStyle:         { backgroundColor: COLORS.deep2 },
  headerTitleStyle:    { color: COLORS.goldLight, fontWeight: '700', fontSize: ms(17) },
  headerTintColor:     COLORS.gold,
  headerShadowVisible: false,
};

const TAB_H  = Platform.OS === 'ios' ? ms(82) : ms(62);
const TAB_PB = Platform.OS === 'ios' ? ms(22) : ms(6);

// ─── CLIENT TABS ─────────────────────────────────────────────────────────────
const CLIENT_TABS = [
  { name: 'Dashboard',  component: DashboardScreen, icon: '🏠' },
  { name: 'Vendors',    component: BrowseVendors,   icon: '🏪' },
  { name: 'Bookings',   component: BookingsScreen,  icon: '📋' },
  { name: 'Trousseau',  component: DahejScreen,     icon: '💒' },
  { name: 'Settings',   component: SettingsScreen,  icon: '⚙️' },
];

const ClientTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => {
      const tab = CLIENT_TABS.find(t => t.name === route.name);
      return {
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <View style={{
            alignItems: 'center', justifyContent: 'center',
            width: ms(38), height: ms(38),
            borderRadius: ms(19),
            backgroundColor: focused ? 'rgba(201,168,76,0.18)' : 'transparent',
          }}>
            <Text style={{ fontSize: focused ? ms(20) : ms(17) }}>{tab?.icon}</Text>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: COLORS.deep2,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          height: TAB_H,
          paddingBottom: TAB_PB,
          paddingTop: ms(4),
        },
        tabBarActiveTintColor:   COLORS.goldLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: ms(10), fontWeight: '600', marginTop: 0 },
      };
    }}
  >
    {CLIENT_TABS.map(t => (
      <Tab.Screen key={t.name} name={t.name} component={t.component} />
    ))}
  </Tab.Navigator>
);

// ─── VENDOR TABS ─────────────────────────────────────────────────────────────
const VENDOR_TABS = [
  { name: 'VendorHome',     component: VendorDashboard, icon: '🏠', label: 'Dashboard' },
  { name: 'VendorRequests', component: VendorRequests,  icon: '📩', label: 'Requests'  },
  { name: 'VendorServices', component: VendorServices,  icon: '🛠️', label: 'Services'  },
];

const VendorTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => {
      const tab = VENDOR_TABS.find(t => t.name === route.name);
      return {
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <View style={{
            alignItems: 'center', justifyContent: 'center',
            width: ms(38), height: ms(38),
            borderRadius: ms(19),
            backgroundColor: focused ? 'rgba(201,168,76,0.18)' : 'transparent',
          }}>
            <Text style={{ fontSize: focused ? ms(20) : ms(17) }}>{tab?.icon}</Text>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: COLORS.deep2,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          height: TAB_H,
          paddingBottom: TAB_PB,
          paddingTop: ms(4),
        },
        tabBarActiveTintColor:   COLORS.goldLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: ms(10), fontWeight: '600', marginTop: 0 },
      };
    }}
  >
    {VENDOR_TABS.map(t => (
      <Tab.Screen
        key={t.name}
        name={t.name}
        component={t.component}
        options={{ title: t.label }}
      />
    ))}
  </Tab.Navigator>
);

// ─── ROOT NAVIGATOR ───────────────────────────────────────────────────────────
const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deep }}>
      <ActivityIndicator size="large" color={COLORS.gold} />
      <Text style={{ color: COLORS.gold, marginTop: 12, ...TYPOGRAPHY.captionB }}>Loading…</Text>
    </View>
  );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login"    component={LoginScreen}    />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === 'vendor' ? (
        <>
          <Stack.Screen name="VendorTabs"    component={VendorTabs} />
          <Stack.Screen name="VendorProfile" component={VendorProfile}
            options={{ headerShown: true, title: 'Edit Profile', ...HEADER_OPTS }} />
        </>
      ) : (
        <>
          <Stack.Screen name="ClientTabs"   component={ClientTabs} />
          <Stack.Screen name="VendorDetail" component={VendorDetailScreen}
            options={{ headerShown: true, title: 'Vendor Details',       ...HEADER_OPTS }} />
          <Stack.Screen name="SendRequest"  component={SendRequest}
            options={{ headerShown: true, title: 'Send Booking Request', ...HEADER_OPTS }} />
          <Stack.Screen name="Guests"       component={GuestsScreen}
            options={{ headerShown: true, title: 'Guest List',           ...HEADER_OPTS }} />
          <Stack.Screen name="Budget"       component={BudgetScreen}
            options={{ headerShown: true, title: 'Budget',               ...HEADER_OPTS }} />
          <Stack.Screen name="Tasks"        component={TasksScreen}
            options={{ headerShown: true, title: 'To-Do Tasks',          ...HEADER_OPTS }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={COLORS.deep2} />
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
