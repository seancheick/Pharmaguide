// src/constants/profile.ts
// 🚀 WORLD-CLASS: Profile Section Configuration
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './index';

export interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge?: number;
  completeness?: number;
  route: string;
}

export const MAIN_SECTIONS = {
  HEALTH_PROFILE: 'health_profile',
  SETTINGS: 'settings',
  DATA_QUALITY: 'data_quality',
  SUPPORT: 'support',
  ABOUT: 'about',
} as const;

export type MainSectionId = (typeof MAIN_SECTIONS)[keyof typeof MAIN_SECTIONS];

export interface ProfileSectionGroup {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  badge?: number;
  subsections?: ProfileSection[];
}

// Profile section groups with their subsections
export const PROFILE_SECTIONS: ProfileSectionGroup[] = [
  {
    id: MAIN_SECTIONS.HEALTH_PROFILE,
    title: 'Health Profile',
    description:
      'Manage your health information for personalized recommendations',
    icon: 'medical',
    color: COLORS.primary,
    route: 'NewHealthProfileSetup',
  },
  {
    id: MAIN_SECTIONS.SETTINGS,
    title: 'Settings',
    description: 'App configuration and preferences',
    icon: 'settings',
    color: COLORS.info,
    route: 'SettingsScreen',
    subsections: [
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Manage your notification preferences',
        icon: 'notifications',
        color: COLORS.info,
        route: 'NotificationSettingsScreen',
      },
      {
        id: 'privacy',
        title: 'Privacy',
        description: 'Control your data and privacy settings',
        icon: 'lock-closed',
        color: COLORS.info,
        route: 'PrivacySettingsScreen',
      },
      {
        id: 'accessibility',
        title: 'Accessibility',
        description: 'Customize app appearance and behavior',
        icon: 'accessibility',
        color: COLORS.info,
        route: 'AccessibilitySettingsScreen',
      },
      {
        id: 'theme',
        title: 'Theme',
        description: 'Change app appearance',
        icon: 'color-palette',
        color: COLORS.info,
        route: 'ThemeSettingsScreen',
      },
    ],
  },
  {
    id: MAIN_SECTIONS.DATA_QUALITY,
    title: 'Data Quality',
    description: 'Help improve our database and report issues',
    icon: 'analytics',
    color: COLORS.success,
    route: 'DataQualityScreen',
    subsections: [
      {
        id: 'report_issue',
        title: 'Report Issue',
        description: 'Report inaccurate or missing information',
        icon: 'warning',
        color: COLORS.success,
        route: 'ReportIssueScreen',
      },
      {
        id: 'my_submissions',
        title: 'My Submissions',
        description: 'Track your contributions',
        icon: 'list',
        color: COLORS.success,
        route: 'MySubmissionsScreen',
      },
      {
        id: 'contributions',
        title: 'Community Impact',
        description: "See how you've helped the community",
        icon: 'people',
        color: COLORS.success,
        route: 'ContributionsScreen',
      },
    ],
  },
  {
    id: MAIN_SECTIONS.SUPPORT,
    title: 'Support',
    description: 'Get help and learn about our methodology',
    icon: 'help-circle',
    color: COLORS.warning,
    route: 'SupportScreen',
    subsections: [
      {
        id: 'help',
        title: 'Help Center',
        description: 'Get answers to common questions',
        icon: 'help',
        color: COLORS.warning,
        route: 'HelpScreen',
      },
      {
        id: 'faq',
        title: 'FAQ',
        description: 'Frequently asked questions',
        icon: 'information-circle',
        color: COLORS.warning,
        route: 'FAQScreen',
      },
    ],
  },
  {
    id: MAIN_SECTIONS.ABOUT,
    title: 'About',
    description: 'App information, terms, and credits',
    icon: 'information-circle',
    color: COLORS.textSecondary,
    route: 'AboutScreen',
  },
];
