// src/navigation/AppNavigator.tsx
// This file defines the main application navigator, which includes both authentication and main app screens.

import React, { useCallback, useState } from 'react';
import {
  NavigationContainer,
  NavigationState,
  PartialState,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { LoadingScreen } from '../components/common/LoadingScreen';
import {
  navigationStateManager,
  NavigationStateUtils,
} from '../services/navigation/navigationStateManager';
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
  HealthGoalsScreen,
  HealthConditionsScreen,
  AllergiesScreen,
  SettingsScreen,
  DataQualityScreen,
  SupportScreen,
  AboutScreen,
  NotificationSettingsScreen,
  PrivacySettingsScreen,
  AccessibilitySettingsScreen,
  ThemeSettingsScreen,
  ReportIssueScreen,
  MySubmissionsScreen,
  ContributionsScreen,
  HelpScreen,
  FAQScreen,
  DisclaimersScreen,
  ContactSupportScreen,
  AppInfoScreen,
  TermsOfServiceScreen,
  PrivacyPolicyScreen,
  CreditsScreen,
  LicensesScreen,
} from '../screens/profile';
import { COLORS } from '../constants';
import { RootStackParamList, MainTabParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

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
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<
    NavigationState | PartialState<NavigationState> | undefined
  >();

  // Create a ref to track if this is the first render
  const isFirstRender = React.useRef(true);

  // Initialize navigation state manager and restore state
  React.useEffect(() => {
    const initializeNavigation = async () => {
      try {
        await navigationStateManager.initialize(user?.id);

        // Only restore navigation state for authenticated users (not guests)
        // This ensures guest users always start at the main tabs
        if (user && user.email && !user.is_anonymous) {
          const restoredState =
            await navigationStateManager.restoreNavigationState();
          if (
            restoredState &&
            NavigationStateUtils.isValidNavigationState(restoredState)
          ) {
            setInitialState(restoredState);
          }
        } else if (user && user.is_anonymous) {
          // For guest users, clear any existing navigation state
          // and ensure they start fresh at main tabs
          await navigationStateManager.clearNavigationState();
          setInitialState(undefined);
        }
      } catch (error) {
        console.error('Failed to initialize navigation:', error);
      } finally {
        setIsReady(true);
      }
    };

    initializeNavigation();
  }, [user?.id]);

  // Handle navigation state changes
  const onStateChange = useCallback(
    (state: NavigationState | undefined) => {
      if (state && user) {
        // Save navigation state for logged-in users
        const sanitizedState =
          NavigationStateUtils.sanitizeNavigationState(state);
        navigationStateManager.saveNavigationState(sanitizedState);
      }
    },
    [user]
  );

  // Use this effect to handle the navigation reset only when auth state changes
  React.useEffect(() => {
    // Skip the first render to avoid unnecessary resets
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Log the auth state change for debugging
    console.log('Auth state changed, user:', user ? 'logged in' : 'logged out');

    // Clear navigation state when user logs out or when guest user signs in
    if (!user) {
      navigationStateManager.clearNavigationState();
      setInitialState(undefined);
    } else if (user.is_anonymous) {
      // For guest users, always clear navigation state to ensure fresh start
      navigationStateManager.clearNavigationState();
      setInitialState(undefined);
      console.log(
        '🎭 Guest user detected, clearing navigation state for fresh start'
      );
    }
  }, [user]);

  if (loading || !isReady) {
    return <LoadingScreen message="Initializing..." variant="auth" />;
  }

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={onStateChange}
    >
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
            }}
          />
          <Stack.Screen
            name="OCR"
            component={OCRScreen}
            options={{
              headerShown: true,
              title: 'Scan Label',
            }}
          />
          <Stack.Screen
            name="ProductSubmission"
            component={ProductSubmissionScreen}
            options={{
              headerShown: false,
              title: 'Submit Product',
            }}
          />
          <Stack.Screen
            name="ProductAnalysisResults"
            component={ProductAnalysisResults}
            options={{
              headerShown: true,
              title: 'Product Analysis',
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
            name="HealthGoalsScreen"
            component={HealthGoalsScreen}
            options={{
              headerShown: false,
              title: 'Health Goals',
            }}
          />
          <Stack.Screen
            name="HealthConditionsScreen"
            component={HealthConditionsScreen}
            options={{
              headerShown: false,
              title: 'Health Conditions',
            }}
          />
          <Stack.Screen
            name="AllergiesScreen"
            component={AllergiesScreen}
            options={{
              headerShown: false,
              title: 'Allergies',
            }}
          />
          <Stack.Screen
            name="SettingsScreen"
            component={SettingsScreen}
            options={{
              headerShown: false,
              title: 'Settings',
            }}
          />
          <Stack.Screen
            name="DataQualityScreen"
            component={DataQualityScreen}
            options={{
              headerShown: false,
              title: 'Data Quality',
            }}
          />
          <Stack.Screen
            name="SupportScreen"
            component={SupportScreen}
            options={{
              headerShown: false,
              title: 'Support',
            }}
          />
          <Stack.Screen
            name="AboutScreen"
            component={AboutScreen}
            options={{
              headerShown: false,
              title: 'About',
            }}
          />
          <Stack.Screen
            name="NotificationSettingsScreen"
            component={NotificationSettingsScreen}
            options={{
              headerShown: false,
              title: 'Notification Settings',
            }}
          />
          <Stack.Screen
            name="PrivacySettingsScreen"
            component={PrivacySettingsScreen}
            options={{
              headerShown: false,
              title: 'Privacy Settings',
            }}
          />
          <Stack.Screen
            name="AccessibilitySettingsScreen"
            component={AccessibilitySettingsScreen}
            options={{
              headerShown: false,
              title: 'Accessibility Settings',
            }}
          />
          <Stack.Screen
            name="ThemeSettingsScreen"
            component={ThemeSettingsScreen}
            options={{
              headerShown: false,
              title: 'Theme Settings',
            }}
          />
          <Stack.Screen
            name="ReportIssueScreen"
            component={ReportIssueScreen}
            options={{
              headerShown: false,
              title: 'Report Issue',
            }}
          />
          <Stack.Screen
            name="MySubmissionsScreen"
            component={MySubmissionsScreen}
            options={{
              headerShown: false,
              title: 'My Submissions',
            }}
          />
          <Stack.Screen
            name="ContributionsScreen"
            component={ContributionsScreen}
            options={{
              headerShown: false,
              title: 'My Contributions',
            }}
          />
          <Stack.Screen
            name="HelpScreen"
            component={HelpScreen}
            options={{
              headerShown: false,
              title: 'Help & Support',
            }}
          />
          <Stack.Screen
            name="FAQScreen"
            component={FAQScreen}
            options={{
              headerShown: false,
              title: 'FAQ',
            }}
          />
          <Stack.Screen
            name="DisclaimersScreen"
            component={DisclaimersScreen}
            options={{
              headerShown: false,
              title: 'Disclaimers',
            }}
          />
          <Stack.Screen
            name="ContactSupportScreen"
            component={ContactSupportScreen}
            options={{
              headerShown: false,
              title: 'Contact Support',
            }}
          />
          <Stack.Screen
            name="AppInfoScreen"
            component={AppInfoScreen}
            options={{
              headerShown: false,
              title: 'App Information',
            }}
          />
          <Stack.Screen
            name="TermsOfServiceScreen"
            component={TermsOfServiceScreen}
            options={{
              headerShown: false,
              title: 'Terms of Service',
            }}
          />
          <Stack.Screen
            name="PrivacyPolicyScreen"
            component={PrivacyPolicyScreen}
            options={{
              headerShown: false,
              title: 'Privacy Policy',
            }}
          />
          <Stack.Screen
            name="CreditsScreen"
            component={CreditsScreen}
            options={{
              headerShown: false,
              title: 'Credits',
            }}
          />
          <Stack.Screen
            name="LicensesScreen"
            component={LicensesScreen}
            options={{
              headerShown: false,
              title: 'Licenses',
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
