# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pharmaguide is a HIPAA-compliant React Native/Expo mobile application for supplement safety analysis, drug interaction checking, and health profile management. The app prioritizes user privacy by storing all health data locally with AES-256 encryption.

## Essential Commands

### Development
```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser
```

### Testing
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests (Detox)
npm run test:coverage     # Tests with coverage report
```

### Code Quality (ALWAYS run before committing)
```bash
npm run lint              # ESLint check
npm run lint:fix          # ESLint auto-fix
npm run type-check        # TypeScript check
npm run code-quality      # All quality checks combined
```

### Running a Single Test
```bash
npm test -- path/to/test.test.ts                    # Run specific test file
npm test -- --testNamePattern="test description"    # Run tests matching pattern
npm test -- --watch path/to/test.test.ts           # Watch mode for specific file
```

## Architecture Overview

### Storage Hierarchy (Critical for HIPAA Compliance)
The app uses a three-tier storage system with automatic migration:
1. **SECURE**: Encrypted storage for sensitive health data (React Native Secure Store)
2. **LOCAL**: High-performance storage for non-sensitive data (MMKV)
3. **CLOUD**: Supabase for non-PHI data only

**Important**: Never send health profile data, medications, or other PHI to cloud services. All AI analysis must use anonymized data.

### State Management
- **Zustand stores** in `src/stores/` for global state
- **Local component state** for UI-specific state
- **MMKV** for persistent local storage
- **Secure Storage** for sensitive data persistence

### Service Architecture
Services in `src/services/` handle all business logic:
- `storage/`: Unified storage service with hierarchy management
- `health/`: Local health profile management (NO cloud sync)
- `ai/`: AI analysis services (HuggingFace, Groq)
- `monitoring/`: Performance and error tracking
- `accessibility/`: Voice navigation and screen reader support

### Navigation Structure
Uses React Navigation with bottom tabs + stack navigation:
- Home (Dashboard)
- Scan (Camera/Barcode)
- Profile (Health Profile)
- History (Scan History)
- Settings

## Critical Development Rules

### HIPAA Compliance
1. Store all health data locally only with encryption
2. Never log or transmit PHI to external services
3. Use `secureStorage` service for sensitive data
4. Anonymize data before AI analysis

### Performance Optimization
1. Use `useMemo` and `useCallback` for expensive operations
2. Implement lazy loading for heavy components
3. Monitor memory usage with performance service
4. Cache images using the caching service

### Error Handling Pattern
```typescript
try {
  // Operation
} catch (error) {
  console.error('Descriptive error message:', error);
  showToast({ message: 'User-friendly message', type: 'error' });
  // Graceful degradation or fallback
}
```

### Testing Requirements
- Unit tests for all utility functions and hooks
- Integration tests for navigation and API calls
- Minimum coverage: 70% global, 80% for critical paths
- Run tests before committing

## Working with Key Features

### Adding New Screens
1. Create screen in `src/screens/[feature]/`
2. Add navigation type to `src/types/navigation.ts`
3. Register in navigation structure
4. Add appropriate error boundaries

### Implementing Storage
```typescript
import { unifiedStorageService } from '@/services/storage';

// Store data with automatic tier selection
await unifiedStorageService.setItem('key', data, {
  tier: 'LOCAL', // or 'SECURE' for sensitive data
  encrypt: true  // for additional encryption
});
```

### AI Analysis Pattern
```typescript
// Always anonymize before analysis
const anonymizedData = anonymizeHealthData(userData);
const analysis = await aiAnalysisService.analyze(anonymizedData);
```

### Adding New Components
1. Create in `src/components/[feature]/`
2. Export from `src/components/index.ts`
3. Include proper TypeScript types
4. Add accessibility props
5. Consider memoization for performance

## Environment Configuration

Environment variables are managed through Expo:
- Development: `.env.development`
- Production: `.env.production`
- Never commit `.env` files
- Use `Config` from `src/config` to access variables

## Debugging Tips

### Performance Issues
1. Check React DevTools Profiler
2. Use `npm run bundle-analyzer` for bundle size
3. Monitor with performance service
4. Check for memory leaks in hooks

### Storage Issues
1. Use `npm run cleanup:storage` for storage cleanup
2. Check MMKV logs for corruption
3. Verify encryption keys in secure storage
4. Monitor storage migration logs

### API Issues
1. Check network state with monitoring service
2. Verify API keys in environment config
3. Look for rate limiting in console
4. Check request deduplication cache