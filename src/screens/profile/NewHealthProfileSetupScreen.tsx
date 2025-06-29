// src/screens/profile/NewHealthProfileSetupScreen.tsx
// Brand new 2-step health profile setup system

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { newHealthProfileService } from '../../services/newHealthProfileService';
import type {
  NewHealthProfile,
  PrivacyConsent,
  Demographics,
  HealthGoal,
  HealthCondition,
  Allergy,
} from '../../types/newHealthProfile';
import {
  AGE_RANGES,
  BIOLOGICAL_SEX_OPTIONS,
  COMMON_HEALTH_GOALS,
  COMMON_HEALTH_CONDITIONS,
  COMMON_ALLERGIES,
} from '../../types/newHealthProfile';
import { ChoiceChip } from '../../components/profile/ChoiceChip';
import { OptimizedIcon } from '../../components/common/OptimizedIcon';

type SetupStep = 'privacy' | 'health-info' | 'complete';

export const NewHealthProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // State
  const [currentStep, setCurrentStep] = useState<SetupStep>('privacy');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Step 1: Privacy & Consent
  const [privacyConsent, setPrivacyConsent] = useState<PrivacyConsent>({
    dataStorage: false,
    aiAnalysis: false,
    anonymousAnalytics: false,
    consentTimestamp: '',
  });
  
  // Step 2: Health Information
  const [demographics, setDemographics] = useState<Demographics>({
    ageRange: '',
    biologicalSex: '',
    displayName: '',
  });
  const [selectedHealthGoals, setSelectedHealthGoals] = useState<HealthGoal[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<HealthCondition[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<Allergy[]>([]);

  // Step 1: Privacy Consent Step
  const handlePrivacyNext = useCallback(async () => {
    if (!privacyConsent.dataStorage) {
      Alert.alert(
        'Privacy Consent Required',
        'Please agree to data storage to continue with your health profile setup.'
      );
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    try {
      setLoading(true);
      
      const consent: PrivacyConsent = {
        ...privacyConsent,
        consentTimestamp: new Date().toISOString(),
      };
      
      await newHealthProfileService.updatePrivacyConsent(user.id, consent);
      setCurrentStep('health-info');
    } catch (error) {
      console.error('Failed to save privacy consent:', error);
      Alert.alert('Error', 'Failed to save privacy consent. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [privacyConsent, user?.id]);

  // Step 2: Health Information Step
  const handleHealthInfoNext = useCallback(async () => {
    if (!demographics.ageRange || !demographics.biologicalSex) {
      Alert.alert('Required Information', 'Please select your age range and biological sex.');
      return;
    }

    if (selectedHealthGoals.length > 2) {
      Alert.alert('Too Many Goals', 'Please select a maximum of 2 health goals.');
      return;
    }

    if (!user?.id) return;

    try {
      setLoading(true);
      
      await newHealthProfileService.updateHealthInformation(user.id, {
        demographics: {
          ...demographics,
          displayName: demographics.displayName || user.email?.split('@')[0] || 'User',
        },
        healthGoals: selectedHealthGoals,
        healthConditions: selectedConditions,
        allergies: selectedAllergies,
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to save health information:', error);
      Alert.alert('Error', 'Failed to save health information. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [demographics, selectedHealthGoals, selectedConditions, selectedAllergies, user]);

  // Health Goal Selection
  const toggleHealthGoal = useCallback((goal: HealthGoal) => {
    setSelectedHealthGoals(prev => {
      if (goal.id === 'none') {
        return [goal];
      }
      
      const withoutNone = prev.filter(g => g.id !== 'none');
      const isSelected = withoutNone.find(g => g.id === goal.id);
      
      if (isSelected) {
        return withoutNone.filter(g => g.id !== goal.id);
      } else if (withoutNone.length < 2) {
        return [...withoutNone, goal];
      } else {
        Alert.alert('Maximum Reached', 'You can select up to 2 health goals.');
        return prev;
      }
    });
  }, []);

  // Health Condition Selection
  const toggleHealthCondition = useCallback((condition: HealthCondition) => {
    setSelectedConditions(prev => {
      if (condition.id === 'none') {
        return [condition];
      }
      
      const withoutNone = prev.filter(c => c.id !== 'none');
      const isSelected = withoutNone.find(c => c.id === condition.id);
      
      if (isSelected) {
        return withoutNone.filter(c => c.id !== condition.id);
      } else {
        return [...withoutNone, condition];
      }
    });
  }, []);

  // Allergy Selection
  const toggleAllergy = useCallback((allergy: Allergy) => {
    setSelectedAllergies(prev => {
      if (allergy.id === 'none') {
        return [allergy];
      }
      
      const withoutNone = prev.filter(a => a.id !== 'none');
      const isSelected = withoutNone.find(a => a.id === allergy.id);
      
      if (isSelected) {
        return withoutNone.filter(a => a.id !== allergy.id);
      } else {
        return [...withoutNone, allergy];
      }
    });
  }, []);

  // Success Modal Actions
  const handleGoToStack = useCallback(() => {
    setShowSuccessModal(false);
    // Navigate to MainTabs with Stack tab selected
    navigation.navigate('MainTabs', {
      screen: 'Stack',
    } as never);
  }, [navigation]);

  const handleGoHome = useCallback(() => {
    setShowSuccessModal(false);
    // Navigate to MainTabs with Home tab selected
    navigation.navigate('MainTabs', {
      screen: 'Home',
    } as never);
  }, [navigation]);

  // Render Step 1: Privacy & Consent
  const renderPrivacyStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <OptimizedIcon name="shield-checkmark" size={48} color={COLORS.primary} />
        <Text style={styles.stepTitle}>Privacy & Data Consent</Text>
        <Text style={styles.stepSubtitle}>
          Your health data is private and secure. Please review our data practices.
        </Text>
      </View>

      <View style={styles.consentSection}>
        <View style={styles.consentItem}>
          <View style={styles.consentContent}>
            <Text style={styles.consentTitle}>Local Data Storage</Text>
            <Text style={styles.consentDescription}>
              Store your health profile securely on your device with encryption. Required for app functionality.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.checkbox,
              privacyConsent.dataStorage && styles.checkboxChecked,
            ]}
            onPress={() =>
              setPrivacyConsent(prev => ({ ...prev, dataStorage: !prev.dataStorage }))
            }
          >
            {privacyConsent.dataStorage && (
              <OptimizedIcon name="checkmark" size={16} color={COLORS.surface} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.consentItem}>
          <View style={styles.consentContent}>
            <Text style={styles.consentTitle}>AI-Powered Analysis</Text>
            <Text style={styles.consentDescription}>
              Allow AI analysis for personalized supplement recommendations. Optional.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.checkbox,
              privacyConsent.aiAnalysis && styles.checkboxChecked,
            ]}
            onPress={() =>
              setPrivacyConsent(prev => ({ ...prev, aiAnalysis: !prev.aiAnalysis }))
            }
          >
            {privacyConsent.aiAnalysis && (
              <OptimizedIcon name="checkmark" size={16} color={COLORS.surface} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.consentItem}>
          <View style={styles.consentContent}>
            <Text style={styles.consentTitle}>Anonymous Analytics</Text>
            <Text style={styles.consentDescription}>
              Help improve the app with anonymous usage data. No personal information shared.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.checkbox,
              privacyConsent.anonymousAnalytics && styles.checkboxChecked,
            ]}
            onPress={() =>
              setPrivacyConsent(prev => ({ ...prev, anonymousAnalytics: !prev.anonymousAnalytics }))
            }
          >
            {privacyConsent.anonymousAnalytics && (
              <OptimizedIcon name="checkmark" size={16} color={COLORS.surface} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton,
          !privacyConsent.dataStorage && styles.nextButtonDisabled,
        ]}
        onPress={handlePrivacyNext}
        disabled={!privacyConsent.dataStorage || loading}
      >
        <Text style={[
          styles.nextButtonText,
          !privacyConsent.dataStorage && styles.nextButtonTextDisabled,
        ]}>
          {loading ? 'Saving...' : 'Continue'}
        </Text>
        <OptimizedIcon 
          name="chevron-up" 
          size={20} 
          color={!privacyConsent.dataStorage ? COLORS.textSecondary : COLORS.surface} 
        />
      </TouchableOpacity>
    </ScrollView>
  );

  // Render Step 2: Health Information
  const renderHealthInfoStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <OptimizedIcon name="person" size={48} color={COLORS.primary} />
        <Text style={styles.stepTitle}>Health Information</Text>
        <Text style={styles.stepSubtitle}>
          Tell us about yourself to get personalized recommendations.
        </Text>
      </View>

      {/* Demographics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demographics</Text>
        
        <Text style={styles.fieldLabel}>What would you like me to call you? (optional)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your preferred name"
            placeholderTextColor={COLORS.textSecondary}
            value={demographics.displayName || ''}
            onChangeText={(text) => setDemographics(prev => ({ ...prev, displayName: text.trim() }))}
            returnKeyType="next"
            maxLength={50}
          />
        </View>
        
        <Text style={styles.fieldLabel}>Age Range *</Text>
        <View style={styles.chipContainer}>
          {AGE_RANGES.map(range => (
            <ChoiceChip
              key={range.id}
              label={range.label}
              selected={demographics.ageRange === range.id}
              onPress={() => setDemographics(prev => ({ ...prev, ageRange: range.id }))}
            />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Biological Sex *</Text>
        <View style={styles.chipContainer}>
          {BIOLOGICAL_SEX_OPTIONS.map(option => (
            <ChoiceChip
              key={option.id}
              label={option.label}
              selected={demographics.biologicalSex === option.id}
              onPress={() => setDemographics(prev => ({ ...prev, biologicalSex: option.id }))}
            />
          ))}
        </View>
      </View>

      {/* Health Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Goals</Text>
        <Text style={styles.sectionSubtitle}>Choose up to 2 goals (optional)</Text>
        <View style={styles.chipContainer}>
          {COMMON_HEALTH_GOALS.map(goal => (
            <ChoiceChip
              key={goal.id}
              label={goal.name}
              selected={selectedHealthGoals.some(g => g.id === goal.id)}
              onPress={() => toggleHealthGoal(goal)}
              variant={goal.id === 'none' ? 'default' : 'primary'}
            />
          ))}
        </View>
      </View>

      {/* Health Conditions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Conditions</Text>
        <Text style={styles.sectionSubtitle}>Select any that apply (optional)</Text>
        <View style={styles.chipContainer}>
          {COMMON_HEALTH_CONDITIONS.map(condition => (
            <ChoiceChip
              key={condition.id}
              label={condition.name}
              selected={selectedConditions.some(c => c.id === condition.id)}
              onPress={() => toggleHealthCondition(condition)}
              variant={condition.id === 'none' ? 'default' : 'primary'}
            />
          ))}
        </View>
      </View>

      {/* Allergies */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergies & Sensitivities</Text>
        <Text style={styles.sectionSubtitle}>Select any that apply (optional)</Text>
        <View style={styles.chipContainer}>
          {COMMON_ALLERGIES.map(allergy => (
            <ChoiceChip
              key={allergy.id}
              label={allergy.name}
              selected={selectedAllergies.some(a => a.id === allergy.id)}
              onPress={() => toggleAllergy(allergy)}
              variant={allergy.id === 'none' ? 'default' : 'danger'}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton,
          (!demographics.ageRange || !demographics.biologicalSex) && styles.nextButtonDisabled,
        ]}
        onPress={handleHealthInfoNext}
        disabled={!demographics.ageRange || !demographics.biologicalSex || loading}
      >
        <Text style={[
          styles.nextButtonText,
          (!demographics.ageRange || !demographics.biologicalSex) && styles.nextButtonTextDisabled,
        ]}>
          {loading ? 'Saving...' : 'Complete Profile'}
        </Text>
        <OptimizedIcon 
          name="checkmark" 
          size={20} 
          color={(!demographics.ageRange || !demographics.biologicalSex) ? COLORS.textSecondary : COLORS.surface} 
        />
      </TouchableOpacity>
    </ScrollView>
  );

  // Success Modal
  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <OptimizedIcon name="checkmark" size={64} color={COLORS.success} />
            <Text style={styles.modalTitle}>Profile Complete!</Text>
            <Text style={styles.modalSubtitle}>
              Your health profile has been saved securely. Ready to start building your supplement stack?
            </Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoToStack}>
              <Text style={styles.primaryButtonText}>Add Your First Supplement</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
              <Text style={styles.secondaryButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: currentStep === 'privacy' ? '50%' : '100%' },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep === 'privacy' ? '1' : '2'} of 2
        </Text>
      </View>

      {/* Content */}
      {currentStep === 'privacy' && renderPrivacyStep()}
      {currentStep === 'health-info' && renderHealthInfoStep()}
      
      {/* Success Modal */}
      {renderSuccessModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: SPACING.sm,
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
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  consentSection: {
    marginBottom: SPACING.xl,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  consentContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  consentTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  consentDescription: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
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
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.xl,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  nextButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.surface,
    marginRight: SPACING.sm,
  },
  nextButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalActions: {
    gap: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.surface,
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
});