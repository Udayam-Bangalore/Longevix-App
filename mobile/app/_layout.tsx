import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/src/contexts/auth.context";
import { AppStateProvider } from "@/src/contexts/app-state.context";
import { MealsProvider } from "@/src/contexts/meals.context";
import { NotificationsProvider } from "@/src/contexts/notifications.context";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Alert, BackHandler } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, hasSeenWelcome, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // If we're on the welcome screen, don't allow going back (exit app)
      if (segments[1] === "welcome") {
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", style: "destructive", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }
      // If we're on login screen and not first time, exit app
      if (segments[1] === "login" && hasSeenWelcome) {
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", style: "destructive", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }
      // If we're on pricing screen, navigate back to home
      if (segments[0] === "pricing") {
        router.replace("/(tabs)");
        return true;
      }
      // Allow default back behavior on other screens
      return false;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [segments, hasSeenWelcome]);

  useEffect(() => {
    if (isLoading) return;
    if (isNavigating.current) return;
    
    const inAuthGroup = segments[0] === "(auth)";
    const currentScreen = segments[1];

    // Navigation logic:
    // 1. First time opening (hasSeenWelcome = false) → Welcome screen
    // 2. If authenticated and profile completed → Home screen (tabs)
    // 3. If authenticated but profile not completed → Profile setup screen
    // 4. If not authenticated but has seen welcome → Login screen

    if (!hasSeenWelcome && !isAuthenticated) {
      // First time user - go to welcome screen
      if (!inAuthGroup || (inAuthGroup && currentScreen !== "welcome")) {
        isNavigating.current = true;
        router.replace("/(auth)/welcome");
      }
    } else if (isAuthenticated) {
      // Check if we have user data
      if (!user) {
        // User is authenticated but user data not loaded yet, don't navigate
        return;
      }
      
      // Check if profile is completed
      const isProfileCompleted = user?.profileCompleted || false;
      
      if (isProfileCompleted) {
        // Profile completed - go to home (tabs)
        if (inAuthGroup) {
          isNavigating.current = true;
          router.replace("/(tabs)");
        }
      } else {
        // Profile not completed - go to profile setup
        if (!inAuthGroup || (inAuthGroup && currentScreen !== "profile-setup")) {
          isNavigating.current = true;
          router.replace("/(auth)/profile-setup");
        }
      }
    } else {
      // User has seen welcome but not authenticated - go to login
      if (!inAuthGroup || (inAuthGroup && currentScreen !== "login" && currentScreen !== "signup" && currentScreen !== "email-verification" && currentScreen !== "onboarding")) {
        isNavigating.current = true;
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isLoading, hasSeenWelcome, segments, user]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Auth callback page */}
        <Stack.Screen
          name="auth/callback"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        {/* Pricing page */}
        <Stack.Screen
          name="pricing"
          options={{
            headerShown: false,
          }}
        />
        {/* Test connection page */}
        <Stack.Screen
          name="test-connection"
          options={{
            headerShown: false,
          }}
        />
        {/* 404 Not Found */}
        <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <AuthProvider>
          <MealsProvider>
            <NotificationsProvider>
              <RootLayoutNav />
            </NotificationsProvider>
          </MealsProvider>
        </AuthProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
