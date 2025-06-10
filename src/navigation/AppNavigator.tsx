// src/navigation/AppNavigator.tsx
import React, { useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { AuthNavigator } from "./AuthNavigator";
import { HomeScreen } from "../screens/home/HomeScreen";
import { ScanScreen } from "../screens/scan/ScanScreen";
import { AIScreen } from "../screens/ai/AIScreen";
import { MyStackScreen } from "../screens/stack/MyStackScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../constants";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabNavigator = () => {
  const navigationRef = useRef<any>(null);

  return (
    <Tab.Navigator
      ref={navigationRef}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconComponent: React.ElementType;
          let iconName: string;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
            iconComponent = Ionicons;
          } else if (route.name === "Scan") {
            iconName = focused ? "scan" : "scan-outline";
            iconComponent = Ionicons;
          } else if (route.name === "AI") {
            iconName = focused
              ? "chatbubble-ellipses"
              : "chatbubble-ellipses-outline";
            iconComponent = Ionicons;
          } else if (route.name === "Stack") {
            iconName = "inventory";
            iconComponent = MaterialIcons;
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
            iconComponent = Ionicons;
          }

          return React.createElement(iconComponent, {
            name: iconName,
            size: size,
            color: color,
          });
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray200,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: "Home" }}>
        {(props) => <HomeScreen {...props} navigationRef={navigationRef} />}
      </Tab.Screen>
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{ tabBarLabel: "Scan" }}
      />
      <Tab.Screen
        name="AI"
        component={AIScreen}
        options={{ tabBarLabel: "AI Chat" }}
      />
      <Tab.Screen
        name="Stack"
        component={MyStackScreen}
        options={{ tabBarLabel: "My Stack" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
