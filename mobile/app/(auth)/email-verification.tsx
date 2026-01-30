import { authService } from "@/src/services";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const responsiveSize = (size: number, factor: number = 1) =>
  Math.min(size, SCREEN_WIDTH * factor);

const responsiveHeight = (size: number, factor: number = 1) =>
  Math.min(size, SCREEN_HEIGHT * factor);

export default function EmailVerificationScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [resendTimer, setResendTimer] = useState(60);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
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
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const handleResendVerification = async () => {
    if (resendTimer > 0) {
      return;
    }

    if (!email) {
      Alert.alert(
        "Error",
        "Email address is missing. Please go back and try again.",
      );
      return;
    }

    try {
      await authService.resendVerificationEmail(email);
      Alert.alert(
        "Verification Email Sent",
        "A new verification email has been sent to your email address.",
      );
      setResendTimer(60);
    } catch (error) {
      console.error("Resend verification error:", error);
      Alert.alert(
        "Failed to Resend",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    }
  };

  const handleBackToLogin = () => {
    router.push("/(auth)/login");
  };

  return (
      <LinearGradient
        colors={["#E8F5E9", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBackToLogin}
              style={styles.backButton}
              accessibilityLabel="Go back to login"
            >
              <FontAwesome6 name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[
              styles.contentSection,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <View style={styles.illustrationContainer}>
              <Ionicons name="mail-open-outline" size={120} color="#2E7D32" />
            </View>

            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a verification link to
            </Text>
            
            <View style={styles.emailContainer}>
              <Text style={styles.emailText}>{email}</Text>
            </View>

            <Text style={styles.instructionText}>
              Please click the link in the email to verify your account.
              Once verified, you can log in with your credentials.
            </Text>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the email?
              </Text>
              {resendTimer > 0 ? (
                <Text style={styles.timerText}>
                  Resend in {resendTimer}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendVerification}>
                  <Text style={styles.resendLink}>Resend Verification Email</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={handleBackToLogin}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsiveSize(20),
    paddingVertical: responsiveSize(40),
  },
  header: {
    position: "absolute",
    top: responsiveHeight(20),
    left: responsiveSize(20),
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  contentSection: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: responsiveSize(20),
  },
  illustrationContainer: {
    marginBottom: responsiveSize(40),
    alignItems: "center",
  },
  title: {
    fontSize: responsiveSize(28),
    fontWeight: "bold",
    color: "#2E7D32",
    textAlign: "center",
    marginBottom: responsiveSize(12),
    lineHeight: responsiveSize(36),
  },
  subtitle: {
    fontSize: responsiveSize(16),
    color: "#666",
    textAlign: "center",
    marginBottom: responsiveSize(8),
  },
  emailContainer: {
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    paddingHorizontal: responsiveSize(16),
    paddingVertical: responsiveSize(8),
    borderRadius: responsiveSize(8),
    marginBottom: responsiveSize(24),
  },
  emailText: {
    fontSize: responsiveSize(16),
    fontWeight: "600",
    color: "#2E7D32",
    textAlign: "center",
  },
  instructionText: {
    fontSize: responsiveSize(16),
    color: "#666",
    textAlign: "center",
    marginBottom: responsiveSize(32),
    lineHeight: responsiveSize(24),
    paddingHorizontal: responsiveSize(10),
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: responsiveSize(32),
  },
  resendText: {
    fontSize: responsiveSize(14),
    color: "#666",
    marginBottom: responsiveSize(8),
  },
  timerText: {
    fontSize: responsiveSize(14),
    color: "#999",
    fontWeight: "600",
  },
  resendLink: {
    fontSize: responsiveSize(14),
    color: "#2E7D32",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: responsiveSize(32),
    paddingVertical: responsiveSize(14),
    borderRadius: responsiveSize(25),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: responsiveSize(16),
    fontWeight: "600",
    color: "#fff",
  },
});
