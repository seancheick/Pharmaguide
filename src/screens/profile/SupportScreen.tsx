// src/screens/profile/SupportScreen.tsx
// 🚀 WORLD-CLASS: Comprehensive Support Hub
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { SupportScreenProps } from '../../types/navigation';

interface SupportItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  external?: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({ navigation }) => {
  const handleEmailSupport = () => {
    const email = 'support@pharmaguide.app';
    const subject = 'Support Request - Pharmaguide App';
    const body = 'Please describe your issue or question:\n\n';
    
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          'Email Not Available',
          `Please send your support request to: ${email}`,
          [{ text: 'OK' }]
        );
      }
    });
  };

  const handleCallSupport = () => {
    const phoneNumber = 'tel:+1-800-PHARMA-1';
    
    Linking.canOpenURL(phoneNumber).then((supported) => {
      if (supported) {
        Alert.alert(
          'Call Support',
          'Call our support team at 1-800-PHARMA-1?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => Linking.openURL(phoneNumber) },
          ]
        );
      } else {
        Alert.alert(
          'Phone Not Available',
          'Please call our support team at: 1-800-PHARMA-1',
          [{ text: 'OK' }]
        );
      }
    });
  };

  const handleWebsiteHelp = () => {
    const url = 'https://pharmaguide.app/help';
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open website. Please try again later.');
    });
  };

  const supportItems: SupportItem[] = [
    {
      id: 'help_center',
      title: 'Help Center',
      description: 'Browse articles and tutorials',
      icon: 'help-circle',
      onPress: () => navigation.navigate('HelpScreen'),
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      description: 'Quick answers to common questions',
      icon: 'chatbubble-ellipses',
      onPress: () => navigation.navigate('FAQScreen'),
    },
    {
      id: 'contact_support',
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: 'mail',
      onPress: () => navigation.navigate('ContactSupportScreen'),
    },
    {
      id: 'disclaimers',
      title: 'Medical Disclaimers',
      description: 'Important safety and legal information',
      icon: 'warning',
      onPress: () => navigation.navigate('DisclaimersScreen'),
    },
    {
      id: 'website_help',
      title: 'Online Help Center',
      description: 'Visit our comprehensive help website',
      icon: 'globe',
      external: true,
      onPress: handleWebsiteHelp,
    },
  ];

  const quickFAQs: FAQItem[] = [
    {
      question: 'How accurate is the supplement analysis?',
      answer: 'Our analysis combines multiple data sources including clinical studies, FDA databases, and expert reviews. However, always consult healthcare professionals for medical advice.',
    },
    {
      question: 'Can I trust the interaction warnings?',
      answer: 'Our interaction database is continuously updated with the latest research. However, this app is not a substitute for professional medical advice.',
    },
    {
      question: 'How do I add medications to my stack?',
      answer: 'Go to the Stack tab, tap the + button, and search for your medication or supplement. You can also scan barcodes for quick addition.',
    },
    {
      question: 'Is my health data secure?',
      answer: 'Yes, all health data is encrypted and stored securely. We never share personal health information with third parties without your explicit consent.',
    },
  ];

  const renderSupportItem = (item: SupportItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.supportItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.supportHeader}>
        <View style={styles.supportIconContainer}>
          <Ionicons
            name={item.icon}
            size={24}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.supportInfo}>
          <View style={styles.supportTitleRow}>
            <Text style={styles.supportTitle}>{item.title}</Text>
            {item.external && (
              <Ionicons name="open" size={16} color={COLORS.textSecondary} />
            )}
          </View>
          <Text style={styles.supportDescription}>{item.description}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderFAQItem = (item: FAQItem, index: number) => (
    <View key={index} style={styles.faqItem}>
      <Text style={styles.faqQuestion}>{item.question}</Text>
      <Text style={styles.faqAnswer}>{item.answer}</Text>
    </View>
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
        <Text style={styles.title}>Support</Text>
        <TouchableOpacity onPress={handleEmailSupport} style={styles.emailButton}>
          <Ionicons name="mail" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <MaterialIcons name="support-agent" size={40} color={COLORS.primary} />
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers, get support, and learn about our methodology
          </Text>
        </View>

        {/* Quick Contact */}
        <View style={styles.quickContact}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
              <Ionicons name="mail" size={20} color={COLORS.primary} />
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleCallSupport}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleWebsiteHelp}>
              <Ionicons name="globe" size={20} color={COLORS.primary} />
              <Text style={styles.contactButtonText}>Website</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Options</Text>
          <View style={styles.supportContainer}>
            {supportItems.map(renderSupportItem)}
          </View>
        </View>

        {/* Quick FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Answers</Text>
          <View style={styles.faqContainer}>
            {quickFAQs.slice(0, 3).map(renderFAQItem)}
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('FAQScreen')}
          >
            <Text style={styles.viewAllText}>View All FAQs</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Emergency Notice */}
        <View style={styles.emergencyNotice}>
          <MaterialIcons name="emergency" size={20} color={COLORS.error} />
          <Text style={styles.emergencyText}>
            For medical emergencies, call 911 or your local emergency services immediately. 
            This app is not intended for emergency medical situations.
          </Text>
        </View>

        {/* Support Hours */}
        <View style={styles.supportHours}>
          <Text style={styles.supportHoursTitle}>Support Hours</Text>
          <Text style={styles.supportHoursText}>
            Monday - Friday: 9:00 AM - 6:00 PM EST{'\n'}
            Saturday: 10:00 AM - 4:00 PM EST{'\n'}
            Sunday: Closed
          </Text>
          <Text style={styles.supportHoursNote}>
            Email support is available 24/7 with responses within 24 hours
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
  emailButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
  quickContact: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  contactButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  contactButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  supportContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  supportItem: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  supportInfo: {
    flex: 1,
  },
  supportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  supportTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  supportDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  faqContainer: {
    gap: SPACING.md,
  },
  faqItem: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
  },
  faqQuestion: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  faqAnswer: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emergencyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.errorLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  emergencyText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    lineHeight: 18,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  supportHours: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  supportHoursTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  supportHoursText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  supportHoursNote: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
