// src/components/compliance/ComplianceModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import { FDADisclaimer } from './FDADisclaimer';

interface ComplianceModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  title?: string;
  type?: 'ai_analysis' | 'interaction_check' | 'recommendation' | 'general';
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  visible,
  onAccept,
  onDecline,
  title,
  type = 'general',
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const getModalContent = () => {
    switch (type) {
      case 'ai_analysis':
        return {
          title: title || 'AI Analysis Disclaimer',
          content: [
            'This AI analysis provides educational information only and should not be used as medical advice.',
            'The analysis is based on available research and may not account for your individual health circumstances.',
            'Results are for informational purposes and should be discussed with your healthcare provider.',
            'This tool does not diagnose, treat, cure, or prevent any disease or medical condition.',
          ],
          icon: 'analytics' as const,
        };
      case 'interaction_check':
        return {
          title: title || 'Interaction Check Disclaimer',
          content: [
            'This interaction check provides educational information based on available research.',
            'Not all potential interactions may be identified, and individual responses may vary.',
            'This tool does not replace professional medical advice or pharmacist consultation.',
            'Always consult your healthcare provider before combining supplements or medications.',
          ],
          icon: 'warning' as const,
        };
      case 'recommendation':
        return {
          title: title || 'Recommendation Disclaimer',
          content: [
            'These recommendations are for educational purposes only and are not medical advice.',
            'Individual needs may vary based on health status, medications, and other factors.',
            'Recommendations are based on general research and may not apply to your specific situation.',
            'Consult your healthcare provider before making any changes to your supplement regimen.',
          ],
          icon: 'bulb' as const,
        };
      default:
        return {
          title: title || 'Health Information Disclaimer',
          content: [
            'This app provides educational health information only.',
            'Information should not be used as a substitute for professional medical advice.',
            'Individual health needs vary and require personalized medical guidance.',
            'Always consult qualified healthcare professionals for medical decisions.',
          ],
          icon: 'information-circle' as const,
        };
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isScrolledToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setHasScrolledToBottom(isScrolledToBottom);
  };

  const modalContent = getModalContent();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDecline}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons
              name={modalContent.icon}
              size={24}
              color={COLORS.warning}
              style={styles.headerIcon}
            />
            <Text style={styles.title}>{modalContent.title}</Text>
          </View>
          <TouchableOpacity onPress={onDecline} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.importantNotice}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={styles.importantText}>Important Health Information</Text>
          </View>

          <Text style={styles.description}>
            Before proceeding, please read and understand the following important information:
          </Text>

          {modalContent.content.map((item, index) => (
            <View key={index} style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}

          <FDADisclaimer variant="modal" showIcon={false} />

          <View style={styles.acknowledgment}>
            <Text style={styles.acknowledgmentText}>
              By proceeding, you acknowledge that you have read and understood this disclaimer
              and agree to use this information for educational purposes only.
            </Text>
          </View>

          {!hasScrolledToBottom && (
            <View style={styles.scrollIndicator}>
              <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
              <Text style={styles.scrollText}>Scroll to continue</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={onDecline}
          >
            <Text style={styles.declineButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button,
              styles.acceptButton,
              !hasScrolledToBottom && styles.disabledButton
            ]}
            onPress={onAccept}
            disabled={!hasScrolledToBottom}
          >
            <Text style={[
              styles.acceptButtonText,
              !hasScrolledToBottom && styles.disabledButtonText
            ]}>
              I Understand, Continue
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  importantNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  importantText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
    marginBottom: SPACING.lg,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    paddingRight: SPACING.md,
  },
  bullet: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
  },
  acknowledgment: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.lg,
  },
  acknowledgmentText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
    fontStyle: 'italic',
  },
  scrollIndicator: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    opacity: 0.7,
  },
  scrollText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
  },
  declineButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  acceptButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.background,
  },
  disabledButtonText: {
    color: COLORS.textSecondary,
  },
});
