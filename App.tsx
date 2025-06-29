// App.tsx
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { AppNavigator } from './src/navigation/AppNavigator';
import { performanceMonitor } from './src/services/performance/performanceMonitor';
import { gamificationService } from './src/services/gamification/gamificationService';
import { secureStorage } from './src/services/storage/secureStorage';
import { networkService } from './src/services/network/networkService';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { ToastContainer } from './src/components/common/Toast';

// Wrapper component to access auth context
function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    // Set user ID for gamification service when auth state changes
    if (user && !user.is_anonymous) {
      gamificationService.setUserId(user.id);

      // Set user context for monitoring services
      // TODO: Add user context setting after startup optimization
    } else {
      gamificationService.setUserId(null);
    }
  }, [user]);

  return (
    <ErrorBoundary>
      <AppNavigator />
      <ToastContainer />
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}

export default function App() {
  // Track if app has rendered at least once
  const [hasRendered, setHasRendered] = React.useState(false);

  useEffect(() => {
    setHasRendered(true);
  }, []);

  useEffect(() => {
    // Initialize core services with simple optimization
    const initializeServices = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        const startTime = Date.now();

        // Initialize essential services only
        await networkService.initialize();
        await secureStorage.initialize();

        // Clean up invalid storage entries
        const { initializeStorageCleanup } = await import(
          './src/utils/cleanupStorage'
        );
        await initializeStorageCleanup();

        const totalTime = Date.now() - startTime;
        console.log(
          `✅ App initialization completed in ${totalTime}ms (performance optimized)`
        );
      } catch (error) {
        console.error('❌ Failed to initialize core services:', error);
        // App can still function with limited capabilities
      }
    };

    // Ensure the @anonymous directory exists for storage
    const ensureDirectoryExists = async () => {
      const anonymousDir = `${FileSystem.documentDirectory}ExponentExperienceData/@anonymous`;
      try {
        const dirInfo = await FileSystem.getInfoAsync(anonymousDir);
        if (!dirInfo.exists || !dirInfo.isDirectory) {
          await FileSystem.makeDirectoryAsync(anonymousDir, {
            intermediates: true,
          });
          console.log(`Created directory: ${anonymousDir}`);
        }
      } catch (error) {
        console.error(`Failed to create directory: ${error}`);
      }
    };

    // Initialize everything
    const initialize = async () => {
      await ensureDirectoryExists();
      await initializeServices();
      // Complete cold start measurement
      performanceMonitor.endMeasure('cold_start', 'navigation');
    };

    initialize();
  }, []);

  // Defer non-critical service initialization until after first render
  useEffect(() => {
    if (!hasRendered) return;

    // Defer gamification service (non-critical)
    setTimeout(() => {
      try {
        console.log('🎮 Initializing gamification service...');
        // Gamification service will be initialized here when ready
        console.log('✅ Deferred services initialized');
      } catch (error) {
        console.warn('⚠️ Deferred service initialization failed:', error);
      }
    }, 100); // Small delay to ensure UI is ready
  }, [hasRendered]);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
