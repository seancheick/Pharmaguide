// src/screens/profile/AllergiesScreen.tsx
// 🚀 WORLD-CLASS: Allergies & Sensitivities Selection Screen
import React, { useState } from 'react';
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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { AllergiesScreenProps } from '../../types/navigation';

interface Allergy {
  id: string;
  name: string;
  category: 'food' | 'environmental' | 'medication' | 'supplement';
  severity: 'mild' | 'moderate' | 'severe';
  icon: keyof typeof MaterialIcons.glyphMap;
}

const COMMON_ALLERGIES: Allergy[] = [
  // Food Allergies
  {
    id: 'shellfish',
    name: 'Shellfish',
    category: 'food',
    severity: 'severe',
    icon: 'set-meal',
  },
  {
    id: 'nuts',
    name: 'Tree Nuts',
    category: 'food',
    severity: 'severe',
    icon: 'eco',
  },
  {
    id: 'peanuts',
    name: 'Peanuts',
    category: 'food',
    severity: 'severe',
    icon: 'eco',
  },
  {
    id: 'dairy',
    name: 'Dairy/Lactose',
    category: 'food',
    severity: 'moderate',
    icon: 'local-drink',
  },
  {
    id: 'gluten',
    name: 'Gluten',
    category: 'food',
    severity: 'moderate',
    icon: 'grain',
  },
  {
    id: 'soy',
    name: 'Soy',
    category: 'food',
    severity: 'moderate',
    icon: 'eco',
  },
  {
    id: 'eggs',
    name: 'Eggs',
    category: 'food',
    severity: 'moderate',
    icon: 'egg',
  },

  // Medication Allergies
  {
    id: 'penicillin',
    name: 'Penicillin',
    category: 'medication',
    severity: 'severe',
    icon: 'medication',
  },
  {
    id: 'aspirin',
    name: 'Aspirin/NSAIDs',
    category: 'medication',
    severity: 'moderate',
    icon: 'medication',
  },
  {
    id: 'sulfa',
    name: 'Sulfa Drugs',
    category: 'medication',
    severity: 'moderate',
    icon: 'medication',
  },

  // Supplement Ingredients
  {
    id: 'gelatin',
    name: 'Gelatin',
    category: 'supplement',
    severity: 'mild',
    icon: 'science',
  },
  {
    id: 'artificial_colors',
    name: 'Artificial Colors',
    category: 'supplement',
    severity: 'mild',
    icon: 'palette',
  },
  {
    id: 'titanium_dioxide',
    name: 'Titanium Dioxide',
    category: 'supplement',
    severity: 'mild',
    icon: 'science',
  },

  // Environmental
  {
    id: 'latex',
    name: 'Latex',
    category: 'environmental',
    severity: 'moderate',
    icon: 'healing',
  },
];

const SEVERITY_COLORS = {
  mild: COLORS.warning,
  moderate: COLORS.error,
  severe: '#D32F2F',
};

export const AllergiesScreen: React.FC<AllergiesScreenProps> = ({
  navigation,
}) => {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);

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

        // Advance to next step (this is the final step, so no advancement needed)
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

  const handleAllergyToggle = (allergyId: string) => {
    setSelectedAllergies(prev => {
      if (prev.includes(allergyId)) {
        return prev.filter(id => id !== allergyId);
      } else {
        return [...prev, allergyId];
      }
    });
  };

  const handleAddCustomAllergy = () => {
    if (
      customAllergy.trim() &&
      !customAllergies.includes(customAllergy.trim())
    ) {
      setCustomAllergies(prev => [...prev, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const handleRemoveCustomAllergy = (allergy: string) => {
    setCustomAllergies(prev => prev.filter(a => a !== allergy));
  };

  const handleSave = async () => {
    const allAllergies = [...selectedAllergies, ...customAllergies];

    try {
      // TODO: Save to profile service
      console.log('Saving allergies:', allAllergies);

      // Mark allergies step as complete (final step)
      await markStepComplete('allergies');

      // No success popup here - the HealthProfileSetupScreen will show the final completion popup
      navigation.goBack();
    } catch (error) {
      console.error('Error saving allergies:', error);
      Alert.alert('Error', 'Failed to save allergies. Please try again.');
    }
  };

  const renderAllergyCard = (allergy: Allergy) => {
    const isSelected = selectedAllergies.includes(allergy.id);
    const severityColor = SEVERITY_COLORS[allergy.severity];

    return (
      <TouchableOpacity
        key={allergy.id}
        style={[styles.allergyCard, isSelected && styles.selectedAllergyCard]}
        onPress={() => handleAllergyToggle(allergy.id)}
        activeOpacity={0.7}
      >
        <View style={styles.allergyHeader}>
          <View
            style={[
              styles.allergyIconContainer,
              isSelected && styles.selectedIconContainer,
            ]}
          >
            <MaterialIcons
              name={allergy.icon}
              size={20}
              color={isSelected ? COLORS.white : severityColor}
            />
          </View>
          <View style={styles.allergyInfo}>
            <Text
              style={[
                styles.allergyName,
                isSelected && styles.selectedAllergyName,
              ]}
            >
              {allergy.name}
            </Text>
            <View style={styles.severityContainer}>
              <View
                style={[styles.severityDot, { backgroundColor: severityColor }]}
              />
              <Text
                style={[
                  styles.severityText,
                  isSelected && styles.selectedSeverityText,
                ]}
              >
                {allergy.severity.charAt(0).toUpperCase() +
                  allergy.severity.slice(1)}
              </Text>
            </View>
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={COLORS.success}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const groupedAllergies = COMMON_ALLERGIES.reduce(
    (acc, allergy) => {
      if (!acc[allergy.category]) {
        acc[allergy.category] = [];
      }
      acc[allergy.category].push(allergy);
      return acc;
    },
    {} as Record<string, Allergy[]>
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
        <Text style={styles.title}>Allergies</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="warning" size={32} color={COLORS.error} />
          <Text style={styles.instructionsTitle}>
            Allergies & Sensitivities
          </Text>
          <Text style={styles.instructionsText}>
            Select any allergies or sensitivities you have. This is critical for
            your safety and helps us avoid recommending harmful supplements.
          </Text>
          <View style={styles.criticalNote}>
            <Ionicons name="alert-circle" size={16} color={COLORS.error} />
            <Text style={styles.criticalText}>
              Critical safety information - please be thorough
            </Text>
          </View>
        </View>

        {/* Grouped Allergies */}
        {Object.entries(groupedAllergies).map(([category, allergies]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {category.charAt(0).toUpperCase() + category.slice(1)} Allergies
            </Text>
            <View style={styles.allergiesGrid}>
              {allergies.map(renderAllergyCard)}
            </View>
          </View>
        ))}

        {/* Custom Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Custom Allergy</Text>
          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              placeholder="Enter allergy or sensitivity..."
              value={customAllergy}
              onChangeText={setCustomAllergy}
              onSubmitEditing={handleAddCustomAllergy}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCustomAllergy}
              disabled={!customAllergy.trim()}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Custom Allergies List */}
          {customAllergies.map((allergy, index) => (
            <View key={index} style={styles.customAllergyItem}>
              <Text style={styles.customAllergyText}>{allergy}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveCustomAllergy(allergy)}
                style={styles.removeButton}
              >
                <Ionicons name="close" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Allergies</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
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
  criticalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  criticalText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.semibold,
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
  allergiesGrid: {
    gap: SPACING.sm,
  },
  allergyCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  selectedAllergyCard: {
    backgroundColor: COLORS.errorLight,
    borderColor: COLORS.error,
  },
  allergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  allergyIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconContainer: {
    backgroundColor: COLORS.error,
  },
  allergyInfo: {
    flex: 1,
  },
  allergyName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  selectedAllergyName: {
    color: COLORS.error,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  selectedSeverityText: {
    color: COLORS.error + 'CC',
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
  customAllergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  customAllergyText: {
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
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});
