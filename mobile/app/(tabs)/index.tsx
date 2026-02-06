import {
  DEFAULT_MACRO_TARGETS,
  DEFAULT_MICRONUTRIENTS,
  RDA_VALUES,
} from "@/src/constants";
import { useAuth } from "@/src/contexts/auth.context";
import { useMeals } from "@/src/contexts/meals.context";
import { hp, responsiveWidth, wp } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");


interface NutrientData {
  id: string;
  name: string;
  value: number;
  unit: string;
  percentage: number;
  rda: string;
  status: "good" | "warning" | "excellent" | "low";
  icon: string;
  iconColor: string;
  iconBg: string;
  description: string;
}


const CURRENT_DATE = new Date();
const FORMATTED_DATE = CURRENT_DATE.toLocaleDateString("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
});

// Use default micronutrients from constants
const MICRONUTRIENTS: NutrientData[] = DEFAULT_MICRONUTRIENTS.map(nutrient => ({
  ...nutrient,
  status: 'low' as const,
}));


const CircularProgress: React.FC<{
  percentage: number;
  size: number;
  children?: React.ReactNode;
}> = ({ percentage, size, children }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getProgressColor = () => {
    if (percentage >= 100) return '#FFD700';
    if (percentage >= 50) return '#4CAF50';
    if (percentage >= 30) return '#FF9800';
    return '#F44336';
  };

  const progressColor = getProgressColor();

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      {children && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
};


const ProgressBar: React.FC<{
  percentage: number;
  color: string;
  height?: number;
}> = ({ percentage, color, height = 6 }) => {
  const clampedPercentage = Math.min(percentage, 100);

  return (
    <View style={[styles.progressBarContainer, { height }]}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${clampedPercentage}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
};


const AskAISection: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  
  if (user?.role === "admin" || user?.role === "prouser") {
    return null;
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/pricing")}>
      <LinearGradient
        colors={["#4CAF50", "#1A1A1A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.askAIContainer}
      >

        <View style={styles.askAIPattern}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </View>


        <View style={styles.askAIContent}>
          
          <View style={styles.askAILeft}>
            <View style={styles.askAIIconContainer}>
              <LinearGradient
                colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                style={styles.askAIIconBg}
              >
                <MaterialCommunityIcons
                  name="robot-happy-outline"
                  size={28}
                  color="#fff"
                />
              </LinearGradient>
            </View>
            <View style={styles.askAITextContainer}>
              <View style={styles.askAITitleRow}>
                <Text style={styles.askAITitle}>Ask AI</Text>
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={12} color="#fff" />
                </View>
              </View>
              <Text style={styles.askAISubtitle}>
                Get personalized nutrition advice instantly
              </Text>
            </View>
          </View>

          
          <TouchableOpacity 
            style={styles.upgradeButton} 
            activeOpacity={0.8}
            onPress={() => router.push("/pricing")}
          >
            <Ionicons name="sparkles" size={16} color="#1A1A1A" />
            <Text style={styles.upgradeText}>Upgrade</Text>
          </TouchableOpacity>
        </View>


        <View style={styles.starContainer}>
          <Ionicons
            name="sparkles"
            size={14}
            color="rgba(255,255,255,0.4)"
            style={styles.star1}
          />
          <Ionicons
            name="sparkles"
            size={10}
            color="rgba(255,255,255,0.3)"
            style={styles.star2}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};


const NutrientCard: React.FC<{ nutrient: NutrientData }> = ({ nutrient }) => {
  const router = useRouter();
  
  const getStatusColor = () => {
    switch (nutrient.status) {
      case "excellent":
        return "#2E7D32";
      case "good":
        return "#2E7D32";
      case "warning":
        return "#FF9800";
      case "low":
        return "#F44336";
      default:
        return "#2E7D32";
    }
  };

  const getStatusIcon = () => {
    switch (nutrient.status) {
      case "excellent":
      case "good":
        return (
          <Ionicons name="checkmark-circle" size={20} color={getStatusColor()} />
        );
      case "warning":
        return <Ionicons name="alert-circle" size={20} color={getStatusColor()} />;
      case "low":
        return <Ionicons name="warning" size={20} color={getStatusColor()} />;
      default:
        return null;
    }
  };

  const handlePress = () => {
    router.push({
      pathname: "/micronutrient-detail",
      params: {
        nutrientKey: nutrient.id,
        name: nutrient.name,
        value: nutrient.value.toString(),
        percentage: nutrient.percentage.toString(),
        unit: nutrient.unit,
        rda: nutrient.rda,
        description: nutrient.description || `${nutrient.name} is an essential nutrient for your health.`,
      },
    });
  };

  return (
    <TouchableOpacity style={styles.nutrientCard} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.nutrientCardContent}>
        
        <View
          style={[
            styles.nutrientIconContainer,
            { backgroundColor: nutrient.iconBg },
          ]}
        >
          <MaterialCommunityIcons
            name={nutrient.icon as any}
            size={22}
            color={nutrient.iconColor}
          />
        </View>

        
        <View style={styles.nutrientInfo}>
          <Text style={styles.nutrientName}>{nutrient.name}</Text>
          <Text style={styles.nutrientValue}>
            {Number(nutrient.value).toLocaleString(undefined, { maximumFractionDigits: 1 })} {nutrient.unit}
          </Text>
          <ProgressBar percentage={nutrient.percentage} color={getStatusColor()} />
        </View>

        
        <View style={styles.nutrientStatus}>
          <View style={styles.nutrientPercentageRow}>
            <Text style={[styles.nutrientPercentage, { color: getStatusColor() }]}>
              {nutrient.percentage}%
            </Text>
            {getStatusIcon()}
          </View>
        </View>
      </View>


      <Text style={styles.nutrientRda}>{nutrient.rda}</Text>
      <Text style={styles.nutrientResearch}>
        <MaterialCommunityIcons name="book-search" size={16} color="#666" /> Research
      </Text>
    </TouchableOpacity>
  );
};


const AlertsInsightsSection: React.FC<{ micronutrients: NutrientData[] }> = ({ micronutrients }) => {
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  
  
  const alerts = micronutrients
    .filter(nutrient => nutrient.status === 'low')
    .map((nutrient, index) => ({
      id: `alert-${index}`,
      title: `Low ${nutrient.name}`,
      description: `Your intake of ${nutrient.name} is below recommended levels. ${nutrient.name} is essential for maintaining optimal health.`,
      action: "View research",
      icon: "warning",
      iconColor: "#FF9800",
      bgColor: "#FFF8E1",
      borderColor: "#FFECB3",
    }));

  
  if (alerts.length === 0) {
    return null;
  }

  
  const displayedAlerts = showAllAlerts
    ? alerts
    : alerts.slice(0, 2);

  const toggleShowAll = () => {
    setShowAllAlerts(!showAllAlerts);
  };

  return (
    <View style={styles.alertsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Alerts & Insights</Text>
        {alerts.length > 2 && (
          <TouchableOpacity onPress={toggleShowAll}>
            <Text style={styles.viewAllText}>
              {showAllAlerts ? "Show Less" : "View All"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.alertsContainer}>
        {displayedAlerts.map((alert) => (
          <TouchableOpacity 
            key={alert.id} 
            style={[
              styles.alertCard, 
              { backgroundColor: alert.bgColor, borderColor: alert.borderColor }
            ]} 
            activeOpacity={0.7}
          >
            <View style={styles.alertIconContainer}>
              <Ionicons name={alert.icon as any} size={24} color={alert.iconColor} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDescription}>{alert.description}</Text>
              <View style={styles.alertAction}>
                <Text style={[styles.alertActionText, { color: alert.iconColor }]}>{alert.action}</Text>
                <Ionicons name="arrow-forward" size={16} color={alert.iconColor} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      
      {!showAllAlerts && alerts.length > 2 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={toggleShowAll}
        >
          <Text style={styles.showMoreText}>
            +{alerts.length - 2} more alerts
          </Text>
          <Ionicons name="chevron-down" size={16} color="#2E7D32" />
        </TouchableOpacity>
      )}
    </View>
  );
};


const MealsSection: React.FC = () => {
  const { meals } = useMeals();
  const router = useRouter();

  const handleMealPress = (mealId: string) => {
    router.push(`/meal-details?mealId=${mealId}`);
  };

  return (
    <View style={styles.mealsSection}>
      <Text style={styles.sectionTitle}>Today's Meals</Text>
      <View style={styles.mealsContainer}>
        {meals?.map((meal) => (
          <TouchableOpacity 
            key={meal?.id} 
            style={styles.mealCard} 
            activeOpacity={0.7}
            onPress={() => meal?.id && handleMealPress(meal.id)}
          >
            <View style={[styles.mealIconContainer, { backgroundColor: meal?.iconBg }]}>
              <MaterialCommunityIcons name={meal?.icon as any} size={28} color={meal?.iconColor} />
            </View>
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>{meal?.name}</Text>
              <Text style={styles.mealDetails}>
                {meal?.items?.length} items • {Math.round(Number(meal?.calories) || 0)} cal
              </Text>
              {meal?.items?.length > 0 && (
                <View style={styles.mealMacrosPreview}>
                  <Text style={styles.mealMacroText}>
                    P: {Math.round(meal?.items?.reduce((sum, item) => sum + (item?.protein || 0), 0) || 0)}g
                  </Text>
                  <Text style={styles.mealMacroDot}>•</Text>
                  <Text style={styles.mealMacroText}>
                    C: {Math.round(meal?.items?.reduce((sum, item) => sum + (item?.carbohydrates || 0), 0) || 0)}g
                  </Text>
                  <Text style={styles.mealMacroDot}>•</Text>
                  <Text style={styles.mealMacroText}>
                    F: {Math.round(meal?.items?.reduce((sum, item) => sum + (item?.fat || 0), 0) || 0)}g
                  </Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};


export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showAllNutrients, setShowAllNutrients] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams<{ t?: string }>();
  const { meals, loading, error, refreshMeals, clearErrors } = useMeals();

  // Refresh meals when screen comes into focus or when timestamp changes
  useFocusEffect(
    useCallback(() => {
      refreshMeals();
    }, [refreshMeals, params.t])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearErrors();
    await refreshMeals();
    setRefreshing(false);
  }, [refreshMeals, clearErrors]);

  const totalCalories = meals?.reduce(
    (sum, meal) => sum + (meal?.items?.reduce((itemSum, item) => itemSum + (item?.calories || 0), 0) || 0),
    0
  ) || 0;
  const totalItems = meals?.reduce((sum, meal) => sum + (meal?.items?.length || 0), 0) || 0;
  const totalProtein = meals?.reduce(
    (sum, meal) => sum + (meal?.items?.reduce((itemSum, item) => itemSum + (item?.protein || 0), 0) || 0),
    0
  ) || 0;
  const NUTRIENT_SCORE = totalCalories > 0 ? Math.min(Math.round((totalCalories / DEFAULT_MACRO_TARGETS.calories) * 100), 100) : 0;
  
  const macroTargets = {
    calories: { value: totalCalories, target: DEFAULT_MACRO_TARGETS.calories },
    protein: { value: totalProtein, target: DEFAULT_MACRO_TARGETS.protein },
  };

  
  const totalMicronutrients: Record<string, number> = {};
  meals?.forEach(meal => {
    if (meal?.micronutrients) {
      Object.entries(meal?.micronutrients).forEach(([key, value]) => {
        if (!totalMicronutrients[key]) {
          totalMicronutrients[key] = 0;
        }
        totalMicronutrients[key] += value;
      });
    }
  });

  

  
  const updatedMicronutrients = MICRONUTRIENTS.map(nutrient => {
    const key = nutrient.id;
    const value = totalMicronutrients[key] || 0;
    const rda = RDA_VALUES[key];
    const percentage = rda > 0 ? Math.min(Math.round((value / rda) * 100), 100) : 0;
    
    let status: 'low' | 'good' | 'warning' | 'excellent' = 'low';
    if (percentage >= 100) status = 'excellent';
    else if (percentage >= 75) status = 'good';
    else if (percentage >= 50) status = 'warning';
    
    return {
      ...nutrient,
      value,
      percentage,
      status,
    };
  });

  
  const displayedNutrients = showAllNutrients
    ? updatedMicronutrients
    : updatedMicronutrients.slice(0, 3);

  const toggleShowAll = () => {
    setShowAllNutrients(!showAllNutrients);
  };

  // Loading State
  if (loading && meals?.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your meals...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
            tintColor="#4CAF50"
          />
        }
      >
        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={20} color="#C62828" />
            <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>Longevix</Text>
            <Text style={styles.dateText}>{FORMATTED_DATE}</Text>
          </View>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <View style={styles.logoInner}>
                <Image 
                  source={require("@/assets/images/logo.png")} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        </View>

        
        <LinearGradient
          colors={["#4CAF50", "#16213E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.navArrow}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.todayText}>Today</Text>
            <TouchableOpacity style={styles.navArrow}>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.evidenceBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.evidenceText}>Evidence-backed</Text>
            </View>
          </View>

          
          <View style={styles.scoreSection}>
            <View style={styles.scoreTextContainer}>
              <Text style={styles.scoreValue}>{NUTRIENT_SCORE}%</Text>
              <Text style={styles.scoreLabel}>Overall Nutrient Score</Text>
            </View>
            <CircularProgress percentage={NUTRIENT_SCORE} size={80}><Ionicons name="body" size={20} color="#fff" /></CircularProgress>
          </View>

          
          <View style={styles.macroCardsContainer}>
            
            <View style={styles.macroCard}>
              <Text style={styles.macroLabel}>Calories</Text>
              <Text style={styles.macroValue}>
                {totalCalories > 0
                  ? Math.round(totalCalories).toLocaleString()
                  : "–"}
              </Text>
              <Text style={styles.macroTarget}>
                of {DEFAULT_MACRO_TARGETS.calories.toLocaleString()}
              </Text>
            </View>

            
            <View style={styles.macroCard}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>
                {totalProtein > 0
                  ? `${Math.round(totalProtein)}g`
                  : "–"}
              </Text>
              <Text style={styles.macroTarget}>
                of {DEFAULT_MACRO_TARGETS.protein}g
              </Text>
            </View>
          </View>
        </LinearGradient>

        
        <View style={styles.insightSection}>
          <View style={styles.insightIcon}>
            <Ionicons name="bulb-outline" size={24} color="#333" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Daily Insight</Text>
            <Text style={styles.insightText}>
              Based on peer-reviewed nutrition research. Tap any nutrient to see
              supporting studies.
            </Text>
          </View>
        </View>

        
        <View style={styles.askAISectionWrapper}>
          <AskAISection />
        </View>

        
        <View style={styles.micronutrientsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Micronutrients</Text>
            <TouchableOpacity onPress={() => router.push("/micronutrients")}>
              <Text style={styles.viewAllText}>
                {showAllNutrients ? "Show Less" : "View All"}
              </Text>
            </TouchableOpacity>
          </View>

          
          {displayedNutrients.map((nutrient) => (
            <NutrientCard key={nutrient.id} nutrient={nutrient} />
          ))}


          {!showAllNutrients && MICRONUTRIENTS?.length > 3 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={toggleShowAll}
            >
              <Text style={styles.showMoreText}>
                +{MICRONUTRIENTS.length - 3} more nutrients
              </Text>
              <Ionicons name="chevron-down" size={16} color="#2E7D32" />
            </TouchableOpacity>
          )}
        </View>

        
        <AlertsInsightsSection micronutrients={updatedMicronutrients} />

        
        <MealsSection />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    marginHorizontal: wp(4),
    marginTop: hp(2),
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#C62828",
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#C62828",
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#C62828",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  retryText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(20),
    paddingLeft: wp(4),
    paddingRight: wp(4),
  },

  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 12,
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    fontWeight: "500",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircle: {
    width: responsiveWidth(64),
    height: responsiveWidth(64),
    borderRadius: responsiveWidth(32),
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.2)",
  },
  logoInner: {
    width: responsiveWidth(48),
    height: responsiveWidth(48),
    borderRadius: responsiveWidth(24),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoImage: {
    width: responsiveWidth(32),
    height: responsiveWidth(32),
  },

  
  heroSection: {
    marginHorizontal: wp(4),
    borderRadius: responsiveWidth(24),
    padding: wp(5),
    marginTop: hp(1),
  },
  heroNav: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  todayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 12,
  },
  evidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: "auto",
    gap: 6,
  },
  evidenceText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  
  scoreSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  scoreTextContainer: {
    flex: 1,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
    marginTop: 4,
  },

  
  macroCardsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    padding: 16,
  },
  macroLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  macroTarget: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
    marginTop: 2,
  },

  
  insightSection: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: wp(4),
    marginTop: hp(2),
    borderRadius: responsiveWidth(16),
    padding: wp(4),
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    fontWeight: "500",
  },

  
  askAISectionWrapper: {
    marginHorizontal: wp(4),
    marginTop: hp(2),
  },
  askAIContainer: {
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
    position: "relative",
  },
  askAIPattern: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  patternCircle1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  patternCircle2: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  askAIContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  askAILeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  askAIIconContainer: {
    marginRight: 14,
  },
  askAIIconBg: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  askAITextContainer: {
    flex: 1,
  },
  askAITitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  askAITitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  lockBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  askAISubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    fontWeight: "500",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#764ba2",
  },
  starContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  star1: {
    position: "absolute",
    top: 12,
    right: 80,
  },
  star2: {
    position: "absolute",
    bottom: 15,
    right: 120,
  },

  
  micronutrientsSection: {
    marginTop: hp(3),
    paddingHorizontal: wp(4),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  viewAllText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },

  
  nutrientCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nutrientCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  nutrientIconContainer: {
    width: responsiveWidth(44),
    height: responsiveWidth(44),
    borderRadius: responsiveWidth(12),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3),
  },
  nutrientInfo: {
    flex: 1,
  },
  nutrientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  nutrientValue: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
    marginBottom: 8,
    fontWeight: "500",
  },
  nutrientStatus: {
    alignItems: "flex-end",
  },
  nutrientPercentageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nutrientPercentage: {
    fontSize: 18,
    fontWeight: "700",
  },
  nutrientRda: {
    fontSize: 12,
    color: "#999",
    marginTop: 12,
    fontWeight: "500",
  },
  nutrientResearch: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontWeight: "600",
  },

  
  progressBarContainer: {
    width: "100%",
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    borderRadius: 3,
  },

  
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
  },

  
  alertsSection: {
    marginTop: hp(3),
    paddingHorizontal: wp(4),
  },
  alertsContainer: {
    marginTop: 16,
  },
  alertCard: {
    backgroundColor: "#F2F2F2",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  dashedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#666",
    borderStyle: "dashed",
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  alertDescription: {
    fontSize: 14,
    color: "#4A4A4A",
    lineHeight: 20,
    marginBottom: 12,
  },
  alertAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  alertActionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
  },

  
  mealsSection: {
    marginTop: hp(3),
    paddingHorizontal: wp(4),
  },
  mealsContainer: {
    marginTop: 16,
  },
  mealCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  mealIconContainer: {
    width: responsiveWidth(60),
    height: responsiveWidth(60),
    borderRadius: responsiveWidth(16),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(4),
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  mealDetails: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  mealMacrosPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  mealMacroText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "700",
  },
  mealMacroDot: {
    fontSize: 12,
    color: "#CCC",
  },
});
