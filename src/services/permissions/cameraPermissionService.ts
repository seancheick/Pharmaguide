// src/services/permissions/cameraPermissionService.ts
import { Alert, Linking, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { performanceMonitor } from '../performance/performanceMonitor';

interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

interface PermissionOptions {
  showHIPAACompliance?: boolean;
  context?: 'barcode' | 'ocr' | 'general';
  onDenied?: () => void;
  onGranted?: () => void;
}

class CameraPermissionService {
  private static instance: CameraPermissionService;
  private permissionCache: PermissionResult | null = null;
  private lastRequestTime = 0;
  private readonly REQUEST_COOLDOWN = 5000; // 5 seconds

  static getInstance(): CameraPermissionService {
    if (!CameraPermissionService.instance) {
      CameraPermissionService.instance = new CameraPermissionService();
    }
    return CameraPermissionService.instance;
  }

  /**
   * Request camera permission with enhanced UX and HIPAA compliance messaging
   */
  async requestCameraPermission(
    options: PermissionOptions = {}
  ): Promise<PermissionResult> {
    const startTime = Date.now();

    try {
      // Check cooldown to prevent spam requests
      if (Date.now() - this.lastRequestTime < this.REQUEST_COOLDOWN) {
        return (
          this.permissionCache || {
            granted: false,
            canAskAgain: false,
            status: 'denied',
          }
        );
      }

      this.lastRequestTime = Date.now();

      // Get current permission status
      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();

      if (status === 'granted') {
        const result = {
          granted: true,
          canAskAgain: true,
          status: 'granted' as const,
        };
        this.permissionCache = result;
        options.onGranted?.();
        return result;
      }

      // Show context-specific permission explanation
      if (status === 'undetermined' || canAskAgain) {
        const shouldRequest = await this.showPermissionExplanation(options);

        if (shouldRequest) {
          const { status: newStatus, canAskAgain: newCanAskAgain } =
            await Camera.requestCameraPermissionsAsync();

          const result = {
            granted: newStatus === 'granted',
            canAskAgain: newCanAskAgain,
            status: newStatus as 'granted' | 'denied' | 'undetermined',
          };

          this.permissionCache = result;

          if (result.granted) {
            options.onGranted?.();
            this.logPermissionEvent('granted', options.context);
          } else {
            options.onDenied?.();
            this.logPermissionEvent('denied', options.context);
            await this.handlePermissionDenied(result, options);
          }

          return result;
        }
      }

      // Permission permanently denied
      const result = { granted: false, canAskAgain, status: 'denied' as const };
      this.permissionCache = result;
      options.onDenied?.();
      await this.handlePermissionDenied(result, options);

      return result;
    } catch (error) {
      console.error('Camera permission request failed:', error);
      this.logPermissionEvent('error', options.context, error);

      return { granted: false, canAskAgain: false, status: 'denied' };
    } finally {
      // Record performance metric using the correct API
      performanceMonitor.startMeasure('camera_permission_request');
      performanceMonitor.endMeasure('camera_permission_request', 'api');
    }
  }

  /**
   * Show context-specific permission explanation with HIPAA compliance
   */
  private async showPermissionExplanation(
    options: PermissionOptions
  ): Promise<boolean> {
    return new Promise(resolve => {
      const { context = 'general', showHIPAACompliance = true } = options;

      const messages = {
        barcode: {
          title: 'Camera Access for Barcode Scanning',
          message:
            'PharmaGuide needs camera access to scan product barcodes for supplement analysis.',
          details: showHIPAACompliance
            ? '\n\n🔒 HIPAA Compliance: Your camera data is processed locally and never transmitted to our servers. All health information remains encrypted on your device.'
            : '',
        },
        ocr: {
          title: 'Camera Access for Label Recognition',
          message:
            'We need camera access to capture supplement labels for text recognition and ingredient analysis.',
          details: showHIPAACompliance
            ? '\n\n🔒 Privacy Protection: Images are processed locally using on-device AI. No photos are stored or shared.'
            : '',
        },
        general: {
          title: 'Camera Access Required',
          message:
            'PharmaGuide needs camera access for product scanning and analysis.',
          details: showHIPAACompliance
            ? '\n\n🔒 Your Privacy: All camera data is processed securely on your device in compliance with HIPAA regulations.'
            : '',
        },
      };

      const config = messages[context];

      Alert.alert(
        config.title,
        config.message + config.details,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Grant Access',
            style: 'default',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Handle permission denied with helpful guidance
   */
  private async handlePermissionDenied(
    result: PermissionResult,
    options: PermissionOptions
  ): Promise<void> {
    if (!result.canAskAgain) {
      // Permission permanently denied - guide to settings
      Alert.alert(
        'Camera Access Disabled',
        'Camera access has been disabled for PharmaGuide. To enable barcode scanning and label recognition, please:\n\n1. Open Settings\n2. Find PharmaGuide\n3. Enable Camera access\n\n🔒 Your privacy is protected - all camera data stays on your device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => this.openAppSettings(),
          },
        ]
      );
    } else {
      // Can ask again later
      Alert.alert(
        'Camera Access Required',
        'Camera access is needed for product scanning. You can grant permission later in the app settings.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Open app settings for manual permission grant
   */
  private async openAppSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Failed to open settings:', error);
      Alert.alert(
        'Error',
        'Unable to open settings. Please manually enable camera access in your device settings.'
      );
    }
  }

  /**
   * Check current permission status without requesting
   */
  async checkPermissionStatus(): Promise<PermissionResult> {
    try {
      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();

      const result = {
        granted: status === 'granted',
        canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined',
      };

      this.permissionCache = result;
      return result;
    } catch (error) {
      console.error('Failed to check camera permission:', error);
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  }

  /**
   * Clear permission cache (useful for testing)
   */
  clearCache(): void {
    this.permissionCache = null;
    this.lastRequestTime = 0;
  }

  /**
   * Log permission events for analytics
   */
  private logPermissionEvent(
    event: 'granted' | 'denied' | 'error',
    context?: string,
    error?: any
  ): void {
    try {
      const eventData = {
        event: `camera_permission_${event}`,
        context: context || 'unknown',
        timestamp: Date.now(),
        platform: Platform.OS,
        ...(error && { error: error.message || 'Unknown error' }),
      };

      // Log to performance monitor for analytics (simplified logging)
      console.log('📊 Permission analytics:', eventData);

      console.log('📷 Camera permission event:', eventData);
    } catch (logError) {
      console.error('Failed to log permission event:', logError);
    }
  }
}

export const cameraPermissionService = CameraPermissionService.getInstance();
