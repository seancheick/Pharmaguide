// src/screens/profile/ProfileScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/common";
import { useAuth } from "../../hooks/useAuth";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, signOut, loading: authLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // Navigation will be handled by the AppNavigator based on auth state
      console.log("Sign out successful");
    } catch (error) {
      console.error("Sign out error:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleCreateAccount = () => {
    // Navigate to the Welcome screen
    navigation.navigate("Welcome" as never);
  };

  // Show loading state
  if (authLoading || isSigningOut) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {isSigningOut ? "Signing out..." : "Loading..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        {user && !user.is_anonymous ? (
          // Signed-in user view
          <>
            <Text style={styles.subtitle}>{user.email}</Text>

            {/* User details section */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>
                  {user.profile?.firstName && user.profile?.lastName
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : "Not set"}
                </Text>
              </View>

              {user.profile?.age && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Age:</Text>
                  <Text style={styles.detailValue}>{user.profile.age}</Text>
                </View>
              )}

              {user.profile?.gender && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gender:</Text>
                  <Text style={styles.detailValue}>{user.profile.gender}</Text>
                </View>
              )}
            </View>

            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="outline"
              style={{ marginTop: SPACING.lg }}
            />
          </>
        ) : user && user.is_anonymous ? (
          // Anonymous user view
          <>
            <Text style={styles.subtitle}>Guest User</Text>
            <Text style={styles.message}>
              Create an account to save your data and access all features.
            </Text>

            <Button
              title="Create Account"
              onPress={handleCreateAccount}
              style={{ marginTop: SPACING.lg }}
            />

            <Button
              title="Continue as Guest"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={{ marginTop: SPACING.md }}
            />
          </>
        ) : (
          // Not signed in view
          <>
            <Text style={styles.subtitle}>Not Signed In</Text>
            <Text style={styles.message}>
              Please sign in or create an account to access your profile.
            </Text>

            <Button
              title="Sign In / Create Account"
              onPress={handleCreateAccount}
              style={{ marginTop: SPACING.lg }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  message: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  detailsContainer: {
    width: "100%",
    marginVertical: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: SPACING.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
});
