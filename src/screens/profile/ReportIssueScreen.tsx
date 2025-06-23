// src/screens/profile/ReportIssueScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { ReportIssueScreenProps } from '../../types/navigation';

interface IssueType {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const ReportIssueScreen: React.FC<ReportIssueScreenProps> = ({ navigation }) => {
  const [selectedIssueType, setSelectedIssueType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueTypes: IssueType[] = [
    {
      id: 'missing_product',
      title: 'Missing Product',
      description: 'Product not found in our database',
      icon: 'add-circle',
    },
    {
      id: 'incorrect_info',
      title: 'Incorrect Information',
      description: 'Wrong ingredients, dosage, or other details',
      icon: 'warning',
    },
    {
      id: 'missing_interactions',
      title: 'Missing Interactions',
      description: 'Known interactions not detected',
      icon: 'link',
    },
    {
      id: 'app_bug',
      title: 'App Bug',
      description: 'Technical issue or unexpected behavior',
      icon: 'bug',
    },
    {
      id: 'other',
      title: 'Other Issue',
      description: 'Something else not listed above',
      icon: 'help-circle',
    },
  ];

  const handleSubmit = async () => {
    if (!selectedIssueType || !description.trim()) {
      Alert.alert('Missing Information', 'Please select an issue type and provide a description.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Report Submitted',
        'Thank you for your report! We\'ll review it and get back to you within 24 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIssueType = (issueType: IssueType) => (
    <TouchableOpacity
      key={issueType.id}
      style={[
        styles.issueTypeCard,
        selectedIssueType === issueType.id && styles.selectedIssueType,
      ]}
      onPress={() => setSelectedIssueType(issueType.id)}
      activeOpacity={0.7}
    >
      <View style={styles.issueTypeHeader}>
        <View style={[
          styles.issueTypeIcon,
          { backgroundColor: selectedIssueType === issueType.id ? COLORS.primary : COLORS.gray200 }
        ]}>
          <Ionicons
            name={issueType.icon}
            size={20}
            color={selectedIssueType === issueType.id ? COLORS.white : COLORS.textSecondary}
          />
        </View>
        <View style={styles.issueTypeInfo}>
          <Text style={styles.issueTypeTitle}>{issueType.title}</Text>
          <Text style={styles.issueTypeDescription}>{issueType.description}</Text>
        </View>
        {selectedIssueType === issueType.id && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
        )}
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
        <Text style={styles.title}>Report an Issue</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Issue Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What type of issue are you reporting?</Text>
          <View style={styles.issueTypesContainer}>
            {issueTypes.map(renderIssueType)}
          </View>
        </View>

        {/* Product Name (if applicable) */}
        {(selectedIssueType === 'missing_product' || selectedIssueType === 'incorrect_info') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter the product name"
              value={productName}
              onChangeText={setProductName}
              autoCapitalize="words"
            />
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Please provide details about the issue..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedIssueType || !description.trim() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedIssueType || !description.trim() || isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Report</Text>
                <Ionicons name="send" size={18} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Guidelines */}
        <View style={styles.guidelines}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.guidelinesText}>
            Please provide as much detail as possible to help us resolve the issue quickly. 
            We typically respond within 24 hours.
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
  issueTypesContainer: {
    gap: SPACING.sm,
  },
  issueTypeCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIssueType: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  issueTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  issueTypeInfo: {
    flex: 1,
  },
  issueTypeTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  issueTypeDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  textArea: {
    height: 120,
  },
  submitSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  guidelines: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  guidelinesText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    lineHeight: 18,
  },
});
