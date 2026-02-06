import { useAuth } from "@/src/contexts/auth.context";
import { authService } from "@/src/services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useNotificationsStore } from "@/src/store/notifications.store";
import NotificationPermissionModal from "@/src/components/notifications/notification-permission-modal";
import {
  Animated,
  Dimensions,
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
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");


const responsiveSize = (size: number, factor: number = 1) =>
  Math.min(size, SCREEN_WIDTH * factor);

const responsiveHeight = (size: number, factor: number = 1) =>
  Math.min(size, SCREEN_HEIGHT * factor);

type SexOption = "male" | "female" | "others" | null;
type ActivityLevel = "low" | "moderate" | "high" | null;
type DietType = "veg" | "non-veg" | "vegan" | null;
type PrimaryGoal = "maintain" | "fat-loss" | "muscle-gain" | null;


const activityOptions: {
  value: ActivityLevel;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
}[] = [
  {
    value: "low",
    label: "Low",
    subtitle: "Little to no exercise",
    icon: "bed",
    color: "#64B5F6",
  },
  {
    value: "moderate",
    label: "Moderate",
    subtitle: "Exercise 3-5 days/week",
    icon: "directions-walk",
    color: "#FFB74D",
  },
  {
    value: "high",
    label: "High",
    subtitle: "Exercise 6-7 days/week",
    icon: "directions-run",
    color: "#81C784",
  },
];


const dietOptions: {
  value: DietType;
  label: string;
  icon: string;
  color: string;
}[] = [
  { value: "veg", label: "Veg", icon: "canadian-maple-leaf", color: "#4CAF50" },
  { value: "non-veg", label: "Non-Veg", icon: "bone", color: "#FF7043" },
  { value: "vegan", label: "Vegan", icon: "seedling", color: "#66BB6A" },
];


const goalOptions: {
  value: PrimaryGoal;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
}[] = [
  {
    value: "maintain",
    label: "Maintain Health",
    subtitle: "Balanced nutrition",
    icon: "heart-pulse",
    color: "#2196F3",
  },
  {
    value: "fat-loss",
    label: "Fat Loss",
    subtitle: "Calorie deficit focus",
    icon: "fire-flame-curved",
    color: "#FF5722",
  },
  {
    value: "muscle-gain",
    label: "Muscle Gain",
    subtitle: "Protein emphasis",
    icon: "dumbbell",
    color: "#9C27B0",
  },
];


interface Step1Props {
  age: string;
  setAge: (value: string) => void;
  sex: SexOption;
  setSex: (value: SexOption) => void;
  height: string;
  setHeight: (value: string) => void;
  weight: string;
  setWeight: (value: string) => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

const Step1PersonalInfo: React.FC<Step1Props> = ({
  age,
  setAge,
  sex,
  setSex,
  height,
  setHeight,
  weight,
  setWeight,
  fadeAnim,
  slideAnim,
}) => {
  const sexOptions: { value: SexOption; label: string; icon: string }[] = [
    { value: "male", label: "Male", icon: "mars" },
    { value: "female", label: "Female", icon: "venus" },
    { value: "others", label: "Others", icon: "genderless" },
  ];

  return (
    <>
      <Animated.View
        style={[
          styles.titleSection,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.mainTitle}>Let's personalize your experience</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>
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
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Age</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="calendar-outline" size={22} color="#2E7D32" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              placeholderTextColor="#999"
              value={age}
              onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
        </View>

        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Sex</Text>
          <View style={styles.sexOptionsContainer}>
            {sexOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sexOption,
                  sex === option.value && styles.sexOptionSelected,
                ]}
                onPress={() => setSex(option.value)}
                activeOpacity={0.7}
              >
                <FontAwesome6
                  name={option.icon as any}
                  size={24}
                  color={sex === option.value ? "#fff" : "#2E7D32"}
                />
                <Text
                  style={[
                    styles.sexOptionText,
                    sex === option.value && styles.sexOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Height</Text>
            <Text style={styles.optionalLabel}>(Optional)</Text>
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="resize-outline" size={22} color="#2E7D32" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="cm"
              placeholderTextColor="#999"
              value={height}
              onChangeText={(text) => setHeight(text.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              maxLength={6}
            />
            <Text style={styles.unitText}>cm</Text>
          </View>
        </View>

        
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Weight</Text>
            <Text style={styles.optionalLabel}>(Optional)</Text>
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="fitness-outline" size={22} color="#2E7D32" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="kg"
              placeholderTextColor="#999"
              value={weight}
              onChangeText={(text) => setWeight(text.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              maxLength={6}
            />
            <Text style={styles.unitText}>kg</Text>
          </View>
        </View>
      </Animated.View>
    </>
  );
};


interface Step2Props {
  activityLevel: ActivityLevel;
  setActivityLevel: (value: ActivityLevel) => void;
  dietType: DietType;
  setDietType: (value: DietType) => void;
  primaryGoal: PrimaryGoal;
  setPrimaryGoal: (value: PrimaryGoal) => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

const Step2LifestyleGoals: React.FC<Step2Props> = ({
  activityLevel,
  setActivityLevel,
  dietType,
  setDietType,
  primaryGoal,
  setPrimaryGoal,
  fadeAnim,
  slideAnim,
}) => {
  return (
    <>
      <Animated.View
        style={[
          styles.titleSection,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.mainTitle}>Lifestyle & Goals</Text>
        <Text style={styles.subtitle}>
          These help us calculate your nutrient targets
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
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Activity Level</Text>
          <View style={styles.activityOptionsContainer}>
            {activityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.activityOption,
                  activityLevel === option.value && styles.activityOptionSelected,
                ]}
                onPress={() => setActivityLevel(option.value)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.activityIconContainer,
                    { backgroundColor: `${option.color}20` },
                    activityLevel === option.value && {
                      backgroundColor: `${option.color}40`,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={option.icon as any}
                    size={24}
                    color={
                      activityLevel === option.value ? "#fff" : option.color
                    }
                  />
                </View>

                {/* Right side - Text */}
                <View style={styles.activityTextContainer}>
                  <Text
                    style={[
                      styles.activityLabel,
                      activityLevel === option.value &&
                        styles.activityLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.activitySubtitle,
                      activityLevel === option.value &&
                        styles.activitySubtitleSelected,
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </View>

                {/* Checkmark */}
                {activityLevel === option.value && (
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Diet Type Section */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Diet Type</Text>
          <View style={styles.dietOptionsContainer}>
            {dietOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dietOption,
                  dietType === option.value && styles.dietOptionSelected,
                ]}
                onPress={() => setDietType(option.value)}
                activeOpacity={0.7}
              >
                <FontAwesome6
                  name={option.icon as any}
                  size={22}
                  color={dietType === option.value ? "#fff" : option.color}
                />
                <Text
                  style={[
                    styles.dietOptionText,
                    dietType === option.value && styles.dietOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Primary Goal Section */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Primary Goal</Text>
          <View style={styles.goalOptionsContainer}>
            {goalOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.goalOption,
                  primaryGoal === option.value && styles.goalOptionSelected,
                ]}
                onPress={() => setPrimaryGoal(option.value)}
                activeOpacity={0.7}
              >
                {/* Left side - Icon */}
                <View
                  style={[
                    styles.goalIconContainer,
                    { backgroundColor: `${option.color}15` },
                  ]}
                >
                  <FontAwesome6
                    name={option.icon as any}
                    size={22}
                    color={option.color}
                  />
                </View>

                {/* Right side - Text */}
                <View style={styles.goalTextContainer}>
                  <Text style={styles.goalLabel}>{option.label}</Text>
                  <Text style={styles.goalSubtitle}>{option.subtitle}</Text>
                </View>

                {/* Checkmark */}
                {primaryGoal === option.value && (
                  <View style={styles.goalCheckmark}>
                    <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </>
  );
};


export default function ProfileSetupScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = params.mode === "edit";
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<SexOption>(null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(null);
  const [dietType, setDietType] = useState<DietType>(null);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(null);

  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Notification modal state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const { hasSeenPrompt, setHasSeenPrompt, enableNotifications } = useNotificationsStore();
  const { user, setUser } = useAuth();

  // Load user data when in edit mode
  useEffect(() => {
    if (isEditMode && user) {
      if (user.age) setAge(user.age.toString());
      if (user.sex) setSex(user.sex as SexOption);
      if (user.height) setHeight(user.height.toString());
      if (user.weight) setWeight(user.weight?.toString() || "");
      if (user.activityLevel) setActivityLevel(user.activityLevel as ActivityLevel);
      if (user.dietType) setDietType(user.dietType as DietType);
      if (user.primaryGoal) setPrimaryGoal(user.primaryGoal as PrimaryGoal);
    }
  }, [isEditMode, user]);

  useEffect(() => {
    
    fadeAnim.setValue(0);
    slideAnim.setValue(30);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  
  const isStep1Valid = age.length > 0 && sex !== null;
  const isStep2Valid =
    activityLevel !== null && dietType !== null && primaryGoal !== null;

  const isCurrentStepValid = currentStep === 1 ? isStep1Valid : isStep2Valid;

  const handleNext = async () => {
    if (!isCurrentStepValid) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        const profileData = {
          age: parseInt(age, 10),
          sex,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          activityLevel,
          dietType,
          primaryGoal,
        };

        const updatedUser = await authService.updateProfile(profileData);
        // Update user state in context
        setUser(updatedUser);
        
        // In edit mode, redirect to home directly
        if (isEditMode) {
          router.replace("/(tabs)");
        } else {
          // Show notification modal if user hasn't seen it before
          if (!hasSeenPrompt) {
            setShowNotificationModal(true);
            setHasSeenPrompt(true);
          } else {
            router.replace("/(tabs)");
          }
        }
      } catch (error) {
        // Handle error - show toast or alert
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      // In edit mode, go back to profile; otherwise go back to login
      if (isEditMode) {
        router.replace("/(tabs)/profile");
      } else {
        router.back();
      }
    }
  };

  // Notification modal handlers
  const handleEnableNotifications = async () => {
    await enableNotifications();
    setShowNotificationModal(false);
    router.replace("/(tabs)");
  };

  const handleSkipNotifications = () => {
    setShowNotificationModal(false);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#FFFFFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                accessibilityLabel="Go back"
              >
                <FontAwesome6 name="arrow-left" size={24} color="#333" />
              </TouchableOpacity>

              {/* Step Indicator */}
              <View style={styles.stepIndicator}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stepDot,
                      index + 1 <= currentStep && styles.stepDotActive,
                    ]}
                  />
                ))}
                <Text style={styles.stepText}>
                  {isEditMode ? "Edit Profile" : `Step ${currentStep}/${totalSteps}`}
                </Text>
              </View>

              {/* Placeholder for balance */}
              <View style={styles.headerPlaceholder} />
            </View>

            {/* Step Content */}
            {currentStep === 1 && (
              <Step1PersonalInfo
                age={age}
                setAge={setAge}
                sex={sex}
                setSex={setSex}
                height={height}
                setHeight={setHeight}
                weight={weight}
                setWeight={setWeight}
                fadeAnim={fadeAnim}
                slideAnim={slideAnim}
              />
            )}

            {currentStep === 2 && (
              <Step2LifestyleGoals
                activityLevel={activityLevel}
                setActivityLevel={setActivityLevel}
                dietType={dietType}
                setDietType={setDietType}
                primaryGoal={primaryGoal}
                setPrimaryGoal={setPrimaryGoal}
                fadeAnim={fadeAnim}
                slideAnim={slideAnim}
              />
            )}

            {/* Spacer to push button to bottom */}
            <View style={styles.spacer} />

            {/* Next Button */}
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  !isCurrentStepValid && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!isCurrentStepValid}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isCurrentStepValid
                      ? ["#2E7D32", "#1B5E20"]
                      : ["#A5D6A7", "#A5D6A7"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>
                    {currentStep === totalSteps ? (isEditMode ? "Save Changes" : "Start Your Journey") : "Next"}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Notification Permission Modal */}
      <NotificationPermissionModal
        visible={showNotificationModal}
        onClose={handleSkipNotifications}
        onEnable={handleEnableNotifications}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  gradientContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepIndicator: {
    flexDirection: "row",
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E0E0E0",
  },
  stepDotActive: {
    backgroundColor: "#2E7D32",
    width: 24,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 8,
  },
  headerPlaceholder: {
    width: 44,
  },

  
  titleSection: {
    marginTop: responsiveHeight(20, 0.025),
    marginBottom: responsiveHeight(24, 0.03),
  },
  mainTitle: {
    fontSize: responsiveSize(28, 0.07),
    fontWeight: "800",
    color: "#333",
    marginBottom: 10,
    letterSpacing: 0.3,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: responsiveSize(16, 0.04),
    color: "#666",
    fontWeight: "500",
    lineHeight: 24,
  },

  
  formSection: {
    gap: 24,
  },
  fieldContainer: {
    gap: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  optionalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 58,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  unitText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    marginLeft: 8,
  },

  
  sexOptionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  sexOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  sexOptionSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#1B5E20",
  },
  sexOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  sexOptionTextSelected: {
    color: "#fff",
  },

  
  activityOptionsContainer: {
    gap: 12,
  },
  activityOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activityOptionSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#1B5E20",
  },
  activityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  activityLabelSelected: {
    color: "#fff",
  },
  activitySubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  activitySubtitleSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  checkmarkContainer: {
    marginLeft: 8,
  },

  
  dietOptionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dietOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  dietOptionSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#1B5E20",
  },
  dietOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  dietOptionTextSelected: {
    color: "#fff",
  },

  
  goalOptionsContainer: {
    gap: 12,
  },
  goalOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  goalOptionSelected: {
    borderColor: "#2E7D32",
  },
  goalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  goalSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  goalCheckmark: {
    marginLeft: 8,
  },

  
  spacer: {
    flex: 1,
    minHeight: 30,
  },

  
  buttonContainer: {
    marginTop: 20,
  },
  nextButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonDisabled: {
    shadowOpacity: 0.1,
  },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
