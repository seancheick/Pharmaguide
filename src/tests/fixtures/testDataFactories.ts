// src/tests/fixtures/testDataFactories.ts
// Test data factories for consistent test data generation

import { faker } from '@faker-js/faker';

// User data factory
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  email_confirmed_at: faker.date.recent().toISOString(),
  last_sign_in_at: faker.date.recent().toISOString(),
  app_metadata: {},
  user_metadata: {
    full_name: faker.person.fullName(),
    avatar_url: faker.image.avatar(),
  },
  ...overrides,
});

// Product data factory
export const createMockProduct = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  brand: faker.company.name(),
  barcode: faker.string.numeric(13),
  description: faker.commerce.productDescription(),
  ingredients: [
    faker.science.chemicalElement().name,
    faker.science.chemicalElement().name,
    'Cellulose',
    'Magnesium Stearate',
  ],
  serving_size: '1 capsule',
  servings_per_container: faker.number.int({ min: 30, max: 120 }),
  nutrition_facts: {
    calories: faker.number.int({ min: 0, max: 10 }),
    total_fat: '0g',
    sodium: faker.number.int({ min: 0, max: 50 }) + 'mg',
    total_carbohydrate: '0g',
    protein: '0g',
  },
  supplement_facts: {
    vitamin_d3: faker.number.int({ min: 400, max: 5000 }) + ' IU',
    calcium: faker.number.int({ min: 100, max: 1000 }) + 'mg',
  },
  warnings: [
    'Keep out of reach of children',
    'Consult your healthcare provider before use',
  ],
  storage_instructions: 'Store in a cool, dry place',
  expiration_date: faker.date.future().toISOString(),
  lot_number: faker.string.alphanumeric(8).toUpperCase(),
  manufacturer: faker.company.name(),
  country_of_origin: faker.location.country(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Stack item data factory
export const createMockStackItem = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  product_id: faker.string.uuid(),
  product_name: faker.commerce.productName(),
  brand: faker.company.name(),
  dosage: faker.number.int({ min: 100, max: 2000 }) + 'mg',
  frequency: faker.helpers.arrayElement(['Daily', 'Twice daily', 'Three times daily', 'Weekly']),
  time_of_day: faker.helpers.arrayElement(['Morning', 'Afternoon', 'Evening', 'Before bed']),
  with_food: faker.datatype.boolean(),
  notes: faker.lorem.sentence(),
  start_date: faker.date.past().toISOString(),
  end_date: faker.date.future().toISOString(),
  is_active: true,
  reminder_enabled: faker.datatype.boolean(),
  reminder_times: ['08:00', '20:00'],
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Interaction data factory
export const createMockInteraction = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  supplement1: faker.commerce.productName(),
  supplement2: faker.commerce.productName(),
  interaction_type: faker.helpers.arrayElement(['supplement-supplement', 'supplement-medication', 'supplement-food']),
  severity: faker.helpers.arrayElement(['low', 'moderate', 'high', 'severe']),
  description: faker.lorem.paragraph(),
  mechanism: faker.lorem.sentence(),
  clinical_significance: faker.lorem.paragraph(),
  recommendation: faker.lorem.sentence(),
  management_strategy: faker.lorem.paragraph(),
  evidence_level: faker.helpers.arrayElement(['theoretical', 'case_report', 'observational', 'clinical_trial']),
  sources: [
    'NIH National Institute of Health',
    'Mayo Clinic',
    'WebMD',
    'Drugs.com',
  ],
  last_updated: faker.date.recent().toISOString(),
  created_at: faker.date.past().toISOString(),
  ...overrides,
});

// Health profile data factory
export const createMockHealthProfile = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  age_range: faker.helpers.arrayElement(['18-24', '25-34', '35-44', '45-54', '55-64', '65+']),
  sex: faker.helpers.arrayElement(['male', 'female', 'other', 'prefer_not_to_say']),
  weight_range: faker.helpers.arrayElement(['under_120', '120-150', '150-180', '180-220', 'over_220']),
  height_range: faker.helpers.arrayElement(['under_5ft', '5ft-5ft6', '5ft6-6ft', 'over_6ft']),
  activity_level: faker.helpers.arrayElement(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
  health_goals: faker.helpers.arrayElements([
    'general_wellness',
    'immune_support',
    'energy_boost',
    'bone_health',
    'heart_health',
    'brain_health',
    'digestive_health',
    'weight_management',
  ], { min: 1, max: 3 }),
  health_conditions: faker.helpers.arrayElements([
    'diabetes',
    'hypertension',
    'heart_disease',
    'arthritis',
    'osteoporosis',
    'depression',
    'anxiety',
    'thyroid_disorder',
  ], { min: 0, max: 2 }),
  allergies: faker.helpers.arrayElements([
    'shellfish',
    'nuts',
    'dairy',
    'gluten',
    'soy',
    'eggs',
    'fish',
  ], { min: 0, max: 2 }),
  medications: faker.helpers.arrayElements([
    'blood_pressure_medication',
    'diabetes_medication',
    'cholesterol_medication',
    'antidepressants',
    'pain_relievers',
  ], { min: 0, max: 2 }),
  dietary_restrictions: faker.helpers.arrayElements([
    'vegetarian',
    'vegan',
    'keto',
    'paleo',
    'gluten_free',
    'dairy_free',
  ], { min: 0, max: 2 }),
  privacy_settings: {
    share_anonymous_data: faker.datatype.boolean(),
    ai_analysis_consent: faker.datatype.boolean(),
    marketing_emails: faker.datatype.boolean(),
    research_participation: faker.datatype.boolean(),
  },
  completed_at: faker.date.recent().toISOString(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// AI analysis data factory
export const createMockAIAnalysis = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  product_id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  analysis_type: faker.helpers.arrayElement(['product_safety', 'stack_analysis', 'interaction_check']),
  safety_score: faker.number.int({ min: 0, max: 100 }),
  confidence_level: faker.number.float({ min: 0.5, max: 1.0, precision: 0.01 }),
  risk_factors: faker.helpers.arrayElements([
    'high_dosage',
    'potential_interactions',
    'contraindications',
    'side_effects',
    'quality_concerns',
  ], { min: 0, max: 3 }),
  benefits: faker.helpers.arrayElements([
    'immune_support',
    'bone_health',
    'energy_boost',
    'antioxidant_properties',
    'cardiovascular_support',
  ], { min: 1, max: 4 }),
  recommendations: [
    faker.lorem.sentence(),
    faker.lorem.sentence(),
    faker.lorem.sentence(),
  ],
  warnings: [
    faker.lorem.sentence(),
    faker.lorem.sentence(),
  ],
  interactions_found: faker.number.int({ min: 0, max: 5 }),
  analysis_summary: faker.lorem.paragraph(),
  detailed_analysis: faker.lorem.paragraphs(3),
  model_version: '1.0.0',
  processing_time_ms: faker.number.int({ min: 500, max: 5000 }),
  created_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Notification data factory
export const createMockNotification = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  type: faker.helpers.arrayElement(['reminder', 'interaction_alert', 'health_tip', 'system_update']),
  title: faker.lorem.words(3),
  body: faker.lorem.sentence(),
  data: {
    stack_item_id: faker.string.uuid(),
    action: faker.helpers.arrayElement(['take_supplement', 'check_interactions', 'update_profile']),
  },
  scheduled_for: faker.date.future().toISOString(),
  sent_at: null,
  read_at: null,
  is_recurring: faker.datatype.boolean(),
  recurrence_pattern: 'daily',
  is_active: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Analytics event data factory
export const createMockAnalyticsEvent = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  event_name: faker.helpers.arrayElement([
    'product_scanned',
    'product_added_to_stack',
    'interaction_checked',
    'ai_analysis_requested',
    'profile_updated',
  ]),
  event_properties: {
    product_id: faker.string.uuid(),
    screen_name: faker.helpers.arrayElement(['home', 'scan', 'stack', 'profile']),
    source: faker.helpers.arrayElement(['barcode_scan', 'manual_search', 'recommendation']),
  },
  user_properties: {
    user_type: faker.helpers.arrayElement(['free', 'premium']),
    app_version: '1.0.0',
    platform: faker.helpers.arrayElement(['ios', 'android']),
  },
  session_id: faker.string.uuid(),
  timestamp: faker.date.recent().toISOString(),
  ...overrides,
});

// Error report data factory
export const createMockErrorReport = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  error_type: faker.helpers.arrayElement(['javascript_error', 'network_error', 'api_error', 'crash']),
  error_message: faker.lorem.sentence(),
  stack_trace: faker.lorem.paragraphs(5),
  user_agent: faker.internet.userAgent(),
  app_version: '1.0.0',
  platform: faker.helpers.arrayElement(['ios', 'android']),
  device_info: {
    model: faker.helpers.arrayElement(['iPhone 14', 'Samsung Galaxy S23', 'Google Pixel 7']),
    os_version: faker.system.semver(),
    screen_resolution: '1920x1080',
    memory_usage: faker.number.int({ min: 100, max: 8000 }) + 'MB',
  },
  context: {
    screen_name: faker.helpers.arrayElement(['home', 'scan', 'stack', 'profile']),
    action: faker.lorem.words(2),
    additional_data: {},
  },
  severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
  is_resolved: false,
  occurred_at: faker.date.recent().toISOString(),
  reported_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Batch data factories
export const createMockUsers = (count: number = 5) => 
  Array.from({ length: count }, () => createMockUser());

export const createMockProducts = (count: number = 10) => 
  Array.from({ length: count }, () => createMockProduct());

export const createMockStackItems = (count: number = 5, userId?: string) => 
  Array.from({ length: count }, () => createMockStackItem(userId ? { user_id: userId } : {}));

export const createMockInteractions = (count: number = 3) => 
  Array.from({ length: count }, () => createMockInteraction());

// Test scenario factories
export const createUserWithStack = () => {
  const user = createMockUser();
  const stackItems = createMockStackItems(3, user.id);
  return { user, stackItems };
};

export const createProductWithInteractions = () => {
  const product = createMockProduct();
  const interactions = createMockInteractions(2);
  return { product, interactions };
};

export const createCompleteUserProfile = () => {
  const user = createMockUser();
  const healthProfile = createMockHealthProfile({ user_id: user.id });
  const stackItems = createMockStackItems(5, user.id);
  const notifications = Array.from({ length: 3 }, () => 
    createMockNotification({ user_id: user.id })
  );
  
  return {
    user,
    healthProfile,
    stackItems,
    notifications,
  };
};

// Export all factories
export const TestDataFactories = {
  createMockUser,
  createMockProduct,
  createMockStackItem,
  createMockInteraction,
  createMockHealthProfile,
  createMockAIAnalysis,
  createMockNotification,
  createMockAnalyticsEvent,
  createMockErrorReport,
  createMockUsers,
  createMockProducts,
  createMockStackItems,
  createMockInteractions,
  createUserWithStack,
  createProductWithInteractions,
  createCompleteUserProfile,
};
