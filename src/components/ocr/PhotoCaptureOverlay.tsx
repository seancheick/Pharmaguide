// src/components/ocr/PhotoCaptureOverlay.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, Camera, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { cameraPermissionService } from '../../services/permissions/cameraPermissionService';
import { useCameraLifecycle } from '../../hooks/useCameraLifecycle';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface PhotoCaptureOverlayProps {
  onPhotoTaken: (uri: string) => void;
  onClose: () => void;
  captureType: 'front_label' | 'ingredients' | 'nutrition_facts';
  title?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PhotoCaptureOverlay: React.FC<PhotoCaptureOverlayProps> = ({
  onPhotoTaken,
  onClose,
  captureType,
  title,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Smart camera lifecycle management for OCR
  const {
    isActive: isCameraActive,
    isSuspended: isCameraSuspended,
    suspendReason,
    activateCamera,
    suspendCamera,
  } = useCameraLifecycle({
    autoSuspendDelay: 60000, // 1 minute for OCR (longer than barcode)
    enableAppStateHandling: true,
    enableTabFocusHandling: true,
    enableInactivitySuspend: true,
    logPerformance: true,
  });

  React.useEffect(() => {
    const initializeCamera = async () => {
      if (!permission?.granted) {
        await cameraPermissionService.requestCameraPermission({
          context: 'ocr',
          showHIPAACompliance: true,
          onGranted: () => {
            console.log('📷 Camera permission granted for OCR');
          },
          onDenied: () => {
            console.log('📷 Camera permission denied for OCR');
          },
        });
      }
    };

    initializeCamera();
  }, [permission]);

  React.useEffect(() => {
    // Start pulse animation for capture guide
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnimation]);

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo?.uri) {
        onPhotoTaken(photo.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  const getGuideText = () => {
    switch (captureType) {
      case 'front_label':
        return 'Position the front label within the frame';
      case 'ingredients':
        return 'Capture the ingredients list clearly';
      case 'nutrition_facts':
        return 'Focus on the nutrition facts panel';
      default:
        return 'Position the label within the frame';
    }
  };

  const getGuideIcon = () => {
    switch (captureType) {
      case 'front_label':
        return 'document-text-outline';
      case 'ingredients':
        return 'list-outline';
      case 'nutrition_facts':
        return 'nutrition-outline';
      default:
        return 'camera-outline';
    }
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
            We need camera access to capture supplement labels for text
            recognition.
            {'\n\n'}🔒 Privacy Protection: Images are processed locally using
            on-device AI. No photos are stored or shared.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() =>
              cameraPermissionService.requestCameraPermission({
                context: 'ocr',
                showHIPAACompliance: true,
              })
            }
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        {/* Only render camera when active to save resources */}
        {isCameraActive && (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            flash={flashEnabled ? 'on' : 'off'}
          />
        )}

        {/* Camera suspended overlay */}
        {isCameraSuspended && (
          <View style={styles.suspendedOverlay}>
            <View style={styles.suspendedContent}>
              <Ionicons
                name="pause-circle"
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
                {!suspendReason && 'Camera is temporarily paused'}
              </Text>
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={activateCamera}
              >
                <Ionicons name="camera" size={20} color={COLORS.white} />
                <Text style={styles.resumeButtonText}>Resume Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title || 'Capture Label'}</Text>
          <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
            <Ionicons
              name={flashEnabled ? 'flash' : 'flash-off'}
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        {/* Capture Guide Overlay */}
        <View style={styles.overlay}>
          <View style={styles.guideContainer}>
            <Animated.View
              style={[
                styles.captureFrame,
                { transform: [{ scale: pulseAnimation }] },
              ]}
            >
              <View style={styles.frameCorner} />
              <View style={[styles.frameCorner, styles.topRight]} />
              <View style={[styles.frameCorner, styles.bottomLeft]} />
              <View style={[styles.frameCorner, styles.bottomRight]} />
            </Animated.View>
          </View>

          {/* Guide Text */}
          <View style={styles.guideTextContainer}>
            <Ionicons
              name={getGuideIcon() as any}
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.guideText}>{getGuideText()}</Text>
            <Text style={styles.guideSubtext}>
              Ensure text is clear and well-lit
            </Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.captureButton,
                isCapturing && styles.captureButtonDisabled,
              ]}
              onPress={handleTakePhoto}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonInner}>
                {isCapturing ? (
                  <MaterialIcons
                    name="hourglass-empty"
                    size={32}
                    color={COLORS.white}
                  />
                ) : (
                  <Ionicons name="camera" size={32} color={COLORS.white} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.helpButton}
              onPress={() =>
                Alert.alert(
                  'Photo Tips',
                  '• Ensure good lighting\n• Hold camera steady\n• Keep text in focus\n• Avoid shadows and glare'
                )
              }
            >
              <Ionicons
                name="help-circle-outline"
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  captureFrame: {
    width: screenWidth * 0.8,
    height: screenHeight * 0.4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.white,
    borderWidth: 3,
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    left: 'auto',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    top: 'auto',
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    top: 'auto',
    left: 'auto',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  guideTextContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  guideText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  guideSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray300,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: SPACING.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  cancelButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  captureButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  message: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.xl,
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
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  permissionMessage: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray300,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  // Camera suspended overlay styles
  suspendedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.black,
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
    color: COLORS.white,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  suspendedMessage: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray300,
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
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
