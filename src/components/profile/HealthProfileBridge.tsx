// src/components/profile/HealthProfileBridge.tsx
// Bridge component to transition users to the new health profile system

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useNewHealthProfile } from '../../hooks/useNewHealthProfile';
import { COLORS } from '../../constants';

interface HealthProfileBridgeProps {
  children: React.ReactNode;
}

export const HealthProfileBridge: React.FC<HealthProfileBridgeProps> = ({ children }) => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const { loading, isProfileComplete } = useNewHealthProfile();

  useEffect(() => {
    // Only check for authenticated users (not guests)
    if (!isAuthenticated || !user || user.is_anonymous || loading) {
      return;
    }

    // If user doesn't have a complete profile, redirect to new setup
    if (!isProfileComplete) {
      console.log('🔄 Redirecting to new health profile setup');
      // Use setTimeout to avoid navigation during render
      setTimeout(() => {
        navigation.navigate('NewHealthProfileSetup' as never);
      }, 100);
    }
  }, [isAuthenticated, user, isProfileComplete, loading, navigation]);

  // Show loading while checking profile status
  if (isAuthenticated && !user?.is_anonymous && loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // For guests or users with complete profiles, show children
  return <>{children}</>;
};