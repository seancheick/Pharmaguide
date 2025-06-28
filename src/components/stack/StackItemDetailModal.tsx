// src/components/stack/StackItemDetailModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OptimizedIcon } from '../common/OptimizedIcon';
import { ValidatedInput } from '../common/ValidatedInput';
import { OptimizedImage } from '../common/OptimizedImage';
import { useFormValidation } from '../../hooks/useFormValidation';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { UserStack } from '../../types';

interface StackItemDetailModalProps {
  visible: boolean;
  item: UserStack | null;
  onClose: () => void;
  onUpdate: (itemId: string, updates: Partial<UserStack>) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}

export const StackItemDetailModal: React.FC<StackItemDetailModalProps> = ({
  visible,
  item,
  onClose,
  onUpdate,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itemType, setItemType] = useState<'supplement' | 'medication'>(
    'supplement'
  );

  // Form validation for editing
  const { getFieldProps, validateForm, resetForm, fields } = useFormValidation(
    {
      name: {
        validator: 'text',
        options: { required: true, maxLength: 200 },
        validateOnBlur: true,
        sanitize: true,
      },
      brand: {
        validator: 'text',
        options: { maxLength: 100 },
        validateOnBlur: true,
        sanitize: true,
      },
      dosage: {
        validator: 'dosage',
        validateOnBlur: true,
        sanitize: true,
      },
      frequency: {
        validator: 'frequency',
        validateOnBlur: true,
        sanitize: true,
      },
    },
    {
      name: item?.name || '',
      brand: item?.brand || '',
      dosage: item?.dosage || '',
      frequency: item?.frequency || '',
    }
  );

  // Reset form and type when item changes
  React.useEffect(() => {
    if (item && item.id) {
      setItemType(item.type);
      // Don't call resetForm here to avoid infinite loops
      // The form will be initialized with the correct values from the hook
    }
  }, [item?.id]); // Only depend on item.id to prevent infinite loops

  const handleSave = async () => {
    if (!item) return;

    // Validate form
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        name: fields.name.value,
        brand: fields.brand.value,
        dosage: fields.dosage.value,
        frequency: fields.frequency.value,
        type: itemType, // Use the state variable
      };

      await onUpdate(item.id, updates);
      setIsEditing(false);
      Alert.alert('Success', 'Item updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!item) return;

    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove "${item.name}" from your stack?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              console.log('Removing item:', item.id);
              await onRemove(item.id);
              onClose();
              // Don't show success alert here - let the parent handle it
            } catch (error: any) {
              console.error('Remove error:', error);
              Alert.alert('Error', error.message || 'Failed to remove item');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (item) {
      setItemType(item.type);
      // Reset form to original values
      resetForm();
    }
  };

  if (!item) return null;

  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <OptimizedIcon
              type="material"
              name="arrow-back"
              size={28}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <TouchableOpacity
            onPress={isEditing ? handleSave : () => setIsEditing(true)}
            style={styles.actionButton}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Item Image */}
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <OptimizedImage
                source={{ uri: item.imageUrl }}
                style={styles.itemImage}
                priority="high"
                contentFit="contain"
                fallbackIcon="cube-outline"
                fallbackIconSize={48}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <OptimizedIcon
                  type="ion"
                  name="cube-outline"
                  size={48}
                  color={COLORS.gray400}
                />
              </View>
            )}
          </View>

          {/* Item Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            {isEditing ? (
              <ValidatedInput
                label="Name"
                placeholder="Item name"
                validationType="text"
                required
                maxLength={200}
                editable={!loading}
                {...getFieldProps('name')}
              />
            ) : (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Name</Text>
                <Text style={styles.fieldValue}>{item.name}</Text>
              </View>
            )}

            {isEditing ? (
              <ValidatedInput
                label="Brand"
                placeholder="Brand name"
                validationType="text"
                maxLength={100}
                editable={!loading}
                {...getFieldProps('brand')}
              />
            ) : (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Brand</Text>
                <Text style={styles.fieldValue}>
                  {item.brand || 'Not specified'}
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Type</Text>
              {isEditing ? (
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      itemType === 'supplement' && styles.typeOptionSelected,
                    ]}
                    onPress={() => setItemType('supplement')}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        itemType === 'supplement' &&
                          styles.typeOptionTextSelected,
                      ]}
                    >
                      Supplement
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      itemType === 'medication' && styles.typeOptionSelected,
                    ]}
                    onPress={() => setItemType('medication')}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        itemType === 'medication' &&
                          styles.typeOptionTextSelected,
                      ]}
                    >
                      Medication
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.fieldValue}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              )}
            </View>
          </View>

          {/* Dosage Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dosage Information</Text>

            {isEditing ? (
              <ValidatedInput
                label="Dosage"
                placeholder="e.g., 500mg, 1 tablet"
                validationType="text"
                required
                maxLength={100}
                editable={!loading}
                {...getFieldProps('dosage')}
              />
            ) : (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Dosage</Text>
                <Text style={styles.fieldValue}>{item.dosage}</Text>
              </View>
            )}

            {isEditing ? (
              <ValidatedInput
                label="Frequency"
                placeholder="e.g., Once daily, Twice daily"
                validationType="text"
                required
                maxLength={100}
                editable={!loading}
                {...getFieldProps('frequency')}
              />
            ) : (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Frequency</Text>
                <Text style={styles.fieldValue}>{item.frequency}</Text>
              </View>
            )}
          </View>

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {item.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  {ingredient.amount && ingredient.unit && (
                    <Text style={styles.ingredientAmount}>
                      {ingredient.amount}
                      {ingredient.unit}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Cancel Button for Edit Mode */}
          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Fixed Footer with Remove Button */}
        {!isEditing && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.xl }] }>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemove}
              disabled={loading}
            >
              <OptimizedIcon
                type="material"
                name="delete"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.removeButtonText}>Remove from Stack</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
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
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
    marginLeft: -SPACING.xs, // Align with edge
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, // Temporary debug border
    borderColor: COLORS.primary, // Temporary debug border
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  scrollContent: {
    paddingBottom: SPACING.md, // Reduced since footer is now fixed
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl, // Extra bottom padding for safe area
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  itemImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  field: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  fieldValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  typeOptionTextSelected: {
    color: COLORS.white,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ingredientName: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    flex: 1,
  },
  ingredientAmount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  removeButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.white,
  },
  editActions: {
    gap: SPACING.md,
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
});
