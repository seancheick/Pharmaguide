// src/screens/profile/AccessibilitySettingsScreen.tsx
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
import { AccessibilitySettingsScreenProps } from '../../types/navigation';

interface AccessibilitySetting {
  id: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

interface FontSizeOption {
  id: string;
  label: string;
  size: 'small' | 'medium' | 'large' | 'extra-large';
}

export const AccessibilitySettingsScreen: React.FC<AccessibilitySettingsScreenProps> = ({ navigation }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [voiceOver, setVoiceOver] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [selectedFontSize, setSelectedFontSize] = useState('medium');

  const fontSizeOptions: FontSizeOption[] = [
    { id: 'small', label: 'Small', size: 'small' },
    { id: 'medium', label: 'Medium', size: 'medium' },
    { id: 'large', label: 'Large', size: 'large' },
    { id: 'extra-large', label: 'Extra Large', size: 'extra-large' },
  ];

  const accessibilitySettings: AccessibilitySetting[] = [
    {
      id: 'high_contrast',
      title: 'High Contrast Mode',
      description: 'Increase contrast for better visibility',
      value: highContrast,
      onToggle: setHighContrast,
    },
    {
      id: 'reduce_motion',
      title: 'Reduce Motion',
      description: 'Minimize animations and transitions',
      value: reduceMotion,
      onToggle: setReduceMotion,
    },
    {
      id: 'voice_over',
      title: 'Enhanced VoiceOver',
      description: 'Improved screen reader support',
      value: voiceOver,
      onToggle: setVoiceOver,
    },
    {
      id: 'haptic_feedback',
      title: 'Haptic Feedback',
      description: 'Vibration feedback for interactions',
      value: hapticFeedback,
      onToggle: setHapticFeedback,
    },
  ];

  const renderAccessibilitySetting = (setting: AccessibilitySetting) => (
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

  const renderFontSizeOption = (option: FontSizeOption) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.fontSizeOption,
        selectedFontSize === option.id && styles.selectedFontSize,
      ]}
      onPress={() => setSelectedFontSize(option.id)}
      activeOpacity={0.7}
    >
      <View style={styles.fontSizeInfo}>
        <Text style={styles.fontSizeLabel}>{option.label}</Text>
        <Text style={[styles.fontSizePreview, { fontSize: getFontSizeValue(option.size) }]}>
          Sample Text
        </Text>
      </View>
      {selectedFontSize === option.id && (
        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  const getFontSizeValue = (size: FontSizeOption['size']): number => {
    switch (size) {
      case 'small': return 12;
      case 'medium': return 16;
      case 'large': return 20;
      case 'extra-large': return 24;
      default: return 16;
    }
  };

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
        <Text style={styles.title}>Accessibility</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Font Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Size</Text>
          <View style={styles.fontSizeContainer}>
            {fontSizeOptions.map(renderFontSizeOption)}
          </View>
        </View>

        {/* Accessibility Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility Features</Text>
          <View style={styles.settingsContainer}>
            {accessibilitySettings.map(renderAccessibilitySetting)}
          </View>
        </View>

        {/* System Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Integration</Text>
          <View style={styles.systemInfo}>
            <Ionicons name="settings" size={20} color={COLORS.info} />
            <Text style={styles.systemText}>
              For additional accessibility features, visit your device's Settings app under Accessibility.
            </Text>
          </View>
        </View>

        {/* Accessibility Info */}
        <View style={styles.accessibilityInfo}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.accessibilityText}>
            Pharmaguide is committed to making our app accessible to everyone. 
            If you encounter any accessibility issues, please contact our support team.
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
  fontSizeContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fontSizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  selectedFontSize: {
    backgroundColor: COLORS.primaryLight,
  },
  fontSizeInfo: {
    flex: 1,
  },
  fontSizeLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  fontSizePreview: {
    color: COLORS.textSecondary,
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
  systemInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  systemText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    lineHeight: 18,
  },
  accessibilityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  accessibilityText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    lineHeight: 18,
  },
});
