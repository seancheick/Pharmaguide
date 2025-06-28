// src/screens/profile/HealthConditionsScreen.tsx
// 🚀 WORLD-CLASS: Health Conditions Selection Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { HealthConditionsScreenProps } from '../../types/navigation';
import { storageAdapter } from '../../services/storage/storageAdapter';
import { OptimizedIcon } from '../../components/common/OptimizedIcon';
import { useHealthProfile } from '../../hooks/useHealthProfile';
import type {
  HealthConditions,
  HealthCondition as HealthConditionType,
} from '../../types/healthProfile';

interface HealthConditionOption {
  id: string;
  name: string;
  category:
    | 'cardiovascular'
    | 'metabolic'
    | 'digestive'
    | 'mental'
    | 'autoimmune'
    | 'other';
  icon: string; // Use string for compatibility with OptimizedIcon
  description?: string;
}

const COMMON_CONDITIONS: HealthConditionOption[] = [
  {
    id: 'hypertension',
    name: 'High Blood Pressure',
    category: 'cardiovascular',
    icon: 'monitor-heart',
    description: 'Elevated blood pressure readings',
  },
  {
    id: 'diabetes_t2',
    name: 'Type 2 Diabetes',
    category: 'metabolic',
    icon: 'bloodtype',
    description: 'Blood sugar regulation issues',
  },
  {
    id: 'anxiety',
    name: 'Anxiety',
    category: 'mental',
    icon: 'psychology',
    description: 'Anxiety disorders or chronic worry',
  },
  {
    id: 'depression',
    name: 'Depression',
    category: 'mental',
    icon: 'sentiment-dissatisfied',
    description: 'Mood disorders or persistent sadness',
  },
  {
    id: 'arthritis',
    name: 'Arthritis',
    category: 'autoimmune',
    icon: 'accessibility',
    description: 'Joint inflammation and pain',
  },
  {
    id: 'ibs',
    name: 'IBS',
    category: 'digestive',
    icon: 'restaurant',
    description: 'Irritable bowel syndrome',
  },
  {
    id: 'high_cholesterol',
    name: 'High Cholesterol',
    category: 'cardiovascular',
    icon: 'favorite',
    description: 'Elevated cholesterol levels',
  },
  {
    id: 'thyroid',
    name: 'Thyroid Issues',
    category: 'metabolic',
    icon: 'healing',
    description: 'Hyper or hypothyroidism',
  },
  {
    id: 'insomnia',
    name: 'Sleep Disorders',
    category: 'other',
    icon: 'bedtime',
    description: 'Difficulty sleeping or staying asleep',
  },
  {
    id: 'migraines',
    name: 'Migraines',
    category: 'other',
    icon: 'psychology',
    description: 'Chronic headaches or migraines',
  },
  {
    id: 'osteoporosis',
    name: 'Osteoporosis',
    category: 'other',
    icon: 'accessibility',
    description: 'Bone density loss',
  },
  {
    id: 'gerd',
    name: 'GERD',
    category: 'digestive',
    icon: 'local-fire-department',
    description: 'Gastroesophageal reflux disease',
  },
];

export const HealthConditionsScreen: React.FC<HealthConditionsScreenProps> = ({
  navigation,
  route,
}) => {
  // Accept initialValue from navigation params for progress recovery
  const initialValue = route?.params?.initialValue as
    | {
        selectedConditions?: string[];
        customConditions?: string[];
        allConditions?: string[];
      }
    | undefined;
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    initialValue?.selectedConditions || []
  );
  const [customCondition, setCustomCondition] = useState('');
  const [customConditions, setCustomConditions] = useState<string[]>(
    initialValue?.customConditions || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const { updateProfile } = useHealthProfile();

  // 💾 Load existing data when component mounts (if not provided by initialValue)
  useEffect(() => {
    if (
      initialValue &&
      (initialValue.selectedConditions?.length ||
        initialValue.customConditions?.length)
    )
      return;
    const loadExistingData = async () => {
      try {
        // Load from setup data (temporary storage during setup flow)
        const savedSetupData = await AsyncStorage.getItem(
          'health_profile_setup_data'
        );
        if (savedSetupData) {
          const setupData = JSON.parse(savedSetupData);
          if (setupData.conditions) {
            const { selectedConditions: saved, customConditions: savedCustom } =
              setupData.conditions;
            if (Array.isArray(saved)) {
              setSelectedConditions(saved);
            }
            if (Array.isArray(savedCustom)) {
              setCustomConditions(savedCustom);
            }
          }
        }
      } catch (error) {
        console.error('Error loading existing health conditions:', error);
      }
    };

    loadExistingData();
  }, [initialValue]);

  // 🔄 Mark step as complete in HealthProfileSetupScreen
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

  const handleConditionToggle = (conditionId: string) => {
    setSelectedConditions(prev => {
      if (prev.includes(conditionId)) {
        return prev.filter(id => id !== conditionId);
      } else {
        return [...prev, conditionId];
      }
    });
  };

  const handleAddCustomCondition = () => {
    if (
      customCondition.trim() &&
      !customConditions.includes(customCondition.trim())
    ) {
      setCustomConditions(prev => [...prev, customCondition.trim()]);
      setCustomCondition('');
    }
  };

  const handleRemoveCustomCondition = (condition: string) => {
    setCustomConditions(prev => prev.filter(c => c !== condition));
  };

  const handleSave = async () => {
    const allConditions = [...selectedConditions, ...customConditions];

    setIsLoading(true);
    try {
      console.log('💾 Saving health conditions:', {
        selectedConditions,
        customConditions,
      });

      // 1. Save to setupData (temporary storage during setup flow)
      const savedSetupData = await AsyncStorage.getItem(
        'health_profile_setup_data'
      );
      const setupData = savedSetupData ? JSON.parse(savedSetupData) : {};
      setupData.conditions = {
        selectedConditions,
        customConditions,
        allConditions,
      };
      await AsyncStorage.setItem(
        'health_profile_setup_data',
        JSON.stringify(setupData)
      );

      // 2. Transform to HealthConditions interface and save to health profile
      const conditionsData: HealthConditions = {
        conditions: allConditions.map(condition => ({
          id: typeof condition === 'string' ? condition : condition,
          name: typeof condition === 'string' ? condition : condition,
          category: 'other' as const,
          severity: 'moderate' as const,
          diagnosedDate: new Date().toISOString(),
          isActive: true,
          notes: customConditions.includes(condition)
            ? 'Custom condition'
            : undefined,
        })),
        consentGiven: true,
        lastUpdated: new Date().toISOString(),
      };

      const result = await updateProfile('conditions', conditionsData);
      if (result.error) {
        throw new Error(
          typeof result.error === 'string'
            ? result.error
            : 'Failed to save health conditions'
        );
      }

      console.log('✅ Successfully saved health conditions');

      // 3. Mark health conditions step as complete and advance to next step
      await markStepComplete('health_conditions');

      // No success popup - user continues to next step seamlessly
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error saving health conditions:', error);
      Alert.alert(
        'Error',
        'Failed to save health conditions. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderConditionCard = (condition: HealthConditionOption) => {
    const isSelected = selectedConditions.includes(condition.id);

    return (
      <TouchableOpacity
        key={condition.id}
        style={[
          styles.conditionCard,
          isSelected && styles.selectedConditionCard,
        ]}
        onPress={() => handleConditionToggle(condition.id)}
        activeOpacity={0.7}
      >
        <View style={styles.conditionHeader}>
          <View
            style={[
              styles.conditionIconContainer,
              isSelected && styles.selectedIconContainer,
            ]}
          >
            <OptimizedIcon
              type="material"
              name={condition.icon}
              size={20}
              color={isSelected ? COLORS.white : COLORS.primary}
            />
          </View>
          {isSelected && (
            <OptimizedIcon
              type="ion"
              name="checkmark-circle"
              size={20}
              color={COLORS.success}
            />
          )}
        </View>
        <Text
          style={[
            styles.conditionName,
            isSelected && styles.selectedConditionName,
          ]}
        >
          {condition.name}
        </Text>
        {condition.description && (
          <Text
            style={[
              styles.conditionDescription,
              isSelected && styles.selectedConditionDescription,
            ]}
          >
            {condition.description}
          </Text>
        )}
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
          />
        </TouchableOpacity>
        <Text style={styles.title}>Health Conditions</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <OptimizedIcon
            type="material"
            name="health-and-safety"
            size={32}
            color={COLORS.primary}
          />
          <Text style={styles.instructionsTitle}>Health Conditions</Text>
          <Text style={styles.instructionsText}>
            Select any health conditions you have. This helps us provide safer
            supplement recommendations and identify potential interactions.
          </Text>
          <View style={styles.privacyNote}>
            <OptimizedIcon
              type="ion"
              name="shield-checkmark"
              size={16}
              color={COLORS.success}
            />
            <Text style={styles.privacyText}>
              Your health information is encrypted and private
            </Text>
          </View>
        </View>

        {/* Common Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Conditions</Text>
          <View style={styles.conditionsGrid}>
            {COMMON_CONDITIONS.map(renderConditionCard)}
          </View>
        </View>

        {/* Custom Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Custom Condition</Text>
          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              placeholder="Enter condition name..."
              value={customCondition}
              onChangeText={setCustomCondition}
              onSubmitEditing={handleAddCustomCondition}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCustomCondition}
              disabled={!customCondition.trim()}
            >
              <OptimizedIcon
                name="add"
                size={20}
                color={COLORS.white}
                type="material"
              />
            </TouchableOpacity>
          </View>

          {/* Custom Conditions List */}
          {customConditions.map((condition, index) => (
            <View key={index} style={styles.customConditionItem}>
              <Text style={styles.customConditionText}>{condition}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveCustomCondition(condition)}
                style={styles.removeButton}
              >
                <OptimizedIcon
                  name="close"
                  size={16}
                  color={COLORS.error}
                  type="ion"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Conditions'}
          </Text>
          {!isLoading && (
            <OptimizedIcon
              name="arrow-forward"
              size={20}
              color={COLORS.white}
              type="ion"
            />
          )}
        </TouchableOpacity>
      </View>
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
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  privacyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.medium,
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
  conditionsGrid: {
    gap: SPACING.sm,
  },
  conditionCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  selectedConditionCard: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  conditionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconContainer: {
    backgroundColor: COLORS.primary,
  },
  conditionName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  selectedConditionName: {
    color: COLORS.primary,
  },
  conditionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  selectedConditionDescription: {
    color: COLORS.primary + 'CC',
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  customInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customConditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  customConditionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    flex: 1,
  },
  removeButton: {
    padding: SPACING.xs,
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
