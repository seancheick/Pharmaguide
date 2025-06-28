// src/tests/mocks/serviceMocks.ts
// Comprehensive service mocks for testing

import { jest } from '@jest/globals';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
  functions: {
    invoke: jest.fn(),
  },
};

// Mock Storage Adapter
export const mockStorageAdapter = {
  initialize: jest.fn().mockResolvedValue(undefined),
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  clear: jest.fn().mockResolvedValue(undefined),
  getSize: jest.fn().mockResolvedValue(0),
  contains: jest.fn().mockResolvedValue(false),
};

// Mock Performance Monitor
export const mockPerformanceMonitor = {
  initialize: jest.fn().mockResolvedValue(undefined),
  measure: jest.fn(),
  measureAsync: jest.fn().mockImplementation(async (name, fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return result;
  }),
  getMetrics: jest.fn().mockReturnValue({}),
  clearMetrics: jest.fn(),
  setThreshold: jest.fn(),
  onThresholdExceeded: jest.fn(),
};

// Mock AI Services
export const mockHuggingFaceService = {
  analyzeProduct: jest.fn().mockResolvedValue({
    safety_score: 85,
    interactions: [],
    recommendations: ['Take with food'],
    analysis: 'Product appears safe for general use',
  }),
  checkInteractions: jest.fn().mockResolvedValue([]),
  generateRecommendations: jest.fn().mockResolvedValue([]),
};

export const mockGroqService = {
  analyzeSupplementStack: jest.fn().mockResolvedValue({
    overall_safety: 'good',
    interactions: [],
    recommendations: ['Maintain current regimen'],
  }),
  chatCompletion: jest.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: 'This is a mock AI response for testing purposes.',
        },
      },
    ],
  }),
};

// Mock Product Search Service
export const mockProductSearchService = {
  searchByBarcode: jest.fn().mockResolvedValue({
    id: 'mock-product-123',
    name: 'Mock Vitamin D3',
    brand: 'Mock Brand',
    barcode: '1234567890123',
    ingredients: ['Vitamin D3', 'Cellulose'],
    serving_size: '1 capsule',
    servings_per_container: 60,
  }),
  searchByName: jest.fn().mockResolvedValue([
    {
      id: 'mock-product-123',
      name: 'Mock Vitamin D3',
      brand: 'Mock Brand',
      score: 0.95,
    },
    {
      id: 'mock-product-456',
      name: 'Mock Vitamin D3 2000 IU',
      brand: 'Another Brand',
      score: 0.87,
    },
  ]),
  getProductDetails: jest.fn().mockResolvedValue({
    id: 'mock-product-123',
    name: 'Mock Vitamin D3',
    brand: 'Mock Brand',
    description: 'High-quality vitamin D3 supplement',
    ingredients: ['Vitamin D3', 'Cellulose'],
    nutrition_facts: {
      serving_size: '1 capsule',
      servings_per_container: 60,
      vitamin_d3: '1000 IU',
    },
  }),
};

// Mock Interaction Service
export const mockInteractionService = {
  checkInteractions: jest.fn().mockResolvedValue([
    {
      id: 'interaction-123',
      supplement1: 'Vitamin D3',
      supplement2: 'Calcium',
      severity: 'moderate',
      description: 'May increase calcium absorption',
      recommendation: 'Monitor calcium levels',
      sources: ['NIH', 'Mayo Clinic'],
    },
  ]),
  getInteractionDetails: jest.fn().mockResolvedValue({
    id: 'interaction-123',
    description: 'Detailed interaction information',
    mechanism: 'Vitamin D3 enhances calcium absorption',
    clinical_significance: 'Generally beneficial but monitor levels',
    management: 'Take as directed and monitor calcium levels',
  }),
};

// Mock Navigation Services
export const mockNavigationStateManager = {
  initialize: jest.fn().mockResolvedValue(undefined),
  saveNavigationState: jest.fn().mockResolvedValue(undefined),
  restoreNavigationState: jest.fn().mockResolvedValue(null),
  clearNavigationState: jest.fn().mockResolvedValue(undefined),
  registerGuard: jest.fn(),
  unregisterGuard: jest.fn(),
  checkNavigationGuards: jest.fn().mockResolvedValue({ blocked: false }),
  clearAllGuards: jest.fn(),
  getActiveGuards: jest.fn().mockReturnValue({}),
  setUserId: jest.fn(),
};

export const mockDeepLinkingService = {
  initialize: jest.fn().mockResolvedValue(undefined),
  handleDeepLink: jest.fn().mockResolvedValue(true),
  parseDeepLink: jest.fn().mockReturnValue({
    route: 'home',
    params: {},
    isValid: true,
    requiresAuth: false,
  }),
  generateDeepLink: jest.fn().mockReturnValue('pharmaguide://test'),
  openExternalURL: jest.fn().mockResolvedValue(true),
};

// Mock Health Profile Service
export const mockHealthProfileService = {
  saveProfile: jest.fn().mockResolvedValue(undefined),
  loadProfile: jest.fn().mockResolvedValue({
    age_range: '25-34',
    sex: 'prefer_not_to_say',
    health_goals: ['general_wellness'],
    health_conditions: [],
    allergies: [],
    privacy_settings: {
      share_anonymous_data: false,
      ai_analysis_consent: true,
    },
  }),
  updateProfile: jest.fn().mockResolvedValue(undefined),
  deleteProfile: jest.fn().mockResolvedValue(undefined),
  validateProfile: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
};

// Mock Notification Service
export const mockNotificationService = {
  requestPermissions: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotification: jest.fn().mockResolvedValue('notification-id-123'),
  cancelNotification: jest.fn().mockResolvedValue(undefined),
  cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
  getScheduledNotifications: jest.fn().mockResolvedValue([]),
  handleNotificationReceived: jest.fn(),
  handleNotificationResponse: jest.fn(),
};

// Mock Analytics Service
export const mockAnalyticsService = {
  initialize: jest.fn().mockResolvedValue(undefined),
  trackEvent: jest.fn(),
  trackScreen: jest.fn(),
  trackError: jest.fn(),
  setUserProperties: jest.fn(),
  setUserId: jest.fn(),
  flush: jest.fn().mockResolvedValue(undefined),
};

// Mock Crash Reporting Service
export const mockCrashReportingService = {
  initialize: jest.fn().mockResolvedValue(undefined),
  recordError: jest.fn(),
  recordException: jest.fn(),
  setUserIdentifier: jest.fn(),
  setCustomKey: jest.fn(),
  log: jest.fn(),
  crash: jest.fn(),
};

// Mock Biometric Service
export const mockBiometricService = {
  isAvailable: jest.fn().mockResolvedValue(true),
  getSupportedTypes: jest.fn().mockResolvedValue(['fingerprint', 'faceId']),
  authenticate: jest.fn().mockResolvedValue({ success: true }),
  cancel: jest.fn(),
};

// Mock Camera Service
export const mockCameraService = {
  requestPermissions: jest.fn().mockResolvedValue({ status: 'granted' }),
  hasPermission: jest.fn().mockResolvedValue(true),
  takePicture: jest.fn().mockResolvedValue({
    uri: 'file://mock-image.jpg',
    width: 1920,
    height: 1080,
  }),
  startBarcodeScan: jest.fn(),
  stopBarcodeScan: jest.fn(),
};

// Mock File System Service
export const mockFileSystemService = {
  readFile: jest.fn().mockResolvedValue('mock file content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(true),
  getInfo: jest.fn().mockResolvedValue({
    size: 1024,
    modificationTime: Date.now(),
    isDirectory: false,
  }),
  makeDirectory: jest.fn().mockResolvedValue(undefined),
  readDirectory: jest.fn().mockResolvedValue(['file1.txt', 'file2.txt']),
};

// Mock Network Service
export const mockNetworkService = {
  isConnected: jest.fn().mockResolvedValue(true),
  getConnectionType: jest.fn().mockResolvedValue('wifi'),
  onConnectionChange: jest.fn(() => ({
    remove: jest.fn(),
  })),
  checkReachability: jest.fn().mockResolvedValue(true),
};

// Mock Haptic Service
export const mockHapticService = {
  impact: jest.fn().mockResolvedValue(undefined),
  notification: jest.fn().mockResolvedValue(undefined),
  selection: jest.fn().mockResolvedValue(undefined),
  isAvailable: jest.fn().mockResolvedValue(true),
};

// Mock Clipboard Service
export const mockClipboardService = {
  getString: jest.fn().mockResolvedValue('mock clipboard content'),
  setString: jest.fn().mockResolvedValue(undefined),
  hasString: jest.fn().mockResolvedValue(true),
  hasURL: jest.fn().mockResolvedValue(false),
  hasNumber: jest.fn().mockResolvedValue(false),
};

// Export all mocks as a single object for easy importing
export const ServiceMocks = {
  supabaseClient: mockSupabaseClient,
  storageAdapter: mockStorageAdapter,
  performanceMonitor: mockPerformanceMonitor,
  huggingFaceService: mockHuggingFaceService,
  groqService: mockGroqService,
  productSearchService: mockProductSearchService,
  interactionService: mockInteractionService,
  navigationStateManager: mockNavigationStateManager,
  deepLinkingService: mockDeepLinkingService,
  healthProfileService: mockHealthProfileService,
  notificationService: mockNotificationService,
  analyticsService: mockAnalyticsService,
  crashReportingService: mockCrashReportingService,
  biometricService: mockBiometricService,
  cameraService: mockCameraService,
  fileSystemService: mockFileSystemService,
  networkService: mockNetworkService,
  hapticService: mockHapticService,
  clipboardService: mockClipboardService,
};

// Helper function to reset all mocks
export const resetAllMocks = () => {
  Object.values(ServiceMocks).forEach(mockService => {
    if (typeof mockService === 'object' && mockService !== null) {
      Object.values(mockService).forEach(mockMethod => {
        if (jest.isMockFunction(mockMethod)) {
          mockMethod.mockClear();
        }
      });
    }
  });
};

// Helper function to setup default mock implementations
export const setupDefaultMocks = () => {
  // Setup common successful responses
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });

  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });

  mockStorageAdapter.getItem.mockImplementation((key: string) => {
    // Return null by default, can be overridden in specific tests
    return Promise.resolve(null);
  });

  mockPerformanceMonitor.measureAsync.mockImplementation(async (name, fn) => {
    return await fn();
  });
};
