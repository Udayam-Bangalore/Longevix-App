import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/src/contexts/auth.context";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { setHasSeenWelcome } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGetStarted = async () => {
    await setHasSeenWelcome();
    router.push("/(auth)/onboarding");
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#064E3B", "#065F46", "#047857", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Background decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        <View style={styles.glowEffect} />

        <View style={styles.content}>
          {/* Logo/Icon Section */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.iconCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={styles.iconInner}>
                <Image
                  source={require("@/assets/images/logo.png")}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </View>
            </Animated.View>
            <Text style={styles.appName}>Longevix</Text>
            <Text style={styles.tagline}>Your Smart Nutrition Companion</Text>
          </Animated.View>

          {/* Features Section */}
          <Animated.View
            style={[
              styles.featuresContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <FeatureItem
              icon="chatbubble-ellipses-outline"
              title="AI Nutrition Coach"
              text="Chat with our AI to get personalized meal plans and nutrition advice tailored to your goals"
            />
            <FeatureItem
              icon="trending-up-outline"
              title="Smart Insights"
              text="Visualize your progress with beautiful charts and personalized health recommendations"
            />
            <FeatureItem
              icon="sparkles-outline"
              title="Achieve Goals"
              text="Set personalized targets and let our AI guide you to a healthier, longer life"
            />
          </Animated.View>

          {/* CTA Buttons */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetStarted}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#FFFFFF", "#F9FAFB", "#F3F4F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#059669" />
              </LinearGradient>
            </TouchableOpacity>

          </Animated.View>
        </View>
      </LinearGradient>
    </>
  );
}

const FeatureItem = ({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) => (
  <View style={styles.featureItem}>
    <View style={styles.featureContent}>
      <View style={styles.featureIconContainer}>
        <View style={styles.featureIconCircle}>
          <Ionicons name={icon} size={22} color="#FFFFFF" />
        </View>
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    width: width,
    height: height,
  },
  decorativeCircle1: {
    position: "absolute",
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    top: -width * 0.25,
    right: -width * 0.25,
  },
  decorativeCircle2: {
    position: "absolute",
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: "rgba(5, 150, 105, 0.06)",
    bottom: height * 0.12,
    left: -width * 0.2,
  },
  decorativeCircle3: {
    position: "absolute",
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: "rgba(16, 185, 129, 0.04)",
    top: height * 0.35,
    right: -width * 0.15,
  },
  glowEffect: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    top: height * 0.15,
    left: width * 0.2,
    filter: "blur(60px)",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 20,
    maxHeight: height,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  iconCircle: {
    width: Math.min(120, width * 0.28),
    height: Math.min(120, width * 0.28),
    borderRadius: Math.min(60, width * 0.14),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 15,
  },
  iconInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  appName: {
    fontSize: Math.min(44, width * 0.09),
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.75)",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  featuresContainer: {
    gap: 14,
    marginTop: 20,
  },
  featureItem: {
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  featureContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  featureIconContainer: {
    marginRight: 14,
  },
  featureIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Math.min(15, width * 0.04),
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  featureText: {
    fontSize: Math.min(13, width * 0.033),
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "500",
    lineHeight: Math.min(18, width * 0.045),
  },
  buttonContainer: {
    gap: 16,
    marginTop: 10,
  },
  primaryButton: {
    borderRadius: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: "#059669",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
