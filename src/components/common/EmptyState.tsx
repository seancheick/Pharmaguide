// src/components/common/EmptyState.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { OptimizedIcon } from './OptimizedIcon';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-outline',
  title,
  description,
  primaryAction,
  secondaryAction,
  style,
  compact = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <View
        style={[styles.iconContainer, compact && styles.compactIconContainer]}
      >
        <OptimizedIcon
          type="ion"
          name={icon}
          size={compact ? 48 : 64}
          color={COLORS.textTertiary}
        />
      </View>

      <Text style={[styles.title, compact && styles.compactTitle]}>
        {title}
      </Text>

      <Text style={[styles.description, compact && styles.compactDescription]}>
        {description}
      </Text>

      {(primaryAction || secondaryAction) && (
        <View style={styles.actionContainer}>
          {primaryAction && (
            <Button
              title={primaryAction.label}
              onPress={primaryAction.onPress}
              variant={primaryAction.variant || 'primary'}
              style={styles.primaryButton}
            />
          )}

          {secondaryAction && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={secondaryAction.onPress}
            >
              <Text style={styles.secondaryButtonText}>
                {secondaryAction.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// Predefined empty states for common scenarios
export const StackEmptyState: React.FC<{
  onAddItem: () => void;
  onLearnMore?: () => void;
}> = ({ onAddItem, onLearnMore }) => (
  <EmptyState
    icon="layers-outline"
    title="Your stack is empty"
    description="Start building your supplement stack by scanning products or searching our database."
    primaryAction={{
      label: 'Add Your First Item',
      onPress: onAddItem,
    }}
    secondaryAction={
      onLearnMore
        ? {
            label: 'Learn about stacks',
            onPress: onLearnMore,
          }
        : undefined
    }
  />
);

export const RecentScansEmptyState: React.FC<{
  onStartScanning: () => void;
}> = ({ onStartScanning }) => (
  <EmptyState
    icon="scan-outline"
    title="No recent scans"
    description="Scan product barcodes to get instant analysis and safety information."
    primaryAction={{
      label: 'Start Scanning',
      onPress: onStartScanning,
    }}
    compact
  />
);

export const SearchEmptyState: React.FC<{
  query?: string;
  onClearSearch?: () => void;
  onBrowseCategories?: () => void;
}> = ({ query, onClearSearch, onBrowseCategories }) => (
  <EmptyState
    icon="search-outline"
    title={query ? `No results for "${query}"` : 'Start your search'}
    description={
      query
        ? 'Try adjusting your search terms or browse our categories.'
        : 'Search for supplements, medications, or ingredients to get detailed information.'
    }
    primaryAction={
      query && onClearSearch
        ? {
            label: 'Clear Search',
            onPress: onClearSearch,
            variant: 'secondary' as const,
          }
        : undefined
    }
    secondaryAction={
      onBrowseCategories
        ? {
            label: 'Browse Categories',
            onPress: onBrowseCategories,
          }
        : undefined
    }
    compact
  />
);

export const NetworkErrorEmptyState: React.FC<{
  onRetry: () => void;
  onGoOffline?: () => void;
}> = ({ onRetry, onGoOffline }) => (
  <EmptyState
    icon="cloud-offline-outline"
    title="Connection problem"
    description="Unable to load data. Please check your internet connection and try again."
    primaryAction={{
      label: 'Try Again',
      onPress: onRetry,
    }}
    secondaryAction={
      onGoOffline
        ? {
            label: 'Continue Offline',
            onPress: onGoOffline,
          }
        : undefined
    }
  />
);

export const LoadingFailedEmptyState: React.FC<{
  onRetry: () => void;
  error?: string;
}> = ({ onRetry, error }) => (
  <EmptyState
    icon="alert-circle-outline"
    title="Failed to load"
    description={error || 'Something went wrong while loading this content.'}
    primaryAction={{
      label: 'Try Again',
      onPress: onRetry,
    }}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  compactContainer: {
    paddingVertical: SPACING.lg,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  compactIconContainer: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  compactTitle: {
    fontSize: 18,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
    maxWidth: 300,
  },
  compactDescription: {
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  secondaryButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
