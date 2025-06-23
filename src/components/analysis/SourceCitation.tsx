// src/components/analysis/SourceCitation.tsx
// 📚 SOURCE CITATION & EVIDENCE ATTRIBUTION
// Transparent source references for user trust

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Linking,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SourceReference {
  id: string;
  type: 'FDA' | 'NIH' | 'PUBMED' | 'CLINICAL_TRIAL' | 'TEXTBOOK' | 'GUIDELINE';
  title: string;
  authors?: string[];
  journal?: string;
  year?: number;
  url?: string;
  doi?: string;
  pmid?: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  relevanceScore: number; // 0-1
  excerpt?: string;
}

interface SourceCitationProps {
  sources: SourceReference[];
  compact?: boolean;
  maxVisible?: number;
  onSourcePress?: (source: SourceReference) => void;
}

/**
 * 📚 Source Citation Component
 * - Displays evidence sources with proper attribution
 * - Links to original sources when available
 * - Evidence quality indicators
 * - Expandable source details
 */
export const SourceCitation: React.FC<SourceCitationProps> = ({
  sources,
  compact = false,
  maxVisible = 3,
  onSourcePress,
}) => {
  const [showAllSources, setShowAllSources] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceReference | null>(null);

  const visibleSources = showAllSources ? sources : sources.slice(0, maxVisible);
  const hasMoreSources = sources.length > maxVisible;

  const handleSourcePress = (source: SourceReference) => {
    if (onSourcePress) {
      onSourcePress(source);
    } else {
      setSelectedSource(source);
    }
  };

  const openSourceUrl = async (source: SourceReference) => {
    if (source.url) {
      const supported = await Linking.canOpenURL(source.url);
      if (supported) {
        await Linking.openURL(source.url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } else if (source.pmid) {
      const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`;
      await Linking.openURL(pubmedUrl);
    } else if (source.doi) {
      const doiUrl = `https://doi.org/${source.doi}`;
      await Linking.openURL(doiUrl);
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="library-outline" size={12} color="#666" />
        <Text style={styles.compactText}>
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={() => setShowAllSources(true)}>
          <Text style={styles.viewAllText}>View</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="library" size={16} color="#007AFF" />
        <Text style={styles.headerText}>Evidence Sources</Text>
        <Text style={styles.countText}>({sources.length})</Text>
      </View>

      {visibleSources.map((source, index) => (
        <SourceItem
          key={source.id}
          source={source}
          index={index + 1}
          onPress={() => handleSourcePress(source)}
        />
      ))}

      {hasMoreSources && !showAllSources && (
        <TouchableOpacity 
          style={styles.showMoreButton}
          onPress={() => setShowAllSources(true)}
        >
          <Text style={styles.showMoreText}>
            Show {sources.length - maxVisible} more sources
          </Text>
          <Ionicons name="chevron-down" size={14} color="#007AFF" />
        </TouchableOpacity>
      )}

      {/* Source Detail Modal */}
      <Modal
        visible={selectedSource !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSource(null)}
      >
        {selectedSource && (
          <SourceDetailModal
            source={selectedSource}
            onClose={() => setSelectedSource(null)}
            onOpenUrl={() => openSourceUrl(selectedSource)}
          />
        )}
      </Modal>
    </View>
  );
};

/**
 * Individual source item component
 */
interface SourceItemProps {
  source: SourceReference;
  index: number;
  onPress: () => void;
}

const SourceItem: React.FC<SourceItemProps> = ({ source, index, onPress }) => {
  const typeConfig = getSourceTypeConfig(source.type);
  const gradeColor = getEvidenceGradeColor(source.evidenceLevel);

  return (
    <TouchableOpacity style={styles.sourceItem} onPress={onPress}>
      <View style={styles.sourceHeader}>
        <View style={styles.sourceNumber}>
          <Text style={styles.sourceNumberText}>{index}</Text>
        </View>
        <View style={[styles.sourceType, { backgroundColor: typeConfig.color }]}>
          <Text style={styles.sourceTypeText}>{typeConfig.label}</Text>
        </View>
        <View style={[styles.evidenceGrade, { backgroundColor: gradeColor }]}>
          <Text style={styles.evidenceGradeText}>{source.evidenceLevel}</Text>
        </View>
      </View>
      
      <Text style={styles.sourceTitle} numberOfLines={2}>
        {source.title}
      </Text>
      
      {source.authors && source.authors.length > 0 && (
        <Text style={styles.sourceAuthors} numberOfLines={1}>
          {source.authors.slice(0, 3).join(', ')}
          {source.authors.length > 3 && ' et al.'}
        </Text>
      )}
      
      {source.journal && source.year && (
        <Text style={styles.sourceJournal}>
          {source.journal} ({source.year})
        </Text>
      )}
      
      <View style={styles.sourceFooter}>
        <View style={styles.relevanceScore}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.relevanceText}>
            {Math.round(source.relevanceScore * 100)}% relevant
          </Text>
        </View>
        {(source.url || source.pmid || source.doi) && (
          <Ionicons name="link" size={12} color="#007AFF" />
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Source detail modal
 */
interface SourceDetailModalProps {
  source: SourceReference;
  onClose: () => void;
  onOpenUrl: () => void;
}

const SourceDetailModal: React.FC<SourceDetailModalProps> = ({
  source,
  onClose,
  onOpenUrl,
}) => {
  const typeConfig = getSourceTypeConfig(source.type);
  const gradeColor = getEvidenceGradeColor(source.evidenceLevel);

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Source Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.modalSourceHeader}>
          <View style={[styles.modalSourceType, { backgroundColor: typeConfig.color }]}>
            <Text style={styles.modalSourceTypeText}>{typeConfig.label}</Text>
          </View>
          <View style={[styles.modalEvidenceGrade, { backgroundColor: gradeColor }]}>
            <Text style={styles.modalEvidenceGradeText}>
              Grade {source.evidenceLevel}
            </Text>
          </View>
        </View>

        <Text style={styles.modalSourceTitle}>{source.title}</Text>

        {source.authors && source.authors.length > 0 && (
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Authors</Text>
            <Text style={styles.modalSectionText}>
              {source.authors.join(', ')}
            </Text>
          </View>
        )}

        {source.journal && (
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Publication</Text>
            <Text style={styles.modalSectionText}>
              {source.journal}
              {source.year && ` (${source.year})`}
            </Text>
          </View>
        )}

        {source.excerpt && (
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Relevant Excerpt</Text>
            <Text style={styles.modalSectionText}>{source.excerpt}</Text>
          </View>
        )}

        <View style={styles.modalSection}>
          <Text style={styles.modalSectionTitle}>Evidence Quality</Text>
          <Text style={styles.modalSectionText}>
            Grade {source.evidenceLevel} - {getEvidenceGradeDescription(source.evidenceLevel)}
          </Text>
        </View>

        <View style={styles.modalSection}>
          <Text style={styles.modalSectionTitle}>Relevance Score</Text>
          <Text style={styles.modalSectionText}>
            {Math.round(source.relevanceScore * 100)}% - {getRelevanceDescription(source.relevanceScore)}
          </Text>
        </View>

        {(source.pmid || source.doi) && (
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Identifiers</Text>
            {source.pmid && (
              <Text style={styles.modalSectionText}>PMID: {source.pmid}</Text>
            )}
            {source.doi && (
              <Text style={styles.modalSectionText}>DOI: {source.doi}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {(source.url || source.pmid || source.doi) && (
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.openUrlButton} onPress={onOpenUrl}>
            <Ionicons name="open-outline" size={20} color="#FFFFFF" />
            <Text style={styles.openUrlText}>Open Source</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Helper functions

function getSourceTypeConfig(type: SourceReference['type']) {
  switch (type) {
    case 'FDA':
      return { label: 'FDA', color: '#34C759' };
    case 'NIH':
      return { label: 'NIH', color: '#007AFF' };
    case 'PUBMED':
      return { label: 'PubMed', color: '#5856D6' };
    case 'CLINICAL_TRIAL':
      return { label: 'Clinical Trial', color: '#AF52DE' };
    case 'TEXTBOOK':
      return { label: 'Textbook', color: '#FF9500' };
    case 'GUIDELINE':
      return { label: 'Guideline', color: '#FF2D92' };
    default:
      return { label: 'Unknown', color: '#8E8E93' };
  }
}

function getEvidenceGradeColor(grade: 'A' | 'B' | 'C' | 'D') {
  switch (grade) {
    case 'A': return '#34C759';
    case 'B': return '#007AFF';
    case 'C': return '#FF9500';
    case 'D': return '#FF3B30';
  }
}

function getEvidenceGradeDescription(grade: 'A' | 'B' | 'C' | 'D') {
  switch (grade) {
    case 'A': return 'High-quality evidence from well-designed studies';
    case 'B': return 'Moderate-quality evidence with some limitations';
    case 'C': return 'Low-quality evidence with significant limitations';
    case 'D': return 'Very low-quality evidence or expert opinion';
  }
}

function getRelevanceDescription(score: number) {
  if (score >= 0.8) return 'Highly relevant to your query';
  if (score >= 0.6) return 'Moderately relevant to your query';
  if (score >= 0.4) return 'Somewhat relevant to your query';
  return 'Limited relevance to your query';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  compactText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  viewAllText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 8,
  },
  sourceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sourceNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sourceType: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  sourceTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  evidenceGrade: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  evidenceGradeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
  },
  sourceAuthors: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  sourceJournal: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  sourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relevanceScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relevanceText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 3,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  modalSourceType: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  modalSourceTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalEvidenceGrade: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modalEvidenceGradeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSourceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    lineHeight: 26,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  openUrlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  openUrlText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
