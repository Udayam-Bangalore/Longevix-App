import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/common";
import { Colors } from "@/constants";
import { useColorScheme } from "@/hooks";
import { AuthGuard } from "@/src/components/guards/auth-guard";
import { useAuth } from "@/src/contexts/auth.context";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  const isProOrAdmin = user?.role === 'prouser' || user?.role === 'admin';

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            height: 75,
            paddingBottom: 15,
            paddingTop: 10,
            justifyContent: 'space-around',
            alignItems: 'center',
            borderRadius: 20,
            marginHorizontal: 10,
            marginBottom: 25,
            backgroundColor: Colors[colorScheme ?? "light"].tabBackground,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
          },
          lazy: false,
        }}
        backBehavior="history"
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons size={26} name="home" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: "Insights",
            tabBarIcon: ({ color }) => (
              <Ionicons size={26} name="stats-chart" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add-food"
          options={{
            title: "",
            tabBarIcon: () => (
              <View style={styles.addFoodButton}>
                <Ionicons size={28} name="add" color="#fff" />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => (
              <View style={{ position: 'relative' }}>
                <Ionicons size={26} name="chatbubbles" color={color} />
                {!isProOrAdmin && (
                  <View style={{ 
                    position: 'absolute', 
                    top: -2, 
                    right: -2, 
                    backgroundColor: '#FF6B6B', 
                    borderRadius: 6,
                    padding: 2
                  }}>
                    <Ionicons name="lock-closed" size={10} color="#fff" />
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons size={26} name="person" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="meal-details"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  addFoodButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
