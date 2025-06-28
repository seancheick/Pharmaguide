// src/types/navigation.ts
// 🚀 WORLD-CLASS: Complete Navigation Type Definitions

import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

// ===== ROOT STACK NAVIGATOR =====
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Welcome: undefined;

  // Product & Search Screens
  Search: { initialQuery?: string } | undefined;
  OCR: undefined;
  ProductSubmission: undefined;
  ProductAnalysisResults: {
    productId?: string;
    barcode?: string;
    productData?: any;
  };

  // Health Profile Screens
  HealthProfileSetup: undefined;
  DemographicsScreen: {
    fromSetup?: boolean;
    initialValue?: any;
  };
  HealthGoalsScreen: {
    fromSetup?: boolean;
    initialValue?: any;
  };
  HealthConditionsScreen: {
    fromSetup?: boolean;
    initialValue?: any;
  };
  AllergiesScreen: {
    fromSetup?: boolean;
    initialValue?: any;
  };
  MedicationsScreen: {
    fromSetup?: boolean;
    initialValue?: any;
  };

  // Profile Section Screens
  SettingsScreen: undefined;
  DataQualityScreen: undefined;
  SupportScreen: undefined;
  AboutScreen: undefined;

  // Settings Sub-screens
  NotificationSettingsScreen: undefined;
  PrivacySettingsScreen: undefined;
  AccessibilitySettingsScreen: undefined;
  ThemeSettingsScreen: undefined;

  // Data Quality Sub-screens
  ReportIssueScreen: undefined;
  MySubmissionsScreen: undefined;
  ContributionsScreen: undefined;

  // Support Sub-screens
  HelpScreen: undefined;
  FAQScreen: undefined;
  DisclaimersScreen: undefined;
  ContactSupportScreen: undefined;

  // About Sub-screens
  AppInfoScreen: undefined;
  TermsOfServiceScreen: undefined;
  PrivacyPolicyScreen: undefined;
  CreditsScreen: undefined;
  LicensesScreen: undefined;
};

// ===== MAIN TAB NAVIGATOR =====
export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Stack: undefined;
  AI: undefined;
  Profile: undefined;
};

// ===== AUTH STACK NAVIGATOR =====
export type AuthStackParamList = {
  Welcome: undefined;
};

// ===== SCREEN PROPS TYPES =====

// Root Stack Screen Props
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

// Main Tab Screen Props
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

// Auth Stack Screen Props
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

// ===== SPECIFIC SCREEN PROPS =====

// Main Tab Screens (with composite navigation for stack access)
export type HomeScreenProps = CompositeScreenProps<
  MainTabScreenProps<'Home'>,
  RootStackScreenProps<keyof RootStackParamList>
>;
export type ScanScreenProps = CompositeScreenProps<
  MainTabScreenProps<'Scan'>,
  RootStackScreenProps<keyof RootStackParamList>
>;
export type StackScreenProps = CompositeScreenProps<
  MainTabScreenProps<'Stack'>,
  RootStackScreenProps<keyof RootStackParamList>
>;
export type AIScreenProps = CompositeScreenProps<
  MainTabScreenProps<'AI'>,
  RootStackScreenProps<keyof RootStackParamList>
>;
export type ProfileScreenProps = CompositeScreenProps<
  MainTabScreenProps<'Profile'>,
  RootStackScreenProps<keyof RootStackParamList>
>;

// Product & Search Screens
export type SearchScreenProps = RootStackScreenProps<'Search'>;
export type OCRScreenProps = RootStackScreenProps<'OCR'>;
export type ProductSubmissionScreenProps =
  RootStackScreenProps<'ProductSubmission'>;
export type ProductAnalysisResultsProps =
  RootStackScreenProps<'ProductAnalysisResults'>;

// Health Profile Screens
export type HealthProfileSetupScreenProps =
  RootStackScreenProps<'HealthProfileSetup'>;
export type DemographicsScreenProps =
  RootStackScreenProps<'DemographicsScreen'>;
export type HealthGoalsScreenProps = RootStackScreenProps<'HealthGoalsScreen'>;
export type HealthConditionsScreenProps =
  RootStackScreenProps<'HealthConditionsScreen'>;
export type AllergiesScreenProps = RootStackScreenProps<'AllergiesScreen'>;
export type MedicationsScreenProps = RootStackScreenProps<'MedicationsScreen'>;

// Profile Section Screens
export type SettingsScreenProps = RootStackScreenProps<'SettingsScreen'>;
export type DataQualityScreenProps = RootStackScreenProps<'DataQualityScreen'>;
export type SupportScreenProps = RootStackScreenProps<'SupportScreen'>;
export type AboutScreenProps = RootStackScreenProps<'AboutScreen'>;

// Settings Sub-screens
export type NotificationSettingsScreenProps =
  RootStackScreenProps<'NotificationSettingsScreen'>;
export type PrivacySettingsScreenProps =
  RootStackScreenProps<'PrivacySettingsScreen'>;
export type AccessibilitySettingsScreenProps =
  RootStackScreenProps<'AccessibilitySettingsScreen'>;
export type ThemeSettingsScreenProps =
  RootStackScreenProps<'ThemeSettingsScreen'>;

// Data Quality Sub-screens
export type ReportIssueScreenProps = RootStackScreenProps<'ReportIssueScreen'>;
export type MySubmissionsScreenProps =
  RootStackScreenProps<'MySubmissionsScreen'>;
export type ContributionsScreenProps =
  RootStackScreenProps<'ContributionsScreen'>;

// Support Sub-screens
export type HelpScreenProps = RootStackScreenProps<'HelpScreen'>;
export type FAQScreenProps = RootStackScreenProps<'FAQScreen'>;
export type DisclaimersScreenProps = RootStackScreenProps<'DisclaimersScreen'>;
export type ContactSupportScreenProps =
  RootStackScreenProps<'ContactSupportScreen'>;

// About Sub-screens
export type AppInfoScreenProps = RootStackScreenProps<'AppInfoScreen'>;
export type TermsOfServiceScreenProps =
  RootStackScreenProps<'TermsOfServiceScreen'>;
export type PrivacyPolicyScreenProps =
  RootStackScreenProps<'PrivacyPolicyScreen'>;
export type CreditsScreenProps = RootStackScreenProps<'CreditsScreen'>;
export type LicensesScreenProps = RootStackScreenProps<'LicensesScreen'>;

// Auth Screens
export type WelcomeScreenProps = AuthStackScreenProps<'Welcome'>;

// ===== NAVIGATION HELPERS =====

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// ===== EXPORT ALL TYPES =====
export type { RootStackParamList, MainTabParamList, AuthStackParamList };
