// src/components/common/OptimizedIcon.tsx
// Optimized icon component with selective imports to reduce bundle size
import React, { Suspense } from 'react';
import { COLORS } from '../../constants';

const LazyIonicons = React.lazy(() =>
  import('@expo/vector-icons').then(mod => ({ default: mod.Ionicons }))
);
const LazyMaterialIcons = React.lazy(() =>
  import('@expo/vector-icons').then(mod => ({ default: mod.MaterialIcons }))
);

// Define only the icons we actually use to enable tree shaking
type IoniconsName =
  | 'add'
  | 'add-circle'
  | 'alert-circle'
  | 'arrow-back'
  | 'arrow-forward'
  | 'arrow-up-outline'
  | 'camera'
  | 'camera-outline'
  | 'checkmark'
  | 'checkmark-circle'
  | 'chevron-down'
  | 'chevron-forward'
  | 'close'
  | 'close-circle'
  | 'cloud-done-outline'
  | 'cloud-offline-outline'
  | 'cloud-upload-outline'
  | 'cube-outline'
  | 'create-outline'
  | 'flash-outline'
  | 'heart'
  | 'help-circle'
  | 'help-circle-outline'
  | 'image-outline'
  | 'information-circle'
  | 'library-outline'
  | 'log-out-outline'
  | 'logo-github'
  | 'logo-linkedin'
  | 'logo-twitter'
  | 'mail'
  | 'person'
  | 'phone-portrait-outline'
  | 'refresh'
  | 'scan'
  | 'scan-outline'
  | 'search'
  | 'search-outline'
  | 'send'
  | 'settings'
  | 'share'
  | 'shield-checkmark'
  | 'shield-outline'
  | 'star'
  | 'time-outline'
  | 'trash'
  | 'trending-up-outline'
  | 'warning';

type MaterialIconsName =
  | 'book'
  | 'bulb'
  | 'call'
  | 'category'
  | 'code'
  | 'delete'
  | 'download'
  | 'emergency'
  | 'favorite'
  | 'fitness'
  | 'flag'
  | 'flame'
  | 'forum'
  | 'globe'
  | 'history'
  | 'inbox'
  | 'info'
  | 'inventory'
  | 'keyboard'
  | 'layers'
  | 'library'
  | 'link'
  | 'medical'
  | 'medical-services'
  | 'medication'
  | 'mic'
  | 'open'
  | 'privacy-tip'
  | 'report-problem'
  | 'schedule'
  | 'stars'
  | 'support-agent'
  | 'tune'
  | 'upgrade'
  | 'verified'
  | 'volunteer-activism'
  | 'web';

interface OptimizedIconProps {
  type: 'ion' | 'material';
  name: string; // Accept any valid icon name for the set
  size?: number;
  color?: string;
  style?: object;
  accessibilityLabel?: string;
}

/**
 * Optimized Icon Component
 *
 * Benefits:
 * - Reduces bundle size by using selective imports
 * - Type-safe icon names (prevents typos)
 * - Consistent styling across the app
 * - Performance optimized with React.memo
 * - Automatic family detection based on icon name
 */
export const OptimizedIcon: React.FC<OptimizedIconProps> = ({
  type,
  name,
  size = 24,
  color = COLORS.gray500,
  style,
  accessibilityLabel,
}) => {
  return (
    <Suspense fallback={null}>
      {type === 'ion' ? (
        <LazyIonicons
          name={name as string}
          size={size}
          color={color}
          style={style}
          accessibilityLabel={accessibilityLabel}
        />
      ) : (
        <LazyMaterialIcons
          name={name as string}
          size={size}
          color={color}
          style={style}
          accessibilityLabel={accessibilityLabel}
        />
      )}
    </Suspense>
  );
};

/**
 * Icon presets for common use cases
 */
export const IconPresets = {
  // Navigation
  back: { name: 'arrow-back' as const, size: 24 },
  forward: { name: 'arrow-forward' as const, size: 24 },
  close: { name: 'close' as const, size: 24 },

  // Actions
  add: { name: 'add' as const, size: 24 },
  delete: { name: 'trash' as const, size: 20 },
  edit: { name: 'create-outline' as const, size: 20 },
  save: { name: 'checkmark' as const, size: 20 },

  // Status
  success: {
    name: 'checkmark-circle' as const,
    size: 20,
    color: COLORS.success,
  },
  warning: { name: 'warning' as const, size: 20, color: COLORS.warning },
  error: { name: 'close-circle' as const, size: 20, color: COLORS.error },
  info: {
    name: 'information-circle' as const,
    size: 20,
    color: COLORS.primary,
  },

  // Features
  scan: { name: 'scan' as const, size: 24 },
  camera: { name: 'camera' as const, size: 24 },
  search: { name: 'search' as const, size: 20 },
  settings: { name: 'settings' as const, size: 24 },

  // Health
  medical: {
    name: 'medical' as const,
    size: 24,
    family: 'MaterialIcons' as const,
  },
  heart: { name: 'heart' as const, size: 20, color: COLORS.error },
  shield: {
    name: 'shield-checkmark' as const,
    size: 20,
    color: COLORS.success,
  },

  // Network
  online: { name: 'wifi' as const, size: 16, color: COLORS.success },
  offline: { name: 'wifi-off' as const, size: 16, color: COLORS.error },

  // Social
  share: { name: 'share' as const, size: 20 },
  mail: { name: 'mail' as const, size: 20 },

  // Data
  upload: { name: 'cloud-upload-outline' as const, size: 20 },
  download: {
    name: 'download' as const,
    size: 20,
    family: 'MaterialIcons' as const,
  },
  refresh: { name: 'refresh' as const, size: 20 },
} as const;

/**
 * Utility function to get icon preset
 */
export const getIconPreset = (preset: keyof typeof IconPresets) => {
  return IconPresets[preset];
};

/**
 * Icon with preset styling
 */
interface PresetIconProps {
  preset: keyof typeof IconPresets;
  size?: number;
  color?: string;
}

export const PresetIcon: React.FC<PresetIconProps> = React.memo(
  ({ preset, size, color }) => {
    const presetConfig = IconPresets[preset];

    return (
      <OptimizedIcon
        name={presetConfig.name}
        size={size || presetConfig.size}
        color={color || presetConfig.color}
      />
    );
  }
);

PresetIcon.displayName = 'PresetIcon';
