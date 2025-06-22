// src/screens/profile/ProfileScreen.tsx
// 🚀 WORLD-CLASS: Complete Profile Management Hub
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { RootStackParamList } from '../../types/navigation';

type ProfileNavigationProp = StackNavigationProp<RootStackParamList>;

export const ProfileScreen = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, signOut, loading: authLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 🎯 Mock profile data - would come from actual profile service
  const profileData = {
    completeness: 65,
    pendingSubmissions: 2,
  };

  // 🏥 1. HEALTH PROFILE - Main health-related features
  const healthProfileSection = {
    id: 'health_profile',
    title: 'Health Profile',
    description:
      'Manage your health information for personalized recommendations',
    icon: 'medical',
    color: COLORS.primary,
    completeness: profileData.completeness,
    badge: undefined as number | undefined,
  };

  // ⚙️ 2. SETTINGS - App configuration
  const settingsSection = {
    id: 'settings',
    title: 'Settings',
    description: 'App configuration and preferences',
    icon: 'settings',
    color: COLORS.info,
    completeness: undefined as number | undefined,
    badge: undefined as number | undefined,
  };

  // 📊 3. DATA QUALITY - User contributions
  const dataQualitySection = {
    id: 'data_quality',
    title: 'Data Quality',
    description: 'Help improve our database and report issues',
    icon: 'analytics',
    color: COLORS.success,
    badge:
      profileData.pendingSubmissions > 0
        ? profileData.pendingSubmissions
        : undefined,
    completeness: undefined as number | undefined,
  };

  // 🆘 4. SUPPORT - Help and assistance
  const supportSection = {
    id: 'support',
    title: 'Support',
    description: 'Get help and learn about our methodology',
    icon: 'help-circle',
    color: COLORS.warning,
    completeness: undefined as number | undefined,
    badge: undefined as number | undefined,
  };

  // ℹ️ 5. ABOUT - App information
  const aboutSection = {
    id: 'about',
    title: 'About',
    description: 'App information, terms, and credits',
    icon: 'information-circle',
    color: COLORS.textSecondary,
    completeness: undefined as number | undefined,
    badge: undefined as number | undefined,
  };

  const mainSections = [
    healthProfileSection,
    settingsSection,
    dataQualitySection,
    supportSection,
    aboutSection,
  ];

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await signOut();
            console.log('Sign out successful');
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleCreateAccount = () => {
    navigation.navigate('Welcome');
  };

  const handleSectionPress = (section: (typeof mainSections)[0]) => {
    switch (section.id) {
      case 'health_profile':
        navigation.navigate('HealthProfileSetup');
        break;
      case 'settings':
        navigation.navigate('SettingsScreen');
        break;
      case 'data_quality':
        navigation.navigate('DataQualityScreen');
        break;
      case 'support':
        navigation.navigate('SupportScreen');
        break;
      case 'about':
        navigation.navigate('AboutScreen');
        break;
      default:
        Alert.alert(
          'Coming Soon',
          `${section.title} features are being developed and will be available soon!`
        );
    }
  };

  // ⚡ FAST: Loading state
  if (authLoading || isSigningOut) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {isSigningOut ? 'Signing out...' : 'Loading...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 🎨 SLEEK: Render main section card
  const renderMainSection = (section: (typeof mainSections)[0]) => (
    <TouchableOpacity
      key={section.id}
      style={styles.mainSectionCard}
      onPress={() => handleSectionPress(section)}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIconContainer,
            { backgroundColor: `${section.color}20` },
          ]}
        >
          <Ionicons
            name={section.icon as keyof typeof Ionicons.glyphMap}
            size={28}
            color={section.color}
          />
        </View>
        <View style={styles.sectionInfo}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{section.badge}</Text>
              </View>
            )}
            {section.completeness !== undefined && (
              <Text style={styles.completenessText}>
                {section.completeness}%
              </Text>
            )}
          </View>
          <Text style={styles.sectionDescription}>{section.description}</Text>
          {section.completeness !== undefined && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${section.completeness}%` },
                ]}
              />
            </View>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={24}
          color={COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  // 🎉 MAIN PROFILE HUB: Show 5-section structure
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {user && user.email && (
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.signOutButton}
            >
              <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* User Info (if authenticated) */}
        {user && user.email && (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <MaterialIcons
                  name="account-circle"
                  size={50}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {user.email?.split('@')[0] || 'User'}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Guest User Banner */}
        {(!user || (!user.email && user.is_anonymous)) && (
          <View style={styles.guestBanner}>
            <MaterialIcons name="info" size={20} color={COLORS.info} />
            <Text style={styles.guestText}>
              Sign in to save your profile and get personalized recommendations
            </Text>
            <TouchableOpacity
              onPress={handleCreateAccount}
              style={styles.signInButton}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main 5 Sections */}
        <View style={styles.sectionsContainer}>
          {mainSections.map(renderMainSection)}
        </View>

        {/* App Version */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Pharmaguide v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>
            Your trusted supplement safety companion
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 🎨 SLEEK: Modern 5-section hub styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  signOutButton: {
    padding: SPACING.sm,
  },
  userCard: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 12,
    padding: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: SPACING.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 12,
  },
  guestText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  signInButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  sectionsContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  mainSectionCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginLeft: SPACING.sm,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  completenessText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.sm,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  appInfoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  appInfoSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
