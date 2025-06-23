// src/screens/profile/PrivacySettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { PrivacySettingsScreenProps } from '../../types/navigation';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  critical?: boolean;
}

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ navigation }) => {
  const [dataSharing, setDataSharing] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [crashReporting, setCrashReporting] = useState(true);
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [locationTracking, setLocationTracking] = useState(false);

  const handleDataExport = () => {
    Alert.alert(
      'Export Data',
      'Your data export will be prepared and sent to your email address within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Data deletion requested') },
      ]
    );
  };

  const privacySettings: PrivacySetting[] = [
    {
      id: 'data_sharing',
      title: 'Anonymous Data Sharing',
      description: 'Help improve the app by sharing anonymized usage data',
      value: dataSharing,
      onToggle: setDataSharing,
    },
    {
      id: 'analytics',
      title: 'Usage Analytics',
      description: 'Allow collection of app usage statistics',
      value: analytics,
      onToggle: setAnalytics,
    },
    {
      id: 'crash_reporting',
      title: 'Crash Reporting',
      description: 'Automatically send crash reports to help fix bugs',
      value: crashReporting,
      onToggle: setCrashReporting,
      critical: true,
    },
    {
      id: 'personalized_ads',
      title: 'Personalized Advertisements',
      description: 'Show ads based on your interests and usage',
      value: personalizedAds,
      onToggle: setPersonalizedAds,
    },
    {
      id: 'location_tracking',
      title: 'Location Services',
      description: 'Use location for nearby pharmacy recommendations',
      value: locationTracking,
      onToggle: setLocationTracking,
    },
  ];

  const renderPrivacySetting = (setting: PrivacySetting) => (
    <View key={setting.id} style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <View style={styles.settingTitleRow}>
          <Text style={styles.settingTitle}>{setting.title}</Text>
          {setting.critical && (
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalText}>Recommended</Text>
            </View>
          )}
        </View>
        <Text style={styles.settingDescription}>{setting.description}</Text>
      </View>
      <Switch
        value={setting.value}
        onValueChange={setting.onToggle}
        trackColor={{ false: COLORS.gray300, true: COLORS.primaryLight }}
        thumbColor={setting.value ? COLORS.primary : COLORS.gray400}
      />
    </View>
  );

  const renderDataAction = (title: string, description: string, onPress: () => void, destructive = false) => (
    <TouchableOpacity
      style={[styles.actionItem, destructive && styles.destructiveAction]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.actionInfo}>
        <Text style={[styles.actionTitle, destructive && styles.destructiveText]}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={destructive ? COLORS.error : COLORS.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Preferences</Text>
          <View style={styles.settingsContainer}>
            {privacySettings.map(renderPrivacySetting)}
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.actionsContainer}>
            {renderDataAction(
              'Export My Data',
              'Download a copy of all your data',
              handleDataExport
            )}
            {renderDataAction(
              'Delete All Data',
              'Permanently remove all your data from our servers',
              handleDataDeletion,
              true
            )}
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
          <Text style={styles.privacyText}>
            Your health data is encrypted and stored securely. We never sell your personal information to third parties.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  settingsContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  criticalBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: SPACING.sm,
  },
  criticalText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionsContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  destructiveAction: {
    backgroundColor: COLORS.errorLight,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  destructiveText: {
    color: COLORS.error,
  },
  actionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.successLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.success,
    lineHeight: 18,
  },
});
