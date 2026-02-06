import {
  normalizeNutrientName,
  RDA_VALUES,
} from "@/src/constants";
import { useAuth } from "@/src/contexts/auth.context";
import { useMeals } from "@/src/contexts/meals.context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgGradient } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TIME_RANGES = ["Week", "Month", "3 Months"];

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // ErrorBoundary caught an error
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Helper function to format numbers in human-readable format
const formatNumber = (num: number): string => {
  const validNum = Number(num);
  if (isNaN(validNum)) {
    return '0';
  }
  
  const roundedNum = Math.round(validNum);
  
  if (roundedNum >= 1000000) {
    return (roundedNum / 1000000).toFixed(1) + 'M';
  } else if (roundedNum >= 1000) {
    return (roundedNum / 1000).toFixed(1) + 'K';
  }
  return roundedNum.toString();
};

const ErrorFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FFF' }}>
    <Ionicons name="warning-outline" size={48} color="#FF9800" />
    <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', color: '#1A1A1A' }}>
      Something went wrong
    </Text>
    <Text style={{ marginTop: 8, fontSize: 14, color: '#666', textAlign: 'center' }}>
      We encountered an error while loading the insights. Please try again.
    </Text>
    <TouchableOpacity
      style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#4CAF50', borderRadius: 8 }}
      onPress={() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }}
    >
      <Text style={{ color: '#FFF', fontWeight: '600' }}>Reload</Text>
    </TouchableOpacity>
  </View>
);

export default function InsightsScreen() {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState("Week");
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { 
    dailyStats, 
    weeklyStats, 
    monthlyStats, 
    statsLoading, 
    statsError, 
    refreshStats,
    clearErrors 
  } = useMeals();

  // Refresh stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshStats();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearErrors();
    await refreshStats();
    setRefreshing(false);
  }, [refreshStats, clearErrors]);

  // Get stats based on selected range
  const getStatsForRange = () => {
    switch (selectedRange) {
      case "Week":
        return {
          daily: dailyStats,
          weekly: weeklyStats,
          monthly: monthlyStats,
        };
      case "Month":
        return {
          daily: dailyStats,
          weekly: weeklyStats,
          monthly: monthlyStats,
        };
      case "3 Months":
        return {
          daily: dailyStats,
          weekly: weeklyStats,
          monthly: monthlyStats,
        };
      default:
        return {
          daily: dailyStats,
          weekly: weeklyStats,
          monthly: monthlyStats,
        };
    }
  };

  const { daily, weekly, monthly } = getStatsForRange();

  // Calculate total calories from stats
  const totalCalories = useMemo(() => {
    let total = 0;
    
    if (selectedRange === "Week" || selectedRange === "Month") {
      daily.forEach(day => {
        total += day.calories || 0;
      });
    } else {
      // For 3 months, use weekly stats
      weekly.forEach(week => {
        total += week.totalCalories || 0;
      });
    }
    
    return total;
  }, [daily, weekly, selectedRange]);

  // Calculate total protein from stats
  const totalProtein = useMemo(() => {
    let total = 0;
    
    if (selectedRange === "Week" || selectedRange === "Month") {
      daily.forEach(day => {
        total += day.protein || 0;
      });
    } else {
      // For 3 months, use weekly stats
      weekly.forEach(week => {
        total += week.totalProtein || 0;
      });
    }
    
    return total;
  }, [daily, weekly, selectedRange]);

  const totalItems = useMemo(() => {
    let total = 0;
    daily.forEach(day => {
      total += day.totalMeals || 0;
    });
    return total;
  }, [daily]);

  // Calculate user's daily calorie target based on profile
  const calculateDailyCalorieTarget = () => {
    if (!user) return 2200; // Default fallback
    
    const weight = user.weight || 70; // kg
    const height = user.height || 170; // cm
    const age = user.age || 30;
    const sex = user.sex || 'male';
    const activityLevel = user.activityLevel || 'moderate';
    const primaryGoal = user.primaryGoal || 'maintain';
    
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number;
    if (sex.toLowerCase() === 'female') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    }
    
    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9,
    };
    
    const activityMultiplier = activityMultipliers[activityLevel.toLowerCase()] || 1.55;
    const tdee = Math.round(bmr * activityMultiplier);
    
    // Adjust based on goal
    let targetCalories = tdee;
    if (primaryGoal.toLowerCase().includes('loss')) {
      targetCalories = Math.round(tdee * 0.85); // 15% deficit
    } else if (primaryGoal.toLowerCase().includes('gain')) {
      targetCalories = Math.round(tdee * 1.15); // 15% surplus
    }
    
    return targetCalories;
  };
  
  const dailyCalorieTarget = calculateDailyCalorieTarget();

  // Calculate days in selected range
  const daysInRange = selectedRange === "Week" ? 7 : selectedRange === "Month" ? 30 : 90;
  const totalCalorieTarget = dailyCalorieTarget * daysInRange;

  // Calculate daily protein target based on user profile
  const calculateDailyProteinTarget = () => {
    if (!user) return 50; // Default fallback in grams
    
    const weight = user.weight || 70; // kg
    const activityLevel = user.activityLevel || 'moderate';
    const primaryGoal = user.primaryGoal || 'maintain';
    
    // Protein recommendation: 0.8-1g per kg body weight for sedentary
    // Increase based on activity level and goals
    let proteinPerKg = 0.8; // Base recommendation
    
    if (activityLevel === 'active' || activityLevel === 'very_active') {
      proteinPerKg = 1.2;
    } else if (activityLevel === 'moderate') {
      proteinPerKg = 1.0;
    }
    
    // Adjust based on goal
    if (primaryGoal.toLowerCase().includes('gain')) {
      proteinPerKg = Math.max(proteinPerKg, 1.4); // Higher for muscle gain
    } else if (primaryGoal.toLowerCase().includes('loss')) {
      proteinPerKg = Math.max(proteinPerKg, 1.0); // Higher protein for fat loss to preserve muscle
    }
    
    return Math.round(weight * proteinPerKg);
  };
  
  const dailyProteinTarget = calculateDailyProteinTarget();
  const totalProteinTarget = dailyProteinTarget * daysInRange;

  // Calculate aggregated micronutrients from all stats
  const aggregatedMicronutrients = useMemo(() => {
    const acc: Record<string, number> = {};
    
    daily.forEach(day => {
      if (day.micronutrients) {
        Object.entries(day.micronutrients).forEach(([key, value]) => {
          const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
          acc[key] = (acc[key] || 0) + numValue;
        });
      }
    });
    
    return acc;
  }, [daily]);

  // Get unit for nutrient
  const getUnitForNutrient = (nutrientName: string): string => {
    const keyMapping: Record<string, string> = {
      'vitaminC': 'vitamin_c',
      'vitaminD': 'vitamin_d',
      'vitaminA': 'vitamin_a',
      'vitaminB12': 'vitamin_b12',
      'vitaminB6': 'vitamin_b6',
      'vitaminE': 'vitamin_e',
      'vitaminK': 'vitamin_k',
    };
    
    const mappedKey = keyMapping[nutrientName] || nutrientName;
    const units: Record<string, string> = {
      'vitamin_c': 'mg',
      'vitamin_d': 'mcg',
      'iron': 'mg',
      'calcium': 'mg',
      'vitamin_a': 'mcg',
      'vitamin_b12': 'mcg',
      'folate': 'mcg',
      'magnesium': 'mg',
      'zinc': 'mg',
      'potassium': 'mg',
      'vitamin_e': 'mg',
      'vitamin_k': 'mcg',
      'thiamin': 'mg',
      'riboflavin': 'mg',
      'niacin': 'mg',
      'vitamin_b6': 'mg',
      'phosphorus': 'mg',
      'iodine': 'mcg',
      'selenium': 'mcg',
      'copper': 'mg',
      'manganese': 'mg',
      'chromium': 'mcg',
      'molybdenum': 'mcg',
    };
    return units[mappedKey] || 'mg';
  };

  // Calculate RDA achievement
  const calculateRDAAchievement = (nutrientName: string, consumedAmount: number) => {
    const normalizedName = normalizeNutrientName(nutrientName);
    const underscoreName = normalizedName.replace(/([A-Z])/g, '_$1').toLowerCase();
    const rdaValue = RDA_VALUES[underscoreName] || RDA_VALUES[normalizedName.toLowerCase()];
    if (!rdaValue) return null;
    
    const totalRDA = rdaValue * daysInRange;
    const achieved = Math.min(consumedAmount, totalRDA);
    
    return {
      name: nutrientName,
      achieved,
      total: totalRDA,
      percentage: Math.min((consumedAmount / totalRDA) * 100, 100),
    };
  };

  // Generate chart data
  const generateChartData = () => {
    const data: number[] = [];
    const daysToShow = selectedRange === "Week" ? 7 : selectedRange === "Month" ? 30 : 90;
    
    const mealsByDay: { [key: string]: number } = {};
    
    daily.forEach(day => {
      const dateKey = new Date(day.date).toISOString().split('T')[0];
      mealsByDay[dateKey] = (mealsByDay[dateKey] || 0) + (day.calories || 0);
    });

    const endDate = new Date();
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      data.push(mealsByDay[dateKey] || 0);
    }

    return data;
  };

  const chartData = useMemo(() => generateChartData(), [daily, selectedRange]);
  
  // Generate labels for the chart
  const generateLabels = () => {
    const labels: string[] = [];
    const daysToShow = selectedRange === "Week" ? 7 : selectedRange === "Month" ? 7 : 6;
    
    const endDate = new Date();
    const step = Math.floor(90 / 6);
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(endDate);
      
      if (selectedRange === "Week") {
        date.setDate(date.getDate() - (6 - i));
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      } else if (selectedRange === "Month") {
        date.setDate(date.getDate() - (30 - i * 5));
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      } else {
        date.setDate(date.getDate() - (90 - i * step));
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      }
    }
    
    return labels;
  };

  const days = generateLabels();

  const generatePath = () => {
    const height = 120;
    const width = SCREEN_WIDTH - 80;
    
    if (!chartData || chartData.length === 0) {
      return "";
    }
    
    const validData = chartData.filter(val => typeof val === 'number' && !isNaN(val));
    if (validData.length === 0) {
      return "";
    }
    
    const maxVal = Math.max(...validData, 1);
    const stepX = validData.length > 1 ? width / (validData.length - 1) : width / 2;
    
    return validData.reduce((acc, val, i) => {
      const x = validData.length > 1 ? i * stepX : width / 2;
      const y = height - ((val / maxVal) * height * 0.8) - 10;
      return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, "");
  };

  const maxCalories = chartData.length > 0 ? Math.max(...chartData.filter(v => typeof v === 'number' && !isNaN(v)), 1) : 1;

  // Loading State
  if (statsLoading && dailyStats.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#4CAF50", "#2E7D32"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Insights</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading your insights...</Text>
        </View>
      </View>
    );
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {/* Header */}
        <LinearGradient
          colors={["#4CAF50", "#2E7D32"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <Ionicons name="bulb-outline" size={24} color="#FFF" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Insights</Text>
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
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
          {statsError && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={20} color="#C62828" />
              <Text style={styles.errorText} numberOfLines={2}>{statsError}</Text>
              <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Time Range Selector */}
          <View style={styles.rangeSelector}>
            {TIME_RANGES.map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.rangeButton,
                  selectedRange === range && styles.activeRangeButton,
                ]}
                onPress={() => setSelectedRange(range)}
              >
                <Text
                  style={[
                    styles.rangeText,
                    selectedRange === range && styles.activeRangeText,
                  ]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weekly Overview Card */}
          <View style={styles.overviewCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {selectedRange === "Week" ? "Weekly Overview" : selectedRange === "Month" ? "Monthly Overview" : "Quarterly Overview"}
              </Text>
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={14} color="#1A1A1A" />
                <Text style={styles.badgeText}>Evidence-backed</Text>
              </View>
            </View>

            {/* Chart Area */}
            <View style={styles.chartContainer}>
              {chartData && chartData.length > 0 && chartData.some(v => v > 0) ? (
                <Svg height="140" width={SCREEN_WIDTH - 80}>
                  <Defs>
                    <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#4CAF50" stopOpacity="0.3" />
                      <Stop offset="1" stopColor="#4CAF50" stopOpacity="0" />
                    </SvgGradient>
                  </Defs>
                  
                  <Path
                    d={`${generatePath()} L ${SCREEN_WIDTH - 80} 120 L 0 120 Z`}
                    fill="url(#grad)"
                  />
                  
                  <Path
                    d={generatePath()}
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {chartData && chartData.length > 0 && chartData.map((val, i) => {
                    const stepX = chartData.length > 1 ? (SCREEN_WIDTH - 80) / (chartData.length - 1) : (SCREEN_WIDTH - 80) / 2;
                    const x = chartData.length > 1 ? i * stepX : (SCREEN_WIDTH - 80) / 2;
                    const y = 120 - ((val / maxCalories) * 120 * 0.8) - 10;
                    if (typeof val !== 'number' || isNaN(val)) return null;
                    return (
                      <Circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#FFF"
                        stroke="#4CAF50"
                        strokeWidth="2"
                      />
                    );
                  })}
                </Svg>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No data available for this period</Text>
                  <Text style={[styles.noDataText, { fontSize: 12, marginTop: 4 }]}>
                    Start logging meals to see your insights
                  </Text>
                </View>
              )}
              
              {/* Days Labels */}
              <View style={styles.daysContainer}>
                {days.map((day, index) => (
                  <Text key={`${day}-${index}`} style={styles.dayText}>{day}</Text>
                ))}
              </View>
            </View>

            {/* Stats Section */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(totalCalories)}</Text>
                <Text style={styles.statLabel}>Total Calories</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>{formatNumber(totalProtein)}g</Text>
                <Text style={styles.statLabel}>Total Protein</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(totalItems)}</Text>
                <Text style={styles.statLabel}>Meals Logged</Text>
              </View>
            </View>

            {/* Score Section */}
            <View style={styles.scoreSection}>
              <View style={styles.scoreRow}>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreValue}>
                    {totalCalories > 0 && totalCalorieTarget > 0 
                      ? Math.min(Math.round((totalCalories / totalCalorieTarget) * 100), 100) 
                      : 0}%
                  </Text>
                  <Text style={styles.scoreLabel}>Calories Adherence</Text>
                  <Text style={[styles.statLabel, { marginTop: 4 }]}>
                    {dailyCalorieTarget.toLocaleString()} cal/day
                  </Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreValue, { color: '#4CAF50' }]}>
                    {totalProtein > 0 && totalProteinTarget > 0 
                      ? Math.min(Math.round((totalProtein / totalProteinTarget) * 100), 100) 
                      : 0}%
                  </Text>
                  <Text style={styles.scoreLabel}>Protein Adherence</Text>
                  <Text style={[styles.statLabel, { marginTop: 4 }]}>
                    {dailyProteinTarget}g/day
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* RDA Achievement Rate Section */}
          <View style={styles.achievementCard}>
            <Text style={styles.cardTitle}>RDA Achievement Rate</Text>
            <View style={styles.achievementList}>
              {(() => {
                const priorityNutrients = ['vitaminC', 'iron', 'calcium', 'vitaminD'];
                const nutrientColors: Record<string, string> = {
                  'vitaminC': '#FF9800',
                  'iron': '#795548',
                  'calcium': '#2196F3',
                  'vitaminD': '#FFC107',
                };
                const nutrientDisplayNames: Record<string, string> = {
                  'vitaminC': 'Vitamin C',
                  'iron': 'Iron',
                  'calcium': 'Calcium',
                  'vitaminD': 'Vitamin D',
                };

                const achievements = priorityNutrients
                  .map(nutrientKey => {
                    const matchingKey = Object.keys(aggregatedMicronutrients).find(
                      key => normalizeNutrientName(key) === nutrientKey
                    );
                    const consumedAmount = matchingKey ? aggregatedMicronutrients[matchingKey] : 0;
                    const achievement = calculateRDAAchievement(nutrientKey, consumedAmount);
                    return achievement ? { ...achievement, color: nutrientColors[nutrientKey] } : null;
                  })
                  .filter((item): item is NonNullable<typeof item> => item !== null);

                if (achievements.length === 0 || achievements.every(a => a.achieved === 0)) {
                  return (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No micronutrient data available</Text>
                      <Text style={[styles.noDataText, { fontSize: 12, marginTop: 4 }]}>
                        Log meals with detailed nutrition info to see RDA progress
                      </Text>
                    </View>
                  );
                }

                return achievements.map((item) => (
                  <View key={item.name} style={styles.achievementItem}>
                    <View style={styles.achievementHeader}>
                      <Text style={styles.achievementName}>{nutrientDisplayNames[item.name] || item.name}</Text>
                      <Text style={styles.achievementValue}>
                        {formatNumber(Math.round(item.achieved))}/{formatNumber(Math.round(item.total))} {getUnitForNutrient(item.name)}
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${item.percentage}%`,
                            backgroundColor: item.color
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.achievementValue, { fontSize: 11, marginTop: 4, color: '#999' }]}>
                      {Math.round(item.percentage)}% of daily target
                    </Text>
                  </View>
                ));
              })()}
            </View>
          </View>

          {/* Personalized Insights Section */}
          <View style={styles.personalizedSection}>
            <Text style={styles.sectionTitle}>Personalized Insights</Text>
            
            {/* Insight Card 1 */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="battery-dead-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.insightHeaderText}>
                  <Text style={styles.insightQuestion}>Why am I feeling tired?</Text>
                  <Text style={styles.insightDescription}>
                    Based on your nutrient intake patterns, possible contributors include low Vitamin D and inconsistent Iron intake. Evidence suggests these deficiencies may impact energy levels.
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightFooter}>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>Medium confidence</Text>
                </View>
                <TouchableOpacity 
                  style={styles.researchLink}
                  onPress={() => {
                    const researchQuery = `Tell me about the latest peer-reviewed research on Vitamin D and Iron nutrition. Include relevant research papers, studies, and links to scientific publications. Also analyze my current intake data: Based on my nutrient intake patterns, I'm showing possible contributors to low energy levels including low Vitamin D and inconsistent Iron intake. What does the evidence suggest about how these deficiencies may impact energy levels and what recommendations would you make?`;
                    router.push({
                      pathname: "/(tabs)/chat",
                      params: { prefill: researchQuery }
                    });
                  }}
                >
                  <Ionicons name="book-outline" size={16} color="#666" />
                  <Text style={styles.researchText}>View research</Text>
                </TouchableOpacity>
              </View>

              {user?.role !== "admin" && user?.role !== "prouser" && (
                <TouchableOpacity 
                  style={styles.premiumButton} 
                  activeOpacity={0.8}
                  onPress={() => router.push("/pricing")}
                >
                  <LinearGradient
                    colors={["#4CAF50", "#1A1A1A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.premiumButtonGradient}
                  >
                    <View style={styles.buttonPattern}>
                      <View style={styles.patternCircle1} />
                      <View style={styles.patternCircle2} />
                    </View>
                    <View style={styles.starContainer}>
                      <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.4)" style={styles.star1} />
                      <Ionicons name="sparkles" size={10} color="rgba(255,255,255,0.3)" style={styles.star2} />
                    </View>
                    <Text style={styles.premiumButtonText}>Get Recommendations</Text>
                    <Ionicons name="lock-closed" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Medical Disclaimer Card */}
            <View style={styles.disclaimerCard}>
              <Ionicons name="information-circle" size={32} color="#666" style={styles.disclaimerIcon} />
              <Text style={styles.disclaimerText}>
                Insights are based on nutritional research and intake patterns. This is not a medical diagnosis. Consult a healthcare provider for personalized advice.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  logoInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    width: 32,
    height: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#C62828",
    marginBottom: 20,
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
  rangeSelector: {
    flexDirection: "row",
    backgroundColor: "#F1F3F5",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  activeRangeButton: {
    backgroundColor: "#66BB6A",
  },
  rangeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  activeRangeText: {
    color: "#FFF",
  },
  overviewCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginBottom: 20,
  },
  achievementCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  noDataContainer: {
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: SCREEN_WIDTH - 80,
  },
  dayText: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  scoreSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
  },
  scoreItem: {
    alignItems: "center",
    flex: 1,
  },
  scoreDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#E9ECEF",
    marginHorizontal: 16,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#4CAF50",
  },
  scoreLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  achievementList: {
    gap: 16,
  },
  achievementItem: {
    gap: 8,
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  achievementValue: {
    fontSize: 12,
    color: "#666",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E9ECEF",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  personalizedSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  insightCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    gap: 12,
  },
  insightHeader: {
    flexDirection: "row",
    gap: 12,
  },
  insightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  insightHeaderText: {
    flex: 1,
    gap: 4,
  },
  insightQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  insightDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  insightFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  confidenceBadge: {
    backgroundColor: "#FFF9C4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F57F17",
  },
  researchLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  researchText: {
    fontSize: 12,
    color: "#666",
  },
  premiumButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  premiumButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  patternCircle1: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -30,
    right: -20,
  },
  patternCircle2: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -10,
    left: -10,
  },
  starContainer: {
    position: "absolute",
    top: 10,
    right: 20,
  },
  star1: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  star2: {
    position: "absolute",
    top: 15,
    right: 10,
  },
  premiumButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  disclaimerCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginTop: 8,
  },
  disclaimerIcon: {
    marginTop: 2,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    flex: 1,
  },
});
