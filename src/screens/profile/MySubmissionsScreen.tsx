// src/screens/profile/MySubmissionsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { MySubmissionsScreenProps } from '../../types/navigation';

interface Submission {
  id: string;
  type: 'product' | 'issue' | 'correction';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: string;
  reviewedAt?: string;
  points?: number;
}

export const MySubmissionsScreen: React.FC<MySubmissionsScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Mock data - would come from API
  const submissions: Submission[] = [
    {
      id: '1',
      type: 'product',
      title: 'Nature Made Vitamin D3',
      description: 'Added missing product with complete ingredient list',
      status: 'approved',
      submittedAt: '2024-01-15',
      reviewedAt: '2024-01-16',
      points: 50,
    },
    {
      id: '2',
      type: 'issue',
      title: 'Incorrect dosage information',
      description: 'Reported wrong dosage for Omega-3 supplement',
      status: 'under_review',
      submittedAt: '2024-01-20',
    },
    {
      id: '3',
      type: 'correction',
      title: 'Updated ingredient list',
      description: 'Corrected allergen information for protein powder',
      status: 'pending',
      submittedAt: '2024-01-22',
    },
  ];

  const filterOptions = [
    { id: 'all', label: 'All', count: submissions.length },
    { id: 'pending', label: 'Pending', count: submissions.filter(s => s.status === 'pending').length },
    { id: 'approved', label: 'Approved', count: submissions.filter(s => s.status === 'approved').length },
    { id: 'rejected', label: 'Rejected', count: submissions.filter(s => s.status === 'rejected').length },
  ];

  const filteredSubmissions = selectedFilter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === selectedFilter);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status: Submission['status']) => {
    switch (status) {
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      case 'under_review': return COLORS.warning;
      case 'pending': return COLORS.info;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: Submission['status']) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'under_review': return 'Under Review';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const getTypeIcon = (type: Submission['type']) => {
    switch (type) {
      case 'product': return 'add-circle';
      case 'issue': return 'warning';
      case 'correction': return 'create';
      default: return 'document';
    }
  };

  const renderFilterButton = (filter: typeof filterOptions[0]) => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.filterButton,
        selectedFilter === filter.id && styles.activeFilterButton,
      ]}
      onPress={() => setSelectedFilter(filter.id as any)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter.id && styles.activeFilterButtonText,
      ]}>
        {filter.label} ({filter.count})
      </Text>
    </TouchableOpacity>
  );

  const renderSubmission = (submission: Submission) => (
    <TouchableOpacity
      key={submission.id}
      style={styles.submissionCard}
      activeOpacity={0.7}
    >
      <View style={styles.submissionHeader}>
        <View style={styles.submissionIcon}>
          <MaterialIcons
            name={getTypeIcon(submission.type) as any}
            size={20}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.submissionInfo}>
          <Text style={styles.submissionTitle}>{submission.title}</Text>
          <Text style={styles.submissionDescription}>{submission.description}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(submission.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(submission.status) }]}>
            {getStatusLabel(submission.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.submissionFooter}>
        <Text style={styles.submissionDate}>
          Submitted {submission.submittedAt}
        </Text>
        {submission.points && (
          <View style={styles.pointsBadge}>
            <MaterialIcons name="star" size={14} color={COLORS.warning} />
            <Text style={styles.pointsText}>+{submission.points} points</Text>
          </View>
        )}
      </View>
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
        <Text style={styles.title}>My Submissions</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ReportIssueScreen')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filter Buttons */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersRow}>
              {filterOptions.map(renderFilterButton)}
            </View>
          </ScrollView>
        </View>

        {/* Submissions List */}
        <View style={styles.submissionsContainer}>
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map(renderSubmission)
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>No submissions found</Text>
              <Text style={styles.emptyStateDescription}>
                {selectedFilter === 'all' 
                  ? 'You haven\'t made any submissions yet'
                  : `No ${selectedFilter} submissions found`
                }
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('ReportIssueScreen')}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyStateButtonText}>Make Your First Submission</Text>
              </TouchableOpacity>
            </View>
          )}
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
  addButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: SPACING.md,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  activeFilterButtonText: {
    color: COLORS.white,
  },
  submissionsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  submissionCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  submissionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  submissionInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  submissionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  submissionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  submissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submissionDate: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
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
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});
