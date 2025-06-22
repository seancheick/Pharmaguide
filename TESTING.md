# Testing Guide for PharmaGuide

## Overview

This project uses Jest with React Native Testing Library for unit and integration testing. The test infrastructure is set up to work with TypeScript, React Native components, and our service layer.

## Test Structure

```
src/
├── config/__tests__/
│   └── environment.test.ts
├── services/
│   ├── ai/__tests__/
│   │   └── aiService.test.ts
│   └── supabase/__tests__/
│       └── client.test.ts
├── components/common/__tests__/
│   └── ErrorBoundary.test.tsx
└── utils/
    └── testSetup.ts
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI (no watch, with coverage)
npm run test:ci

# Run all quality checks including tests
npm run test:all
```

### Running Specific Tests

```bash
# Run tests for a specific file
npm test -- src/config/__tests__/environment.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="environment"

# Run tests for a specific directory
npm test -- src/services/
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

- **Preset**: `jest-expo` for React Native compatibility
- **Test Environment**: `jsdom` for DOM-like environment
- **Module Mapping**: Path aliases for cleaner imports
- **Coverage**: Configured to exclude test files and type definitions
- **Transform Ignore Patterns**: Handles React Native and Expo modules

### Test Setup (`src/utils/testSetup.ts`)

The test setup file includes:
- Mock implementations for React Native modules
- Mock implementations for Expo modules
- Mock implementations for navigation
- Mock implementations for Supabase client
- Mock implementations for AI services
- Global test utilities and environment variables

## Writing Tests

### Environment Configuration Tests

Tests for environment variable handling and configuration validation:

```typescript
// src/config/__tests__/environment.test.ts
describe('Environment Configuration', () => {
  it('should return process.env value when available', () => {
    process.env.TEST_VAR = 'test-value';
    const result = envHelpers.getEnvVar('TEST_VAR');
    expect(result).toBe('test-value');
  });
});
```

### Service Tests

Tests for service layer functionality:

```typescript
// src/services/ai/__tests__/aiService.test.ts
describe('AIService', () => {
  it('should handle basic functionality', () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      ingredients: [{ name: 'Vitamin C', amount: '500mg' }],
    };
    
    expect(mockProduct.name).toBe('Test Product');
  });
});
```

### Component Tests

Tests for React components with error boundaries:

```typescript
// src/components/common/__tests__/ErrorBoundary.test.tsx
describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>No error</Text>
      </ErrorBoundary>
    );
    
    expect(getByText('No error')).toBeTruthy();
  });
});
```

## Test Patterns

### Mocking Services

```typescript
// Mock Supabase client
jest.mock('../../supabase/client', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    })),
  },
}));
```

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  const mockResponse = { data: 'test' };
  mockFunction.mockResolvedValue(mockResponse);
  
  const result = await serviceMethod();
  
  expect(result).toEqual(mockResponse);
});
```

### Testing Error Handling

```typescript
it('should handle errors gracefully', async () => {
  mockFunction.mockRejectedValue(new Error('Test error'));
  
  const result = await serviceMethod();
  
  expect(result).toBeDefined(); // Should return fallback
});
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **Text Summary**: Displayed in terminal

### Coverage Targets

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Best Practices

### 1. Test Structure

- Use descriptive test names
- Group related tests with `describe` blocks
- Use `beforeEach` for setup
- Use `afterEach` for cleanup

### 2. Mocking

- Mock external dependencies
- Use `jest.clearAllMocks()` in `beforeEach`
- Mock at the module level when possible
- Provide meaningful mock implementations

### 3. Assertions

- Use specific matchers (`toBe`, `toEqual`, `toHaveProperty`)
- Test both success and error cases
- Verify function calls with `toHaveBeenCalledWith`
- Check array lengths and object properties

### 4. Async Testing

- Always use `async/await` for async tests
- Test both resolved and rejected promises
- Use appropriate timeouts for slow operations

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Check `moduleNameMapper` in Jest config
   - Verify mock implementations

2. **React Native component errors**
   - Ensure proper mocking in `testSetup.ts`
   - Use React Native Testing Library utilities

3. **Async test timeouts**
   - Increase `testTimeout` in Jest config
   - Use `jest.setTimeout()` for specific tests

4. **Coverage issues**
   - Check `collectCoverageFrom` patterns
   - Exclude test files and type definitions

### Debug Mode

Run tests with debug information:

```bash
# Run with verbose output
npm test -- --verbose

# Run with debug information
npm test -- --debug

# Run specific test with full output
npm test -- --testNamePattern="specific test" --verbose
```

## Integration with CI/CD

The test suite is designed to work in CI/CD environments:

```bash
# CI command (no watch, with coverage)
npm run test:ci
```

This command:
- Runs all tests once (no watch mode)
- Generates coverage reports
- Exits with appropriate status codes
- Works in headless environments

## Next Steps

1. **Expand Test Coverage**: Add tests for more services and components
2. **Integration Tests**: Add tests that verify service interactions
3. **E2E Tests**: Consider adding end-to-end tests with Detox
4. **Performance Tests**: Add tests for performance-critical operations
5. **Visual Regression Tests**: Consider snapshot testing for UI components
