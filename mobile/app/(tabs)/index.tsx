import { useAuth } from "@/src/contexts/auth.context";
import { useMeals } from "@/src/contexts/meals.context";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
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
}


const CURRENT_DATE = new Date();
const FORMATTED_DATE = CURRENT_DATE.toLocaleDateString("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const NUTRIENT_SCORE = 0;

const MACRO_DATA = {
  calories: { value: 0, target: 2200 },
  protein: { value: 0, target: 75 },
};

const MICRONUTRIENTS: NutrientData[] = [
  {
    id: "1",
    name: "Vitamin C",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 90mg",
    status: "low",
    icon: "dna",
    iconColor: "#FF9800",
    iconBg: "#FFF3E0",
  },
  {
    id: "2",
    name: "Iron",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 18mg",
    status: "low",
    icon: "blood-bag",
    iconColor: "#795548",
    iconBg: "#EFEBE9",
  },
  {
    id: "3",
    name: "Calcium",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 1,000mg",
    status: "low",
    icon: "bone",
    iconColor: "#2196F3",
    iconBg: "#E3F2FD",
  },
  {
    id: "4",
    name: "Vitamin D",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "RDA: 20mcg",
    status: "low",
    icon: "white-balance-sunny",
    iconColor: "#FFC107",
    iconBg: "#FFFDE7",
  },
  {
    id: "5",
    name: "Vitamin A",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "UL: 3,000mcg",
    status: "low",
    icon: "eye",
    iconColor: "#9C27B0",
    iconBg: "#F3E5F5",
  },
  {
    id: "6",
    name: "Vitamin B12",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "RDA: 2.4mcg",
    status: "low",
    icon: "brain",
    iconColor: "#673AB7",
    iconBg: "#EDE7F6",
  },
  {
    id: "7",
    name: "Vitamin B6",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 1.3mg",
    status: "low",
    icon: "cellphone-text",
    iconColor: "#3F51B5",
    iconBg: "#E8EAF6",
  },
  {
    id: "8",
    name: "Folate",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "RDA: 400mcg",
    status: "low",
    icon: "flower",
    iconColor: "#009688",
    iconBg: "#E0F2F1",
  },
  {
    id: "9",
    name: "Magnesium",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 400mg",
    status: "low",
    icon: "zodiac-gemini",
    iconColor: "#8BC34A",
    iconBg: "#DCEDC8",
  },
  {
    id: "10",
    name: "Potassium",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 2,600mg",
    status: "low",
    icon: "turbine",
    iconColor: "#CDDC39",
    iconBg: "#F0F4C3",
  },
  {
    id: "11",
    name: "Zinc",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 11mg",
    status: "low",
    icon: "zodiac-aquarius",
    iconColor: "#00BCD4",
    iconBg: "#B2EBF2",
  },
  {
    id: "12",
    name: "Selenium",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "RDA: 55mcg",
    status: "low",
    icon: "atom",
    iconColor: "#03A9F4",
    iconBg: "#B3E5FC",
  },
  {
    id: "13",
    name: "Copper",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 0.9mg",
    status: "low",
    icon: "cog",
    iconColor: "#00BCD4",
    iconBg: "#B2EBF2",
  },
  {
    id: "14",
    name: "Manganese",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 2.3mg",
    status: "low",
    icon: "blender",
    iconColor: "#0097A7",
    iconBg: "#B2EBF2",
  },
  {
    id: "15",
    name: "Iodine",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "RDA: 150mcg",
    status: "low",
    icon: "radio-tower",
    iconColor: "#26C6DA",
    iconBg: "#B2EBF2",
  },
];


const CircularProgress: React.FC<{
  percentage: number;
  size: number;
  children?: React.ReactNode;
}> = ({ percentage, size, children }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

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
          stroke="#FFFFFF"
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

  return (
    <View style={styles.nutrientCard}>
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
            {nutrient.value.toLocaleString()} {nutrient.unit}
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
    </View>
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
        {meals.map((meal) => (
          <TouchableOpacity 
            key={meal.id} 
            style={styles.mealCard} 
            activeOpacity={0.7}
            onPress={() => handleMealPress(meal.id)}
          >
            <View style={[styles.mealIconContainer, { backgroundColor: meal.iconBg }]}>
              <MaterialCommunityIcons name={meal.icon as any} size={28} color={meal.iconColor} />
            </View>
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealDetails}>
                {meal.items.length} items • {meal.calories} cal
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};


export default function DashboardScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showAllNutrients, setShowAllNutrients] = useState(false);
  const { meals, loading, error } = useMeals();

  
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalItems = meals.reduce((sum, meal) => sum + meal.items.length, 0);
  const NUTRIENT_SCORE = totalCalories > 0 ? Math.min(Math.round((totalCalories / 2200) * 100), 100) : 0;
  
  const MACRO_DATA = {
    calories: { value: totalCalories, target: 2200 },
    protein: { value: Math.round(totalCalories * 0.15 / 4), target: 75 },
  };

  
  const totalMicronutrients: Record<string, number> = {};
  meals.forEach(meal => {
    if (meal.micronutrients) {
      Object.entries(meal.micronutrients).forEach(([key, value]) => {
        if (!totalMicronutrients[key]) {
          totalMicronutrients[key] = 0;
        }
        totalMicronutrients[key] += value;
      });
    }
  });

  
  const nutrientNameToKey: Record<string, string> = {
    'Vitamin C': 'vitamin_c',
    'Iron': 'iron',
    'Calcium': 'calcium',
    'Vitamin D': 'vitamin_d',
    'Vitamin A': 'vitamin_a',
    'Vitamin B12': 'vitamin_b12',
    'Vitamin B6': 'vitamin_b6',
    'Folate': 'folate',
    'Magnesium': 'magnesium',
    'Potassium': 'potassium',
    'Zinc': 'zinc',
    'Selenium': 'selenium',
    'Copper': 'copper',
    'Manganese': 'manganese',
    'Iodine': 'iodine',
  };

  
  const RDA_VALUES: Record<string, number> = {
    'vitamin_c': 90,
    'iron': 18,
    'calcium': 1000,
    'vitamin_d': 20,
    'vitamin_a': 900,
    'vitamin_b12': 2.4,
    'vitamin_b6': 1.3,
    'folate': 400,
    'magnesium': 400,
    'potassium': 2600,
    'zinc': 11,
    'selenium': 55,
    'copper': 0.9,
    'manganese': 2.3,
    'iodine': 150,
  };

  
  const updatedMicronutrients = MICRONUTRIENTS.map(nutrient => {
    const key = nutrientNameToKey[nutrient.name];
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

  return (
    <View style={styles.container}>
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
      >
        
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>NutriTrack</Text>
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
                {MACRO_DATA.calories.value.toLocaleString()}
              </Text>
              <Text style={styles.macroTarget}>
                of {MACRO_DATA.calories.target.toLocaleString()}
              </Text>
            </View>

            
            <View style={styles.macroCard}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{MACRO_DATA.protein.value}g</Text>
              <Text style={styles.macroTarget}>
                of {MACRO_DATA.protein.target}g
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
            <TouchableOpacity onPress={toggleShowAll}>
              <Text style={styles.viewAllText}>
                {showAllNutrients ? "Show Less" : "View All"}
              </Text>
            </TouchableOpacity>
          </View>

          
          {displayedNutrients.map((nutrient) => (
            <NutrientCard key={nutrient.id} nutrient={nutrient} />
          ))}


          {!showAllNutrients && MICRONUTRIENTS.length > 3 && (
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
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },

  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.2)",
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

  
  heroSection: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
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
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
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
    marginHorizontal: 16,
    marginTop: 16,
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
    marginTop: 24,
    paddingHorizontal: 16,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    marginTop: 24,
    paddingHorizontal: 16,
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
    marginTop: 24,
    paddingHorizontal: 16,
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
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
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
});
