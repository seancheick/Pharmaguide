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
import { Ionicons } from '@expo/vector-icons';
// Remove AsyncStorage import - no longer needed for progress tracking
import { useAuth } from '../../hooks/useAuth';
import { useHealthProfile } from '../../hooks/useHealthProfile';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import {
  PROFILE_SECTIONS,
  MAIN_SECTIONS,
  ProfileSectionGroup,
} from '../../constants/profile';
import type { ProfileScreenProps } from '../../types/navigation';

// Remove locking mechanism - all sections should be freely accessible

export const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenProps['navigation']>();

  const navigateToScreen = (route: string) => {
    // Navigate to the specified screen - all sections are freely accessible
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate(route);
  };
  const {
    user,
    signOut,
    loading: authLoading,
    isAuthenticated,
    isGuest,
  } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { completeness, loading: profileLoading } = useHealthProfile();
  // Remove locking state - all sections are freely accessible

  // Remove all progress tracking logic - sections are freely accessible

  // Remove all completion and progress tracking functions

  // Enhance profile sections with dynamic data
  const mainSections = PROFILE_SECTIONS.map((section: ProfileSectionGroup) => ({
    ...section,
    completeness:
      section.id === MAIN_SECTIONS.HEALTH_PROFILE ? completeness : undefined,
    // TODO: Add dynamic badge count from submissions service
    badge: section.id === MAIN_SECTIONS.DATA_QUALITY ? 2 : undefined,
  }));

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

  const handleSectionPress = (section: ProfileSectionGroup) => {
    if (section.route) {
      navigateToScreen(section.route);
    } else {
      Alert.alert(
        'Coming Soon',
        `${section.title} features are being developed and will be available soon!`
      );
    }
  };

  // ⚡ FAST: Loading state
  if (authLoading || isSigningOut || profileLoading) {
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

  // 🎨 SLEEK: Render main section card - all sections freely accessible
  const renderMainSection = (section: (typeof mainSections)[0]) => {
    return (
      <TouchableOpacity
        key={section.id}
        style={styles.mainSectionCard}
        onPress={() => handleSectionPress(section)}
        activeOpacity={0.7}
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
  };

  // 🎉 MAIN PROFILE HUB: Show 5-section structure
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {isAuthenticated && (
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.signOutButton}
            >
              <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* User Info (if authenticated) */}
        {isAuthenticated && (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons
                  name="person-circle"
                  size={50}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {user?.email?.split('@')[0] || 'User'}
                </Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Guest User Banner */}
        {isGuest && (
          <View style={styles.guestBanner}>
            <Ionicons name="information-circle" size={20} color={COLORS.info} />
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

        {/* Remove Save Progress Button - sections are freely accessible */}

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
