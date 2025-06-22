// src/screens/profile/HealthProfileSetupScreen.tsx
// 🚀 WORLD-CLASS: Fast, Light, Legal, Easy, Sleek
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ConsentModal } from '../../components/privacy/ConsentModal';
import { privacyService } from '../../services/privacy/privacyService';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { ConsentType, ProfileSetupStep } from '../../types/healthProfile';
import { HealthProfileSetupScreenProps } from '../../types/navigation';

export const HealthProfileSetupScreen: React.FC<
  HealthProfileSetupScreenProps
> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>(
    {} as any
  );
  const [progressAnim] = useState(new Animated.Value(0));

  // ⚡ OPTIMIZED: Streamlined steps for speed
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
      id: 'medications',
      title: 'Medications & Supplements',
      description: 'Add to your stack for interaction checking',
      required: false,
      completed: false,
      consentRequired: true,
      estimatedTime: 3,
    },
    {
      id: 'health_goals',
      title: 'Health Goals',
      description: 'What do you want to achieve? (Pick 3)',
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

  useEffect(() => {
    animateProgress();
  }, [steps]);

  // ✨ SLEEK: Smooth animations
  const animateProgress = () => {
    const progress = getProgressPercentage() / 100;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

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
    const screenMap: Record<string, string> = {
      demographics: 'DemographicsScreen',
      health_goals: 'HealthGoalsScreen',
      health_conditions: 'HealthConditionsScreen',
      allergies: 'AllergiesScreen',
      medications: 'MedicationsScreen',
    };

    const screenName = screenMap[stepId] as keyof typeof screenMap;
    if (screenName) {
      navigation.navigate(screenName as any);
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

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
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
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
          <MaterialIcons
            name="health-and-safety"
            size={40}
            color={COLORS.primary}
          />
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

      {/* Action Button */}
      {getProgressPercentage() === 100 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.completeButtonText}>Start Using App</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

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
});
