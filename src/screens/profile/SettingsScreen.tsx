// src/screens/profile/SettingsScreen.tsx
// 🚀 WORLD-CLASS: Comprehensive Settings Hub
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomHeader } from '../../components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { SettingsScreenProps } from '../../types/navigation';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const notificationSettings: SettingItem[] = [
    {
      id: 'push_notifications',
      title: 'Push Notifications',
      description: 'Receive alerts and reminders',
      icon: 'notifications',
      type: 'toggle',
      value: pushEnabled,
      onToggle: setPushEnabled,
    },
    {
      id: 'email_notifications',
      title: 'Email Notifications',
      description: 'Weekly reports and updates',
      icon: 'mail',
      type: 'toggle',
      value: emailEnabled,
      onToggle: setEmailEnabled,
    },
    {
      id: 'notification_settings',
      title: 'Notification Settings',
      description: 'Customize notification types and timing',
      icon: 'settings',
      type: 'navigation',
      onPress: () => navigation.navigate('NotificationSettingsScreen'),
    },
  ];

  const privacySettings: SettingItem[] = [
    {
      id: 'privacy_settings',
      title: 'Privacy Settings',
      description: 'Manage data sharing and consent',
      icon: 'shield-checkmark',
      type: 'navigation',
      onPress: () => navigation.navigate('PrivacySettingsScreen'),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Help improve the app with usage data',
      icon: 'analytics',
      type: 'toggle',
      value: analyticsEnabled,
      onToggle: setAnalyticsEnabled,
    },
  ];

  const accessibilitySettings: SettingItem[] = [
    {
      id: 'accessibility_settings',
      title: 'Accessibility',
      description: 'Font size, contrast, and motion settings',
      icon: 'accessibility',
      type: 'navigation',
      onPress: () => navigation.navigate('AccessibilitySettingsScreen'),
    },
    {
      id: 'theme_settings',
      title: 'Theme',
      description: 'Light, dark, or system theme',
      icon: 'color-palette',
      type: 'navigation',
      onPress: () => navigation.navigate('ThemeSettingsScreen'),
    },
  ];

  const accountSettings: SettingItem[] = [
    {
      id: 'export_data',
      title: 'Export Health Profile',
      description: 'Export your health profile as an encrypted file',
      icon: 'download',
      type: 'action',
      onPress: () => handleExportData(),
    },
    {
      id: 'import_data',
      title: 'Import Health Profile',
      description: 'Restore your health profile from an encrypted file',
      icon: 'cloud-upload',
      type: 'action',
      onPress: () => handleImportData(),
    },
    {
      id: 'delete_account',
      title: 'Delete Account',
      description: 'Permanently delete your account and data',
      icon: 'trash',
      type: 'action',
      destructive: true,
      onPress: () => handleDeleteAccount(),
    },
  ];

  // --- ENCRYPTED EXPORT/IMPORT LOGIC ---
  const handleExportData = async () => {
    try {
      // Prompt for password
      let password = '';
      Alert.prompt(
        'Export Health Profile',
        'Enter a password to encrypt your export file:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Export',
            onPress: async (input) => {
              password = input;
              if (!password) {
                Alert.alert('Error', 'Password is required for encryption.');
                return;
              }
              // Dynamically import crypto-js for AES
              const CryptoJS = await import('crypto-js');
              // Get health profile from local storage service
              const { localHealthProfileService } = await import('../../services/health/localHealthProfileService');
              const { useAuth } = await import('../../hooks/useAuth');
              const user = useAuth().user;
              const profile = await localHealthProfileService.getHealthProfile(user.id);
              if (!profile) {
                Alert.alert('Error', 'No health profile found to export.');
                return;
              }
              const json = JSON.stringify(profile);
              const ciphertext = CryptoJS.AES.encrypt(json, password).toString();
              // For MVP: Show the encrypted string in an alert (in real app, save/share as file)
              Alert.alert('Exported Data (MVP)', ciphertext);
            },
          },
        ],
        'secure-text'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export health profile.');
    }
  };

  const handleImportData = async () => {
    try {
      // Prompt for encrypted data and password
      let ciphertext = '';
      let password = '';
      Alert.prompt(
        'Import Health Profile',
        'Paste your encrypted export file:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Next',
            onPress: (input) => {
              ciphertext = input;
              Alert.prompt(
                'Enter Password',
                'Enter the password used to encrypt the file:',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Import',
                    onPress: async (inputPwd) => {
                      password = inputPwd;
                      if (!ciphertext || !password) {
                        Alert.alert('Error', 'Both encrypted data and password are required.');
                        return;
                      }
                      try {
                        const CryptoJS = await import('crypto-js');
                        const bytes = CryptoJS.AES.decrypt(ciphertext, password);
                        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                        if (!decrypted) throw new Error('Decryption failed');
                        const profile = JSON.parse(decrypted);
                        const { localHealthProfileService } = await import('../../services/health/localHealthProfileService');
                        const { useAuth } = await import('../../hooks/useAuth');
                        const user = useAuth().user;
                        await localHealthProfileService.saveHealthProfile(user.id, profile);
                        Alert.alert('Success', 'Health profile imported successfully!');
                      } catch (e) {
                        Alert.alert('Error', 'Failed to decrypt or import profile.');
                      }
                    },
                  },
                ],
                'secure-text'
              );
            },
          },
        ],
        'plain-text'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to import health profile.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => console.log('Deleting account...'),
        },
      ]
    );
  };

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, item.destructive && styles.destructiveItem]}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        <View
          style={[
            styles.settingIconContainer,
            item.destructive && styles.destructiveIconContainer,
          ]}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={item.destructive ? COLORS.error : COLORS.primary}
          />
        </View>
        <View style={styles.settingInfo}>
          <Text
            style={[
              styles.settingTitle,
              item.destructive && styles.destructiveTitle,
            ]}
          >
            {item.title}
          </Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
      </View>

      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: COLORS.gray300, true: COLORS.primaryLight }}
          thumbColor={item.value ? COLORS.primary : COLORS.gray400}
        />
      )}

      {item.type === 'navigation' && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{items.map(renderSettingItem)}</View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Settings" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.appInfo}>
          <Ionicons name="settings" size={40} color={COLORS.primary} />
          <Text style={styles.appInfoTitle}>App Settings</Text>
          <Text style={styles.appInfoSubtitle}>
            Customize your Pharmaguide experience
          </Text>
        </View>

        {/* Settings Sections */}
        {renderSection('Notifications', notificationSettings)}
        {renderSection('Privacy & Security', privacySettings)}
        {renderSection('Accessibility & Theme', accessibilitySettings)}
        {renderSection('Account', accountSettings)}

        {/* App Version */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Pharmaguide v1.0.0</Text>
          <Text style={styles.versionSubtext}>
            Build 2024.1.0 • Last updated: Today
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  appInfoTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  appInfoSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionContent: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: SPACING.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  destructiveItem: {
    backgroundColor: COLORS.errorLight + '40',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  destructiveIconContainer: {
    backgroundColor: COLORS.errorLight,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  destructiveTitle: {
    color: COLORS.error,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  versionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  versionSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
