// src/screens/submission/ProductSubmissionScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PhotoCaptureOverlay } from '../../components/ocr/PhotoCaptureOverlay';
import { CustomHeader } from '../../components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface ProductSubmissionData {
  productName: string;
  brand: string;
  category: string;
  barcode?: string;
  photos: {
    front?: string;
    back?: string;
    ingredients?: string;
    nutrition?: string;
  };
  manualIngredients: string;
  servingSize: string;
  servingsPerContainer: string;
  directions: string;
  warnings: string;
}

export const ProductSubmissionScreen: React.FC = () => {
  const navigation = useNavigation();
  const [submissionData, setSubmissionData] = useState<ProductSubmissionData>({
    productName: '',
    brand: '',
    category: 'supplement',
    photos: {},
    manualIngredients: '',
    servingSize: '',
    servingsPerContainer: '',
    directions: '',
    warnings: '',
  });

  const [currentPhotoType, setCurrentPhotoType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoCapture = (photoType: string) => {
    setCurrentPhotoType(photoType);
  };

  const handlePhotoTaken = (uri: string) => {
    if (currentPhotoType) {
      setSubmissionData(prev => ({
        ...prev,
        photos: {
          ...prev.photos,
          [currentPhotoType]: uri,
        },
      }));
    }
    setCurrentPhotoType(null);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!submissionData.productName.trim()) {
      Alert.alert('Missing Information', 'Product name is required.');
      return;
    }

    if (!submissionData.brand.trim()) {
      Alert.alert('Missing Information', 'Brand name is required.');
      return;
    }

    if (!submissionData.photos.front && !submissionData.photos.ingredients) {
      Alert.alert(
        'Missing Photos',
        'Please capture at least the front label or ingredients list.'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: Implement actual submission to backend
      console.log('📤 Submitting product data:', submissionData);

      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Submission Successful! 🎉',
        "Thank you for contributing to our database. Your submission will be reviewed and you'll earn points once approved!",
        [
          {
            text: 'Continue',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Submission failed:', error);
      Alert.alert('Submission Failed', 'Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPhotoStatus = (photoType: string) => {
    return submissionData.photos[
      photoType as keyof typeof submissionData.photos
    ]
      ? '✅'
      : '📷';
  };

  if (currentPhotoType) {
    return (
      <PhotoCaptureOverlay
        captureType={currentPhotoType as any}
        onPhotoTaken={handlePhotoTaken}
        onClose={() => setCurrentPhotoType(null)}
        title={`Capture ${currentPhotoType.replace('_', ' ')}`}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Submit Product" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            Help expand our database! Submit products not found during scanning.
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={submissionData.productName}
              onChangeText={text =>
                setSubmissionData(prev => ({ ...prev, productName: text }))
              }
              placeholder="e.g., Vitamin D3 1000 IU"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brand *</Text>
            <TextInput
              style={styles.input}
              value={submissionData.brand}
              onChangeText={text =>
                setSubmissionData(prev => ({ ...prev, brand: text }))
              }
              placeholder="e.g., Nature Made"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barcode (if visible)</Text>
            <TextInput
              style={styles.input}
              value={submissionData.barcode}
              onChangeText={text =>
                setSubmissionData(prev => ({ ...prev, barcode: text }))
              }
              placeholder="e.g., 123456789012"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Photo Capture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Photos</Text>
          <Text style={styles.sectionSubtitle}>
            Capture clear photos for better analysis
          </Text>

          <View style={styles.photoGrid}>
            {[
              { key: 'front', label: 'Front Label', required: true },
              { key: 'back', label: 'Back Label', required: false },
              { key: 'ingredients', label: 'Ingredients', required: true },
              { key: 'nutrition', label: 'Nutrition Facts', required: false },
            ].map(photo => (
              <TouchableOpacity
                key={photo.key}
                style={styles.photoButton}
                onPress={() => handlePhotoCapture(photo.key)}
              >
                <Text style={styles.photoIcon}>
                  {getPhotoStatus(photo.key)}
                </Text>
                <Text style={styles.photoLabel}>{photo.label}</Text>
                {photo.required && <Text style={styles.requiredMark}>*</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Manual Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ingredients (if photos unclear)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={submissionData.manualIngredients}
              onChangeText={text =>
                setSubmissionData(prev => ({
                  ...prev,
                  manualIngredients: text,
                }))
              }
              placeholder="List ingredients and amounts..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Serving Size</Text>
              <TextInput
                style={styles.input}
                value={submissionData.servingSize}
                onChangeText={text =>
                  setSubmissionData(prev => ({ ...prev, servingSize: text }))
                }
                placeholder="e.g., 1 capsule"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Servings Per Container</Text>
              <TextInput
                style={styles.input}
                value={submissionData.servingsPerContainer}
                onChangeText={text =>
                  setSubmissionData(prev => ({
                    ...prev,
                    servingsPerContainer: text,
                  }))
                }
                placeholder="e.g., 60"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Rewards Info */}
        <View style={styles.rewardsSection}>
          <MaterialIcons name="stars" size={24} color={COLORS.warning} />
          <View style={styles.rewardsText}>
            <Text style={styles.rewardsTitle}>Earn Rewards!</Text>
            <Text style={styles.rewardsDescription}>
              Get 50 points for approved submissions + bonus achievements
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Product'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: 8,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    marginLeft: SPACING.sm,
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
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  photoButton: {
    width: '48%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  photoIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  photoLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  requiredMark: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  rewardsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.xl,
  },
  rewardsText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  rewardsTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.warning,
  },
  rewardsDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.warning,
  },
  bottomActions: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
