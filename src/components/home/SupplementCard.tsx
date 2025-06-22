// src/components/home/SupplementCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface SupplementCardProps {
  supplement: {
    id: string;
    name: string;
    brand?: string;
    dosage?: string;
    imageUrl?: string;
    rating: number;
    score: number;
    riskStatus: 'Safe' | 'Caution' | 'High Risk';
    description?: string;
    alternativeName?: string;
    alternativeScore?: number;
    costPerMonth?: number;
    evidence?: 'A' | 'B' | 'C' | 'D';
  };
  onHelpfulClick?: (supplement: any, isHelpful: boolean) => void;
  onPress?: () => void;
}

export const SupplementCard: React.FC<SupplementCardProps> = ({
  supplement,
  onHelpfulClick,
  onPress,
}) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons
          key={`full-${i}`}
          name="star"
          size={16}
          color={COLORS.warning}
        />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <Ionicons
          key="half"
          name="star-half"
          size={16}
          color={COLORS.warning}
        />
      );
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={16}
          color={COLORS.gray300}
        />
      );
    }

    return stars;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80)
      return { color: COLORS.success, backgroundColor: COLORS.successLight };
    if (score >= 60)
      return { color: COLORS.warning, backgroundColor: COLORS.warningLight };
    return { color: COLORS.error, backgroundColor: COLORS.errorLight };
  };

  const getRiskIcon = (status: string) => {
    switch (status) {
      case 'Safe':
        return (
          <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
        );
      case 'Caution':
        return (
          <MaterialIcons name="warning" size={16} color={COLORS.warning} />
        );
      case 'High Risk':
        return <Ionicons name="alert-circle" size={16} color={COLORS.error} />;
      default:
        return null;
    }
  };

  const getRiskColor = (status: string) => {
    switch (status) {
      case 'Safe':
        return { backgroundColor: COLORS.successLight, color: COLORS.success };
      case 'Caution':
        return { backgroundColor: COLORS.warningLight, color: COLORS.warning };
      case 'High Risk':
        return { backgroundColor: COLORS.errorLight, color: COLORS.error };
      default:
        return { backgroundColor: COLORS.gray100, color: COLORS.textSecondary };
    }
  };

  const scoreStyle = getScoreColor(supplement.score);
  const riskStyle = getRiskColor(supplement.riskStatus);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name} numberOfLines={2}>
              {supplement.name}
            </Text>
            {supplement.dosage && (
              <Text style={styles.dosage} numberOfLines={1}>
                {supplement.dosage}
              </Text>
            )}
          </View>
          {supplement.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: supplement.imageUrl }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>{renderStars(supplement.rating)}</View>
          <Text style={styles.ratingText}>({supplement.rating})</Text>
        </View>

        {/* Risk and Score */}
        <View style={styles.statusContainer}>
          <View style={styles.riskContainer}>
            {getRiskIcon(supplement.riskStatus)}
            <View style={[styles.riskBadge, riskStyle]}>
              <Text style={[styles.riskText, { color: riskStyle.color }]}>
                {supplement.riskStatus}
              </Text>
            </View>
          </View>
          <View style={[styles.scoreBadge, scoreStyle]}>
            <Text style={[styles.scoreText, { color: scoreStyle.color }]}>
              {supplement.score}/100
            </Text>
          </View>
        </View>

        {/* Description */}
        {supplement.description && (
          <Text style={styles.description} numberOfLines={2}>
            {supplement.description}
          </Text>
        )}

        {/* Alternative */}
        {supplement.alternativeName && (
          <View style={styles.alternativeContainer}>
            <View style={styles.alternativeHeader}>
              <Ionicons name="trending-up" size={12} color={COLORS.primary} />
              <Text style={styles.alternativeLabel}>Better Alternative</Text>
            </View>
            <Text style={styles.alternativeText} numberOfLines={1}>
              {supplement.alternativeName} (Score: {supplement.alternativeScore}
              /100)
            </Text>
          </View>
        )}

        {/* Cost */}
        {supplement.costPerMonth && (
          <Text style={styles.cost}>
            Cost: ~${supplement.costPerMonth}/month (NADAC)
          </Text>
        )}

        {/* Action Buttons */}
        {onHelpfulClick && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.helpfulButton]}
              onPress={() => onHelpfulClick(supplement, true)}
            >
              <Text style={styles.helpfulText}>👍 Helpful</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.notHelpfulButton]}
              onPress={() => onHelpfulClick(supplement, false)}
            >
              <Text style={styles.notHelpfulText}>👎 Not Helpful</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: SPACING.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  dosage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  imageContainer: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 32,
    height: 32,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stars: {
    flexDirection: 'row',
    marginRight: SPACING.xs,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  riskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginLeft: SPACING.xs,
  },
  riskText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  scoreBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  scoreText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  alternativeContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  alternativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  alternativeLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  alternativeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
  },
  cost: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  helpfulButton: {
    borderColor: COLORS.successLight,
    backgroundColor: COLORS.successLight,
  },
  notHelpfulButton: {
    borderColor: COLORS.errorLight,
    backgroundColor: COLORS.errorLight,
  },
  helpfulText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  notHelpfulText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
