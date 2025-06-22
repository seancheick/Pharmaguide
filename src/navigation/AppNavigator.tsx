// src/navigation/AppNavigator.tsx
// This file defines the main application navigator, which includes both authentication and main app screens.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ScanScreen } from '../screens/scan/ScanScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { OCRScreen } from '../screens/ocr/OCRScreen';
import { ProductSubmissionScreen } from '../screens/submission/ProductSubmissionScreen';
import { ProductAnalysisResults } from '../screens/scan/ProductAnalysisResults';
import { MyStackScreen } from '../screens/stack/MyStackScreen';
import { AIScreen } from '../screens/ai/AIScreen';
import {
  ProfileScreen,
  HealthProfileSetupScreen,
  DemographicsScreen,
  MedicationsScreen,
} from '../screens/profile';
import { COLORS } from '../constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tab navigator for main app screens
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Scan') {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === 'Stack') {
            iconName = focused ? 'layers' : 'layers-outline';
          } else if (route.name === 'AI') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Stack" component={MyStackScreen} />
      <Tab.Screen name="AI" component={AIScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Root Navigator that switches between Auth and Main based on authentication state
export const AppNavigator = () => {
  const { user, loading } = useAuth();

  // Create a ref to track if this is the first render
  const isFirstRender = React.useRef(true);

  // Use this effect to handle the navigation reset only when auth state changes
  React.useEffect(() => {
    // Skip the first render to avoid unnecessary resets
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Log the auth state change for debugging
    console.log('Auth state changed, user:', user ? 'logged in' : 'logged out');
  }, [user]);

  if (loading) {
    // You could return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{
              headerShown: true,
              title: 'Search Products',
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="OCR"
            component={OCRScreen}
            options={{
              headerShown: true,
              title: 'Scan Label',
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="ProductSubmission"
            component={ProductSubmissionScreen}
            options={{
              headerShown: false,
              title: 'Submit Product',
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="ProductAnalysisResults"
            component={ProductAnalysisResults}
            options={{
              headerShown: true,
              title: 'Product Analysis',
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="HealthProfileSetup"
            component={HealthProfileSetupScreen}
            options={{
              headerShown: false,
              title: 'Health Profile Setup',
            }}
          />
          <Stack.Screen
            name="DemographicsScreen"
            component={DemographicsScreen}
            options={{
              headerShown: false,
              title: 'Demographics',
            }}
          />
          <Stack.Screen
            name="MedicationsScreen"
            component={MedicationsScreen}
            options={{
              headerShown: false,
              title: 'Medications & Supplements',
            }}
          />
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};
