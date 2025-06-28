// src/screens/profile/HealthGoalsScreen.tsx
// 🚀 WORLD-CLASS: Health Goals Selection Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { HealthGoalsScreenProps } from '../../types/navigation';
import { storageAdapter } from '../../services/storage/storageAdapter';
import { OptimizedIcon } from '../../components/common/OptimizedIcon';
import { useHealthProfile } from '../../hooks/useHealthProfile';
import type {
  HealthGoals,
  HealthGoal as HealthGoalType,
} from '../../types/healthProfile';

interface HealthGoalOption {
  id: string;
  title: string;
  description: string;
  icon: string; // Use string for compatibility with OptimizedIcon
  category: 'fitness' | 'wellness' | 'nutrition' | 'mental';
}

const HEALTH_GOALS: HealthGoalOption[] = [
  {
    id: 'muscle_building',
    title: 'Build Muscle',
    description: 'Increase muscle mass and strength',
    icon: 'barbell',
    category: 'fitness',
  },
  {
    id: 'weight_loss',
    title: 'Lose Weight',
    description: 'Achieve healthy weight loss',
    icon: 'trending-down',
    category: 'fitness',
  },
  {
    id: 'energy_boost',
    title: 'Boost Energy',
    description: 'Increase daily energy levels',
    icon: 'flash',
    category: 'wellness',
  },
  {
    id: 'immune_support',
    title: 'Immune Support',
    description: 'Strengthen immune system',
    icon: 'shield',
    category: 'wellness',
  },
  {
    id: 'heart_health',
    title: 'Heart Health',
    description: 'Support cardiovascular health',
    icon: 'heart',
    category: 'wellness',
  },
  {
    id: 'brain_health',
    title: 'Brain Health',
    description: 'Improve cognitive function',
    icon: 'bulb',
    category: 'mental',
  },
  {
    id: 'sleep_quality',
    title: 'Better Sleep',
    description: 'Improve sleep quality and duration',
    icon: 'moon',
    category: 'wellness',
  },
  {
    id: 'stress_management',
    title: 'Stress Relief',
    description: 'Manage stress and anxiety',
    icon: 'leaf',
    category: 'mental',
  },
  {
    id: 'digestive_health',
    title: 'Digestive Health',
    description: 'Support gut health and digestion',
    icon: 'restaurant',
    category: 'nutrition',
  },
  {
    id: 'bone_health',
    title: 'Bone Health',
    description: 'Strengthen bones and joints',
    icon: 'body',
    category: 'wellness',
  },
  {
    id: 'skin_health',
    title: 'Skin Health',
    description: 'Improve skin appearance and health',
    icon: 'sparkles',
    category: 'wellness',
  },
  {
    id: 'athletic_performance',
    title: 'Athletic Performance',
    description: 'Enhance sports and exercise performance',
    icon: 'trophy',
    category: 'fitness',
  },
];

export const HealthGoalsScreen: React.FC<HealthGoalsScreenProps> = ({
  navigation,
  route,
}) => {
  // Accept initialValue from navigation params for progress recovery
  const initialValue = route?.params?.initialValue as string[] | HealthGoals | undefined;
  const [selectedGoals, setSelectedGoals] = useState<string[]>(() => {
    if (Array.isArray(initialValue)) return initialValue;
    if (initialValue && typeof initialValue === 'object' && (initialValue as HealthGoals).primary) {
      // Convert HealthGoals interface to array
      const g = initialValue as HealthGoals;
      return [g.primary, g.secondary, g.tertiary].filter(Boolean) as string[];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const maxGoals = 3;
  const { updateProfile } = useHealthProfile();

  //  Load existing data when component mounts (if not provided by initialValue)
  useEffect(() => {
    if (selectedGoals.length > 0) return; // Already set from initialValue
    const loadExistingData = async () => {
      try {
        // Load from setup data (temporary storage during setup flow)
        const savedSetupData = await AsyncStorage.getItem(
          'health_profile_setup_data'
        );
        if (savedSetupData) {
          const setupData = JSON.parse(savedSetupData);
          if (setupData.goals) {
            // Handle both array format (from setupData) and HealthGoals interface format
            if (Array.isArray(setupData.goals)) {
              setSelectedGoals(setupData.goals);
            } else if (setupData.goals.primary) {
              // Convert HealthGoals interface back to array for UI
              const goals = [
                setupData.goals.primary,
                setupData.goals.secondary,
                setupData.goals.tertiary,
              ].filter(Boolean);
              setSelectedGoals(goals);
            }
          }
        }
      } catch (error) {
        console.error('Error loading existing health goals:', error);
      }
    };

    loadExistingData();
  }, [selectedGoals.length]);

  // �🔄 Mark step as complete in HealthProfileSetupScreen
  const markStepComplete = async (stepId: string) => {
    try {
      const savedProgress = await storageAdapter.getItem(
        'health_profile_setup_progress'
      );
      if (savedProgress) {
        const { steps } = JSON.parse(savedProgress);
        const updatedSteps = steps.map(
          (step: { id: string; completed: boolean }) =>
            step.id === stepId ? { ...step, completed: true } : step
        );

        // Advance to next step
        const completedStepIndex = steps.findIndex(
          (step: { id: string }) => step.id === stepId
        );
        const nextStep = Math.min(completedStepIndex + 1, steps.length - 1);

        await storageAdapter.setItem(
          'health_profile_setup_progress',
          JSON.stringify({
            currentStep: nextStep,
            steps: updatedSteps,
          })
        );
      }
    } catch (error) {
      console.error('Error marking step complete:', error);
    }
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      } else if (prev.length < maxGoals) {
        return [...prev, goalId];
      } else {
        Alert.alert(
          'Maximum Goals Reached',
          `You can select up to ${maxGoals} goals. Remove one to add another.`
        );
        return prev;
      }
    });
  };

  const handleSave = async () => {
    if (selectedGoals.length === 0) {
      Alert.alert(
        'No Goals Selected',
        'Please select at least one health goal.'
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log('💾 Saving health goals:', selectedGoals);

      // 1. Save to setupData (temporary storage during setup flow)
      const savedSetupData = await AsyncStorage.getItem(
        'health_profile_setup_data'
      );
      const setupData = savedSetupData ? JSON.parse(savedSetupData) : {};
      setupData.goals = selectedGoals; // Store as array for UI compatibility
      await AsyncStorage.setItem(
        'health_profile_setup_data',
        JSON.stringify(setupData)
      );

      // 2. Transform to HealthGoals interface and save to health profile
      const goalsData: HealthGoals = {
        primary: selectedGoals[0] as HealthGoalType,
        secondary: selectedGoals[1] as HealthGoalType,
        tertiary: selectedGoals[2] as HealthGoalType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await updateProfile('goals', goalsData);
      if (result.error) {
        throw new Error(
          typeof result.error === 'string'
            ? result.error
            : 'Failed to save health goals'
        );
      }

      console.log('✅ Successfully saved health goals');

      // 3. Mark health goals step as complete and advance to next step
      await markStepComplete('health_goals');

      // No success popup - user continues to next step seamlessly
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error saving health goals:', error);
      Alert.alert('Error', 'Failed to save health goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGoalCard = (goal: HealthGoalOption) => {
    const isSelected = selectedGoals.includes(goal.id);

    return (
      <TouchableOpacity
        key={goal.id}
        style={[styles.goalCard, isSelected && styles.selectedGoalCard]}
        onPress={() => handleGoalToggle(goal.id)}
        activeOpacity={0.7}
      >
        <View style={styles.goalHeader}>
          <View
            style={[
              styles.goalIconContainer,
              isSelected && styles.selectedIconContainer,
            ]}
          >
            <OptimizedIcon
              type="ion"
              name={goal.icon}
              size={24}
              color={isSelected ? COLORS.white : COLORS.primary}
              accessibilityLabel={`${goal.title} icon`}
            />
          </View>
          {isSelected && (
            <View style={styles.checkmark}>
              <OptimizedIcon
                type="ion"
                name="checkmark"
                size={16}
                color={COLORS.white}
                accessibilityLabel="Selected"
              />
            </View>
          )}
        </View>
        <Text
          style={[styles.goalTitle, isSelected && styles.selectedGoalTitle]}
        >
          {goal.title}
        </Text>
        <Text
          style={[
            styles.goalDescription,
            isSelected && styles.selectedGoalDescription,
          ]}
        >
          {goal.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <OptimizedIcon
            type="ion"
            name="arrow-back"
            size={24}
            color={COLORS.textPrimary}
            accessibilityLabel="Back"
          />
        </TouchableOpacity>
        <Text style={styles.title}>Health Goals</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <OptimizedIcon
            type="ion"
            name="flag"
            size={32}
            color={COLORS.primary}
            accessibilityLabel="Flag"
          />
          <Text style={styles.instructionsTitle}>Choose Your Goals</Text>
          <Text style={styles.instructionsText}>
            Select up to {maxGoals} health goals to get personalized supplement
            recommendations.
          </Text>
          <Text style={styles.selectedCount}>
            {selectedGoals.length} of {maxGoals} selected
          </Text>
        </View>

        {/* Goals Grid */}
        <View style={styles.goalsContainer}>
          {HEALTH_GOALS.map(renderGoalCard)}
        </View>
      </ScrollView>

      {/* Save Button */}
      {selectedGoals.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Goals'}
            </Text>
            {!isLoading && (
              <OptimizedIcon
                type="ion"
                name="arrow-forward"
                size={20}
                color={COLORS.white}
                accessibilityLabel="Save"
              />
            )}
          </TouchableOpacity>
        </View>
      )}
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
  skipText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  content: {
    flex: 1,
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  instructionsTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  instructionsText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  selectedCount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  goalsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  goalCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  selectedGoalCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconContainer: {
    backgroundColor: COLORS.white + '20',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  selectedGoalTitle: {
    color: COLORS.white,
  },
  goalDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  selectedGoalDescription: {
    color: COLORS.white + 'CC',
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  saveButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray400,
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});
