// src/screens/profile/LicensesScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { LicensesScreenProps } from '../../types/navigation';

interface License {
  id: string;
  name: string;
  version?: string;
  license: string;
  description: string;
  url?: string;
  category: 'framework' | 'ui' | 'utility' | 'development' | 'analytics';
}

export const LicensesScreen: React.FC<LicensesScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const licenses: License[] = [
    {
      id: '1',
      name: 'React Native',
      version: '0.72.0',
      license: 'MIT License',
      description: 'A framework for building native apps using React',
      url: 'https://github.com/facebook/react-native',
      category: 'framework',
    },
    {
      id: '2',
      name: 'React',
      version: '18.2.0',
      license: 'MIT License',
      description: 'A JavaScript library for building user interfaces',
      url: 'https://github.com/facebook/react',
      category: 'framework',
    },
    {
      id: '3',
      name: 'React Navigation',
      version: '6.0.0',
      license: 'MIT License',
      description: 'Routing and navigation for React Native apps',
      url: 'https://github.com/react-navigation/react-navigation',
      category: 'framework',
    },
    {
      id: '4',
      name: 'Expo',
      version: '49.0.0',
      license: 'MIT License',
      description: 'Platform for universal React applications',
      url: 'https://github.com/expo/expo',
      category: 'framework',
    },
    {
      id: '5',
      name: 'React Native Vector Icons',
      version: '10.0.0',
      license: 'MIT License',
      description: 'Customizable icons for React Native',
      url: 'https://github.com/oblador/react-native-vector-icons',
      category: 'ui',
    },
    {
      id: '6',
      name: 'React Native Linear Gradient',
      version: '2.8.0',
      license: 'MIT License',
      description: 'A gradient component for React Native',
      url: 'https://github.com/react-native-linear-gradient/react-native-linear-gradient',
      category: 'ui',
    },
    {
      id: '7',
      name: 'Lodash',
      version: '4.17.21',
      license: 'MIT License',
      description: 'A modern JavaScript utility library',
      url: 'https://github.com/lodash/lodash',
      category: 'utility',
    },
    {
      id: '8',
      name: 'Axios',
      version: '1.5.0',
      license: 'MIT License',
      description: 'Promise based HTTP client for JavaScript',
      url: 'https://github.com/axios/axios',
      category: 'utility',
    },
    {
      id: '9',
      name: 'TypeScript',
      version: '5.0.0',
      license: 'Apache License 2.0',
      description: 'TypeScript is a superset of JavaScript',
      url: 'https://github.com/microsoft/TypeScript',
      category: 'development',
    },
    {
      id: '10',
      name: 'ESLint',
      version: '8.45.0',
      license: 'MIT License',
      description: 'A tool for identifying patterns in JavaScript',
      url: 'https://github.com/eslint/eslint',
      category: 'development',
    },
  ];

  const categories = [
    { id: 'all', label: 'All', count: licenses.length },
    { id: 'framework', label: 'Framework', count: licenses.filter(l => l.category === 'framework').length },
    { id: 'ui', label: 'UI Components', count: licenses.filter(l => l.category === 'ui').length },
    { id: 'utility', label: 'Utilities', count: licenses.filter(l => l.category === 'utility').length },
    { id: 'development', label: 'Development', count: licenses.filter(l => l.category === 'development').length },
  ];

  const filteredLicenses = selectedCategory === 'all' 
    ? licenses 
    : licenses.filter(l => l.category === selectedCategory);

  const getCategoryColor = (category: License['category']) => {
    switch (category) {
      case 'framework': return COLORS.primary;
      case 'ui': return COLORS.secondary;
      case 'utility': return COLORS.success;
      case 'development': return COLORS.warning;
      case 'analytics': return COLORS.info;
      default: return COLORS.textSecondary;
    }
  };

  const handleLicensePress = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const renderCategoryButton = (category: typeof categories[0]) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.activeCategoryButton,
      ]}
      onPress={() => setSelectedCategory(category.id)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category.id && styles.activeCategoryButtonText,
      ]}>
        {category.label} ({category.count})
      </Text>
    </TouchableOpacity>
  );

  const renderLicense = (license: License) => (
    <TouchableOpacity
      key={license.id}
      style={styles.licenseCard}
      onPress={() => handleLicensePress(license.url)}
      activeOpacity={license.url ? 0.7 : 1}
    >
      <View style={styles.licenseHeader}>
        <View style={styles.licenseInfo}>
          <Text style={styles.licenseName}>{license.name}</Text>
          {license.version && (
            <Text style={styles.licenseVersion}>v{license.version}</Text>
          )}
        </View>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: `${getCategoryColor(license.category)}20` }
        ]}>
          <Text style={[
            styles.categoryBadgeText,
            { color: getCategoryColor(license.category) }
          ]}>
            {license.license}
          </Text>
        </View>
      </View>
      
      <Text style={styles.licenseDescription}>{license.description}</Text>
      
      <View style={styles.licenseFooter}>
        <View style={[
          styles.categoryTag,
          { backgroundColor: `${getCategoryColor(license.category)}15` }
        ]}>
          <Text style={[
            styles.categoryTagText,
            { color: getCategoryColor(license.category) }
          ]}>
            {license.category}
          </Text>
        </View>
        {license.url && (
          <View style={styles.linkIndicator}>
            <Ionicons name="open" size={14} color={COLORS.textSecondary} />
            <Text style={styles.linkText}>View Source</Text>
          </View>
        )}
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
        <Text style={styles.title}>Open Source Licenses</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introduction}>
          <MaterialIcons name="code" size={32} color={COLORS.primary} />
          <Text style={styles.introTitle}>Built with Open Source</Text>
          <Text style={styles.introText}>
            Pharmaguide is built using amazing open source libraries and frameworks. 
            We're grateful to the developers and communities behind these projects.
          </Text>
        </View>

        {/* Category Filters */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersRow}>
              {categories.map(renderCategoryButton)}
            </View>
          </ScrollView>
        </View>

        {/* Licenses List */}
        <View style={styles.licensesSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Libraries' : `${categories.find(c => c.id === selectedCategory)?.label} Libraries`}
          </Text>
          <View style={styles.licensesContainer}>
            {filteredLicenses.map(renderLicense)}
          </View>
        </View>

        {/* License Information */}
        <View style={styles.licenseInfo}>
          <Text style={styles.licenseInfoTitle}>About Open Source Licenses</Text>
          <Text style={styles.licenseInfoText}>
            Open source licenses allow us to use, modify, and distribute software freely. 
            Each library listed above is governed by its respective license terms.
          </Text>
          <Text style={styles.licenseInfoText}>
            Most libraries use the MIT License, which is permissive and allows commercial use. 
            Some use Apache License 2.0 or other compatible licenses.
          </Text>
        </View>

        {/* Attribution */}
        <View style={styles.attribution}>
          <Text style={styles.attributionTitle}>Full License Texts</Text>
          <Text style={styles.attributionText}>
            Complete license texts for all dependencies are available in the app bundle 
            and can be viewed in the source code repository.
          </Text>
          <TouchableOpacity
            style={styles.attributionButton}
            onPress={() => Linking.openURL('https://github.com/pharmaguide/mobile-app')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="code" size={18} color={COLORS.white} />
            <Text style={styles.attributionButtonText}>View Source Code</Text>
          </TouchableOpacity>
        </View>

        {/* Gratitude */}
        <View style={styles.gratitude}>
          <MaterialIcons name="favorite" size={24} color={COLORS.error} />
          <Text style={styles.gratitudeText}>
            Thank you to all the open source contributors who make projects like Pharmaguide possible. 
            Your work enables innovation and helps create better software for everyone.
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
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  introduction: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.primaryLight,
    marginBottom: SPACING.lg,
  },
  introTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  filtersSection: {
    paddingVertical: SPACING.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  activeCategoryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  activeCategoryButtonText: {
    color: COLORS.white,
  },
  licensesSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  licensesContainer: {
    gap: SPACING.sm,
  },
  licenseCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  licenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  licenseInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  licenseName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  licenseVersion: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  licenseDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  licenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    textTransform: 'capitalize',
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  licenseInfo: {
    backgroundColor: COLORS.infoLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  licenseInfoTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  licenseInfoText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  attribution: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  attributionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  attributionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  attributionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  attributionButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  gratitude: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  gratitudeText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
