// src/components/home/SupplementCard.tsx
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../../constants';

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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: ANIMATIONS.DURATION.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0,
        duration: ANIMATIONS.DURATION.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons
          key={`full-${i}`}
          name="star"
          size={14}
          color={COLORS.warning}
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons
          key="half"
          name="star-half"
          size={14}
          color={COLORS.warning}
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={14}
          color={COLORS.gray300}
        />
      );
    }

    return stars;
  };

  const getScoreGradient = (score: number): string[] => {
    if (score >= 80) return [COLORS.success, COLORS.successLight];
    if (score >= 60) return [COLORS.warning, COLORS.warningLight];
    return [COLORS.error, COLORS.errorLight];
  };

  const getRiskConfig = (status: string) => {
    switch (status) {
      case 'Safe':
        return {
          icon: (
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={COLORS.success}
            />
          ),
          colors: [COLORS.success, COLORS.successLight],
          textColor: COLORS.success,
        };
      case 'Caution':
        return {
          icon: (
            <MaterialIcons name="warning" size={14} color={COLORS.warning} />
          ),
          colors: [COLORS.warning, COLORS.warningLight],
          textColor: COLORS.warning,
        };
      case 'High Risk':
        return {
          icon: <Ionicons name="alert-circle" size={14} color={COLORS.error} />,
          colors: [COLORS.error, COLORS.errorLight],
          textColor: COLORS.error,
        };
      default:
        return {
          icon: null,
          colors: [COLORS.gray400, COLORS.gray300],
          textColor: COLORS.textSecondary,
        };
    }
  };

  const riskConfig = getRiskConfig(supplement.riskStatus);
  const animatedShadowStyle = {
    shadowOpacity: shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.15, 0.25],
    }),
    shadowRadius: shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 20],
    }),
    elevation: shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [5, 8],
    }),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.card,
          animatedShadowStyle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="light" style={styles.blurContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.8)', 'rgba(249,250,251,0.8)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientOverlay}
            />
            <CardContent
              supplement={supplement}
              riskConfig={riskConfig}
              renderStars={renderStars}
              getScoreGradient={getScoreGradient}
              onHelpfulClick={onHelpfulClick}
            />
          </BlurView>
        ) : (
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(249,250,251,0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.androidContainer}
          >
            <CardContent
              supplement={supplement}
              riskConfig={riskConfig}
              renderStars={renderStars}
              getScoreGradient={getScoreGradient}
              onHelpfulClick={onHelpfulClick}
            />
          </LinearGradient>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Separate component for card content to avoid duplication
const CardContent: React.FC<any> = ({
  supplement,
  riskConfig,
  renderStars,
  getScoreGradient,
  onHelpfulClick,
}) => (
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

      {/* Product Image with Glass Effect */}
      <View style={styles.imageContainer}>
        {supplement.imageUrl ? (
          <>
            <Image
              source={{ uri: supplement.imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'transparent']}
              style={styles.imageGloss}
            />
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cube-outline" size={28} color={COLORS.gray400} />
          </View>
        )}
      </View>
    </View>

    {/* Rating */}
    <View style={styles.ratingContainer}>
      <View style={styles.stars}>{renderStars(supplement.rating)}</View>
      <Text style={styles.ratingText}>({supplement.rating.toFixed(1)})</Text>
      {supplement.evidence && (
        <View style={styles.evidenceBadge}>
          <Text style={styles.evidenceText}>
            Evidence: {supplement.evidence}
          </Text>
        </View>
      )}
    </View>

    {/* Risk and Score with Modern Badges */}
    <View style={styles.statusContainer}>
      <LinearGradient
        colors={riskConfig.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.riskGradient}
      >
        {riskConfig.icon}
        <Text style={[styles.riskText, { color: COLORS.white }]}>
          {supplement.riskStatus}
        </Text>
      </LinearGradient>

      <LinearGradient
        colors={getScoreGradient(supplement.score)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.scoreGradient}
      >
        <Text style={[styles.scoreText, { color: COLORS.white }]}>
          {supplement.score}/100
        </Text>
      </LinearGradient>
    </View>

    {/* Description */}
    {supplement.description && (
      <Text style={styles.description} numberOfLines={2}>
        {supplement.description}
      </Text>
    )}

    {/* Alternative Recommendation */}
    {supplement.alternativeName && (
      <LinearGradient
        colors={['rgba(37, 99, 235, 0.05)', 'rgba(37, 99, 235, 0.02)']}
        style={styles.alternativeContainer}
      >
        <View style={styles.alternativeHeader}>
          <Ionicons name="trending-up" size={12} color={COLORS.primary} />
          <Text style={styles.alternativeLabel}>Better Alternative</Text>
        </View>
        <Text style={styles.alternativeText} numberOfLines={1}>
          {supplement.alternativeName} • Score: {supplement.alternativeScore}
          /100
        </Text>
      </LinearGradient>
    )}

    {/* Cost Info */}
    {supplement.costPerMonth && (
      <View style={styles.costContainer}>
        <Ionicons
          name="pricetag-outline"
          size={12}
          color={COLORS.textSecondary}
        />
        <Text style={styles.cost}>~${supplement.costPerMonth}/month</Text>
      </View>
    )}

    {/* Action Buttons with Glass Effect */}
    {onHelpfulClick && (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.helpfulButton]}
          onPress={() => onHelpfulClick(supplement, true)}
          activeOpacity={0.8}
        >
          <Text style={styles.helpfulText}>👍 Helpful</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.notHelpfulButton]}
          onPress={() => onHelpfulClick(supplement, false)}
          activeOpacity={0.8}
        >
          <Text style={styles.notHelpfulText}>👎 Not Helpful</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: 320,
    borderRadius: 24,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  blurContainer: {
    flex: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  androidContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    padding: SPACING.lg,
    ...StyleSheet.absoluteFillObject,
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
    letterSpacing: -0.3,
  },
  dosage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: 40,
    height: 40,
  },
  imageGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  evidenceBadge: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 8,
  },
  evidenceText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  riskGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  riskText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  scoreGradient: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
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
    padding: SPACING.sm,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
  },
  alternativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  alternativeLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alternativeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  cost: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  helpfulButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  notHelpfulButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  helpfulText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  notHelpfulText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
