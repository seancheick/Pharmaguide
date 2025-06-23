// src/screens/profile/ContactSupportScreen.tsx
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
  Linking,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { ContactSupportScreenProps } from '../../types/navigation';

interface ContactMethod {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  available: boolean;
}

interface SupportCategory {
  id: string;
  label: string;
  value: string;
}

export const ContactSupportScreen: React.FC<ContactSupportScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supportCategories: SupportCategory[] = [
    { id: 'technical', label: 'Technical Issue', value: 'technical' },
    { id: 'account', label: 'Account Problem', value: 'account' },
    { id: 'data', label: 'Data Issue', value: 'data' },
    { id: 'feature', label: 'Feature Request', value: 'feature' },
    { id: 'billing', label: 'Billing Question', value: 'billing' },
    { id: 'other', label: 'Other', value: 'other' },
  ];

  const contactMethods: ContactMethod[] = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'Get help via email (24-48 hour response)',
      icon: 'mail',
      action: () => Linking.openURL('mailto:support@pharmaguide.com'),
      available: true,
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with our support team (Mon-Fri 9AM-5PM)',
      icon: 'chatbubble',
      action: () => console.log('Open live chat'),
      available: false, // Would be true during business hours
    },
    {
      id: 'phone',
      title: 'Phone Support',
      description: 'Call us for urgent issues (Mon-Fri 9AM-5PM)',
      icon: 'call',
      action: () => Linking.openURL('tel:+1-555-PHARMA'),
      available: true,
    },
  ];

  const handleSubmitTicket = async () => {
    if (!selectedCategory || !subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Support Ticket Submitted',
        'Thank you for contacting us! We\'ll get back to you within 24-48 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContactMethod = (method: ContactMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.contactMethodCard,
        !method.available && styles.unavailableMethod,
      ]}
      onPress={method.available ? method.action : undefined}
      activeOpacity={method.available ? 0.7 : 1}
    >
      <View style={[
        styles.contactMethodIcon,
        { backgroundColor: method.available ? COLORS.primary : COLORS.gray300 }
      ]}>
        <MaterialIcons
          name={method.icon as any}
          size={20}
          color={method.available ? COLORS.white : COLORS.textSecondary}
        />
      </View>
      <View style={styles.contactMethodInfo}>
        <Text style={[
          styles.contactMethodTitle,
          !method.available && styles.unavailableText,
        ]}>
          {method.title}
        </Text>
        <Text style={styles.contactMethodDescription}>
          {method.description}
        </Text>
      </View>
      {method.available ? (
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      ) : (
        <View style={styles.unavailableBadge}>
          <Text style={styles.unavailableText}>Offline</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCategoryOption = (category: SupportCategory) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryOption,
        selectedCategory === category.value && styles.selectedCategory,
      ]}
      onPress={() => setSelectedCategory(category.value)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.categoryOptionText,
        selectedCategory === category.value && styles.selectedCategoryText,
      ]}>
        {category.label}
      </Text>
      {selectedCategory === category.value && (
        <Ionicons name="checkmark" size={16} color={COLORS.white} />
      )}
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
        <Text style={styles.title}>Contact Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Contact Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help Now</Text>
          <View style={styles.contactMethodsContainer}>
            {contactMethods.map(renderContactMethod)}
          </View>
        </View>

        {/* Support Ticket Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submit a Support Ticket</Text>
          
          {/* Category Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Category *</Text>
            <View style={styles.categoriesGrid}>
              {supportCategories.map(renderCategoryOption)}
            </View>
          </View>

          {/* Subject */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Subject *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Brief description of your issue"
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
          </View>

          {/* Message */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Message *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Please provide detailed information about your issue..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>
              {message.length}/1000 characters
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedCategory || !subject.trim() || !message.trim() || isSubmitting) && 
              styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitTicket}
            disabled={!selectedCategory || !subject.trim() || !message.trim() || isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
                <Ionicons name="send" size={18} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Response Time Info */}
        <View style={styles.responseInfo}>
          <MaterialIcons name="schedule" size={20} color={COLORS.info} />
          <Text style={styles.responseInfoText}>
            We typically respond to support tickets within 24-48 hours. 
            For urgent issues, please use our phone support during business hours.
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
  contactMethodsContainer: {
    gap: SPACING.sm,
  },
  contactMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  unavailableMethod: {
    opacity: 0.6,
  },
  contactMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  contactMethodInfo: {
    flex: 1,
  },
  contactMethodTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  contactMethodDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  unavailableText: {
    color: COLORS.textSecondary,
  },
  unavailableBadge: {
    backgroundColor: COLORS.gray200,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    gap: SPACING.xs,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  selectedCategoryText: {
    color: COLORS.white,
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
  characterCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
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
  responseInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  responseInfoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    lineHeight: 18,
  },
});
