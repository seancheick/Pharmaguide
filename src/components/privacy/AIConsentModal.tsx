// src/components/privacy/AIConsentModal.tsx
// 🔒 HIPAA-COMPLIANT: AI Analysis Consent Modal
// Required before any AI analysis can be performed

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { localHealthProfileService } from '../../services/health/localHealthProfileService';

interface AIConsentModalProps {
  visible: boolean;
  onConsent: (hasConsent: boolean) => void;
  onClose: () => void;
  userId: string;
}

/**
 * HIPAA-Compliant AI Consent Modal
 * - Explicit consent required before AI analysis
 * - Clear data usage disclosure
 * - User can opt-out and still use app
 * - Consent stored locally only
 */
export const AIConsentModal: React.FC<AIConsentModalProps> = ({
  visible,
  onConsent,
  onClose,
  userId,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConsent = async (hasConsent: boolean) => {
    try {
      setLoading(true);
      
      // Store consent locally (HIPAA compliant)
      await localHealthProfileService.updateAIConsent(userId, hasConsent);
      
      onConsent(hasConsent);
      onClose();
      
      if (hasConsent) {
        Alert.alert(
          '✅ AI Analysis Enabled',
          'You can now use AI-powered supplement analysis. You can change this setting anytime in your privacy preferences.',
          [{ text: 'Got it', style: 'default' }]
        );
      } else {
        Alert.alert(
          '🔒 Privacy Protected',
          'AI analysis is disabled. You can still use all other app features including rule-based safety checks.',
          [{ text: 'Got it', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Failed to update AI consent:', error);
      Alert.alert(
        'Error',
        'Failed to save your consent preference. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Analysis Consent</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#007AFF" />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Enable AI-Powered Supplement Analysis?
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            We use artificial intelligence to provide personalized supplement analysis. 
            Your privacy is our top priority.
          </Text>

          {/* What We Send Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cloud-upload-outline" size={20} color="#34C759" />
              <Text style={styles.sectionTitle}>✅ What We Send to AI Services</Text>
            </View>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• General supplement categories (e.g., "Vitamin D")</Text>
              <Text style={styles.bulletItem}>• Age ranges (e.g., "25-35", not exact age)</Text>
              <Text style={styles.bulletItem}>• General health conditions (e.g., "diabetes")</Text>
              <Text style={styles.bulletItem}>• Common allergen categories (e.g., "shellfish")</Text>
              <Text style={styles.bulletItem}>• Biological sex for dosing recommendations</Text>
            </View>
          </View>

          {/* What We Never Send Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-outline" size={20} color="#FF3B30" />
              <Text style={styles.sectionTitle}>❌ What We NEVER Send</Text>
            </View>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Your name or personal identifiers</Text>
              <Text style={styles.bulletItem}>• Exact ages, addresses, or contact information</Text>
              <Text style={styles.bulletItem}>• Specific medical history or diagnoses</Text>
              <Text style={styles.bulletItem}>• Exact dosages or medication schedules</Text>
              <Text style={styles.bulletItem}>• Brand names or pharmacy information</Text>
            </View>
          </View>

          {/* Local Storage Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="phone-portrait-outline" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>🔒 Your Data Stays Local</Text>
            </View>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• All personal health data encrypted on your device</Text>
              <Text style={styles.bulletItem}>• No health information stored on our servers</Text>
              <Text style={styles.bulletItem}>• You can delete all data anytime</Text>
              <Text style={styles.bulletItem}>• Works offline with rule-based safety checks</Text>
            </View>
          </View>

          {/* Alternative Section */}
          <View style={styles.alternativeSection}>
            <Text style={styles.alternativeTitle}>
              Don't want AI analysis?
            </Text>
            <Text style={styles.alternativeText}>
              No problem! You can still use PharmaGuide with our expert-validated 
              safety rules and interaction database. All core features work without AI.
            </Text>
          </View>

          {/* Legal Notice */}
          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              By enabling AI analysis, you consent to sending anonymized, 
              non-identifying health categories to our AI providers for analysis. 
              You can withdraw consent anytime in Privacy Settings.
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={() => handleConsent(false)}
            disabled={loading}
          >
            <Text style={styles.declineButtonText}>
              No Thanks - Use Without AI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.consentButton]}
            onPress={() => handleConsent(true)}
            disabled={loading}
          >
            <Text style={styles.consentButtonText}>
              {loading ? 'Saving...' : 'Enable AI Analysis'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 30,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  bulletList: {
    marginLeft: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  alternativeSection: {
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    marginBottom: 24,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  alternativeText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  legalSection: {
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginBottom: 30,
  },
  legalText: {
    fontSize: 12,
    color: '#E65100',
    lineHeight: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  consentButton: {
    backgroundColor: '#007AFF',
  },
  consentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
