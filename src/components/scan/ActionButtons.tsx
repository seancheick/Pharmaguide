// src/components/scan/ActionButtons.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface ActionButtonsProps {
  savedToStack: boolean;
  onScanAnother: () => void;
  onAddToStack: () => void;
  onTalkToAI: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  savedToStack,
  onScanAnother,
  onAddToStack,
  onTalkToAI,
}) => {
  return (
    <View style={styles.actions}>
      <Button
        title="Scan Another Product"
        onPress={onScanAnother}
        variant="primary"
        size="large"
        style={styles.scanAnotherButton}
        icon={<Ionicons name="scan" size={20} color={COLORS.background} />}
      />

      {/* Dual button design */}
      <View style={styles.dualButtonContainer}>
        <TouchableOpacity
          style={[
            styles.dualButton,
            styles.stackButton,
            savedToStack && styles.stackButtonSaved,
            styles.leftButton,
          ]}
          onPress={onAddToStack}
          disabled={savedToStack}
        >
          <Ionicons
            name={savedToStack ? 'checkmark-circle' : 'library-outline'}
            size={20}
            color={savedToStack ? COLORS.success : COLORS.background}
          />
          <Text
            style={[
              styles.dualButtonText,
              savedToStack && styles.stackButtonTextSaved,
            ]}
          >
            {savedToStack ? 'Added to Stack' : 'Add to Stack'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dualButton, styles.aiButton]}
          onPress={onTalkToAI}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={20}
            color={COLORS.background}
          />
          <Text style={styles.dualButtonText}>Talk to AI Pharmacist</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  scanAnotherButton: {
    marginBottom: SPACING.lg,
  },
  dualButtonContainer: {
    flexDirection: 'row',
  },
  dualButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    minHeight: 52,
  },
  leftButton: {
    marginRight: SPACING.sm / 2,
  },
  stackButton: {
    backgroundColor: COLORS.secondary,
  },
  stackButtonSaved: {
    backgroundColor: COLORS.success,
  },
  aiButton: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm / 2,
  },
  dualButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.xs,
    textAlign: 'center',
  },
  stackButtonTextSaved: {
    color: COLORS.background,
  },
});
