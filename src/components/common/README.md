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
- `loading?: boolean` - Loading state
- `size?: 'small' | 'medium' | 'large'` - Button size

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
- `placeholder?: string` - Placeholder text
- `secureTextEntry?: boolean` - Password input
- `keyboardType?: KeyboardTypeOptions` - Keyboard type

**Usage:**
```tsx
<Input 
  label="Email" 
  value={email} 
  onChangeText={setEmail}
  error={emailError}
  keyboardType="email-address"
/>
```

### ValidatedInput
An enhanced input component with built-in validation.

**Props:**
- `label: string` - Input label
- `value: string` - Input value
- `onChangeText: (text: string) => void` - Change handler
- `validationRules: ValidationRule[]` - Validation rules
- `onValidationChange?: (isValid: boolean) => void` - Validation callback

**Usage:**
```tsx
<ValidatedInput
  label="Password"
  value={password}
  onChangeText={setPassword}
  validationRules={[
    { type: 'required', message: 'Password is required' },
    { type: 'minLength', value: 8, message: 'Password must be at least 8 characters' }
  ]}
/>
```

### LoadingScreen
A full-screen loading component with customizable content.

**Props:**
- `message?: string` - Loading message
- `showSpinner?: boolean` - Show/hide spinner
- `backgroundColor?: string` - Background color

**Usage:**
```tsx
<LoadingScreen message="Loading your profile..." />
```

### ErrorBoundary
A React error boundary component for catching and handling errors.

**Props:**
- `fallback?: React.ComponentType<{ error: Error; resetError: () => void }>` - Custom fallback component
- `onError?: (error: Error, errorInfo: ErrorInfo) => void` - Error callback

**Usage:**
```tsx
<ErrorBoundary fallback={CustomErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

### ScreenWrapper
A wrapper component for screens with common functionality.

**Props:**
- `children: React.ReactNode` - Screen content
- `title?: string` - Screen title
- `showBackButton?: boolean` - Show back button
- `onBackPress?: () => void` - Back button handler
- `loading?: boolean` - Loading state
- `error?: Error` - Error state

**Usage:**
```tsx
<ScreenWrapper title="Profile" showBackButton>
  <ProfileContent />
</ScreenWrapper>
```

### OptimizedImage
A performance-optimized image component with caching and lazy loading.

**Props:**
- `source: ImageSourcePropType` - Image source
- `style?: StyleProp<ImageStyle>` - Image styles
- `resizeMode?: ImageResizeMode` - Resize mode
- `placeholder?: React.ReactNode` - Loading placeholder
- `onLoad?: () => void` - Load callback
- `onError?: () => void` - Error callback

**Usage:**
```tsx
<OptimizedImage
  source={{ uri: imageUrl }}
  style={styles.image}
  placeholder={<ActivityIndicator />}
/>
```

### Toast
A toast notification component for displaying messages.

**Props:**
- `message: string` - Toast message
- `type?: 'success' | 'error' | 'warning' | 'info'` - Toast type
- `duration?: number` - Display duration
- `onDismiss?: () => void` - Dismiss callback

**Usage:**
```tsx
<Toast message="Profile saved successfully!" type="success" />
```

## Best Practices

1. **Consistent Props**: Use consistent prop names and types across similar components
2. **Accessibility**: Include accessibility props (accessibilityLabel, accessibilityHint)
3. **Performance**: Use React.memo for components that don't need frequent re-renders
4. **Error Handling**: Always include error states and loading states
5. **Documentation**: Keep this README updated when adding new components

## Contributing

When adding new components to this directory:

1. Create the component file
2. Add it to the `index.ts` export
3. Update this README with component documentation
4. Add appropriate tests
5. Follow the established naming conventions 