import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Button } from "../../components/common";
import { useAuth } from "../../hooks/useAuth";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";

export const ProfileScreen = () => {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
        <Button
          title="Sign Out"
          onPress={signOut}
          variant="outline"
          style={{ marginTop: SPACING.lg }}
        />
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
});
