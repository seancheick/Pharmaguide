// src/screens/scan/BarcodeScanner.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import {
  CameraView,
  Camera,
  useCameraPermissions,
  BarcodeScanningResult,
  BarcodeType,
} from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ManualBarcodeEntry } from '../../components/barcode';
import { cameraPermissionService } from '../../services/permissions/cameraPermissionService';
import {
  useCameraLifecycle,
  useCameraPerformanceMonitor,
} from '../../hooks/useCameraLifecycle';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  onClose: () => void;
}

// Optimized barcode types for consumer products
const CONSUMER_BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
];
const EXTENDED_BARCODE_TYPES: BarcodeType[] = [
  ...CONSUMER_BARCODE_TYPES,
  'code128',
  'code39',
];

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeScanned,
  onClose,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // Smart camera lifecycle management
  const {
    isActive: isCameraActive,
    isSuspended: isCameraSuspended,
    suspendReason,
    activateCamera,
    suspendCamera,
    getMetrics,
  } = useCameraLifecycle({
    autoSuspendDelay: 30000, // 30 seconds of inactivity
    enableAppStateHandling: true,
    enableTabFocusHandling: true,
    enableInactivitySuspend: true,
    logPerformance: true,
  });

  // Camera performance monitoring
  const performanceMetrics = useCameraPerformanceMonitor();

  useEffect(() => {
    const initializeCamera = async () => {
      if (!permission?.granted) {
        await cameraPermissionService.requestCameraPermission({
          context: 'barcode',
          showHIPAACompliance: true,
          onGranted: () => {
            console.log('📷 Camera permission granted for barcode scanning');
          },
          onDenied: () => {
            console.log('📷 Camera permission denied for barcode scanning');
          },
        });
      }
    };

    initializeCamera();
  }, [permission]);

  useEffect(() => {
    // Animated scanning line
    const animateScanLine = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    if (scanning) {
      animateScanLine();
    }

    return () => {
      scanLineAnimation.stopAnimation();
    };
  }, [scanning, scanLineAnimation]);

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned || !isCameraActive) return;

    console.log('📱 Barcode scanned:', data);

    // Haptic feedback
    Vibration.vibrate(100);

    setScanned(true);
    setScanning(false);

    // Suspend camera after successful scan to save battery
    suspendCamera('scan_complete');

    // Validate barcode format
    if (data && data.length >= 8) {
      // Show success animation
      showSuccessAnimation(() => {
        onBarcodeScanned(data);
      });
    } else {
      Alert.alert('Invalid Barcode', 'Please scan a valid product barcode.', [
        {
          text: 'Try Again',
          onPress: () => {
            setScanned(false);
            setScanning(true);
            // Reactivate camera for retry
            activateCamera();
          },
        },
      ]);
    }
  };

  const showSuccessAnimation = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(callback, 500);
    });
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  const resetScanner = () => {
    setScanned(false);
    setScanning(true);
    setShowManualEntry(false);
    successAnimation.setValue(0);
    successScale.setValue(0);
  };

  const handleManualBarcodeEntry = (barcode: string) => {
    setShowManualEntry(false);
    onBarcodeScanned(barcode);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={COLORS.gray400} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            PharmaGuide needs camera access to scan product barcodes for
            supplement analysis.
            {'\n\n'}🔒 HIPAA Compliance: Your camera data is processed locally
            and never transmitted to our servers. All health information remains
            encrypted on your device.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              await requestPermission(); // Update local permission state
              cameraPermissionService.requestCameraPermission({
                context: 'barcode',
                showHIPAACompliance: true,
              });
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const scanLineTranslateY = scanLineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  // Show manual entry overlay if requested
  if (showManualEntry) {
    return (
      <ManualBarcodeEntry
        onBarcodeEntered={handleManualBarcodeEntry}
        onClose={() => setShowManualEntry(false)}
        title="Enter Barcode Manually"
        placeholder="Enter product barcode"
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.cameraContainer}>
        {/* Only render camera when active to save resources */}
        {isCameraActive && (
          <CameraView
            style={styles.camera}
            facing="back"
            flash={flashEnabled ? 'on' : 'off'}
            barcodeScannerSettings={{
              barcodeTypes: CONSUMER_BARCODE_TYPES,
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        )}

        {/* Camera suspended overlay */}
        {isCameraSuspended && (
          <View style={styles.suspendedOverlay}>
            <View style={styles.suspendedContent}>
              <Ionicons
                name="camera-outline"
                size={48}
                color={COLORS.textSecondary}
              />
              <Text style={styles.suspendedTitle}>Camera Paused</Text>
              <Text style={styles.suspendedMessage}>
                {suspendReason === 'tab_blur' &&
                  'Camera paused when switching tabs'}
                {suspendReason === 'app_background' &&
                  'Camera paused when app is in background'}
                {suspendReason === 'inactivity' &&
                  'Camera paused due to inactivity'}
                {suspendReason === 'scan_complete' &&
                  'Scan completed successfully'}
                {!suspendReason && 'Camera is temporarily paused'}
              </Text>
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={activateCamera}
              >
                <Ionicons name="camera" size={20} color={COLORS.background} />
                <Text style={styles.resumeButtonText}>Resume Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButtonLeft} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.background} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Product Barcode</Text>
          <TouchableOpacity
            style={styles.headerButtonRight}
            onPress={toggleFlash}
          >
            <Ionicons
              name={flashEnabled ? 'flash' : 'flash-off'}
              size={24}
              color={COLORS.background}
            />
          </TouchableOpacity>
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanFrame}>
          <View style={styles.frameCorner} />
          <View style={[styles.frameCorner, styles.topRight]} />
          <View style={[styles.frameCorner, styles.bottomLeft]} />
          <View style={[styles.frameCorner, styles.bottomRight]} />

          {/* Animated scan line */}
          {scanning && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY: scanLineTranslateY }],
                },
              ]}
            />
          )}

          {/* Success animation */}
          {scanned && (
            <Animated.View
              style={[
                styles.successOverlay,
                {
                  opacity: successAnimation,
                  transform: [{ scale: successScale }],
                },
              ]}
            >
              <View style={styles.successIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={80}
                  color={COLORS.success}
                />
              </View>
              <Text style={styles.successText}>Scanned Successfully!</Text>
            </Animated.View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {scanned
              ? 'Processing barcode...'
              : 'Position the barcode within the frame'}
          </Text>
          {scanned && (
            <TouchableOpacity style={styles.retryButton} onPress={resetScanner}>
              <Text style={styles.retryButtonText}>Scan Another</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tips and Manual Entry */}
        {!scanned && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipText}>
              💡 Hold steady and ensure good lighting
            </Text>

            <TouchableOpacity
              style={styles.manualEntryButton}
              onPress={() => setShowManualEntry(true)}
            >
              <Ionicons
                name="keypad-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.manualEntryText}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');
const scanFrameSize = width * 0.7;

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: COLORS.gray900,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.gray900,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: COLORS.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  permissionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.background,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray300,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? SPACING.xl * 1.5 : SPACING.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 1,
  },
  headerButtonLeft: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonRight: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  scanFrame: {
    position: 'absolute',
    top: (height - scanFrameSize) / 2,
    left: (width - scanFrameSize) / 2,
    width: scanFrameSize,
    height: 200,
    zIndex: 1,
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  successIcon: {
    marginBottom: SPACING.md,
  },
  successText: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  instructionText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.base,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  tipsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  tipText: {
    color: COLORS.gray300,
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  manualEntryText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.xs,
  },
  // Camera suspended overlay styles
  suspendedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  suspendedContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  suspendedTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  suspendedMessage: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  resumeButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
