import { GuestGuard } from "@/src/components/guards/auth-guard";
import { useAuth } from "@/src/contexts/auth.context";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const responsiveSize = (size: number, factor: number = 1) =>
  Math.min(size, SCREEN_WIDTH * factor);

const responsiveHeight = (size: number, factor: number = 1) =>
  Math.min(size, SCREEN_HEIGHT * factor);

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const { login, sendPhoneOtp, verifyPhoneOtp, user, isAuthenticated } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const prevAuthRef = useRef(isAuthenticated);

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

  // Redirect after successful login
  useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current && user) {
      prevAuthRef.current = true;
      if (!user.profileCompleted) {
        router.replace("/(auth)/profile-setup");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        "Validation Error",
        "Please enter both email and password",
      );
      return;
    }

    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phone) {
      Alert.alert(
        "Validation Error",
        "Please enter your phone number",
      );
      return;
    }

    // Check if phone number starts with country code
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const phoneDigitsOnly = phone.replace(/\D/g, '');

    if (!phone.startsWith('+')) {
      Alert.alert(
        "Invalid Format",
        "Please enter your phone number with country code (e.g., +919876543210)",
      );
      return;
    }

    if (!phoneRegex.test(phone)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid phone number with country code (e.g., +919876543210)",
      );
      return;
    }

    setIsLoading(true);

    try {
      await sendPhoneOtp(phone);
      setOtpSent(true);
      setResendTimer(30);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      Alert.alert(
        "Failed to Send OTP",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert(
        "Validation Error",
        "Please enter the OTP sent to your phone",
      );
      return;
    }

    setIsLoading(true);

    try {
      await verifyPhoneOtp(phone, otp);
    } catch (error) {
      Alert.alert(
        "Verification Failed",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === 'email' ? 'phone' : 'email');
    setOtpSent(false);
    setOtp("");
    setResendTimer(0);
  };

  const handleBack = () => {
    router.replace("/(auth)/onboarding");
  };

  const handleSignUp = () => {
    router.push("/(auth)/signup");
  };

  return (
    <GuestGuard>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#FFFFFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
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
                onPress={handleBack}
                style={styles.backButton}
                accessibilityLabel="Go back"
              >
                <FontAwesome6 name="arrow-left" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Animated.View
              style={[
                styles.logoSection,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.logoCircle}>
                <View style={styles.logoInner}>
                  <Image 
                    source={require("@/assets/images/logo.png")} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to continue your nutrition journey
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.formSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {loginMethod === 'email' ? (
                <>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="mail-outline" size={22} color="#2E7D32" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={22}
                        color="#2E7D32"
                      />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.forgotButton}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      (!email || !password) && styles.loginButtonDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={!email || !password || isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        email && password
                          ? ["#2E7D32", "#1B5E20"]
                          : ["#A5D6A7", "#A5D6A7"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginButtonGradient}
                    >
                      {isLoading ? (
                        <Ionicons name="sync" size={24} color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>Sign In</Text>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {!otpSent ? (
                    <>
                      <View style={styles.inputContainer}>
                        <View style={styles.inputIconContainer}>
                          <Ionicons name="phone-portrait-outline" size={22} color="#2E7D32" />
                        </View>
                        <TextInput
                          style={styles.input}
                          placeholder="+919876543210"
                          placeholderTextColor="#999"
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="phone-pad"
                          autoCapitalize="none"
                        />
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.loginButton,
                          (!phone || !phone.startsWith('+')) && styles.loginButtonDisabled,
                        ]}
                        onPress={handleSendPhoneOtp}
                        disabled={!phone || !phone.startsWith('+') || isLoading}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={
                            phone && phone.startsWith('+')
                              ? ["#2E7D32", "#1B5E20"]
                              : ["#A5D6A7", "#A5D6A7"]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.loginButtonGradient}
                        >
                          {isLoading ? (
                            <Ionicons name="sync" size={24} color="#fff" />
                          ) : (
                            <>
                              <Text style={styles.loginButtonText}>Send OTP</Text>
                              <Ionicons name="send" size={20} color="#fff" />
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View style={styles.otpSentInfo}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={styles.otpSentText}>
                          OTP sent to {phone}
                        </Text>
                        <TouchableOpacity onPress={() => {
                          setOtpSent(false);
                          setOtp("");
                        }}>
                          <Text style={styles.editPhoneText}>Edit</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.inputContainer}>
                        <View style={styles.inputIconContainer}>
                          <Ionicons name="keypad-outline" size={22} color="#2E7D32" />
                        </View>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter OTP"
                          placeholderTextColor="#999"
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="numeric"
                          maxLength={6}
                        />
                      </View>

                      <View style={styles.resendContainer}>
                        {resendTimer > 0 ? (
                          <Text style={styles.resendText}>
                            Resend OTP in {resendTimer}s
                          </Text>
                        ) : (
                          <TouchableOpacity onPress={handleSendPhoneOtp}>
                            <Text style={styles.resendLink}>Resend OTP</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.loginButton,
                          (!otp || otp.length < 4) && styles.loginButtonDisabled,
                        ]}
                        onPress={handleVerifyPhoneOtp}
                        disabled={!otp || otp.length < 4 || isLoading}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={
                            otp && otp.length >= 4
                              ? ["#2E7D32", "#1B5E20"]
                              : ["#A5D6A7", "#A5D6A7"]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.loginButtonGradient}
                        >
                          {isLoading ? (
                            <Ionicons name="sync" size={24} color="#fff" />
                          ) : (
                            <>
                              <Text style={styles.loginButtonText}>Verify & Sign In</Text>
                              <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </Animated.View>

            <Animated.View
              style={[
                styles.signupSection,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.toggleLoginMethod}>
              <TouchableOpacity onPress={toggleLoginMethod} style={styles.toggleButton}>
                <Ionicons 
                  name={loginMethod === 'email' ? 'phone-portrait-outline' : 'mail-outline'} 
                  size={18} 
                  color="#2E7D32" 
                />
                <Text style={styles.toggleLoginMethodText}>
                  {loginMethod === 'email' 
                    ? ' Sign in with Phone instead' 
                    : ' Sign in with Email instead'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legalLinksContainer}>
              <Text style={styles.legalText}>
                By signing in, you agree to our{" "}
                <Text 
                  style={styles.legalLink} 
                  onPress={() => Linking.openURL("https://udayam.co.in/terms-conditions")}
                >
                  Terms & Conditions
                </Text>{" "}
                and{" "}
                <Text 
                  style={styles.legalLink} 
                  onPress={() => Linking.openURL("https://udayam.co.in/privacy-policy")}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </GuestGuard>
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
    paddingHorizontal: responsiveSize(24, 0.06),
    paddingBottom: responsiveHeight(40, 0.05),
  },

  header: {
    paddingTop: responsiveHeight(50, 0.06),
    paddingBottom: responsiveHeight(20, 0.025),
  },
  backButton: {
    width: responsiveSize(44, 0.11),
    height: responsiveSize(44, 0.11),
    borderRadius: responsiveSize(12, 0.03),
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  logoSection: {
    alignItems: "center",
    marginTop: responsiveHeight(10, 0.02),
    marginBottom: responsiveHeight(30, 0.04),
  },
  logoCircle: {
    width: responsiveSize(100, 0.22),
    height: responsiveSize(100, 0.22),
    borderRadius: responsiveSize(50, 0.11),
    backgroundColor: "rgba(46, 125, 50, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(20, 0.025),
    borderWidth: 2,
    borderColor: "rgba(46, 125, 50, 0.2)",
  },
  logoInner: {
    width: responsiveSize(70, 0.15),
    height: responsiveSize(70, 0.15),
    borderRadius: responsiveSize(35, 0.075),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImage: {
    width: responsiveSize(45, 0.1),
    height: responsiveSize(45, 0.1),
  },
  welcomeTitle: {
    fontSize: responsiveSize(32, 0.08),
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: responsiveSize(16, 0.04),
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },

  formSection: {
    marginBottom: responsiveHeight(30, 0.04),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: responsiveSize(16, 0.04),
    marginBottom: responsiveHeight(16, 0.02),
    paddingHorizontal: responsiveSize(16, 0.04),
    height: responsiveHeight(60, 0.075),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIconContainer: {
    width: responsiveSize(40, 0.1),
    height: responsiveSize(40, 0.1),
    borderRadius: responsiveSize(10, 0.025),
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: responsiveSize(16, 0.04),
    color: "#333",
    fontWeight: "500",
  },
  eyeButton: {
    padding: 8,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: responsiveHeight(24, 0.03),
  },
  forgotText: {
    fontSize: responsiveSize(14, 0.035),
    color: "#2E7D32",
    fontWeight: "600",
  },

  loginButton: {
    borderRadius: responsiveSize(16, 0.04),
    overflow: "hidden",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    shadowOpacity: 0.1,
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(18, 0.025),
    gap: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: responsiveSize(18, 0.045),
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  signupSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: responsiveHeight(20, 0.025),
  },
  toggleLoginMethod: {
    alignSelf: "center",
    marginTop: responsiveHeight(20, 0.025),
    marginBottom: responsiveHeight(10, 0.015),
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(10, 0.015),
    paddingHorizontal: responsiveSize(16, 0.04),
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderRadius: responsiveSize(12, 0.03),
  },
  toggleLoginMethodText: {
    fontSize: responsiveSize(14, 0.035),
    color: "#2E7D32",
    fontWeight: "600",
    marginLeft: 8,
  },
  legalLinksContainer: {
    alignSelf: "center",
    marginTop: responsiveHeight(10, 0.015),
    marginBottom: responsiveHeight(20, 0.025),
  },
  legalText: {
    fontSize: responsiveSize(12, 0.03),
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  legalLink: {
    fontSize: responsiveSize(12, 0.03),
    color: "#2E7D32",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  otpSentInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: responsiveHeight(20, 0.025),
    paddingVertical: responsiveHeight(12, 0.018),
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: responsiveSize(12, 0.03),
  },
  otpSentText: {
    fontSize: responsiveSize(14, 0.035),
    color: "#2E7D32",
    fontWeight: "600",
    marginHorizontal: 8,
  },
  editPhoneText: {
    fontSize: responsiveSize(13, 0.032),
    color: "#1565C0",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: responsiveHeight(20, 0.025),
  },
  resendText: {
    fontSize: responsiveSize(14, 0.035),
    color: "#666",
    fontWeight: "500",
  },
  resendLink: {
    fontSize: responsiveSize(14, 0.035),
    color: "#2E7D32",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  signupText: {
    fontSize: responsiveSize(16, 0.04),
    color: "#666",
    fontWeight: "500",
  },
  signupLink: {
    fontSize: responsiveSize(16, 0.04),
    color: "#2E7D32",
    fontWeight: "700",
  },
});
