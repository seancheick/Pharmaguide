// src/examples/EnhancedAccessibilityExample.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  EnhancedInteractionWarning,
  EnhancedProductAnalysisCard,
  EnhancedStackSummary 
} from '../components/accessibility/EnhancedAccessibleComponents';
import { useVoiceNavigation, useAccessibility } from '../hooks';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { OptimizedIcon } from '../components/common/OptimizedIcon';

/**
 * Enhanced Accessibility Example Screen
 * Demonstrates the new accessibility features including:
 * - Enhanced screen reader support for complex UI
 * - Voice navigation integration
 * - Semantic descriptions for interactions
 */
export const EnhancedAccessibilityExample: React.FC = () => {
  const navigation = useNavigation();
  const { isScreenReaderEnabled, announceForScreenReader } = useAccessibility();
  
  // Voice navigation with custom commands
  const {
    isSupported: voiceSupported,
    isListening,
    startListening,
    stopListening,
    registerCommand,
    speak,
  } = useVoiceNavigation({
    enableAutoStart: false,
    customCommands: [
      {
        id: 'show-example-alert',
        phrases: ['show example', 'demo alert', 'test alert'],
        action: () => {
          Alert.alert(
            'Voice Command Demo',
            'This alert was triggered by voice command!',
            [{ text: 'OK', onPress: () => speak?.('Alert dismissed') }]
          );
        },
        description: 'Show example alert',
        category: 'action',
      },
      {
        id: 'announce-screen-info',
        phrases: ['what is this screen', 'screen info', 'where am I'],
        action: () => {
          announceForScreenReader(
            'Enhanced Accessibility Example screen. This screen demonstrates advanced accessibility features including voice navigation and enhanced screen reader support.',
            'high'
          );
        },
        description: 'Announce screen information',
        category: 'information',
      },
    ],
    onCommandExecuted: (commandId, transcript) => {
      console.log(`Voice command executed: ${commandId}`);
    },
    onError: (error) => {
      console.error('Voice navigation error:', error);
    },
  });

  // Sample data for demonstration
  const [sampleInteraction] = useState({
    type: 'warning' as const,
    severity: 'high' as const,
    description: 'Potential interaction between Vitamin D and Calcium supplements may reduce absorption',
    affectedProducts: ['Vitamin D3 5000 IU', 'Calcium Carbonate 500mg'],
    recommendations: [
      'Take supplements at different times of day',
      'Consult with healthcare provider',
      'Monitor calcium levels'
    ],
  });

  const [sampleAnalysis] = useState({
    productName: 'Omega-3 Fish Oil 1000mg',
    score: 85,
    riskLevel: 'LOW' as const,
    interactions: 1,
    benefits: 5,
    warnings: 0,
  });

  const [sampleStack] = useState({
    totalItems: 8,
    interactions: 3,
    riskLevel: 'MODERATE' as const,
    lastUpdated: '2 hours ago',
  });

  // Announce screen entry for screen readers
  useEffect(() => {
    if (isScreenReaderEnabled) {
      announceForScreenReader(
        'Enhanced Accessibility Example screen loaded. This screen demonstrates advanced accessibility features.',
        'low'
      );
    }
  }, [isScreenReaderEnabled, announceForScreenReader]);

  const handleInteractionPress = () => {
    Alert.alert(
      'Interaction Details',
      sampleInteraction.description,
      [
        { text: 'View Recommendations', onPress: () => console.log('View recommendations') },
        { text: 'Dismiss', style: 'cancel' },
      ]
    );
  };

  const handleAnalysisPress = () => {
    Alert.alert(
      'Product Analysis',
      `${sampleAnalysis.productName} has a score of ${sampleAnalysis.score}/100 with ${sampleAnalysis.riskLevel.toLowerCase()} risk level.`,
      [{ text: 'OK' }]
    );
  };

  const handleStackPress = () => {
    Alert.alert(
      'Stack Summary',
      `Your stack contains ${sampleStack.totalItems} items with ${sampleStack.interactions} interactions detected.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      accessible={true}
      accessibilityLabel="Enhanced accessibility example screen"
      accessibilityHint="Scroll to view accessibility feature demonstrations"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Enhanced Accessibility Features</Text>
        <Text style={styles.subtitle}>
          Demonstrating advanced screen reader support and voice navigation
        </Text>
      </View>

      {/* Voice Navigation Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <OptimizedIcon
            type="ion"
            name="mic"
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.sectionTitle}>Voice Navigation</Text>
        </View>

        <View style={styles.voiceControls}>
          <Text style={styles.voiceStatus}>
            Status: {voiceSupported ? (isListening ? 'Listening' : 'Ready') : 'Not Supported'}
          </Text>
          
          {voiceSupported && (
            <View style={styles.voiceButtons}>
              <View
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={isListening ? 'Stop voice navigation' : 'Start voice navigation'}
                accessibilityHint="Toggle voice command listening"
                style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                onTouchEnd={isListening ? stopListening : startListening}
              >
                <OptimizedIcon
                  type="ion"
                  name={isListening ? 'mic' : 'mic-off'}
                  size={20}
                  color={isListening ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.voiceButtonText, isListening && styles.voiceButtonTextActive]}>
                  {isListening ? 'Stop' : 'Start'}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.voiceInstructions}>
            Try saying: "show example", "screen info", or any default navigation commands
          </Text>
        </View>
      </View>

      {/* Enhanced Screen Reader Support Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <OptimizedIcon
            type="ion"
            name="accessibility"
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.sectionTitle}>Enhanced Screen Reader Support</Text>
        </View>

        <Text style={styles.sectionDescription}>
          These components provide rich semantic descriptions for complex interactions:
        </Text>

        {/* Enhanced Interaction Warning */}
        <EnhancedInteractionWarning
          interaction={sampleInteraction}
          onPress={handleInteractionPress}
          style={styles.componentExample}
        />

        {/* Enhanced Product Analysis Card */}
        <EnhancedProductAnalysisCard
          analysis={sampleAnalysis}
          onPress={handleAnalysisPress}
          style={styles.componentExample}
        />

        {/* Enhanced Stack Summary */}
        <EnhancedStackSummary
          stack={sampleStack}
          onPress={handleStackPress}
          style={styles.componentExample}
        />
      </View>

      {/* Accessibility Features Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <OptimizedIcon
            type="ion"
            name="information-circle"
            size={24}
            color={COLORS.info}
          />
          <Text style={styles.sectionTitle}>Accessibility Features</Text>
        </View>

        <View style={styles.featureList}>
          <View style={styles.feature}>
            <OptimizedIcon type="ion" name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Semantic descriptions for complex UI elements</Text>
          </View>
          
          <View style={styles.feature}>
            <OptimizedIcon type="ion" name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Voice navigation with custom commands</Text>
          </View>
          
          <View style={styles.feature}>
            <OptimizedIcon type="ion" name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Contextual announcements for navigation</Text>
          </View>
          
          <View style={styles.feature}>
            <OptimizedIcon type="ion" name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Enhanced accessibility roles and hints</Text>
          </View>
          
          <View style={styles.feature}>
            <OptimizedIcon type="ion" name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Voice feedback for screen reader users</Text>
          </View>
        </View>
      </View>

      {/* Screen Reader Status */}
      <View style={styles.statusSection}>
        <Text style={styles.statusText}>
          Screen Reader: {isScreenReaderEnabled ? 'Enabled' : 'Disabled'}
        </Text>
        <Text style={styles.statusText}>
          Voice Navigation: {voiceSupported ? 'Supported' : 'Not Supported'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  componentExample: {
    marginBottom: SPACING.md,
  },
  voiceControls: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  voiceStatus: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  voiceButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  voiceButtonActive: {
    backgroundColor: COLORS.primary,
  },
  voiceButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  voiceButtonTextActive: {
    color: COLORS.white,
  },
  voiceInstructions: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  featureList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  statusSection: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
});
