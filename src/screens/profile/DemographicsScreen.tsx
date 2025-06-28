// src/screens/profile/DemographicsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CustomHeader } from '../../components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { useHealthProfile } from '../../hooks/useHealthProfile';
import type {
  AgeRange,
  BiologicalSex,
  PregnancyStatus,
  Demographics,
} from '../../types/healthProfile';
import { DemographicsScreenProps } from '../../types/navigation';

export const DemographicsScreen: React.FC<DemographicsScreenProps> = ({
  navigation,
  route,
}) => {
  // Accept initialValue from navigation params for progress recovery
  const initialValue = route?.params?.initialValue as
    | Partial<Demographics>
    | undefined;
  const [demographics, setDemographics] = useState<Partial<Demographics>>(
    initialValue || {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const { updateDemographics } = useHealthProfile();

  // 💾 Load existing data when component mounts (if not provided by initialValue)
  useEffect(() => {
    if (initialValue) return; // Already set from navigation
    const loadExistingData = async () => {
      try {
        // Load from setup data (temporary storage during setup flow)
        const savedSetupData = await AsyncStorage.getItem(
          'health_profile_setup_data'
        );
        if (savedSetupData) {
          const setupData = JSON.parse(savedSetupData);
          if (setupData.demographics) {
            setDemographics(setupData.demographics);
          }
        }
      } catch (error) {
        console.error('Error loading existing demographics:', error);
      }
    };

    loadExistingData();
  }, [initialValue]);

  // 🔄 Mark step as complete in HealthProfileSetupScreen
  const markStepComplete = async (stepId: string) => {
    try {
      const savedProgress = await AsyncStorage.getItem(
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

        await AsyncStorage.setItem(
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

  // ⚡ FAST: Pre-defined options for quick selection
  const ageRanges: { value: AgeRange; label: string; description: string }[] = [
    {
      value: '0-5',
      label: 'Infant/Toddler (0-5)',
      description: 'Special pediatric considerations',
    },
    { value: '6-12', label: 'Child (6-12)', description: 'Growing body needs' },
    {
      value: '13-18',
      label: 'Teen (13-18)',
      description: 'Developmental phase',
    },
    {
      value: '19-30',
      label: 'Young Adult (19-30)',
      description: 'Peak health years',
    },
    {
      value: '31-50',
      label: 'Adult (31-50)',
      description: 'Maintenance focus',
    },
    {
      value: '51-65',
      label: 'Mature Adult (51-65)',
      description: 'Preventive care',
    },
    { value: '66+', label: 'Senior (66+)', description: 'Age-specific safety' },
  ];

  const biologicalSexOptions: {
    value: BiologicalSex;
    label: string;
    icon: string;
  }[] = [
    { value: 'male', label: 'Male', icon: 'male' },
    { value: 'female', label: 'Female', icon: 'female' },
    {
      value: 'prefer_not_to_say',
      label: 'Prefer not to say',
      icon: 'help-circle',
    },
  ];

  const pregnancyOptions: {
    value: PregnancyStatus;
    label: string;
    description: string;
  }[] = [
    {
      value: 'pregnant',
      label: 'Pregnant',
      description: 'Special safety considerations',
    },
    {
      value: 'breastfeeding',
      label: 'Breastfeeding',
      description: 'Nursing safety guidelines',
    },
    {
      value: 'trying_to_conceive',
      label: 'Trying to conceive',
      description: 'Preconception health',
    },
    {
      value: 'none',
      label: 'None of the above',
      description: 'Standard recommendations',
    },
    { value: 'not_applicable', label: 'Not applicable', description: '' },
  ];

  const handleSave = async () => {
    // ⚖️ LEGAL: Validate required fields
    if (!demographics.ageRange || !demographics.biologicalSex) {
      Alert.alert(
        'Missing Information',
        'Please select your age range and biological sex.'
      );
      return;
    }

    setIsLoading(true);
    try {
      // Save to health profile with proper timestamps
      const demographicsData: Demographics = {
        ageRange: demographics.ageRange!,
        biologicalSex: demographics.biologicalSex!,
        displayName: demographics.displayName,
        pregnancyStatus: demographics.pregnancyStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('💾 Saving demographics:', demographicsData);

      // 1. Save to setupData (temporary storage during setup flow)
      const savedSetupData = await AsyncStorage.getItem(
        'health_profile_setup_data'
      );
      const setupData = savedSetupData ? JSON.parse(savedSetupData) : {};
      setupData.demographics = demographicsData;
      await AsyncStorage.setItem(
        'health_profile_setup_data',
        JSON.stringify(setupData)
      );

      // 2. Save to encrypted local storage via useHealthProfile hook
      const result = await updateDemographics(demographicsData);

      if (result.error) {
        throw new Error(
          typeof result.error === 'string'
            ? result.error
            : 'Failed to save demographics'
        );
      }

      // Mark demographics step as complete and advance to next step
      await markStepComplete('demographics');

      console.log('✅ Demographics saved successfully');

      // 🔧 FIX: Navigate to next step automatically instead of just going back
      const fromSetup = route?.params?.fromSetup;
      if (fromSetup) {
        // Navigate to next step in the setup flow
        navigation.navigate('HealthGoalsScreen', { fromSetup: true });
      } else {
        // Regular navigation back to profile
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving demographics:', error);
      Alert.alert('Error', 'Failed to save information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showPregnancyOptions = demographics.biologicalSex === 'female';

  // 🪶 LIGHT: Minimal option renderer
  const renderAgeOption = (option: (typeof ageRanges)[0]) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.optionCard,
        demographics.ageRange === option.value && styles.selectedOption,
      ]}
      onPress={() =>
        setDemographics(prev => ({ ...prev, ageRange: option.value }))
      }
    >
      <View style={styles.optionContent}>
        <Text
          style={[
            styles.optionLabel,
            demographics.ageRange === option.value && styles.selectedText,
          ]}
        >
          {option.label}
        </Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
      {demographics.ageRange === option.value && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  const renderSexOption = (option: (typeof biologicalSexOptions)[0]) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.sexOption,
        demographics.biologicalSex === option.value && styles.selectedSexOption,
      ]}
      onPress={() =>
        setDemographics(prev => ({ ...prev, biologicalSex: option.value }))
      }
    >
      <Ionicons
        name={option.icon as keyof typeof Ionicons.glyphMap}
        size={24}
        color={
          demographics.biologicalSex === option.value
            ? COLORS.primary
            : COLORS.textSecondary
        }
      />
      <Text
        style={[
          styles.sexLabel,
          demographics.biologicalSex === option.value && styles.selectedText,
        ]}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  const renderPregnancyOption = (option: (typeof pregnancyOptions)[0]) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.pregnancyOption,
        demographics.pregnancyStatus === option.value &&
          styles.selectedPregnancyOption,
      ]}
      onPress={() =>
        setDemographics(prev => ({ ...prev, pregnancyStatus: option.value }))
      }
    >
      <View style={styles.pregnancyContent}>
        <Text
          style={[
            styles.pregnancyLabel,
            demographics.pregnancyStatus === option.value &&
              styles.selectedText,
          ]}
        >
          {option.label}
        </Text>
        {option.description && (
          <Text style={styles.pregnancyDescription}>{option.description}</Text>
        )}
      </View>
      {demographics.pregnancyStatus === option.value && (
        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Basic Information" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            This information helps us provide age-appropriate dosing and safety
            recommendations.
          </Text>
        </View>

        {/* Display Name (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Name (Optional)</Text>
          <TextInput
            style={styles.nameInput}
            value={demographics.displayName || ''}
            onChangeText={text =>
              setDemographics(prev => ({ ...prev, displayName: text }))
            }
            placeholder="How should we address you?"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={50}
          />
        </View>

        {/* Age Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age Range *</Text>
          <Text style={styles.sectionSubtitle}>
            Different age groups have different supplement needs and safety
            considerations
          </Text>
          <View style={styles.pickerContainer}>
            {/* Use Picker for compact dropdown UI */}
            {/* @ts-ignore: Picker import for cross-platform */}

            <Picker
              selectedValue={demographics.ageRange || ''}
              onValueChange={value =>
                setDemographics(prev => ({ ...prev, ageRange: value }))
              }
              style={styles.picker}
              accessibilityLabel="Select your age range"
            >
              <Picker.Item label="Select age range..." value="" />
              {ageRanges.map(option => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Biological Sex */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biological Sex *</Text>
          <Text style={styles.sectionSubtitle}>
            Used for dosing recommendations and hormone-related considerations
          </Text>
          <View style={styles.sexOptionsContainer}>
            {biologicalSexOptions.map(renderSexOption)}
          </View>
        </View>

        {/* Pregnancy Status (Female only) */}
        {showPregnancyOptions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pregnancy Status</Text>
            <Text style={styles.sectionSubtitle}>
              Critical for supplement safety during pregnancy and breastfeeding
            </Text>
            <View style={styles.pregnancyContainer}>
              {pregnancyOptions.map(renderPregnancyOption)}
            </View>
          </View>
        )}

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <MaterialIcons
            name="privacy-tip"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.privacyText}>
            Your information is encrypted and stored securely. We never share
            personal data.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!demographics.ageRange || !demographics.biologicalSex) &&
              styles.disabledButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={
            !demographics.ageRange || !demographics.biologicalSex || isLoading
          }
        >
          <Text
            style={[
              styles.saveButtonText,
              (!demographics.ageRange ||
                !demographics.biologicalSex ||
                isLoading) &&
                styles.disabledButtonText,
            ]}
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </Text>
          {!isLoading && (
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ✨ SLEEK: Clean, accessible styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginVertical: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  nameInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  selectedOption: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  selectedText: {
    color: COLORS.primary,
  },
  sexOptionsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sexOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  selectedSexOption: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  sexLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  pregnancyContainer: {
    gap: SPACING.sm,
  },
  pregnancyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  selectedPregnancyOption: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  pregnancyContent: {
    flex: 1,
  },
  pregnancyLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  pregnancyDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.xl,
  },
  privacyText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  disabledButton: {
    backgroundColor: COLORS.gray400,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  disabledButtonText: {
    color: COLORS.gray300,
  },
});
