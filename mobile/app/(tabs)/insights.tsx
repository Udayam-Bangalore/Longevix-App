import {
  normalizeNutrientName,
  RDA_VALUES,
} from "@/src/constants";
import { useAuth } from "@/src/contexts/auth.context";
import { mealsService } from "@/src/services/meals.service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

interface InsightMeal {
  id: string;
  name: string;
  items: any[];
  calories: number;
  date: string;
  micronutrients?: Record<string, number>;
}

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
  // Ensure num is a valid number
  const validNum = Number(num);
  if (isNaN(validNum)) {
    return '0';
  }
  
  // Round to nearest integer for display
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
        // Force reload the app
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
  const [meals, setMeals] = useState<InsightMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMealsForRange = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();

      switch (selectedRange) {
        case "Week":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "Month":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "3 Months":
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Check if user is authenticated before making API call
      if (!user) {
        setMeals([]);
        setLoading(false);
        return;
      }

      const response = await mealsService.getMealsByDateRange(startDateStr, endDateStr);
      setMeals(response || []);
    } catch (err: any) {
      // Don't set error for network errors, just show empty state
      if (err.message && !err.message.includes('network') && !err.message.includes('fetch')) {
        setError(err.message || 'Failed to fetch meals');
      }
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRange, user]);

  useEffect(() => {
    fetchMealsForRange();
  }, [fetchMealsForRange]);

  // Calculate total calories from fetched meals
  // First try meal.calories, if that's 0, calculate from items
  const totalCalories = meals.reduce((sum, meal) => {
    let mealCalories = meal.calories || 0;
    
    // If meal calories is 0, try calculating from items
    if (mealCalories === 0 && meal.items && meal.items.length > 0) {
      mealCalories = meal.items.reduce((itemSum: number, item: any) => {
        const itemCalories = typeof item.calories === 'number' ? item.calories : 
                            typeof item.calories === 'string' ? parseFloat(item.calories) : 0;
        return itemSum + (itemCalories || 0);
      }, 0);
    }
    
    return sum + mealCalories;
  }, 0);
  
  const totalItems = meals.reduce((sum, meal) => sum + (meal.items?.length || 0), 0);

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

  // Calculate aggregated micronutrients from all meals
  const aggregatedMicronutrients = meals.reduce((acc, meal) => {
    if (meal.items && meal.items.length > 0) {
      meal.items.forEach((item: any) => {
        if (item.micronutrients) {
          Object.entries(item.micronutrients).forEach(([key, value]) => {
            const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
            acc[key] = (acc[key] || 0) + numValue;
          });
        }
      });
    }
    // Also check meal-level micronutrients
    if (meal.micronutrients) {
      Object.entries(meal.micronutrients).forEach(([key, value]) => {
        const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
        acc[key] = (acc[key] || 0) + numValue;
      });
    }
    return acc;
  }, {} as Record<string, number>);


  // Calculate days in selected range
  const daysInRange = selectedRange === "Week" ? 7 : selectedRange === "Month" ? 30 : 90;
  const totalCalorieTarget = dailyCalorieTarget * daysInRange;

  // Get unit for nutrient - uses the constants from nutrition.ts
  const getUnitForNutrient = (nutrientName: string): string => {
    // Map from camelCase keys to underscore keys used in constants
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

  // Calculate RDA achievement for a specific nutrient
  const calculateRDAAchievement = (nutrientName: string, consumedAmount: number) => {
    const normalizedName = normalizeNutrientName(nutrientName);
    // Map camelCase to underscore notation used in constants
    const underscoreName = normalizedName.replace(/([A-Z])/g, '_$1').toLowerCase();
    const rdaValue = RDA_VALUES[underscoreName] || RDA_VALUES[normalizedName.toLowerCase()];
    if (!rdaValue) return null;
    
    // Calculate total RDA needed for the period
    const totalRDA = rdaValue * daysInRange;
    const achieved = Math.min(consumedAmount, totalRDA);
    
    return {
      name: nutrientName,
      achieved,
      total: totalRDA,
      percentage: Math.min((consumedAmount / totalRDA) * 100, 100),
    };
  };

  // Generate chart data based on fetched meals
  const generateChartData = () => {
    const data: number[] = [];
    const daysToShow = selectedRange === "Week" ? 7 : selectedRange === "Month" ? 30 : 90;
    
    // Group meals by day
    const mealsByDay: { [key: string]: number } = {};
    
    meals.forEach(meal => {
      const dateKey = new Date(meal.date).toISOString().split('T')[0];
      
      // Calculate calories for this meal
      let mealCalories = meal.calories || 0;
      
      // If meal calories is 0 or not set, calculate from items
      if (mealCalories === 0 && meal.items && meal.items.length > 0) {
        mealCalories = meal.items.reduce((itemSum: number, item: any) => {
          const itemCalories = typeof item.calories === 'number' ? item.calories : 
                              typeof item.calories === 'string' ? parseFloat(item.calories) : 0;
          return itemSum + (itemCalories || 0);
        }, 0);
      }
      
      mealsByDay[dateKey] = (mealsByDay[dateKey] || 0) + mealCalories;
    });

    // Generate data points for the chart
    const endDate = new Date();
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      data.push(mealsByDay[dateKey] || 0);
    }

    return data;
  };

  const chartData = useMemo(() => generateChartData(), [meals, selectedRange]);
  
  // Generate labels for the chart
  const generateLabels = () => {
    const labels: string[] = [];
    const daysToShow = selectedRange === "Week" ? 7 : selectedRange === "Month" ? 7 : 6;
    
    const endDate = new Date();
    const step = Math.floor(90 / 6); // For 3 months
    
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
    
    const maxVal = Math.max(...validData, 1); // Avoid division by zero
    const stepX = validData.length > 1 ? width / (validData.length - 1) : width / 2;
    
    return validData.reduce((acc, val, i) => {
      const x = validData.length > 1 ? i * stepX : width / 2;
      const y = height - ((val / maxVal) * height * 0.8) - 10; // Add some padding
      return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, "");
  };

  const maxCalories = chartData.length > 0 ? Math.max(...chartData.filter(v => typeof v === 'number' && !isNaN(v)), 1) : 1;

  if (loading && meals.length === 0) {
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
          <Text style={styles.headerTitle}>Insights</Text>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchMealsForRange} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

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
              {chartData && chartData.length > 0 ? (
                <Svg height="140" width={SCREEN_WIDTH - 80}>
                  <Defs>
                    <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#4CAF50" stopOpacity="0.3" />
                      <Stop offset="1" stopColor="#4CAF50" stopOpacity="0" />
                    </SvgGradient>
                  </Defs>
                  
                  {/* Area under the line */}
                  <Path
                    d={`${generatePath()} L ${SCREEN_WIDTH - 80} 120 L 0 120 Z`}
                    fill="url(#grad)"
                  />
                  
                  {/* The Line */}
                  <Path
                    d={generatePath()}
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data Points */}
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
                <Text style={styles.statValue}>{formatNumber(meals.length)}</Text>
                <Text style={styles.statLabel}>Meals Logged</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(totalItems)}</Text>
                <Text style={styles.statLabel}>Food Items</Text>
              </View>
            </View>

            {/* Score Section */}
            <View style={styles.scoreSection}>
              <Text style={styles.scoreValue}>
                {totalCalories > 0 && totalCalorieTarget > 0 
                  ? Math.min(Math.round((totalCalories / totalCalorieTarget) * 100), 100) 
                  : 0}%
              </Text>
              <Text style={styles.scoreLabel}>Average goal adherence</Text>
              <Text style={[styles.statLabel, { marginTop: 4 }]}>
                {dailyCalorieTarget.toLocaleString()} cal/day target
              </Text>
            </View>
          </View>

          {/* RDA Achievement Rate Section */}
          <View style={styles.achievementCard}>
            <Text style={styles.cardTitle}>RDA Achievement Rate</Text>
            <View style={styles.achievementList}>
              {(() => {
                // Priority nutrients to display
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

                // Calculate RDA achievements for available nutrients
                const achievements = priorityNutrients
                  .map(nutrientKey => {
                    // Find the nutrient in aggregated data (case-insensitive)
                    const matchingKey = Object.keys(aggregatedMicronutrients).find(
                      key => normalizeNutrientName(key) === nutrientKey
                    );
                    const consumedAmount = matchingKey ? aggregatedMicronutrients[matchingKey] : 0;
                    const achievement = calculateRDAAchievement(nutrientKey, consumedAmount);
                    return achievement ? { ...achievement, color: nutrientColors[nutrientKey] } : null;
                  })
                  .filter((item): item is NonNullable<typeof item> => item !== null);

                // If no data available, show placeholder message
                if (achievements.length === 0) {
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
                <TouchableOpacity style={styles.researchLink}>
                  <Ionicons name="book-outline" size={16} color="#666" />
                  <Text style={styles.researchText}>View research</Text>
                </TouchableOpacity>
              </View>

              {/* Get Recommendations button - Hide for admin and pro users */}
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
                    {/* Background Pattern */}
                    <View style={styles.buttonPattern}>
                      <View style={styles.patternCircle1} />
                      <View style={styles.patternCircle2} />
                    </View>

                    {/* Decorative Stars */}
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

                    <Text style={styles.premiumButtonText}>Get Recommendations</Text>
                    <Ionicons name="lock-closed" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Insight Card 2 */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="warning-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.insightHeaderText}>
                  <Text style={styles.insightQuestion}>Am I exceeding safe limits?</Text>
                  <Text style={styles.insightDescription}>
                    Your Vitamin A intake has been near the upper limit (UL) on 3 out of 7 days this week. Consistently exceeding the UL may increase risk of adverse effects.
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightFooter}>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>High confidence</Text>
                </View>
                <TouchableOpacity style={styles.researchLink}>
                  <Ionicons name="book-outline" size={16} color="#666" />
                  <Text style={styles.researchText}>View research</Text>
                </TouchableOpacity>
              </View>

              {/* Review Foods button - Hide for admin and pro users */}
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
                    {/* Background Pattern */}
                    <View style={styles.buttonPattern}>
                      <View style={styles.patternCircle1} />
                      <View style={styles.patternCircle2} />
                    </View>

                    {/* Decorative Stars */}
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

                    <Text style={styles.premiumButtonText}>Review Foods</Text>
                    <Ionicons name="lock-closed" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Insight Card 3: Deficiency Risk Pattern */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="bulb-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.insightHeaderText}>
                  <Text style={styles.insightQuestion}>Deficiency Risk Pattern</Text>
                  <Text style={styles.insightDescription}>
                    You've had low Vitamin D intake on 5 out of 7 days this week. Consistent deficiency over time may impact bone health and immune function.
                  </Text>
                </View>
              </View>

              <View style={styles.evidenceBox}>
                <Text style={styles.evidenceTitle}>Evidence-backed risks:</Text>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Weakened bone density over time</Text>
                </View>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Reduced immune system function</Text>
                </View>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Potential mood regulation issues</Text>
                </View>
              </View>

              {/* Add Vitamin D Sources button - Hide for admin and pro users */}
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
                    <Text style={styles.premiumButtonText}>Add Vitamin D Sources</Text>
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
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
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
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#C62828",
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#C62828",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#4CAF50",
  },
  scoreLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
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
  evidenceBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  evidenceTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  bulletText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
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
