// src/components/barcode/ManualBarcodeEntry.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { OptimizedIcon } from '../common/OptimizedIcon';

interface ManualBarcodeEntryProps {
  onBarcodeEntered: (barcode: string) => void;
  onClose: () => void;
  title?: string;
  placeholder?: string;
}

export const ManualBarcodeEntry: React.FC<ManualBarcodeEntryProps> = ({
  onBarcodeEntered,
  onClose,
  title = 'Enter Barcode',
  placeholder = 'Enter barcode number',
}) => {
  const [barcode, setBarcode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    // Auto-focus the input when component mounts
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const validateBarcode = (code: string): boolean => {
    // Remove any spaces or dashes
    const cleanCode = code.replace(/[\s-]/g, '');

    // Check if it's a valid length for common barcode formats
    const validLengths = [8, 12, 13, 14]; // EAN-8, UPC-A, EAN-13, ITF-14

    if (!validLengths.includes(cleanCode.length)) {
      return false;
    }

    // Check if it contains only digits
    if (!/^\d+$/.test(cleanCode)) {
      return false;
    }

    // Basic checksum validation for EAN-13/UPC-A
    if (cleanCode.length === 13 || cleanCode.length === 12) {
      return validateEANChecksum(cleanCode);
    }

    return true;
  };

  const validateEANChecksum = (code: string): boolean => {
    try {
      const digits = code.split('').map(Number);
      let sum = 0;

      for (let i = 0; i < digits.length - 1; i++) {
        sum += digits[i] * (i % 2 === 0 ? 1 : 3);
      }

      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === digits[digits.length - 1];
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    const cleanBarcode = barcode.replace(/[\s-]/g, '');

    if (!cleanBarcode) {
      Alert.alert('Invalid Input', 'Please enter a barcode number.');
      return;
    }

    if (cleanBarcode.length < 8) {
      Alert.alert('Invalid Barcode', 'Barcode must be at least 8 digits long.');
      return;
    }

    setIsValidating(true);

    // Validate barcode format
    if (!validateBarcode(cleanBarcode)) {
      Alert.alert(
        'Invalid Barcode',
        'The barcode format appears to be invalid. Do you want to search anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Search Anyway',
            onPress: () => {
              setIsValidating(false);
              onBarcodeEntered(cleanBarcode);
            },
          },
        ]
      );
      setIsValidating(false);
      return;
    }

    // Valid barcode
    setTimeout(() => {
      setIsValidating(false);
      onBarcodeEntered(cleanBarcode);
    }, 500);
  };

  const formatBarcodeInput = (text: string) => {
    // Remove non-digits and limit length
    const cleaned = text.replace(/\D/g, '').slice(0, 14);

    // Add formatting for readability (spaces every 4 digits)
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');

    setBarcode(formatted);
  };

  const getHelpText = () => {
    const length = barcode.replace(/\D/g, '').length;

    if (length === 0) {
      return 'Enter the barcode number found on the product package';
    } else if (length < 8) {
      return `Need at least ${8 - length} more digits`;
    } else if (length >= 8 && length <= 14) {
      return '✓ Valid length - tap Submit to search';
    } else {
      return 'Barcode too long - maximum 14 digits';
    }
  };

  const getHelpColor = () => {
    const length = barcode.replace(/\D/g, '').length;

    if (length === 0) return COLORS.textSecondary;
    if (length < 8) return COLORS.warning;
    if (length >= 8 && length <= 14) return COLORS.success;
    return COLORS.error;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <OptimizedIcon
              type="ion"
              name="close"
              size={24}
              color={COLORS.textPrimary}
              accessibilityLabel="Close"
            />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <OptimizedIcon
              type="material"
              name="keyboard"
              size={48}
              color={COLORS.primary}
              accessibilityLabel="Keyboard"
            />
          </View>

          <Text style={styles.subtitle}>
            Cannot scan the barcode? Enter it manually below.
          </Text>

          {/* Input Section */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <OptimizedIcon
                type="ion"
                name="barcode-outline"
                size={20}
                color={COLORS.textSecondary}
                style={styles.inputIcon}
                accessibilityLabel="Barcode"
              />
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={barcode}
                onChangeText={formatBarcodeInput}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                maxLength={17} // 14 digits + 3 spaces
                autoCorrect={false}
                autoCapitalize="none"
              />
              {barcode.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setBarcode('')}
                >
                  <OptimizedIcon
                    type="ion"
                    name="close-circle"
                    size={20}
                    color={COLORS.textSecondary}
                    accessibilityLabel="Clear input"
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.helpText, { color: getHelpColor() }]}>
              {getHelpText()}
            </Text>
          </View>

          {/* Common Barcode Examples */}
          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>Common Formats:</Text>
            <View style={styles.examplesList}>
              <View style={styles.exampleItem}>
                <Text style={styles.exampleFormat}>UPC-A:</Text>
                <Text style={styles.exampleCode}>123456789012</Text>
              </View>
              <View style={styles.exampleItem}>
                <Text style={styles.exampleFormat}>EAN-13:</Text>
                <Text style={styles.exampleCode}>1234567890123</Text>
              </View>
              <View style={styles.exampleItem}>
                <Text style={styles.exampleFormat}>EAN-8:</Text>
                <Text style={styles.exampleCode}>12345678</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (barcode.replace(/\D/g, '').length < 8 || isValidating) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={barcode.replace(/\D/g, '').length < 8 || isValidating}
          >
            {isValidating ? (
              <Text style={styles.submitButtonText}>Validating...</Text>
            ) : (
              <>
                <OptimizedIcon
                  type="ion"
                  name="search"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.submitButtonText}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
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
  closeButton: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  helpText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  examplesContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
  },
  examplesTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  examplesList: {
    gap: SPACING.xs,
  },
  exampleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exampleFormat: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  exampleCode: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
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
