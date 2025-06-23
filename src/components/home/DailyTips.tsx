// src/components/home/DailyTips.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;

interface DailyTip {
  id: string;
  title: string;
  content: string;
  category: 'nutrition' | 'exercise' | 'sleep' | 'mental' | 'supplement';
  icon: string;
  iconLibrary: 'ionicons' | 'material';
}

const DAILY_TIPS: DailyTip[] = [
  {
    id: '1',
    title: 'Vitamin D Absorption',
    content:
      'Take vitamin D supplements with a meal containing healthy fats to improve absorption by up to 50%.',
    category: 'supplement',
    icon: 'sunny',
    iconLibrary: 'ionicons',
  },
  {
    id: '2',
    title: 'Hydration Timing',
    content:
      'Drink water 30 minutes before meals to aid digestion and nutrient absorption.',
    category: 'nutrition',
    icon: 'water',
    iconLibrary: 'ionicons',
  },
  {
    id: '3',
    title: 'Sleep & Recovery',
    content:
      'Aim for 7-9 hours of sleep nightly. Quality sleep enhances immune function and supplement effectiveness.',
    category: 'sleep',
    icon: 'moon',
    iconLibrary: 'ionicons',
  },
  {
    id: '4',
    title: 'Magnesium Benefits',
    content:
      'Take magnesium 2 hours before bed to improve sleep quality and muscle recovery.',
    category: 'supplement',
    icon: 'fitness',
    iconLibrary: 'ionicons',
  },
  {
    id: '5',
    title: 'Omega-3 Timing',
    content:
      'Take fish oil supplements with your largest meal to reduce fishy aftertaste and improve absorption.',
    category: 'supplement',
    icon: 'restaurant',
    iconLibrary: 'ionicons',
  },
  {
    id: '6',
    title: 'Iron Absorption',
    content:
      'Avoid taking iron supplements with coffee or tea. Vitamin C enhances iron absorption.',
    category: 'supplement',
    icon: 'leaf',
    iconLibrary: 'ionicons',
  },
  {
    id: '7',
    title: 'Stress Management',
    content:
      'Practice deep breathing for 5 minutes daily. Chronic stress can deplete essential nutrients.',
    category: 'mental',
    icon: 'heart',
    iconLibrary: 'ionicons',
  },
];

const getCategoryColor = (category: DailyTip['category']): string => {
  switch (category) {
    case 'nutrition':
      return COLORS.success;
    case 'exercise':
      return COLORS.warning;
    case 'sleep':
      return COLORS.info;
    case 'mental':
      return COLORS.secondary;
    case 'supplement':
      return COLORS.primary;
    default:
      return COLORS.primary;
  }
};

const getCategoryLabel = (category: DailyTip['category']): string => {
  switch (category) {
    case 'nutrition':
      return 'Nutrition';
    case 'exercise':
      return 'Exercise';
    case 'sleep':
      return 'Sleep';
    case 'mental':
      return 'Mental Health';
    case 'supplement':
      return 'Supplements';
    default:
      return 'Health';
  }
};

export const DailyTips: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get daily tip based on current date
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000
    );
    const tipIndex = dayOfYear % DAILY_TIPS.length;
    setCurrentIndex(tipIndex);

    // Scroll to the daily tip after a short delay
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: tipIndex * CARD_WIDTH,
        animated: false,
      });
    }, 100);
  }, []);

  const handlePrevTip = () => {
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : DAILY_TIPS.length - 1;
    setCurrentIndex(prevIndex);
    scrollViewRef.current?.scrollTo({
      x: prevIndex * CARD_WIDTH,
      animated: true,
    });
  };

  const handleNextTip = () => {
    const nextIndex = (currentIndex + 1) % DAILY_TIPS.length;
    setCurrentIndex(nextIndex);
    scrollViewRef.current?.scrollTo({
      x: nextIndex * CARD_WIDTH,
      animated: true,
    });
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / CARD_WIDTH);
    if (
      newIndex !== currentIndex &&
      newIndex >= 0 &&
      newIndex < DAILY_TIPS.length
    ) {
      setCurrentIndex(newIndex);
    }
  };

  const currentTip = DAILY_TIPS[currentIndex];
  const categoryColor = getCategoryColor(currentTip.category);
  const categoryLabel = getCategoryLabel(currentTip.category);

  const renderIcon = (tip: DailyTip) => {
    const color = getCategoryColor(tip.category);
    if (tip.iconLibrary === 'material') {
      return <MaterialIcons name={tip.icon as any} size={24} color={color} />;
    }
    return <Ionicons name={tip.icon as any} size={24} color={color} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="bulb" size={20} color={COLORS.warning} />
          <Text style={styles.sectionTitle}>Daily Health Tip</Text>
        </View>
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevTip}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextTip}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {DAILY_TIPS.map((tip, index) => {
          const tipCategoryColor = getCategoryColor(tip.category);
          const tipCategoryLabel = getCategoryLabel(tip.category);

          return (
            <View key={tip.id} style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${tipCategoryColor}15` },
                  ]}
                >
                  {renderIcon(tip)}
                </View>
                <View style={styles.tipMeta}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: `${tipCategoryColor}20` },
                    ]}
                  >
                    <Text
                      style={[styles.categoryText, { color: tipCategoryColor }]}
                    >
                      {tipCategoryLabel}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.tipContent}>{tip.content}</Text>

              <View style={styles.tipFooter}>
                <View style={styles.progressDots}>
                  {DAILY_TIPS.map((_, dotIndex) => (
                    <View
                      key={dotIndex}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            dotIndex === currentIndex
                              ? tipCategoryColor
                              : COLORS.gray300,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.tipNumber}>
                  {currentIndex + 1} of {DAILY_TIPS.length}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContainer: {
    paddingLeft: SPACING.lg,
  },
  tipCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    width: CARD_WIDTH,
    marginRight: SPACING.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  tipMeta: {
    flex: 1,
  },
  tipTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipContent: {
    fontSize: TYPOGRAPHY.sizes.base,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  tipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  tipNumber: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
