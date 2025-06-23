// src/screens/profile/ThemeSettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { ThemeSettingsScreenProps } from '../../types/navigation';

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: {
    primary: string;
    background: string;
    text: string;
  };
}

export const ThemeSettingsScreen: React.FC<ThemeSettingsScreenProps> = ({ navigation }) => {
  const [selectedTheme, setSelectedTheme] = useState('light');

  const themeOptions: ThemeOption[] = [
    {
      id: 'light',
      name: 'Light Mode',
      description: 'Clean and bright interface',
      icon: 'sunny',
      colors: {
        primary: COLORS.primary,
        background: '#FFFFFF',
        text: '#1F2937',
      },
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Easy on the eyes in low light',
      icon: 'moon',
      colors: {
        primary: COLORS.primary,
        background: '#1F2937',
        text: '#FFFFFF',
      },
    },
    {
      id: 'auto',
      name: 'System Default',
      description: 'Follows your device settings',
      icon: 'phone-portrait',
      colors: {
        primary: COLORS.primary,
        background: '#F3F4F6',
        text: '#374151',
      },
    },
  ];

  const renderThemeOption = (theme: ThemeOption) => (
    <TouchableOpacity
      key={theme.id}
      style={[
        styles.themeOption,
        selectedTheme === theme.id && styles.selectedTheme,
      ]}
      onPress={() => setSelectedTheme(theme.id)}
      activeOpacity={0.7}
    >
      <View style={styles.themeHeader}>
        <View style={[styles.themeIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
          <Ionicons name={theme.icon} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.themeInfo}>
          <Text style={styles.themeName}>{theme.name}</Text>
          <Text style={styles.themeDescription}>{theme.description}</Text>
        </View>
        {selectedTheme === theme.id && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
        )}
      </View>
      
      {/* Theme Preview */}
      <View style={styles.themePreview}>
        <View style={[styles.previewCard, { backgroundColor: theme.colors.background }]}>
          <View style={styles.previewHeader}>
            <View style={[styles.previewDot, { backgroundColor: theme.colors.primary }]} />
            <View style={[styles.previewLine, { backgroundColor: theme.colors.text }]} />
          </View>
          <View style={styles.previewContent}>
            <View style={[styles.previewLine, { backgroundColor: theme.colors.text, width: '80%' }]} />
            <View style={[styles.previewLine, { backgroundColor: theme.colors.text, width: '60%' }]} />
          </View>
        </View>
      </View>
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
        <Text style={styles.title}>Theme Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Theme</Text>
          <View style={styles.themesContainer}>
            {themeOptions.map(renderThemeOption)}
          </View>
        </View>

        {/* Additional Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Options</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Color Scheme</Text>
                <Text style={styles.optionDescription}>Customize app colors</Text>
              </View>
              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Custom Themes</Text>
                <Text style={styles.optionDescription}>Create your own theme</Text>
              </View>
              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Info */}
        <View style={styles.themeInfo}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.themeInfoText}>
            Theme changes will be applied immediately. Dark mode can help reduce eye strain and save battery on OLED displays.
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
  themesContainer: {
    gap: SPACING.md,
  },
  themeOption: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTheme: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  themeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  themeDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  themePreview: {
    alignItems: 'center',
  },
  previewCard: {
    width: 120,
    height: 80,
    borderRadius: 8,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  previewLine: {
    height: 2,
    borderRadius: 1,
    flex: 1,
    opacity: 0.6,
  },
  previewContent: {
    gap: SPACING.xs,
  },
  optionsContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  comingSoon: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  themeInfoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    lineHeight: 18,
  },
});
