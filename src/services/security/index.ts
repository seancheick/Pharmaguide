// src/services/security/index.ts
export { securityService } from './securityService';
export { securityHeaders } from './securityHeaders';

// Export types
export type { 
  SecurityConfig, 
  SecurityViolation, 
  ValidationResult,
  InputType 
} from './securityService';

export type { 
  SecurityHeadersConfig 
} from './securityHeaders';

import { securityService } from './securityService';
import { securityHeaders } from './securityHeaders';
import { logger } from '../monitoring/logger';

/**
 * Initialize all security services
 */
export const initializeSecurityServices = async (config: {
  environment: 'development' | 'staging' | 'production';
  enableOWASPValidation?: boolean;
  enableEnhancedHeaders?: boolean;
  maxRequestsPerMinute?: number;
}) => {
  try {
    logger.info('security', 'Initializing security services', { config });

    // Initialize security service
    securityService.initialize({
      enableInputSanitization: true,
      enableRateLimiting: config.environment === 'production',
      maxRequestsPerMinute: config.maxRequestsPerMinute || (config.environment === 'production' ? 60 : 1000),
      enableSQLInjectionProtection: true,
      enableXSSProtection: true,
      enableCSRFProtection: config.environment === 'production',
      enableOWASPValidation: config.enableOWASPValidation !== false,
      enablePathTraversalProtection: true,
      enableCommandInjectionProtection: true,
    });

    // Initialize security headers service
    if (config.enableEnhancedHeaders !== false) {
      securityHeaders.initialize({
        enableCSP: true,
        enableHSTS: config.environment === 'production',
        enableXFrameOptions: true,
        enableXContentTypeOptions: true,
        enableXXSSProtection: true,
        enableReferrerPolicy: true,
        enablePermissionsPolicy: true,
        environment: config.environment,
      });
    }

    logger.info('security', 'Security services initialized successfully');
  } catch (error) {
    logger.error('security', 'Failed to initialize security services', error);
    throw error;
  }
};
