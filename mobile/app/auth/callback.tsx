import { useAuth } from "@/src/contexts/auth.context";
import { authService } from "@/src/services/auth.service";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const responsiveSize = (size: number) => Math.min(size, SCREEN_WIDTH * 1);

export default function AuthCallback() {
  const { redirectTo, error } = useLocalSearchParams<{
    redirectTo?: string;
    error?: string;
  }>();
  const [status, setStatus] = useState<"processing" | "success" | "error" | "ready">(
    "processing"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const handleCallback = async () => {
      if (error) {
        setStatus("error");
        setErrorMessage(error);
        return;
      }

      try {
        const isAuth = await authService.isAuthenticated();

        if (isAuth) {
          const userData = await authService.getProfile();
          setUser(userData);
          setStatus("success");

          setTimeout(() => {
            if (redirectTo === "/profile-setup" && !userData.profileCompleted) {
              router.replace("/(auth)/profile-setup");
            } else if (userData.profileCompleted) {
              router.replace("/(tabs)");
            } else {
              router.replace("/(auth)/profile-setup");
            }
          }, 1500);
        } else {
          setStatus("ready");
        }
      } catch (err) {
        setStatus("ready");
      }
    };

    handleCallback();
  }, [redirectTo, error]);

  const handleContinue = () => {
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.animationContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {status === "processing" && (
            <View style={styles.loadingContainer}>
              <Animated.View
                style={[styles.spinner, styles.spinnerAnimation]}
              />
              <Text style={styles.title}>Verifying...</Text>
              <Text style={styles.subtitle}>
                Please wait while we verify your email
              </Text>
            </View>
          )}

          {status === "success" && (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.title}>Email Verified!</Text>
              <Text style={styles.subtitle}>
                Redirecting you to complete your profile...
              </Text>
            </View>
          )}

          {status === "ready" && (
            <View style={styles.readyContainer}>
              <View style={styles.readyIcon}>
                <Text style={styles.readyIconText}>✉</Text>
              </View>
              <Text style={styles.title}>Email Verified!</Text>
              <Text style={styles.subtitle}>
                Your email has been successfully verified. Please log in to continue.
              </Text>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === "error" && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>✕</Text>
              </View>
              <Text style={styles.title}>Verification Failed</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => router.replace("/(auth)/login")}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsiveSize(24),
  },
  animationContainer: {
    alignItems: "center",
    width: "100%",
  },
  loadingContainer: {
    alignItems: "center",
  },
  spinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: "#E0E0E0",
    borderTopColor: "#2E7D32",
    marginBottom: responsiveSize(24),
  },
  spinnerAnimation: {},
  successContainer: {
    alignItems: "center",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveSize(24),
  },
  successIconText: {
    fontSize: 40,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  readyContainer: {
    alignItems: "center",
  },
  readyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveSize(24),
  },
  readyIconText: {
    fontSize: 40,
    color: "#FFFFFF",
  },
  title: {
    fontSize: responsiveSize(24),
    fontWeight: "bold",
    color: "#333",
    marginBottom: responsiveSize(12),
    textAlign: "center",
  },
  subtitle: {
    fontSize: responsiveSize(16),
    color: "#666",
    textAlign: "center",
    lineHeight: responsiveSize(24),
    marginBottom: responsiveSize(24),
  },
  continueButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: responsiveSize(32),
    paddingVertical: responsiveSize(14),
    borderRadius: responsiveSize(25),
    marginTop: responsiveSize(16),
  },
  continueButtonText: {
    fontSize: responsiveSize(16),
    fontWeight: "600",
    color: "#fff",
  },
  errorContainer: {
    alignItems: "center",
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F44336",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveSize(24),
  },
  errorIconText: {
    fontSize: 40,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  errorMessage: {
    fontSize: responsiveSize(14),
    color: "#F44336",
    textAlign: "center",
    marginBottom: responsiveSize(16),
    lineHeight: responsiveSize(20),
  },
  retryButton: {
    backgroundColor: "#F44336",
    paddingHorizontal: responsiveSize(32),
    paddingVertical: responsiveSize(14),
    borderRadius: responsiveSize(25),
    marginTop: responsiveSize(16),
  },
  retryButtonText: {
    fontSize: responsiveSize(16),
    fontWeight: "600",
    color: "#fff",
  },
});
