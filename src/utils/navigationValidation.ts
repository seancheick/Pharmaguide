// src/utils/navigationValidation.ts
import { RootStackParamList } from '../types/navigation';

/**
 * Validates navigation parameters to ensure type safety
 */
export class NavigationValidator {
  /**
   * Validate ProductAnalysisResults parameters
   */
  static validateProductAnalysisParams(
    params: RootStackParamList['ProductAnalysisResults']
  ): boolean {
    if (!params) return false;
    
    // Must have at least one identifier
    const hasProductId = params.productId && typeof params.productId === 'string';
    const hasBarcode = params.barcode && typeof params.barcode === 'string';
    const hasProductData = params.productData && typeof params.productData === 'object';
    
    return hasProductId || hasBarcode || hasProductData;
  }

  /**
   * Validate Search parameters
   */
  static validateSearchParams(
    params: RootStackParamList['Search']
  ): boolean {
    if (!params) return true; // Search params are optional
    
    if (params.initialQuery && typeof params.initialQuery !== 'string') {
      return false;
    }
    
    return true;
  }

  /**
   * Sanitize and validate string parameters
   */
  static sanitizeStringParam(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return undefined;
  }

  /**
   * Validate and sanitize product data
   */
  static validateProductData(data: unknown): any | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const productData = data as any;
    
    // Basic validation for required fields
    if (!productData.name || typeof productData.name !== 'string') {
      return undefined;
    }

    return {
      ...productData,
      name: productData.name.trim(),
      brand: this.sanitizeStringParam(productData.brand),
      category: this.sanitizeStringParam(productData.category),
    };
  }

  /**
   * Create safe navigation parameters for ProductAnalysisResults
   */
  static createSafeProductAnalysisParams(params: {
    productId?: string;
    barcode?: string;
    productData?: any;
  }): RootStackParamList['ProductAnalysisResults'] | null {
    const safeParams: RootStackParamList['ProductAnalysisResults'] = {};
    
    if (params.productId) {
      const sanitized = this.sanitizeStringParam(params.productId);
      if (sanitized) safeParams.productId = sanitized;
    }
    
    if (params.barcode) {
      const sanitized = this.sanitizeStringParam(params.barcode);
      if (sanitized) safeParams.barcode = sanitized;
    }
    
    if (params.productData) {
      const validated = this.validateProductData(params.productData);
      if (validated) safeParams.productData = validated;
    }
    
    // Must have at least one valid parameter
    if (!safeParams.productId && !safeParams.barcode && !safeParams.productData) {
      return null;
    }
    
    return safeParams;
  }

  /**
   * Create safe navigation parameters for Search
   */
  static createSafeSearchParams(params?: {
    initialQuery?: string;
  }): RootStackParamList['Search'] | undefined {
    if (!params) return undefined;
    
    const safeParams: RootStackParamList['Search'] = {};
    
    if (params.initialQuery) {
      const sanitized = this.sanitizeStringParam(params.initialQuery);
      if (sanitized) safeParams.initialQuery = sanitized;
    }
    
    return Object.keys(safeParams).length > 0 ? safeParams : undefined;
  }
}

/**
 * Hook for safe navigation with parameter validation
 */
export const useSafeNavigation = () => {
  const navigateToProductAnalysis = (params: {
    productId?: string;
    barcode?: string;
    productData?: any;
  }) => {
    const safeParams = NavigationValidator.createSafeProductAnalysisParams(params);
    
    if (!safeParams) {
      console.error('Invalid parameters for ProductAnalysisResults navigation:', params);
      return false;
    }
    
    return safeParams;
  };

  const navigateToSearch = (params?: {
    initialQuery?: string;
  }) => {
    const safeParams = NavigationValidator.createSafeSearchParams(params);
    return safeParams;
  };

  return {
    navigateToProductAnalysis,
    navigateToSearch,
  };
};

/**
 * Runtime type checking for navigation parameters
 */
export const validateNavigationParams = <T extends keyof RootStackParamList>(
  screenName: T,
  params: RootStackParamList[T]
): boolean => {
  switch (screenName) {
    case 'ProductAnalysisResults':
      return NavigationValidator.validateProductAnalysisParams(
        params as RootStackParamList['ProductAnalysisResults']
      );
    case 'Search':
      return NavigationValidator.validateSearchParams(
        params as RootStackParamList['Search']
      );
    default:
      return true; // Allow other screens to pass through
  }
};

/**
 * Error messages for navigation validation failures
 */
export const NAVIGATION_ERROR_MESSAGES = {
  INVALID_PRODUCT_PARAMS: 'Invalid product parameters. Please provide a product ID, barcode, or product data.',
  INVALID_SEARCH_PARAMS: 'Invalid search parameters.',
  MISSING_REQUIRED_PARAM: 'Missing required navigation parameter.',
  INVALID_PARAM_TYPE: 'Navigation parameter has invalid type.',
} as const;
