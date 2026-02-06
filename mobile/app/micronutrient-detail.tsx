import { useAuth } from "@/src/contexts/auth.context";
import { useMeals } from "@/src/contexts/meals.context";
import { aiService } from "@/src/services/ai.service";
import { hp, wp } from "@/src/utils/responsive";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

// Response parser utility for AI responses
const parseAIResponse = (response: string): string => {
  let cleaned = response;

  // Remove code blocks (```code```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');

  // Remove inline code (`code`)
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // Remove placeholder tags and code-like structures
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  cleaned = cleaned.replace(/__[A-Z]+_\d+__/g, '');

  // Remove system prompt artifacts
  const systemPatterns = [
    /System prompt:.*$/gim,
    /You are a.*$/gim,
    /As an AI.*$/gim,
    /Your role is.*$/gim,
    /Context:.*$/gim,
    /User profile:.*$/gim,
    /Today's meals:.*$/gim,
    /Remember to.*$/gim,
    /Always.*$/gim,
    /Important:.*$/gim,
    /Note:.*$/gim,
    /Based on the.*$/gim,
    /Here is.*$/gim,
    /The user.*$/gim,
    /I will.*$/gim,
    /You should.*$/gim,
    /Make sure to.*$/gim,
    /Do not.*$/gim,
    /Avoid.*$/gim,
    /Ensure.*$/gim,
    /---+\s*$/gm,
    /===+\s*$/gm,
    /\*\*+/g,
    /__+/g,
    /\[.*?\]/g, // Remove markdown links
    /\(.*?https?:\/\/[^\s]+\)/g, // Remove URLs in parentheses
  ];

  for (const pattern of systemPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove lines that are too short and look like system artifacts
  cleaned = cleaned.split('\n')
    .filter(line => {
      const trimmed = line.trim();
      // Remove lines that are just system instructions or too short
      if (trimmed.length < 10 && (trimmed.includes(':') || trimmed.includes('.'))) {
        return false;
      }
      // Remove lines that look like code or JSON
      if (trimmed.includes('{') || trimmed.includes('}') || trimmed.includes('=>')) {
        return false;
      }
      // Remove lines containing angle brackets (code-like structures)
      if (trimmed.includes('<') && trimmed.includes('>')) {
        return false;
      }
      return true;
    })
    .join('\n');

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  // Remove any remaining placeholder tags
  cleaned = cleaned.replace(/__PRESERVED_TAG_\d+__/g, '');
  cleaned = cleaned.replace(/__TAG_\d+__/g, '');

  return cleaned;
};

// Format AI response as bullet points (max 5)
const formatBulletPoints = (response: string): string => {
  let cleaned = parseAIResponse(response);

  // Preserve special placeholder tags
  const preservedTags: string[] = [];
  let tagCounter = 0;
  cleaned = cleaned.replace(/<calculate_rda>/g, () => {
    preservedTags.push('<calculate_rda>');
    return `__TAG_${tagCounter++}__`;
  });

  // Extract bullet points
  let points = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      const trimmed = line.replace(/^[-•*]\s*/, '');
      // Remove lines containing angle brackets (code-like structures)
      if (trimmed.includes('<') && trimmed.includes('>')) {
        return false;
      }
      return trimmed.length > 10 && trimmed.length < 150;
    });

  // If no bullet points found, create them from sentences
  if (points.length === 0) {
    const sentences = cleaned
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => {
        // Remove sentences containing angle brackets
        if (s.includes('<') && s.includes('>')) {
          return false;
        }
        return s.length > 20 && s.length < 100;
      });
    
    points = sentences.slice(0, 5);
  }

  // Limit to 5 points
  points = points.slice(0, 5);

  // Restore preserved tags
  preservedTags.forEach((tag, index) => {
    points = points.map(p => p.replace(`__TAG_${index}__`, tag));
  });

  // Format as bullet points
  return points.map((point) => {
    const cleanPoint = point.replace(/^[-•*]\s*/, '');
    return `• ${cleanPoint}`;
  }).join('\n');
};

const CircularProgress: React.FC<{
  percentage: number;
  size: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}> = ({ percentage, size, strokeWidth = 10, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getProgressColor = () => {
    if (percentage >= 100) return "#4CAF50";
    if (percentage >= 75) return "#8BC34A";
    if (percentage >= 50) return "#FF9800";
    if (percentage >= 25) return "#FF9800";
    return "#F44336";
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

const FOOD_RECOMMENDATIONS: Record<string, { name: string; amount: string; icon: string }[]> = {
  vitamin_c: [
    { name: "Orange Juice", amount: "1 cup (240ml)", icon: "cup" },
    { name: "Red Bell Pepper", amount: "1 medium (119g)", icon: "pepper" },
    { name: "Kiwi", amount: "1 medium (69g)", icon: "fruit-citrus" },
    { name: "Strawberries", amount: "1 cup (144g)", icon: "fruit-cherries" },
    { name: "Broccoli", amount: "1 cup (91g)", icon: "flower" },
  ],
  iron: [
    { name: "Spinach", amount: "1 cup cooked (180g)", icon: "leaf" },
    { name: "Lean Beef", amount: "3 oz (85g)", icon: "food-steak" },
    { name: "Lentils", amount: "1 cup cooked (198g)", icon: "bowl-mix" },
    { name: "Fortified Cereal", amount: "1 cup", icon: "bowl" },
    { name: "Dark Chocolate", amount: "1 oz (28g)", icon: "candy" },
  ],
  calcium: [
    { name: "Milk", amount: "1 cup (240ml)", icon: "cup" },
    { name: "Yogurt", amount: "1 cup (245g)", icon: "cup" },
    { name: "Cheese", amount: "1.5 oz (42g)", icon: "cheese" },
    { name: "Salmon", amount: "3 oz (85g)", icon: "fish" },
    { name: "Tofu", amount: "1/2 cup (126g)", icon: "square-rounded" },
  ],
  vitamin_d: [
    { name: "Salmon", amount: "3 oz (85g)", icon: "fish" },
    { name: "Fortified Milk", amount: "1 cup (240ml)", icon: "cup" },
    { name: "Egg Yolk", amount: "1 large", icon: "egg" },
    { name: "Fortified Cereal", amount: "1 cup", icon: "bowl" },
    { name: "Mushrooms", amount: "1 cup (70g)", icon: "mushroom" },
  ],
  vitamin_a: [
    { name: "Sweet Potato", amount: "1 medium (130g)", icon: "food-potato" },
    { name: "Carrots", amount: "1 medium (61g)", icon: "carrot" },
    { name: "Spinach", amount: "1 cup raw (30g)", icon: "leaf" },
    { name: "Pumpkin", amount: "1 cup (245g)", icon: "pumpkin" },
    { name: "Cantaloupe", amount: "1/2 medium (160g)", icon: "fruit-citrus" },
  ],
  vitamin_b12: [
    { name: "Clams", amount: "3 oz (85g)", icon: "shell" },
    { name: "Salmon", amount: "3 oz (85g)", icon: "fish" },
    { name: "Beef", amount: "3 oz (85g)", icon: "food-steak" },
    { name: "Fortified Cereal", amount: "1 cup", icon: "bowl" },
    { name: "Eggs", amount: "1 large", icon: "egg" },
  ],
  vitamin_b6: [
    { name: "Chickpeas", amount: "1 cup (164g)", icon: "bowl-mix" },
    { name: "Banana", amount: "1 medium (118g)", icon: "fruit-banana" },
    { name: "Potatoes", amount: "1 medium (170g)", icon: "food-potato" },
    { name: "Turkey", amount: "3 oz (85g)", icon: "food-poultry" },
    { name: "Salmon", amount: "3 oz (85g)", icon: "fish" },
  ],
  folate: [
    { name: "Leafy Greens", amount: "1 cup (30g)", icon: "leaf" },
    { name: "Asparagus", amount: "1 cup (134g)", icon: "sprout" },
    { name: "Lentils", amount: "1 cup (198g)", icon: "bowl-mix" },
    { name: "Avocado", amount: "1/2 medium (68g)", icon: "fruit-avocado" },
    { name: "Orange", amount: "1 medium (131g)", icon: "fruit-citrus" },
  ],
  magnesium: [
    { name: "Almonds", amount: "1 oz (28g)", icon: "nut" },
    { name: "Spinach", amount: "1 cup cooked (180g)", icon: "leaf" },
    { name: "Cashews", amount: "1 oz (28g)", icon: "nut" },
    { name: "Black Beans", amount: "1 cup (172g)", icon: "bowl-mix" },
    { name: "Avocado", amount: "1 medium (136g)", icon: "fruit-avocado" },
  ],
  potassium: [
    { name: "Banana", amount: "1 medium (118g)", icon: "fruit-banana" },
    { name: "Sweet Potato", amount: "1 medium (130g)", icon: "food-potato" },
    { name: "Spinach", amount: "1 cup cooked (180g)", icon: "leaf" },
    { name: "Avocado", amount: "1 medium (136g)", icon: "fruit-avocado" },
    { name: "White Beans", amount: "1 cup (179g)", icon: "bowl-mix" },
  ],
  zinc: [
    { name: "Oysters", amount: "3 oz (85g)", icon: "shell" },
    { name: "Beef", amount: "3 oz (85g)", icon: "food-steak" },
    { name: "Pumpkin Seeds", amount: "1 oz (28g)", icon: "seed" },
    { name: "Chickpeas", amount: "1 cup (164g)", icon: "bowl-mix" },
    { name: "Cashews", amount: "1 oz (28g)", icon: "nut" },
  ],
  selenium: [
    { name: "Brazil Nuts", amount: "1 oz (6 nuts)", icon: "nut" },
    { name: "Tuna", amount: "3 oz (85g)", icon: "fish" },
    { name: "Shrimp", amount: "3 oz (85g)", icon: "food-crab" },
    { name: "Sunflower Seeds", amount: "1 oz (28g)", icon: "seed" },
    { name: "Eggs", amount: "1 large", icon: "egg" },
  ],
  copper: [
    { name: "Shellfish", amount: "3 oz (85g)", icon: "shell" },
    { name: "Liver", amount: "3 oz (85g)", icon: "food-off" },
    { name: "Nuts", amount: "1 oz (28g)", icon: "nut" },
    { name: "Whole Grain Bread", amount: "1 slice", icon: "bread-slice" },
    { name: "Dark Chocolate", amount: "1 oz (28g)", icon: "candy" },
  ],
  manganese: [
    { name: "Whole Grains", amount: "1 cup", icon: "bowl" },
    { name: "Nuts", amount: "1 oz (28g)", icon: "nut" },
    { name: "Legumes", amount: "1 cup", icon: "bowl-mix" },
    { name: "Leafy Greens", amount: "1 cup", icon: "leaf" },
    { name: "Tea", amount: "1 cup", icon: "cup" },
  ],
  iodine: [
    { name: "Seaweed", amount: "1 sheet", icon: "water" },
    { name: "Cod", amount: "3 oz (85g)", icon: "fish" },
    { name: "Dairy", amount: "1 cup", icon: "cup" },
    { name: "Iodized Salt", amount: "1/4 tsp", icon: "shaker" },
    { name: "Shrimp", amount: "3 oz (85g)", icon: "food-crab" },
  ],
};

export default function MicronutrientDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    nutrientKey?: string;
    name?: string;
    value?: string;
    percentage?: string;
    unit?: string;
    rda?: string;
    description?: string;
    prefill?: string;
  }>();
  const { user } = useAuth();
  const { meals, refreshMeals } = useMeals();
const [refreshing, setRefreshing] = useState(false);
  const [aiTip, setAiTip] = useState<string>("");
  const [aiTipLoading, setAiTipLoading] = useState(false);

  // Type-safe param extraction with defaults
  const nutrientKey: string = params.nutrientKey || "vitamin_c";
  const name: string = params.name || "Vitamin C";
  const value: number = parseFloat(params.value || '0') || 0;
  const percentage: number = parseInt(params.percentage || '0') || 0;
  const unit: string = params.unit || "mg";
  const rda: string = params.rda || "RDA: 90mg";
  const description: string = params.description || "";

  const foodRecommendations = FOOD_RECOMMENDATIONS[nutrientKey] || [];

  // Fetch AI-powered personalized recommendation based on user profile and food data
  const fetchAiRecommendation = useCallback(async () => {
    if (!user) {
      setAiTip("Complete your profile for personalized recommendations");
      return;
    }

    setAiTipLoading(true);
    try {
      // Build context about user's profile and food data
      const profileContext = buildUserContext();
      const prompt = `Analyze this user's nutrition data and provide exactly 5 bullet points recommendation for ${name} (${nutrientKey}):

${profileContext}

Current intake: ${value}${unit} (${percentage}% of RDA)
Target: ${rda}
<calculate_rda>

Requirements:
- Provide EXACTLY 5 bullet points (no more, no less)
- Each point should start with a bullet character (• or -)
- Use the user's actual profile data (age, sex, activity level, goals)
- Reference their today's food intake data
- Make it personalized, actionable and specific
- Keep each point concise (under 15 words)
- Do NOT calculate or mention RDA values - use <calculate_rda> placeholder

Example format:
• As a ${user.sex || 'young adult'} with ${user.activityLevel || 'moderate'} activity level, focus on...
• Your current intake at ${percentage}% suggests...
• Consider adding ${nutrientKey}-rich foods like...
• Based on your ${user.primaryGoal || 'health goals'}, prioritize...
• Recommended timing: ${nutrientKey === 'iron' || nutrientKey === 'vitamin_c' ? 'Take with meals for better absorption' : nutrientKey === 'vitamin_d' ? 'Morning with fat-containing foods' : 'Spread throughout the day'}`;

      const response = await aiService.chat(prompt);

      // Replace <calculate_rda> with actual calculated values BEFORE cleaning
      const processedResponse = processAiTip(response);

      // Clean and format the response as bullet points
      const cleanedResponse = formatBulletPoints(processedResponse);

      setAiTip(cleanedResponse);
    } catch {
      // Fallback to basic recommendation on error
      setAiTip(getFallbackTip());
    } finally {
      setAiTipLoading(false);
    }
  }, [user, meals, nutrientKey, name, value, percentage, unit, rda]);

  // Build user context for AI prompt with detailed food and profile data
  const buildUserContext = (): string => {
    if (!user) return "User profile not available";

    let context = `=== USER PROFILE ===\n`;
    
    if (user.age) {
      context += `Age: ${user.age} years\n`;
    }
    
    if (user.sex) {
      context += `Sex: ${user.sex}\n`;
    }
    
    if (user.activityLevel) {
      context += `Activity Level: ${user.activityLevel}\n`;
    }
    
    if (user.weight) {
      context += `Weight: ${user.weight}kg\n`;
    }
    
    if (user.height) {
      context += `Height: ${user.height}cm\n`;
    }
    
    if (user.primaryGoal) {
      context += `Primary Goal: ${user.primaryGoal}\n`;
    }

    if (user.dietType) {
      context += `Diet Type: ${user.dietType}\n`;
    }

    // Add today's meals context with detailed food data
    context += `\n=== TODAY'S FOOD INTAKE ===\n`;
    
    if (meals && meals.length > 0) {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      const foodList: string[] = [];

      meals.forEach((meal: any) => {
        context += `\n${meal.mealType?.toUpperCase() || 'Meal'}:\n`;
        
        if (meal.foods && meal.foods.length > 0) {
          meal.foods.forEach((food: any) => {
            const foodName = food.name || food.foodName || 'Unknown food';
            const quantity = food.quantity || 1;
            const unit = food.unit || 'serving';
            const calories = food.calories || food.calorie || 0;
            const protein = food.protein || 0;
            const carbs = food.carbohydrates || food.carbs || 0;
            const fat = food.fat || 0;

            totalCalories += calories;
            totalProtein += protein;
            totalCarbs += carbs;
            totalFat += fat;

            foodList.push(`• ${foodName} (${quantity} ${unit}) - ${calories}kcal`);
          });
        } else {
          context += `  No foods logged\n`;
        }
      });

      context += `\nTotal Today's Intake:\n`;
      context += `• Calories: ${totalCalories}kcal\n`;
      context += `• Protein: ${totalProtein}g\n`;
      context += `• Carbs: ${totalCarbs}g\n`;
      context += `• Fat: ${totalFat}g\n`;
    } else {
      context += `No meals logged yet today\n`;
    }

    return context;
  };

  // Fallback tip based on basic user data
  const getFallbackTip = (): string => {
    if (!user) return "Complete your profile for personalized recommendations";

    if (percentage < 25) {
      return `Your ${name} intake is below optimal levels. Consider adding more ${nutrientKey}-rich foods to your diet.`;
    } else if (percentage >= 100) {
      return `Great job! You've met your ${name} target for today. Keep up the balanced nutrition!`;
    } else {
      return `You're making progress! A bit more ${name} will help you reach your daily target.`;
    }
  };

  // Calculate RDA based on user profile
  const calculateRDA = (): { target: number; unit: string; recommendation: string } => {
    const baseRDAs: Record<string, number> = {
      vitamin_c: 90,
      iron: 18,
      calcium: 1000,
      vitamin_d: 600,
      vitamin_a: 900,
      vitamin_b12: 2.4,
      vitamin_b6: 1.7,
      folate: 400,
      magnesium: 420,
      potassium: 4700,
      zinc: 11,
      selenium: 55,
      copper: 0.9,
      manganese: 2.3,
      iodine: 150,
    };

    const baseRDA = baseRDAs[nutrientKey] || 100;

    // Adjust based on user profile
    let adjustedRDA = baseRDA;
    let recommendation = "Standard RDA";

    if (user.sex === 'female') {
      adjustedRDA = baseRDA * 0.9;
      recommendation = "Adjusted for females";
    } else if (user.sex === 'male') {
      adjustedRDA = baseRDA * 1.1;
      recommendation = "Adjusted for males";
    }

    if (user.age) {
      const age = parseInt(user.age, 10);
      if (age > 50) {
        adjustedRDA *= 1.2;
        recommendation = "Increased for age 50+";
      } else if (age < 18) {
        adjustedRDA *= 0.8;
        recommendation = "Adjusted for younger age";
      }
    }

    if (user.primaryGoal === 'muscle-gain' && nutrientKey === 'protein') {
      adjustedRDA *= 1.3;
      recommendation = "Increased for muscle gain";
    }

    return {
      target: Math.round(adjustedRDA),
      unit: unit,
      recommendation: recommendation
    };
  };

  // Process AI tip to replace <calculate_rda> with actual calculated values
  const processAiTip = (tip: string): string => {
    if (!tip.includes('<calculate_rda>')) return tip;

    const rdaData = calculateRDA();
    return tip.replace(/<calculate_rda>/g, `${rdaData.target} ${rdaData.unit} (${rdaData.recommendation})`);
  };

  // Fetch AI tip when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAiRecommendation();
    }, [fetchAiRecommendation])
  );

  const getStatusColor = () => {
    if (percentage >= 100) return "#4CAF50";
    if (percentage >= 75) return "#8BC34A";
    if (percentage >= 50) return "#FF9800";
    if (percentage >= 25) return "#FF9800";
    return "#F44336";
  };

  const getStatusText = () => {
    if (percentage >= 100) return "Excellent";
    if (percentage >= 75) return "Good";
    if (percentage >= 50) return "Fair";
    if (percentage >= 25) return "Low";
    return "Very Low";
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshMeals();
    setRefreshing(false);
  }, [refreshMeals]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4CAF50"]} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Your Intake</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + "20" }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <CircularProgress percentage={percentage} size={140}>
              <View style={styles.scoreContent}>
                <Text style={[styles.scoreValue, { color: getStatusColor() }]}>{percentage}%</Text>
                <Text style={styles.scoreLabel}>of RDA</Text>
              </View>
            </CircularProgress>
          </View>

          <View style={styles.intakeInfo}>
            <View style={styles.intakeItem}>
              <Text style={styles.intakeLabel}>Consumed</Text>
              <Text style={[styles.intakeValue, { color: getStatusColor() }]}>
                {value.toFixed(1)} {unit}
              </Text>
            </View>
            <View style={styles.intakeDivider} />
            <View style={styles.intakeItem}>
              <Text style={styles.intakeLabel}>Target</Text>
              <Text style={styles.intakeTarget}>{rda.replace("RDA: ", "")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why It's Necessary</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Benefits</Text>
          <View style={styles.benefitsList}>
            {nutrientKey in NUTRIENT_INFO && NUTRIENT_INFO[nutrientKey as keyof typeof NUTRIENT_INFO]?.benefits ? (
              (NUTRIENT_INFO[nutrientKey as keyof typeof NUTRIENT_INFO]?.benefits || []).map((benefit) => (
                <View key={`benefit-${benefit}`} style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: getStatusColor() + "20" }]}>
                    <Ionicons name="checkmark-circle" size={20} color={getStatusColor()} />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Benefits information available</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Based on Your Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Ionicons name="sparkles" size={24} color="#4CAF50" />
              <Text style={styles.profileTitle}>AI Personalized Insight</Text>
            </View>
            
            {aiTipLoading ? (
              <View style={styles.aiLoadingContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.aiLoadingText}>Analyzing your nutrition data...</Text>
              </View>
            ) : aiTip ? (
              <View style={styles.bulletPointsContainer}>
                {aiTip.split('\n').filter(point => point.trim().length > 0).map((point, index) => (
                  <View key={`tip-${index}`} style={styles.bulletPointItem}>
                    <View style={[styles.bulletPointDot, { backgroundColor: getStatusColor() }]} />
                    <Text style={styles.bulletPointText}>{point.replace(/^[•\-]\s*/, '')}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.profileText}>{getFallbackTip()}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to Eat</Text>
          <Text style={styles.sectionSubtitle}>Top food sources to boost your {name} intake</Text>
          <View style={styles.foodList}>
            {foodRecommendations.map((food) => (
              <View key={`food-${food.name}`} style={styles.foodCard}>
                <View style={styles.foodIcon}>
                  <MaterialCommunityIcons name={food.icon as any} size={24} color="#4CAF50" />
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodAmount}>{food.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.researchButton}
            activeOpacity={0.8}
            onPress={() => {
              const researchQuery = `Tell me about the latest peer-reviewed research on ${name} (${nutrientKey}). Include relevant research papers, studies, and links to scientific publications. Also analyze my current intake data: I'm at ${percentage}% of the RDA (${value.toFixed(1)} ${unit} consumed vs ${rda.replace("RDA: ", "")} target). Based on this data and peer-reviewed research, what recommendations would you make?`;
              router.push({
                pathname: "/(tabs)/chat",
                params: { 
                  prefill: researchQuery,
                  nutrientName: name,
                  nutrientKey: nutrientKey
                }
              });
            }}
          >
            <MaterialCommunityIcons name="book-search" size={20} color="#fff" />
            <Text style={styles.researchButtonText}>Research & Insights</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const NUTRIENT_INFO: Record<string, { benefits: string[] }> = {
  vitamin_c: {
    benefits: ["Boosts immune system", "Supports skin health", "Enhances iron absorption", "Acts as antioxidant"],
  },
  iron: {
    benefits: ["Oxygen transport", "Energy metabolism", "Brain function", "Muscle health"],
  },
  calcium: {
    benefits: ["Bone health", "Muscle contraction", "Nerve signaling", "Blood clotting"],
  },
  vitamin_d: {
    benefits: ["Calcium absorption", "Bone health", "Immune function", "Mood regulation"],
  },
  vitamin_a: {
    benefits: ["Vision health", "Immune support", "Skin health", "Cell growth"],
  },
  vitamin_b12: {
    benefits: ["Nerve health", "Energy production", "Red blood cell formation", "DNA synthesis"],
  },
  vitamin_b6: {
    benefits: ["Protein metabolism", "Brain health", "Hormone regulation", "Red blood cell production"],
  },
  folate: {
    benefits: ["DNA synthesis", "Cell division", "Pregnancy health", "Heart health"],
  },
  magnesium: {
    benefits: ["Energy production", "Muscle relaxation", "Nerve function", "Bone health"],
  },
  potassium: {
    benefits: ["Fluid balance", "Muscle function", "Heart health", "Blood pressure regulation"],
  },
  zinc: {
    benefits: ["Immune support", "Wound healing", "Protein synthesis", "Taste and smell"],
  },
  selenium: {
    benefits: ["Thyroid health", "Antioxidant protection", "Immune function", "Reproductive health"],
  },
  copper: {
    benefits: ["Iron absorption", "Connective tissue", "Energy production", "Brain development"],
  },
  manganese: {
    benefits: ["Bone health", "Metabolism", "Antioxidant defense", "Blood sugar regulation"],
  },
  iodine: {
    benefits: ["Thyroid health", "Metabolism", "Brain development", "Growth and development"],
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(5),
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  headerRight: {
    width: 44,
  },
  scoreCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  scoreContent: {
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "800",
  },
  scoreLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  intakeInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  intakeItem: {
    alignItems: "center",
  },
  intakeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  intakeValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  intakeDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#F0F0F0",
  },
  intakeTarget: {
    fontSize: 24,
    fontWeight: "700",
    color: "#666",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  descriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  benefitsList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  benefitText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  profileText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  aiLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  aiLoadingText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  bulletPointsContainer: {
    gap: 10,
  },
  bulletPointItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletPointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  bulletPointText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    flex: 1,
  },
  tipsContainer: {
    gap: 8,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 20,
  },
  foodList: {
    gap: 12,
  },
  foodCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  foodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  foodAmount: {
    fontSize: 14,
    color: "#666",
  },
  researchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  researchButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
  },
  progressBarContainer: {
    width: "100%",
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    borderRadius: 5,
  },
});
