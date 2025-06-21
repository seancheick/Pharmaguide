// src/screens/auth/WelcomeScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../hooks/useAuth";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { signInWithEmail, signUpWithEmail, signInAnonymously } = useAuth();

  // State
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.9);
  const rotateAnim = new Animated.Value(0);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for background elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const showForm = (signIn: boolean) => {
    console.log("showForm called, signIn:", signIn); // Debug log
    setIsSignIn(signIn);
    setShowAuthForm(true);
  };

  const hideForm = () => {
    console.log("hideForm called"); // Debug log
    setShowAuthForm(false);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isSignIn && password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (!isSignIn && password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (isSignIn) {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
        Alert.alert(
          "Success",
          "Account created! Please check your email to verify your account."
        );
      }
    } catch (error: any) {
      Alert.alert(
        isSignIn ? "Sign In Failed" : "Sign Up Failed",
        error.message || "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Could not continue as guest. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  console.log("showAuthForm state:", showAuthForm); // Debug log

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <Animated.View
        style={[styles.backgroundCircle1, { transform: [{ rotate: spin }] }]}
      />
      <Animated.View
        style={[styles.backgroundCircle2, { transform: [{ rotate: spin }] }]}
      />
      <View style={styles.backgroundCircle3} />

      <SafeAreaView style={styles.safeArea}>
        {showAuthForm ? (
          // Auth Form
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formWrapper}>
                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={hideForm}
                  disabled={loading}
                >
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={COLORS.textPrimary}
                  />
                </TouchableOpacity>

                {/* Form Header */}
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>
                    {isSignIn ? "Welcome Back" : "Create Account"}
                  </Text>
                  <Text style={styles.formSubtitle}>
                    {isSignIn
                      ? "Sign in to continue"
                      : "Join us on your health journey"}
                  </Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formFields}>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={COLORS.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={COLORS.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={COLORS.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor={COLORS.textTertiary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete={isSignIn ? "password" : "password-new"}
                      editable={!loading}
                    />
                  </View>

                  {!isSignIn && (
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={COLORS.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor={COLORS.textTertiary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoComplete="password-new"
                        editable={!loading}
                      />
                    </View>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleAuth}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isSignIn ? "Sign In" : "Create Account"}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Switch Auth Mode */}
                <TouchableOpacity
                  onPress={() => setIsSignIn(!isSignIn)}
                  disabled={loading}
                  style={styles.switchButton}
                >
                  <Text style={styles.switchText}>
                    {isSignIn
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </Text>
                </TouchableOpacity>

                {/* Or Continue as Guest */}
                <View style={styles.orContainer}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                <TouchableOpacity
                  style={styles.guestButtonAlt}
                  onPress={handleGuestMode}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={styles.guestButtonAltText}>
                    Continue without account
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          // Welcome Content
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.welcomeContent,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              {/* Logo/Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconBackground}>
                  <MaterialIcons
                    name="health-and-safety"
                    size={64}
                    color={COLORS.primary}
                  />
                </View>
              </View>

              {/* App Name */}
              <Text style={styles.appName}>PharmaGuide</Text>
              <Text style={styles.tagline}>Your Personal Health Companion</Text>

              {/* Features */}
              <View style={styles.features}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="scan" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.featureText}>
                    Scan supplements instantly
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons
                      name="shield-checkmark"
                      size={20}
                      color={COLORS.secondary}
                    />
                  </View>
                  <Text style={styles.featureText}>
                    Check drug interactions
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={20}
                      color={COLORS.accent}
                    />
                  </View>
                  <Text style={styles.featureText}>
                    AI-powered health advice
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => showForm(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => showForm(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    I have an account
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={handleGuestMode}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.textSecondary}
                    style={styles.guestIcon}
                  />
                  <Text style={styles.guestButtonText}>
                    {loading ? "Loading..." : "Continue as Guest"}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
    top: -100,
    right: -100,
  },
  backgroundCircle2: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: COLORS.secondary,
    opacity: 0.08,
    bottom: -150,
    left: -150,
  },
  backgroundCircle3: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.accent,
    opacity: 0.1,
    top: "40%",
    left: -50,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: SPACING.xl,
  },
  formWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    marginHorizontal: SPACING.lg,
    borderRadius: 24,
    padding: SPACING.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeContent: {
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  appName: {
    fontSize: 36,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl * 2,
    textAlign: "center",
  },
  features: {
    marginBottom: SPACING.xl * 2,
    width: "100%",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  featureText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.base,
    flex: 1,
  },
  actionButtons: {
    width: "100%",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: "center",
  },
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  guestIcon: {
    marginRight: SPACING.xs,
  },
  guestButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.base,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
    alignSelf: "flex-start",
  },
  formHeader: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  formSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  formFields: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: "center",
  },
  switchButton: {
    paddingVertical: SPACING.sm,
  },
  switchText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: "center",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.lg,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  orText: {
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginHorizontal: SPACING.md,
  },
  guestButtonAlt: {
    paddingVertical: SPACING.md,
  },
  guestButtonAltText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.base,
    textAlign: "center",
  },
});
