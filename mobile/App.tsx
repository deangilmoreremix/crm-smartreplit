import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// White Label Configuration
import whitelabelConfig from './whitelabel.config';

// Contexts
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WhitelabelProvider, useWhitelabel } from './src/contexts/WhitelabelContext';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import DealsScreen from './src/screens/DealsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Components
import { Icon } from './src/components/Icon';
import { LoadingSpinner } from './src/components/LoadingSpinner';

// Types
import { RootStackParamList, TabParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Tab Navigator Component
function TabNavigator() {
  const { theme } = useTheme();
  const { config } = useWhitelabel();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const tab = config.navigation.tabs.find(t => t.route === route.name);
          if (!tab) return null;

          return (
            <Icon
              name={tab.icon}
              size={size}
              color={focused ? config.branding.primaryColor : color}
            />
          );
        },
        tabBarActiveTintColor: config.branding.primaryColor,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: config.navigation.headerStyle === 'gradient'
            ? 'transparent'
            : theme.colors.surface,
        },
        headerBackground: config.navigation.headerStyle === 'gradient' ? () => (
          <LinearGradient
            colors={[config.branding.primaryColor, config.branding.secondaryColor]}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        ) : undefined,
        headerTintColor: config.navigation.headerStyle === 'gradient'
          ? '#FFFFFF'
          : theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: config.navigation.tabs.find(t => t.route === 'Dashboard')?.name || 'Dashboard',
          tabBarLabel: config.navigation.showTabLabels ? 'Dashboard' : undefined,
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          title: config.navigation.tabs.find(t => t.route === 'Contacts')?.name || 'Contacts',
          tabBarLabel: config.navigation.showTabLabels ? 'Contacts' : undefined,
        }}
      />
      <Tab.Screen
        name="Deals"
        component={DealsScreen}
        options={{
          title: config.navigation.tabs.find(t => t.route === 'Deals')?.name || 'Deals',
          tabBarLabel: config.navigation.showTabLabels ? 'Deals' : undefined,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: config.navigation.tabs.find(t => t.route === 'Settings')?.name || 'Settings',
          tabBarLabel: config.navigation.showTabLabels ? 'Settings' : undefined,
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { config, loading: whitelabelLoading } = useWhitelabel();
  const { theme } = useTheme();

  // Show loading screen while initializing
  if (authLoading || whitelabelLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContent}>
          {config.branding.logo && (
            <Image
              source={{ uri: config.branding.logo }}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <Text style={[styles.appName, { color: theme.colors.text }]}>
            {config.app.displayName}
          </Text>
          <LoadingSpinner size="large" color={config.branding.primaryColor} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.isDark,
        colors: {
          primary: config.branding.primaryColor,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: config.branding.accentColor,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {user ? (
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

// App Wrapper with Providers
export default function App() {
  return (
    <SafeAreaProvider>
      <WhitelabelProvider config={whitelabelConfig}>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </WhitelabelProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
});