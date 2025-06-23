// src/screens/profile/HelpScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { HelpScreenProps } from '../../types/navigation';

interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  onPress: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories: HelpCategory[] = [
    {
      id: 'getting_started',
      title: 'Getting Started',
      icon: 'play-circle',
      description: 'Learn the basics of using Pharmaguide',
      onPress: () => console.log('Navigate to getting started'),
    },
    {
      id: 'scanning',
      title: 'Scanning Products',
      icon: 'scan',
      description: 'How to scan and add supplements to your stack',
      onPress: () => console.log('Navigate to scanning help'),
    },
    {
      id: 'interactions',
      title: 'Understanding Interactions',
      icon: 'warning',
      description: 'Learn about drug and supplement interactions',
      onPress: () => console.log('Navigate to interactions help'),
    },
    {
      id: 'stack_management',
      title: 'Managing Your Stack',
      icon: 'layers',
      description: 'Organize and track your supplements',
      onPress: () => console.log('Navigate to stack help'),
    },
    {
      id: 'health_profile',
      title: 'Health Profile',
      icon: 'person',
      description: 'Set up and manage your health information',
      onPress: () => console.log('Navigate to profile help'),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: 'construct',
      description: 'Common issues and solutions',
      onPress: () => console.log('Navigate to troubleshooting'),
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      description: 'Find answers to common questions',
      icon: 'help-circle',
      onPress: () => navigation.navigate('FAQScreen'),
    },
    {
      id: 'contact',
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: 'mail',
      onPress: () => navigation.navigate('ContactSupportScreen'),
    },
    {
      id: 'video_tutorials',
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      icon: 'play',
      onPress: () => console.log('Navigate to video tutorials'),
    },
  ];

  const renderHelpCategory = (category: HelpCategory) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryCard}
      onPress={category.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.categoryIcon}>
        <MaterialIcons name={category.icon as any} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.quickActionCard}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickActionIcon}>
        <MaterialIcons name={action.icon as any} size={20} color={COLORS.white} />
      </View>
      <View style={styles.quickActionInfo}>
        <Text style={styles.quickActionTitle}>{action.title}</Text>
        <Text style={styles.quickActionDescription}>{action.description}</Text>
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
        <Text style={styles.title}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Help Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Topic</Text>
          <View style={styles.categoriesContainer}>
            {helpCategories.map(renderHelpCategory)}
          </View>
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>
          <View style={styles.resourcesContainer}>
            <TouchableOpacity style={styles.resourceItem} activeOpacity={0.7}>
              <MaterialIcons name="book" size={20} color={COLORS.info} />
              <Text style={styles.resourceText}>User Guide (PDF)</Text>
              <Ionicons name="download" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceItem} activeOpacity={0.7}>
              <MaterialIcons name="web" size={20} color={COLORS.info} />
              <Text style={styles.resourceText}>Online Knowledge Base</Text>
              <Ionicons name="open" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceItem} activeOpacity={0.7}>
              <MaterialIcons name="forum" size={20} color={COLORS.info} />
              <Text style={styles.resourceText}>Community Forum</Text>
              <Ionicons name="open" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Notice */}
        <View style={styles.emergencyNotice}>
          <MaterialIcons name="emergency" size={20} color={COLORS.error} />
          <Text style={styles.emergencyText}>
            For medical emergencies, contact your healthcare provider or emergency services immediately. 
            This app is not a substitute for professional medical advice.
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
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
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
  quickActionsContainer: {
    gap: SPACING.sm,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  quickActionInfo: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  quickActionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  categoriesContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  categoryDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  resourcesContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    gap: SPACING.md,
  },
  resourceText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emergencyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.errorLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  emergencyText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    lineHeight: 18,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
