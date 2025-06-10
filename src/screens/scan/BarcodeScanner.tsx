import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView, // Import SafeAreaView
  Animated,
  Vibration,
  Platform, // Import Platform for OS-specific styling
} from "react-native";
import {
  CameraView,
  Camera, // Keeping Camera import just in case, though CameraView is used
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  onClose: () => void;
}

// Optimized barcode types for consumer products
const CONSUMER_BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e"]; // Primary consumer product codes
const EXTENDED_BARCODE_TYPES = [...CONSUMER_BARCODE_TYPES, "code128", "code39"]; // Backup codes (if you need to scan more general barcodes later)

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeScanned,
  onClose,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanning, setScanning] = useState(true);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

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
    if (scanned) return;

    console.log("📱 Barcode scanned:", data);

    // Haptic feedback
    Vibration.vibrate(100);

    setScanned(true);
    setScanning(false);

    // Validate barcode format
    if (data && data.length >= 8) {
      onBarcodeScanned(data);
    } else {
      Alert.alert("Invalid Barcode", "Please scan a valid product barcode.", [
        {
          text: "Try Again",
          onPress: () => {
            setScanned(false);
            setScanning(true);
          },
        },
      ]);
    }
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  const resetScanner = () => {
    setScanned(false);
    setScanning(true);
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
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
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

  return (
    // Wrap the entire component's return content in SafeAreaView
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.cameraContainer}>
        {" "}
        {/* New container for camera and overlays */}
        <CameraView
          style={styles.camera}
          facing="back"
          flash={flashEnabled ? "on" : "off"}
          barcodeScannerSettings={{
            barcodeTypes: CONSUMER_BARCODE_TYPES,
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        {/* Header - Repositioned inside the CameraContainer but using absolute positioning */}
        {/* We'll use the new closeButton style to place it */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButtonLeft} onPress={onClose}>
            {" "}
            {/* New style for left button */}
            <Ionicons name="close" size={24} color={COLORS.background} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Product Barcode</Text>
          <TouchableOpacity
            style={styles.headerButtonRight}
            onPress={toggleFlash}
          >
            {" "}
            {/* New style for right button */}
            <Ionicons
              name={flashEnabled ? "flash" : "flash-off"}
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
        </View>
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {scanned
              ? "Processing barcode..."
              : "Position the barcode within the frame"}
          </Text>
          {scanned && (
            <TouchableOpacity style={styles.retryButton} onPress={resetScanner}>
              <Text style={styles.retryButtonText}>Scan Another</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get("window");
const scanFrameSize = width * 0.7;

const styles = StyleSheet.create({
  // New safe area container style
  safeAreaContainer: {
    flex: 1,
    backgroundColor: COLORS.gray900, // Background for the whole screen
  },
  // New container for camera and its absolute positioned children
  cameraContainer: {
    flex: 1,
    backgroundColor: "black", // Ensure camera background is black
  },
  container: {
    // Old container style, might be removed or reused for permission screens
    flex: 1,
    backgroundColor: COLORS.gray900,
  },
  camera: {
    ...StyleSheet.absoluteFillObject, // Make camera fill its parent
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: COLORS.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  permissionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.background,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  permissionMessage: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray300,
    textAlign: "center",
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
    position: "absolute",
    top: Platform.OS === "ios" ? SPACING.xl * 1.5 : SPACING.md, // Adjusted for safe area on iOS
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    zIndex: 1,
  },
  headerButtonLeft: {
    // Specific style for left button
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonRight: {
    // Specific style for right button
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  scanFrame: {
    position: "absolute",
    top: (height - scanFrameSize) / 2, // Centered vertically in the view
    left: (width - scanFrameSize) / 2, // Centered horizontally
    width: scanFrameSize,
    height: 200, // Keeping original height for scan line animation
    zIndex: 1,
  },
  frameCorner: {
    position: "absolute",
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
    left: "auto",
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    top: "auto",
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: "auto",
    left: "auto",
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  instructions: {
    position: "absolute",
    bottom: 100, // Adjust this based on your bottom UI elements
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  instructionText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.base,
    textAlign: "center",
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
});
