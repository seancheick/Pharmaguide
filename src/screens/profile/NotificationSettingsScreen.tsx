// src/screens/profile/NotificationSettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { NotificationSettingsScreenProps } from '../../types/navigation';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [interactionAlerts, setInteractionAlerts] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const notificationSettings: NotificationSetting[] = [
    {
      id: 'push_notifications',
      title: 'Push Notifications',
      description: 'Receive notifications on your device',
      value: pushNotifications,
      onToggle: setPushNotifications,
    },
    {
      id: 'interaction_alerts',
      title: 'Interaction Alerts',
      description: 'Get notified about potential drug interactions',
      value: interactionAlerts,
      onToggle: setInteractionAlerts,
    },
    {
      id: 'daily_reminders',
      title: 'Daily Reminders',
      description: 'Reminders to take your supplements',
      value: dailyReminders,
      onToggle: setDailyReminders,
    },
    {
      id: 'weekly_reports',
      title: 'Weekly Health Reports',
      description: 'Summary of your health and supplement data',
      value: weeklyReports,
      onToggle: setWeeklyReports,
    },
    {
      id: 'product_updates',
      title: 'Product Updates',
      description: 'News about products in your stack',
      value: productUpdates,
      onToggle: setProductUpdates,
    },
    {
      id: 'marketing_emails',
      title: 'Marketing Emails',
      description: 'Promotional content and app updates',
      value: marketingEmails,
      onToggle: setMarketingEmails,
    },
  ];

  const renderNotificationSetting = (setting: NotificationSetting) => (
    <View key={setting.id} style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{setting.title}</Text>
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
        <Text style={styles.title}>Notification Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <View style={styles.settingsContainer}>
            {notificationSettings.map(renderNotificationSetting)}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            You can change these settings anytime. Critical safety alerts will always be delivered regardless of your preferences.
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
  settingTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    lineHeight: 18,
  },
});
