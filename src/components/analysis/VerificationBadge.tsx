// src/components/analysis/VerificationBadge.tsx
// 🏆 VERIFICATION & TRUST SYSTEM
// Source verification badges and confidence indicators

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type VerificationLevel = 'FDA_VERIFIED' | 'NIH_VALIDATED' | 'CLINICAL_STUDY' | 'AI_ANALYSIS' | 'RULE_BASED';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type EvidenceGrade = 'A' | 'B' | 'C' | 'D';

interface VerificationBadgeProps {
  level: VerificationLevel;
  confidence?: ConfidenceLevel;
  evidenceGrade?: EvidenceGrade;
  source?: string;
  onPress?: () => void;
  compact?: boolean;
}

/**
 * 🏆 Verification Badge Component
 * - Shows source credibility (FDA, NIH, Clinical, AI)
 * - Displays confidence levels (High/Medium/Low)
 * - Evidence grading (A/B/C/D)
 * - Builds user trust through transparency
 */
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  level,
  confidence,
  evidenceGrade,
  source,
  onPress,
  compact = false,
}) => {
  const config = getVerificationConfig(level);
  const confidenceConfig = confidence ? getConfidenceConfig(confidence) : null;
  const gradeConfig = evidenceGrade ? getEvidenceGradeConfig(evidenceGrade) : null;

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactBadge, { backgroundColor: config.backgroundColor }]}
        onPress={onPress}
        disabled={!onPress}
      >
        <Ionicons name={config.icon} size={12} color={config.textColor} />
        <Text style={[styles.compactText, { color: config.textColor }]}>
          {config.shortLabel}
        </Text>
        {evidenceGrade && (
          <Text style={[styles.gradeText, { color: config.textColor }]}>
            {evidenceGrade}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.badge, { backgroundColor: config.backgroundColor }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.badgeHeader}>
        <Ionicons name={config.icon} size={16} color={config.textColor} />
        <Text style={[styles.badgeTitle, { color: config.textColor }]}>
          {config.label}
        </Text>
        {evidenceGrade && (
          <View style={[styles.gradeContainer, { borderColor: config.textColor }]}>
            <Text style={[styles.gradeBadge, { color: config.textColor }]}>
              {evidenceGrade}
            </Text>
          </View>
        )}
      </View>
      
      {(confidence || source) && (
        <View style={styles.badgeDetails}>
          {confidence && confidenceConfig && (
            <View style={styles.confidenceRow}>
              <Ionicons 
                name={confidenceConfig.icon} 
                size={12} 
                color={config.textColor} 
              />
              <Text style={[styles.confidenceText, { color: config.textColor }]}>
                {confidenceConfig.label}
              </Text>
            </View>
          )}
          {source && (
            <Text style={[styles.sourceText, { color: config.textColor }]}>
              {source}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Multiple verification badges for complex analyses
 */
interface VerificationBadgeGroupProps {
  badges: Array<{
    level: VerificationLevel;
    confidence?: ConfidenceLevel;
    evidenceGrade?: EvidenceGrade;
    source?: string;
  }>;
  onBadgePress?: (index: number) => void;
  compact?: boolean;
}

export const VerificationBadgeGroup: React.FC<VerificationBadgeGroupProps> = ({
  badges,
  onBadgePress,
  compact = false,
}) => {
  return (
    <View style={compact ? styles.compactGroup : styles.badgeGroup}>
      {badges.map((badge, index) => (
        <VerificationBadge
          key={index}
          level={badge.level}
          confidence={badge.confidence}
          evidenceGrade={badge.evidenceGrade}
          source={badge.source}
          onPress={onBadgePress ? () => onBadgePress(index) : undefined}
          compact={compact}
        />
      ))}
    </View>
  );
};

/**
 * Confidence indicator component
 */
interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  percentage?: number;
  showPercentage?: boolean;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  level,
  percentage,
  showPercentage = false,
}) => {
  const config = getConfidenceConfig(level);
  const displayPercentage = percentage || config.defaultPercentage;

  return (
    <View style={styles.confidenceIndicator}>
      <View style={styles.confidenceHeader}>
        <Ionicons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.confidenceLabel, { color: config.color }]}>
          {config.label} Confidence
        </Text>
        {showPercentage && (
          <Text style={[styles.percentageText, { color: config.color }]}>
            {displayPercentage}%
          </Text>
        )}
      </View>
      <View style={styles.confidenceBar}>
        <View 
          style={[
            styles.confidenceProgress, 
            { 
              width: `${displayPercentage}%`,
              backgroundColor: config.color 
            }
          ]} 
        />
      </View>
    </View>
  );
};

// Configuration functions

function getVerificationConfig(level: VerificationLevel) {
  switch (level) {
    case 'FDA_VERIFIED':
      return {
        label: 'FDA Verified',
        shortLabel: 'FDA',
        icon: 'shield-checkmark' as const,
        backgroundColor: '#34C759',
        textColor: '#FFFFFF',
        priority: 1,
      };
    case 'NIH_VALIDATED':
      return {
        label: 'NIH Validated',
        shortLabel: 'NIH',
        icon: 'medical' as const,
        backgroundColor: '#007AFF',
        textColor: '#FFFFFF',
        priority: 2,
      };
    case 'CLINICAL_STUDY':
      return {
        label: 'Clinical Study',
        shortLabel: 'Clinical',
        icon: 'flask' as const,
        backgroundColor: '#5856D6',
        textColor: '#FFFFFF',
        priority: 3,
      };
    case 'RULE_BASED':
      return {
        label: 'Expert Rules',
        shortLabel: 'Rules',
        icon: 'library' as const,
        backgroundColor: '#FF9500',
        textColor: '#FFFFFF',
        priority: 4,
      };
    case 'AI_ANALYSIS':
      return {
        label: 'AI Analysis',
        shortLabel: 'AI',
        icon: 'brain' as const,
        backgroundColor: '#AF52DE',
        textColor: '#FFFFFF',
        priority: 5,
      };
    default:
      return {
        label: 'Unknown',
        shortLabel: '?',
        icon: 'help-circle' as const,
        backgroundColor: '#8E8E93',
        textColor: '#FFFFFF',
        priority: 6,
      };
  }
}

function getConfidenceConfig(level: ConfidenceLevel) {
  switch (level) {
    case 'HIGH':
      return {
        label: 'High',
        icon: 'checkmark-circle' as const,
        color: '#34C759',
        defaultPercentage: 90,
      };
    case 'MEDIUM':
      return {
        label: 'Medium',
        icon: 'warning' as const,
        color: '#FF9500',
        defaultPercentage: 70,
      };
    case 'LOW':
      return {
        label: 'Low',
        icon: 'alert-circle' as const,
        color: '#FF3B30',
        defaultPercentage: 50,
      };
  }
}

function getEvidenceGradeConfig(grade: EvidenceGrade) {
  switch (grade) {
    case 'A':
      return { label: 'Grade A', description: 'High-quality evidence' };
    case 'B':
      return { label: 'Grade B', description: 'Moderate-quality evidence' };
    case 'C':
      return { label: 'Grade C', description: 'Low-quality evidence' };
    case 'D':
      return { label: 'Grade D', description: 'Very low-quality evidence' };
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  compactText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  gradeContainer: {
    marginLeft: 6,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  gradeBadge: {
    fontSize: 10,
    fontWeight: '700',
  },
  gradeText: {
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 3,
  },
  badgeDetails: {
    marginTop: 4,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  confidenceText: {
    fontSize: 10,
    marginLeft: 3,
  },
  sourceText: {
    fontSize: 9,
    opacity: 0.9,
  },
  badgeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  compactGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  confidenceIndicator: {
    marginVertical: 8,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceProgress: {
    height: '100%',
    borderRadius: 2,
  },
});
