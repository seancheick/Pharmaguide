# Codebase Cleanup Action Plan
## Detailed Implementation Steps

---

## Phase 1: Critical Fixes (Week 1-2)

### 1.1 Fix Database Schema Mismatches

#### Step 1: Update Frontend Types
**File:** `src/types/database.ts`

```typescript
// Update DatabaseUserProfile interface
export interface DatabaseUserProfile {
  id: string;
  user_id: string;
  first_name: string | null;        // ADDED
  last_name: string | null;         // ADDED
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  biological_sex: string | null;    // CHANGED from gender
  age_range: string | null;         // ADDED
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  health_goals: string[] | null;
  medical_conditions: string[] | null;
  allergies: string[] | null;
  medications: string[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

#### Step 2: Update Database Transforms
**File:** `src/utils/databaseTransforms.ts`

```typescript
// Add new transformation functions
export const transformDbToUserProfile = (dbProfile: DatabaseUserProfile): UserProfile => ({
  firstName: dbProfile.first_name,
  lastName: dbProfile.last_name,
  displayName: dbProfile.display_name,
  age: dbProfile.age_range ? parseInt(dbProfile.age_range) : null,
  gender: dbProfile.biological_sex,
  healthGoals: dbProfile.health_goals || [],
  conditions: dbProfile.medical_conditions || [],
  allergies: dbProfile.allergies || [],
  medications: dbProfile.medications || [],
});

export const transformUserProfileToDb = (profile: UserProfile): Partial<DatabaseUserProfile> => ({
  first_name: profile.firstName,
  last_name: profile.lastName,
  biological_sex: profile.gender,
  age_range: profile.age?.toString(),
  health_goals: profile.healthGoals,
  medical_conditions: profile.conditions,
  allergies: profile.allergies,
  medications: profile.medications,
});
```

#### Step 3: Update CRUD Operations
**File:** `src/services/database.ts`

```typescript
// Update user profile operations
export const userProfileService = {
  async createProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    const dbProfile = transformUserProfileToDb(profile);
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .insert({ user_id: userId, ...dbProfile })
      .select()
      .single();

    if (error) throw error;
    return transformDbToUserProfile(data);
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    const dbProfile = transformUserProfileToDb(profile);
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .update(dbProfile)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return transformDbToUserProfile(data);
  }
};
```

### 1.2 Resolve Storage Conflicts

#### Step 1: Implement Storage Hierarchy
**File:** `src/services/storage/storageHierarchy.ts`

```typescript
export enum StorageTier {
  SECURE = 'secure',      // PHI, auth tokens
  LOCAL = 'local',        // User preferences, cache
  CLOUD = 'cloud',        // Analytics, non-sensitive data
}

export interface StorageConfig {
  tier: StorageTier;
  encryption: boolean;
  sync: boolean;
  retention: number; // days
}

export const STORAGE_CONFIG: Record<string, StorageConfig> = {
  'health_profile': {
    tier: StorageTier.SECURE,
    encryption: true,
    sync: false, // HIPAA compliance
    retention: 365 * 7, // 7 years
  },
  'user_preferences': {
    tier: StorageTier.LOCAL,
    encryption: false,
    sync: true,
    retention: 365,
  },
  'app_cache': {
    tier: StorageTier.LOCAL,
    encryption: false,
    sync: false,
    retention: 30,
  },
  'analytics': {
    tier: StorageTier.CLOUD,
    encryption: false,
    sync: true,
    retention: 90,
  },
};
```

#### Step 2: Update Storage Service
**File:** `src/services/storage/unifiedStorageService.ts`

```typescript
export class UnifiedStorageService {
  private secureStorage: SecureStorage;
  private localStorage: MMKVStorage;
  private cloudStorage: SupabaseStorage;

  async getItem(key: string): Promise<string | null> {
    const config = STORAGE_CONFIG[key] || STORAGE_CONFIG['app_cache'];
    
    switch (config.tier) {
      case StorageTier.SECURE:
        return this.secureStorage.getItem(key);
      case StorageTier.LOCAL:
        return this.localStorage.getItem(key);
      case StorageTier.CLOUD:
        return this.cloudStorage.getItem(key);
      default:
        return this.localStorage.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const config = STORAGE_CONFIG[key] || STORAGE_CONFIG['app_cache'];
    
    switch (config.tier) {
      case StorageTier.SECURE:
        return this.secureStorage.setItem(key, value);
      case StorageTier.LOCAL:
        return this.localStorage.setItem(key, value);
      case StorageTier.CLOUD:
        return this.cloudStorage.setItem(key, value);
      default:
        return this.localStorage.setItem(key, value);
    }
  }
}
```

### 1.3 Fix Health Profile Setup Flow

#### Step 1: Create Unified Progress Manager
**File:** `src/hooks/useSetupProgress.ts`

```typescript
export const useSetupProgress = () => {
  const [progress, setProgress] = useState<SetupProgress>({
    currentStep: 0,
    steps: [],
    data: {},
  });

  const updateStep = useCallback(async (stepId: string, completed: boolean, data?: any) => {
    setProgress(prev => {
      const updatedSteps = prev.steps.map(step =>
        step.id === stepId ? { ...step, completed } : step
      );
      
      const updatedData = data ? { ...prev.data, [stepId]: data } : prev.data;
      
      return {
        ...prev,
        steps: updatedSteps,
        data: updatedData,
        currentStep: completed ? prev.currentStep + 1 : prev.currentStep,
      };
    });

    // Persist to unified storage
    await unifiedStorage.setItem('setup_progress', JSON.stringify(progress));
  }, [progress]);

  return { progress, updateStep };
};
```

#### Step 2: Update HealthProfileSetupScreen
**File:** `src/screens/profile/HealthProfileSetupScreen.tsx`

```typescript
// Replace multiple state management with unified approach
const { progress, updateStep } = useSetupProgress();

// Remove duplicate saveProgress, loadSavedProgress functions
// Use unified progress manager instead
```

---

## Phase 2: High Priority (Week 3-4)

### 2.1 Performance Optimization

#### Step 1: Implement Memory Leak Detection
**File:** `src/services/performance/memoryLeakDetector.ts`

```typescript
export class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private interval?: NodeJS.Timeout;

  startMonitoring(intervalMs: number = 30000): void {
    this.interval = setInterval(() => {
      this.takeSnapshot();
      this.analyzeLeaks();
    }, intervalMs);
  }

  private analyzeLeaks(): void {
    if (this.snapshots.length < 3) return;
    
    const recent = this.snapshots.slice(-3);
    const isGrowing = recent.every((snapshot, i) => 
      i === 0 || snapshot.used > recent[i - 1].used
    );

    if (isGrowing) {
      logger.warn('performance', 'Potential memory leak detected', {
        snapshots: recent,
      });
    }
  }
}
```

#### Step 2: Optimize Bundle Size
**File:** `scripts/bundleAnalyzer.js`

```javascript
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html',
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
};
```

#### Step 3: Implement Render Optimization
**File:** `src/components/common/OptimizedComponent.tsx`

```typescript
import React, { memo, useCallback, useMemo } from 'react';

export const OptimizedComponent = memo(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true,
    }));
  }, [data]);

  const handleAction = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleAction(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
});
```

### 2.2 Code Quality Improvements

#### Step 1: Eliminate Circular Dependencies
**File:** `src/hooks/useFormPersistence.ts`

```typescript
// Remove dynamic import and refactor
import { useFormValidation } from './useFormValidation';

export const useFormValidationWithPersistence = (
  formConfig: FormConfig,
  persistenceConfig: PersistenceConfig,
  initialValues: Record<string, any> = {}
) => {
  const persistence = useFormPersistence(persistenceConfig);
  const formValidation = useFormValidation(formConfig, initialValues);

  // Merge logic here instead of dynamic import
  return {
    ...formValidation,
    ...persistence,
  };
};
```

#### Step 2: Remove Deprecated Code
**File:** `src/services/database.ts`

```typescript
// Remove deprecated functions
// export const transformScanResult = (dbScan: any): ScanResult => {
//   // REMOVE THIS FUNCTION
// };

// Use new implementation
export const transformScanResult = (dbScan: any): ScanResult => {
  return transformDbToScanResult(dbScan);
};
```

#### Step 3: Implement Strict Typing
**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
  }
}
```

### 2.3 Navigation State Management

#### Step 1: Implement Robust State Persistence
**File:** `src/services/navigation/navigationStateManager.ts`

```typescript
export class NavigationStateManager {
  private storage: UnifiedStorageService;

  async saveNavigationState(state: NavigationState): Promise<void> {
    try {
      const serializedState = JSON.stringify(state);
      await this.storage.setItem('navigation_state', serializedState);
    } catch (error) {
      logger.error('navigation', 'Failed to save navigation state', { error });
    }
  }

  async restoreNavigationState(): Promise<NavigationState | null> {
    try {
      const serializedState = await this.storage.getItem('navigation_state');
      if (!serializedState) return null;
      
      return JSON.parse(serializedState);
    } catch (error) {
      logger.error('navigation', 'Failed to restore navigation state', { error });
      return null;
    }
  }
}
```

---

## Phase 3: Medium Priority (Week 5-6)

### 3.1 File Organization

#### Step 1: Remove Unused Files
```bash
# Files to delete
rm src/services/performance/bundleOptimizationService.ts
rm src/utils/testDatabaseIntegration.ts
rm src/utils/testEdgeFunction.js
rm src/utils/testSecurity.ts
rm src/utils/testSetup.ts
rm testHuggingFace.js
```

#### Step 2: Standardize Naming Conventions
**File:** `.eslintrc.js`

```javascript
module.exports = {
  rules: {
    'naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I']
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase']
      },
      {
        selector: 'function',
        format: ['camelCase']
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE']
      }
    ]
  }
};
```

#### Step 3: Improve Component Organization
**File:** `src/components/index.ts`

```typescript
// Ensure all components are properly exported
export * from './common';
export * from './auth';
export * from './analysis';
export * from './barcode';
export * from './camera';
export * from './compliance';
export * from './demo';
export * from './forms';
export * from './home';
export * from './navigation';
export * from './ocr';
export * from './privacy';
export * from './product';
export * from './scan';
export * from './search';
export * from './stack';
```

### 3.2 Test Coverage

#### Step 1: Implement Comprehensive Test Suite
**File:** `src/tests/components/HealthProfileSetupScreen.test.tsx`

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HealthProfileSetupScreen } from '../../screens/profile/HealthProfileSetupScreen';

describe('HealthProfileSetupScreen', () => {
  it('should render all setup steps', () => {
    const { getByText } = render(<HealthProfileSetupScreen />);
    
    expect(getByText('Privacy & Consent')).toBeTruthy();
    expect(getByText('Basic Info')).toBeTruthy();
    expect(getByText('Health Goals')).toBeTruthy();
    expect(getByText('Health Conditions')).toBeTruthy();
    expect(getByText('Allergies & Sensitivities')).toBeTruthy();
  });

  it('should save progress when step is completed', async () => {
    const { getByText } = render(<HealthProfileSetupScreen />);
    
    const privacyStep = getByText('Privacy & Consent');
    fireEvent.press(privacyStep);
    
    await waitFor(() => {
      expect(getByText('Privacy Settings')).toBeTruthy();
    });
  });
});
```

#### Step 2: Add Integration Tests
**File:** `src/tests/integration/healthProfileFlow.test.tsx`

```typescript
describe('Health Profile Flow Integration', () => {
  it('should complete full setup flow', async () => {
    const { getByText, getByTestId } = renderWithProviders(
      <TestNavigator initialRouteName="HealthProfileSetup" />
    );

    // Complete each step
    await completePrivacyStep();
    await completeDemographicsStep();
    await completeHealthGoalsStep();
    await completeHealthConditionsStep();
    await completeAllergiesStep();

    // Verify completion
    expect(getByText('Profile Setup Complete!')).toBeTruthy();
  });
});
```

### 3.3 Documentation

#### Step 1: Add Component Documentation
**File:** `src/components/common/README.md`

```markdown
# Common Components

This directory contains reusable components used throughout the application.

## Components

### Button
A customizable button component with various styles and states.

**Props:**
- `title: string` - Button text
- `onPress: () => void` - Press handler
- `variant: 'primary' | 'secondary' | 'outline'` - Button style
- `disabled?: boolean` - Disabled state

**Usage:**
```tsx
<Button title="Save" onPress={handleSave} variant="primary" />
```

### Input
A form input component with validation support.

**Props:**
- `label: string` - Input label
- `value: string` - Input value
- `onChangeText: (text: string) => void` - Change handler
- `error?: string` - Error message
```

#### Step 2: Create Architecture Documentation
**File:** `docs/ARCHITECTURE.md`

```markdown
# Application Architecture

## Overview
Pharmaguide is a React Native application built with TypeScript, using Expo for cross-platform development.

## Architecture Layers

### 1. Presentation Layer
- **Components:** Reusable UI components
- **Screens:** Screen-specific components
- **Navigation:** React Navigation setup

### 2. Business Logic Layer
- **Hooks:** Custom React hooks for business logic
- **Services:** External service integrations
- **Utils:** Utility functions

### 3. Data Layer
- **Storage:** Local and cloud storage
- **API:** External API integrations
- **Database:** Supabase database operations

## State Management
- **Redux:** Global application state
- **Zustand:** Local component state
- **AsyncStorage:** Persistent storage

## Security
- **Encryption:** AES-256 for sensitive data
- **HIPAA Compliance:** Local-only PHI storage
- **Authentication:** Supabase Auth
```

---

## Phase 4: Low Priority (Week 7-8)

### 4.1 Code Style Consistency

#### Step 1: Implement Prettier Configuration
**File:** `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

#### Step 2: Add ESLint Rules
**File:** `.eslintrc.js`

```javascript
module.exports = {
  extends: [
    '@react-native-community',
    'prettier',
  ],
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

### 4.2 Performance Monitoring

#### Step 1: Implement Performance Dashboard
**File:** `src/services/monitoring/performanceDashboard.ts`

```typescript
export class PerformanceDashboard {
  private metrics: PerformanceMetrics[] = [];

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Alert on performance issues
    if (metric.duration > 1000) {
      this.alertSlowOperation(metric);
    }
  }

  generateReport(): PerformanceReport {
    return {
      averageResponseTime: this.calculateAverage('duration'),
      memoryUsage: this.getCurrentMemoryUsage(),
      errorRate: this.calculateErrorRate(),
      recommendations: this.generateRecommendations(),
    };
  }
}
```

#### Step 2: Add Performance Alerts
**File:** `src/services/monitoring/performanceAlerts.ts`

```typescript
export class PerformanceAlerts {
  private thresholds = {
    memoryUsage: 150 * 1024 * 1024, // 150MB
    responseTime: 2000, // 2 seconds
    errorRate: 0.05, // 5%
  };

  checkMetrics(metrics: PerformanceMetric[]): Alert[] {
    const alerts: Alert[] = [];

    // Check memory usage
    const memoryUsage = this.getCurrentMemoryUsage();
    if (memoryUsage > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'warning',
        message: 'High memory usage detected',
        metric: memoryUsage,
      });
    }

    // Check response times
    const slowOperations = metrics.filter(m => m.duration > this.thresholds.responseTime);
    if (slowOperations.length > 0) {
      alerts.push({
        type: 'error',
        message: 'Slow operations detected',
        metric: slowOperations,
      });
    }

    return alerts;
  }
}
```

---

## Implementation Checklist

### Week 1-2: Critical Fixes
- [ ] Update database types to match schema
- [ ] Implement storage hierarchy
- [ ] Fix health profile setup flow
- [ ] Test data persistence
- [ ] Verify HIPAA compliance

### Week 3-4: High Priority
- [ ] Implement memory leak detection
- [ ] Optimize bundle size
- [ ] Fix circular dependencies
- [ ] Remove deprecated code
- [ ] Implement strict typing
- [ ] Fix navigation state persistence

### Week 5-6: Medium Priority
- [ ] Remove unused files
- [ ] Standardize naming conventions
- [ ] Improve component organization
- [ ] Add comprehensive tests
- [ ] Create documentation
- [ ] Implement performance tests

### Week 7-8: Low Priority
- [ ] Implement code style consistency
- [ ] Add performance monitoring
- [ ] Create performance dashboard
- [ ] Add performance alerts
- [ ] Final testing and validation

---

## Success Criteria

### Technical Metrics
- [ ] Test coverage > 80%
- [ ] Bundle size reduced by 20%
- [ ] Memory usage < 150MB
- [ ] App startup time < 3 seconds
- [ ] Zero TypeScript errors
- [ ] Zero linting errors

### Quality Metrics
- [ ] All critical issues resolved
- [ ] All high priority issues resolved
- [ ] Performance score > 90
- [ ] Crash rate < 0.1%
- [ ] User satisfaction > 4.5/5

### Business Metrics
- [ ] User retention improved by 15%
- [ ] Support tickets reduced by 30%
- [ ] Development velocity increased
- [ ] Code review time reduced

---

*This action plan provides a structured approach to implementing all the recommendations from the comprehensive audit report.* 