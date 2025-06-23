// src/screens/profile/HealthProfileSetupScreen.tsx
// 🚀 WORLD-CLASS: Fast, Light, Legal, Easy, Sleek
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ConsentModal } from '../../components/privacy/ConsentModal';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { ConsentType, ProfileSetupStep } from '../../types/healthProfile';
import { HealthProfileSetupScreenProps } from '../../types/navigation';

// Storage keys for persistence
const STORAGE_KEYS = {
  SETUP_PROGRESS: 'health_profile_setup_progress',
  SETUP_DATA: 'health_profile_setup_data',
  CONSENTS: 'health_profile_consents',
} as const;

export const HealthProfileSetupScreen: React.FC<
  HealthProfileSetupScreenProps
> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>(
    {} as Record<ConsentType, boolean>
  );
  const [progressAnim] = useState(new Animated.Value(0));
  const [setupData, setSetupData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  // ⚡ OPTIMIZED: Streamlined 5-step flow (medications moved to Stack tab)
  const setupSteps: ProfileSetupStep[] = [
    {
      id: 'privacy_consent',
      title: 'Privacy & Consent',
      description: 'Quick privacy setup - your data, your control',
      required: true,
      completed: false,
      consentRequired: true,
      estimatedTime: 2,
    },
    {
      id: 'demographics',
      title: 'Basic Info',
      description: 'Age & gender for personalized dosing',
      required: true,
      completed: false,
      estimatedTime: 1,
    },
    {
      id: 'health_goals',
      title: 'Health Goals',
      description: 'What do you want to achieve? (Pick up to 3)',
      required: false,
      completed: false,
      estimatedTime: 1,
    },
    {
      id: 'health_conditions',
      title: 'Health Conditions',
      description: 'Optional - for condition-specific warnings',
      required: false,
      completed: false,
      consentRequired: true,
      estimatedTime: 2,
    },
    {
      id: 'allergies',
      title: 'Allergies',
      description: 'Critical safety information',
      required: false,
      completed: false,
      consentRequired: true,
      estimatedTime: 1,
    },
  ];

  const [steps, setSteps] = useState(setupSteps);

  // 📊 SMART: Progress calculation for 5-step flow
  const getProgressPercentage = useCallback(() => {
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / 5) * 100; // Updated for 5 steps (removed medications step)
  }, [steps]);

  // ✨ SLEEK: Smooth animations
  const animateProgress = useCallback(() => {
    const progress = getProgressPercentage() / 100;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, getProgressPercentage]);

  // 💾 Save progress to AsyncStorage
  const saveProgress = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.SETUP_PROGRESS,
          JSON.stringify({ currentStep, steps })
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.SETUP_DATA,
          JSON.stringify(setupData)
        ),
        AsyncStorage.setItem(STORAGE_KEYS.CONSENTS, JSON.stringify(consents)),
      ]);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [currentStep, steps, setupData, consents]);

  // 💾 DATA PERSISTENCE: Load saved progress on mount
  useEffect(() => {
    loadSavedProgress();
  }, []);

  // 🔄 AUTO-SAVE: Save progress whenever steps change
  useEffect(() => {
    if (!isLoading) {
      saveProgress();
    }
    animateProgress();
  }, [steps, currentStep, isLoading, saveProgress, animateProgress]);

  // 🎯 Listen for navigation focus to reload saved progress
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reload progress when user returns to this screen
      loadSavedProgress();
    });

    return unsubscribe;
  }, [navigation]);

  // 💾 Load saved progress from AsyncStorage
  const loadSavedProgress = async () => {
    try {
      const [savedProgress, savedData, savedConsents] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SETUP_PROGRESS),
        AsyncStorage.getItem(STORAGE_KEYS.SETUP_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.CONSENTS),
      ]);

      if (savedProgress) {
        const { currentStep: savedStep, steps: savedSteps } =
          JSON.parse(savedProgress);
        setCurrentStep(savedStep || 0);
        if (savedSteps) {
          setSteps(savedSteps);
        }
      }

      if (savedData) {
        setSetupData(JSON.parse(savedData));
      }

      if (savedConsents) {
        setConsents(JSON.parse(savedConsents));
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove duplicate saveProgress function

  // 🗑️ Clear saved progress (for testing or reset)
  const clearSavedProgress = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SETUP_PROGRESS),
        AsyncStorage.removeItem(STORAGE_KEYS.SETUP_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.CONSENTS),
      ]);
    } catch (error) {
      console.error('Error clearing progress:', error);
    }
  };

  // Remove duplicate animateProgress function

  // ⚖️ LEGAL: Proper consent handling
  const handleConsentGranted = async (
    grantedConsents: Record<ConsentType, boolean>
  ) => {
    try {
      setConsents(grantedConsents);
      setShowConsentModal(false);

      setSteps(prev =>
        prev.map(step =>
          step.id === 'privacy_consent' ? { ...step, completed: true } : step
        )
      );

      setCurrentStep(1);
    } catch (error) {
      console.error('Consent error:', error);
    }
  };

  // 🎨 EASY: Simple navigation
  const handleStepPress = (stepIndex: number) => {
    const step = steps[stepIndex];

    if (stepIndex === 0) {
      setShowConsentModal(true);
      return;
    }

    if (stepIndex > currentStep + 1) return;

    navigateToStep(step.id);
  };

  const navigateToStep = (stepId: string) => {
    // 🧭 SMART: Navigation mapping (medications removed - now handled in Stack tab)
    const screenMap: Record<string, string> = {
      demographics: 'DemographicsScreen',
      health_goals: 'HealthGoalsScreen',
      health_conditions: 'HealthConditionsScreen',
      allergies: 'AllergiesScreen',
      // medications removed - users will add these in the Stack tab
    };

    const screenName = screenMap[stepId];
    if (screenName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation.navigate(screenName as any);
    }
  };

  // Remove duplicate functions - they are already defined above

  // 🎉 Handle setup completion with success message
  const handleCompleteSetup = async () => {
    try {
      // Clear saved progress since setup is complete
      await clearSavedProgress();

      // Show success popup with Stack tab guidance
      Alert.alert(
        '🎉 Profile Setup Complete!',
        'Great job! Your health profile is now set up.\n\nNext step: Optimize your stack by adding supplements or medications in the Stack tab to check for interactions.',
        [
          {
            text: 'Got it!',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error completing setup:', error);
      navigation.goBack();
    }
  };

  // � Handle save progress and return to ProfileScreen
  const handleSaveProgress = async () => {
    try {
      await saveProgress();
      Alert.alert(
        '💾 Progress Saved!',
        'Your progress has been saved. You can continue setup anytime from the Profile tab.',
        [
          {
            text: 'Continue Setup',
            style: 'cancel',
          },
          {
            text: 'Return to Profile',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    }
  };

  // �🔄 Update step completion and auto-advance to next step
  const updateStepCompletion = useCallback(
    (stepId: string, completed: boolean) => {
      setSteps(prevSteps => {
        const updatedSteps = prevSteps.map(step =>
          step.id === stepId ? { ...step, completed } : step
        );

        // Auto-advance to next step when current step is completed
        if (completed) {
          const completedStepIndex = updatedSteps.findIndex(
            step => step.id === stepId
          );
          const nextStepIndex = completedStepIndex + 1;

          // Advance currentStep if we're not already past this step
          if (
            completedStepIndex === currentStep &&
            nextStepIndex < updatedSteps.length
          ) {
            setCurrentStep(nextStepIndex);
          }
        }

        return updatedSteps;
      });
    },
    [currentStep]
  );

  // 💾 Auto-save form data
  const updateFormData = useCallback((stepId: string, data: unknown) => {
    setSetupData(prev => ({
      ...prev,
      [stepId]: data,
    }));
  }, []);

  // 🪶 LIGHT: Minimal render function
  const renderStepItem = (step: ProfileSetupStep, index: number) => {
    const isCompleted = step.completed;
    const isCurrent = index === currentStep;
    const isAccessible = index <= currentStep || isCompleted;

    return (
      <TouchableOpacity
        key={step.id}
        style={[
          styles.stepItem,
          isCurrent && styles.currentStep,
          isCompleted && styles.completedStep,
        ]}
        onPress={() => handleStepPress(index)}
        disabled={!isAccessible}
        activeOpacity={0.7}
      >
        <View style={styles.stepIcon}>
          {isCompleted ? (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={COLORS.success}
            />
          ) : isCurrent ? (
            <View style={styles.currentIcon}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>
          ) : (
            <View style={styles.futureIcon}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>
          )}
        </View>

        <View style={styles.stepContent}>
          <View style={styles.stepHeader}>
            <Text
              style={[styles.stepTitle, !isAccessible && styles.disabledText]}
            >
              {step.title}
            </Text>
            <View style={styles.stepMeta}>
              {step.required && (
                <Text style={styles.requiredBadge}>Required</Text>
              )}
              <Text style={styles.timeEstimate}>{step.estimatedTime}m</Text>
            </View>
          </View>
          <Text
            style={[
              styles.stepDescription,
              !isAccessible && styles.disabledText,
            ]}
          >
            {step.description}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={isAccessible ? COLORS.primary : COLORS.gray300}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Health Profile</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Animated Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(getProgressPercentage())}% Complete
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Ionicons name="shield-checkmark" size={40} color={COLORS.primary} />
          <Text style={styles.heroTitle}>Personalized Safety</Text>
          <Text style={styles.heroSubtitle}>
            Get recommendations tailored to your unique health profile
          </Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => renderStepItem(step, index))}
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>Why personalize?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefit}>
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={COLORS.success}
              />
              <Text style={styles.benefitText}>Age-specific dosing</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="warning" size={16} color={COLORS.warning} />
              <Text style={styles.benefitText}>Drug interactions</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="heart" size={16} color={COLORS.primary} />
              <Text style={styles.benefitText}>Goal-based recommendations</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {getProgressPercentage() === 100 ? (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteSetup}
          >
            <Text style={styles.completeButtonText}>Complete Setup</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.saveProgressButton}
            onPress={handleSaveProgress}
          >
            <Ionicons
              name="bookmark-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.saveProgressButtonText}>Save Progress</Text>
          </TouchableOpacity>
        )}
      </View>

      <ConsentModal
        visible={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsentsGranted={handleConsentGranted}
        title="Privacy Settings"
      />
    </SafeAreaView>
  );
};

// ✨ SLEEK: Modern, minimal styles
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
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  skipText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
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
  progressText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 22,
  },
  stepsContainer: {
    marginBottom: SPACING.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  currentStep: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  completedStep: {
    backgroundColor: COLORS.successLight,
  },
  stepIcon: {
    marginRight: SPACING.md,
  },
  currentIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  futureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  requiredBadge: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  timeEstimate: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  stepDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  disabledText: {
    color: COLORS.gray400,
  },
  benefits: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  benefitsTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  benefitsList: {
    gap: SPACING.sm,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  benefitText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  completeButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  saveProgressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  saveProgressButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
