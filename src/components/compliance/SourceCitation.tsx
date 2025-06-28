// src/components/compliance/SourceCitation.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';

export interface CitationSource {
  id: string;
  title: string;
  source: 'FDA' | 'NIH' | 'PubMed' | 'Clinical_Trial' | 'Peer_Reviewed';
  url?: string;
  year?: number;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  description?: string;
}

interface SourceCitationProps {
  sources: CitationSource[];
  variant?: 'full' | 'compact';
  showEvidenceLevel?: boolean;
}

export const SourceCitation: React.FC<SourceCitationProps> = ({
  sources,
  variant = 'full',
  showEvidenceLevel = true,
}) => {
  const getSourceIcon = (source: CitationSource['source']) => {
    switch (source) {
      case 'FDA':
        return 'shield-checkmark';
      case 'NIH':
        return 'library';
      case 'PubMed':
        return 'document-text';
      case 'Clinical_Trial':
        return 'flask';
      case 'Peer_Reviewed':
        return 'school';
      default:
        return 'document';
    }
  };

  const getEvidenceLevelColor = (level: CitationSource['evidenceLevel']) => {
    switch (level) {
      case 'A':
        return COLORS.success;
      case 'B':
        return COLORS.primary;
      case 'C':
        return COLORS.warning;
      case 'D':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getEvidenceLevelText = (level: CitationSource['evidenceLevel']) => {
    switch (level) {
      case 'A':
        return 'High Quality Evidence';
      case 'B':
        return 'Moderate Quality Evidence';
      case 'C':
        return 'Low Quality Evidence';
      case 'D':
        return 'Very Low Quality Evidence';
      default:
        return 'Evidence Level Unknown';
    }
  };

  const handleSourcePress = async (url?: string) => {
    if (url) {
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error('Failed to open URL:', error);
      }
    }
  };

  if (sources.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="library" size={16} color={COLORS.primary} />
        <Text style={styles.headerText}>Evidence Sources</Text>
      </View>
      
      {sources.map((source, index) => (
        <TouchableOpacity
          key={source.id}
          style={[
            styles.sourceItem,
            variant === 'compact' && styles.compactSourceItem
          ]}
          onPress={() => handleSourcePress(source.url)}
          disabled={!source.url}
        >
          <View style={styles.sourceHeader}>
            <Ionicons
              name={getSourceIcon(source.source)}
              size={14}
              color={COLORS.primary}
              style={styles.sourceIcon}
            />
            <Text style={styles.sourceType}>{source.source}</Text>
            {source.year && (
              <Text style={styles.sourceYear}>({source.year})</Text>
            )}
            {showEvidenceLevel && (
              <View style={[
                styles.evidenceBadge,
                { backgroundColor: getEvidenceLevelColor(source.evidenceLevel) }
              ]}>
                <Text style={styles.evidenceText}>{source.evidenceLevel}</Text>
              </View>
            )}
          </View>
          
          <Text style={[
            styles.sourceTitle,
            variant === 'compact' && styles.compactSourceTitle
          ]}>
            {source.title}
          </Text>
          
          {variant === 'full' && source.description && (
            <Text style={styles.sourceDescription}>
              {source.description}
            </Text>
          )}
          
          {showEvidenceLevel && variant === 'full' && (
            <Text style={styles.evidenceLevel}>
              {getEvidenceLevelText(source.evidenceLevel)}
            </Text>
          )}
          
          {source.url && (
            <View style={styles.linkIndicator}>
              <Ionicons name="link" size={12} color={COLORS.primary} />
              <Text style={styles.linkText}>View Source</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  sourceItem: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  compactSourceItem: {
    padding: SPACING.xs,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sourceIcon: {
    marginRight: SPACING.xs,
  },
  sourceType: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  sourceYear: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  evidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  evidenceText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.background,
  },
  sourceTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  compactSourceTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  sourceDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
  },
  evidenceLevel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  linkText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    textDecorationLine: 'underline',
  },
});
