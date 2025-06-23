// src/screens/profile/CreditsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { CreditsScreenProps } from '../../types/navigation';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
}

interface Contributor {
  id: string;
  name: string;
  contribution: string;
  type: 'development' | 'design' | 'content' | 'research' | 'community';
}

interface DataSource {
  id: string;
  name: string;
  description: string;
  url?: string;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ navigation }) => {
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      role: 'Chief Medical Officer',
      description: 'Board-certified pharmacist with 15+ years of experience in clinical pharmacy and drug interactions.',
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Lead Developer',
      description: 'Full-stack developer specializing in React Native and healthcare applications.',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      role: 'UX/UI Designer',
      description: 'Product designer focused on creating intuitive healthcare experiences.',
    },
    {
      id: '4',
      name: 'Dr. James Wilson',
      role: 'Research Director',
      description: 'PhD in Pharmacology, leading research on supplement-drug interactions.',
    },
  ];

  const contributors: Contributor[] = [
    {
      id: '1',
      name: 'Community Beta Testers',
      contribution: 'Extensive testing and feedback during development',
      type: 'community',
    },
    {
      id: '2',
      name: 'Medical Advisory Board',
      contribution: 'Clinical guidance and medical review',
      type: 'research',
    },
    {
      id: '3',
      name: 'Open Source Contributors',
      contribution: 'Code contributions and bug fixes',
      type: 'development',
    },
    {
      id: '4',
      name: 'Content Reviewers',
      contribution: 'Fact-checking and content validation',
      type: 'content',
    },
  ];

  const dataSources: DataSource[] = [
    {
      id: '1',
      name: 'National Institutes of Health (NIH)',
      description: 'Supplement and drug interaction databases',
      url: 'https://www.nih.gov',
    },
    {
      id: '2',
      name: 'FDA Orange Book',
      description: 'Approved drug products database',
      url: 'https://www.fda.gov',
    },
    {
      id: '3',
      name: 'Natural Medicines Database',
      description: 'Evidence-based supplement information',
    },
    {
      id: '4',
      name: 'PubMed Research',
      description: 'Peer-reviewed scientific literature',
      url: 'https://pubmed.ncbi.nlm.nih.gov',
    },
    {
      id: '5',
      name: 'User Contributions',
      description: 'Community-submitted product information and corrections',
    },
  ];

  const getContributorIcon = (type: Contributor['type']) => {
    switch (type) {
      case 'development': return 'code';
      case 'design': return 'palette';
      case 'content': return 'article';
      case 'research': return 'science';
      case 'community': return 'people';
      default: return 'star';
    }
  };

  const getContributorColor = (type: Contributor['type']) => {
    switch (type) {
      case 'development': return COLORS.info;
      case 'design': return COLORS.secondary;
      case 'content': return COLORS.warning;
      case 'research': return COLORS.success;
      case 'community': return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  };

  const handleDataSourcePress = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const renderTeamMember = (member: TeamMember) => (
    <View key={member.id} style={styles.teamMemberCard}>
      <View style={styles.teamMemberAvatar}>
        <MaterialIcons name="person" size={24} color={COLORS.primary} />
      </View>
      <View style={styles.teamMemberInfo}>
        <Text style={styles.teamMemberName}>{member.name}</Text>
        <Text style={styles.teamMemberRole}>{member.role}</Text>
        <Text style={styles.teamMemberDescription}>{member.description}</Text>
      </View>
    </View>
  );

  const renderContributor = (contributor: Contributor) => (
    <View key={contributor.id} style={styles.contributorCard}>
      <View style={[
        styles.contributorIcon,
        { backgroundColor: `${getContributorColor(contributor.type)}20` }
      ]}>
        <MaterialIcons
          name={getContributorIcon(contributor.type) as any}
          size={20}
          color={getContributorColor(contributor.type)}
        />
      </View>
      <View style={styles.contributorInfo}>
        <Text style={styles.contributorName}>{contributor.name}</Text>
        <Text style={styles.contributorContribution}>{contributor.contribution}</Text>
      </View>
    </View>
  );

  const renderDataSource = (source: DataSource) => (
    <TouchableOpacity
      key={source.id}
      style={styles.dataSourceCard}
      onPress={() => handleDataSourcePress(source.url)}
      activeOpacity={source.url ? 0.7 : 1}
    >
      <View style={styles.dataSourceInfo}>
        <Text style={styles.dataSourceName}>{source.name}</Text>
        <Text style={styles.dataSourceDescription}>{source.description}</Text>
      </View>
      {source.url && (
        <Ionicons name="open" size={16} color={COLORS.textSecondary} />
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
        <Text style={styles.title}>Credits & Acknowledgments</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introduction}>
          <MaterialIcons name="favorite" size={32} color={COLORS.error} />
          <Text style={styles.introTitle}>Made with ❤️</Text>
          <Text style={styles.introText}>
            Pharmaguide is made possible by the dedication of our team, 
            the contributions of our community, and the support of trusted data sources.
          </Text>
        </View>

        {/* Core Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Core Team</Text>
          <View style={styles.teamContainer}>
            {teamMembers.map(renderTeamMember)}
          </View>
        </View>

        {/* Contributors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contributors & Supporters</Text>
          <View style={styles.contributorsContainer}>
            {contributors.map(renderContributor)}
          </View>
        </View>

        {/* Data Sources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sources & Partners</Text>
          <Text style={styles.sectionSubtitle}>
            We rely on trusted sources for accurate health information
          </Text>
          <View style={styles.dataSourcesContainer}>
            {dataSources.map(renderDataSource)}
          </View>
        </View>

        {/* Special Thanks */}
        <View style={styles.specialThanks}>
          <Text style={styles.specialThanksTitle}>Special Thanks</Text>
          <Text style={styles.specialThanksText}>
            • Healthcare professionals who provided clinical guidance
          </Text>
          <Text style={styles.specialThanksText}>
            • Beta testers who helped refine the user experience
          </Text>
          <Text style={styles.specialThanksText}>
            • Open source community for foundational technologies
          </Text>
          <Text style={styles.specialThanksText}>
            • Users who contribute product information and feedback
          </Text>
        </View>

        {/* Open Source */}
        <View style={styles.openSourceSection}>
          <Text style={styles.openSourceTitle}>Open Source</Text>
          <Text style={styles.openSourceText}>
            Pharmaguide is built using open source technologies. 
            View the complete list of open source licenses and attributions.
          </Text>
          <TouchableOpacity
            style={styles.openSourceButton}
            onPress={() => navigation.navigate('LicensesScreen')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="code" size={18} color={COLORS.white} />
            <Text style={styles.openSourceButtonText}>View Licenses</Text>
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Want to Contribute?</Text>
          <Text style={styles.contactText}>
            We welcome contributions from the community. Whether you're a developer, 
            healthcare professional, or user with feedback, we'd love to hear from you.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('ContactSupportScreen')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="volunteer-activism" size={18} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Get Involved</Text>
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
  introduction: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.primaryLight,
    marginBottom: SPACING.lg,
  },
  introTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  teamContainer: {
    gap: SPACING.md,
  },
  teamMemberCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  teamMemberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  teamMemberRole: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xs,
  },
  teamMemberDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  contributorsContainer: {
    gap: SPACING.sm,
  },
  contributorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
  },
  contributorIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  contributorContribution: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  dataSourcesContainer: {
    gap: SPACING.sm,
  },
  dataSourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
  },
  dataSourceInfo: {
    flex: 1,
  },
  dataSourceName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  dataSourceDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  specialThanks: {
    backgroundColor: COLORS.successLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  specialThanksTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  specialThanksText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  openSourceSection: {
    backgroundColor: COLORS.infoLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  openSourceTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  openSourceText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  openSourceButton: {
    backgroundColor: COLORS.info,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  openSourceButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  contactSection: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  contactText: {
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
