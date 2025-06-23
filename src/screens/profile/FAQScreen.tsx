// src/screens/profile/FAQScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { FAQScreenProps } from '../../types/navigation';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'scanning' | 'interactions' | 'account' | 'technical';
}

export const FAQScreen: React.FC<FAQScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I scan a supplement barcode?',
      answer: 'Open the app and tap the scan button on the home screen. Point your camera at the barcode and wait for it to focus. The app will automatically detect and scan the barcode.',
      category: 'scanning',
    },
    {
      id: '2',
      question: 'What should I do if a product isn\'t found?',
      answer: 'If a product isn\'t in our database, you can manually add it by tapping "Add Manually" after scanning. You can also report missing products to help improve our database.',
      category: 'scanning',
    },
    {
      id: '3',
      question: 'How accurate are the interaction warnings?',
      answer: 'Our interaction database is based on peer-reviewed research and clinical studies. However, always consult with your healthcare provider before making changes to your supplement regimen.',
      category: 'interactions',
    },
    {
      id: '4',
      question: 'Can I use this app to replace medical advice?',
      answer: 'No, Pharmaguide is an informational tool only. It should not replace professional medical advice, diagnosis, or treatment. Always consult your healthcare provider.',
      category: 'general',
    },
    {
      id: '5',
      question: 'How do I update my health profile?',
      answer: 'Go to the Profile tab, then tap "Health Profile" to update your demographics, health conditions, medications, and allergies.',
      category: 'account',
    },
    {
      id: '6',
      question: 'Why is the app running slowly?',
      answer: 'Try closing and reopening the app. If the problem persists, restart your device or check for app updates in your app store.',
      category: 'technical',
    },
    {
      id: '7',
      question: 'How do I delete items from my stack?',
      answer: 'In your stack, swipe left on any item and tap the delete button, or tap the item and select "Remove from Stack" from the options.',
      category: 'general',
    },
    {
      id: '8',
      question: 'Is my health data secure?',
      answer: 'Yes, all your health data is encrypted and stored securely. We follow HIPAA guidelines and never share your personal information with third parties.',
      category: 'account',
    },
  ];

  const categories = [
    { id: 'all', label: 'All', count: faqs.length },
    { id: 'general', label: 'General', count: faqs.filter(f => f.category === 'general').length },
    { id: 'scanning', label: 'Scanning', count: faqs.filter(f => f.category === 'scanning').length },
    { id: 'interactions', label: 'Interactions', count: faqs.filter(f => f.category === 'interactions').length },
    { id: 'account', label: 'Account', count: faqs.filter(f => f.category === 'account').length },
    { id: 'technical', label: 'Technical', count: faqs.filter(f => f.category === 'technical').length },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const renderCategoryButton = (category: typeof categories[0]) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.activeCategoryButton,
      ]}
      onPress={() => setSelectedCategory(category.id)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category.id && styles.activeCategoryButtonText,
      ]}>
        {category.label} ({category.count})
      </Text>
    </TouchableOpacity>
  );

  const renderFAQ = (faq: FAQ) => {
    const isExpanded = expandedFAQ === faq.id;
    
    return (
      <View key={faq.id} style={styles.faqCard}>
        <TouchableOpacity
          style={styles.faqHeader}
          onPress={() => toggleFAQ(faq.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

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
        <Text style={styles.title}>Frequently Asked Questions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search FAQs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesRow}>
              {categories.map(renderCategoryButton)}
            </View>
          </ScrollView>
        </View>

        {/* FAQs */}
        <View style={styles.faqsSection}>
          {filteredFAQs.length > 0 ? (
            <View style={styles.faqsContainer}>
              {filteredFAQs.map(renderFAQ)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>No FAQs found</Text>
              <Text style={styles.emptyStateDescription}>
                Try adjusting your search or category filter
              </Text>
            </View>
          )}
        </View>

        {/* Contact Support */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Still need help?</Text>
          <Text style={styles.supportDescription}>
            Can't find what you're looking for? Our support team is here to help.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('ContactSupportScreen')}
            activeOpacity={0.7}
          >
            <Ionicons name="mail" size={18} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  categoriesSection: {
    paddingVertical: SPACING.sm,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  activeCategoryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  activeCategoryButtonText: {
    color: COLORS.white,
  },
  faqsSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  faqsContainer: {
    gap: SPACING.sm,
  },
  faqCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginRight: SPACING.md,
  },
  faqAnswer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  faqAnswerText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyStateDescription: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  supportSection: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  supportDescription: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  contactButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});
