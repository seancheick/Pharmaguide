// src/hooks/index.ts

// Authentication & User Management
export { useAuth } from './useAuth';
export { useAuthMode } from './useAuthMode';
export { useNewHealthProfile } from './useNewHealthProfile';
// Legacy exports for backward compatibility
export { useHealthProfile } from './useHealthProfile';
export { useSetupProgress } from './useSetupProgress';

// Navigation & Routing
export { useNavigationGuard } from './useNavigationGuard';
export { useNavigationRecovery } from './useNavigationRecovery';
export { useNavigationState } from './useNavigationState';
export { useDeepLinking } from './useDeepLinking';

// Data & Analysis
export { useHomeData } from './useHomeData';
export { useProductAnalysis } from './useProductAnalysis';
export { useStackAnalysis } from './useStackAnalysis';
export { useStackHealth } from './useStackHealth';

// Forms & Validation
export { useFormValidation } from './useFormValidation';
export { useFormPersistence } from './useFormPersistence';

// Performance & Optimization
export {
  useVisibilityTracking,
  useSimpleVisibilityTracking,
  useVisibilityPreloader,
} from './useVisibilityTracking';
export {
  usePerformanceMonitoring,
  useOperationMonitoring,
} from './usePerformanceMonitoring';

// Device & Hardware
export { useCameraLifecycle } from './useCameraLifecycle';
export { useNetworkState } from './useNetworkState';
export { useAccessibility } from './useAccessibility';
export {
  useVoiceNavigation,
  useSimpleVoiceNavigation,
} from './useVoiceNavigation';

// Compliance & Legal
export { useAIConsent } from './useAIConsent';
export { useFDACompliance } from './useFDACompliance';

// UI & UX
export { useToast } from './useToast';

// Utilities
export { useAsyncEffect } from './useAsyncEffect';
