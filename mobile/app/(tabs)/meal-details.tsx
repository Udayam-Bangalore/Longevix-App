import { useMeals } from "@/src/contexts/meals.context";
import { Meal, mealsService } from "@/src/services/meals.service";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Micronutrient display name mapping
const MICRONUTRIENT_NAMES: Record<string, string> = {
  vitamin_c: "Vitamin C",
  iron: "Iron",
  calcium: "Calcium",
  vitamin_d: "Vitamin D",
  vitamin_a: "Vitamin A",
  vitamin_b12: "Vitamin B12",
  vitamin_b6: "Vitamin B6",
  folate: "Folate",
  magnesium: "Magnesium",
  potassium: "Potassium",
  zinc: "Zinc",
  selenium: "Selenium",
  copper: "Copper",
  manganese: "Manganese",
  iodine: "Iodine",
};

// Micronutrient unit mapping
const MICRONUTRIENT_UNITS: Record<string, string> = {
  vitamin_c: "mg",
  iron: "mg",
  calcium: "mg",
  vitamin_d: "mcg",
  vitamin_a: "mcg",
  vitamin_b12: "mcg",
  vitamin_b6: "mg",
  folate: "mcg",
  magnesium: "mg",
  potassium: "mg",
  zinc: "mg",
  selenium: "mcg",
  copper: "mg",
  manganese: "mg",
  iodine: "mcg",
};

// Micronutrient icon mapping
const MICRONUTRIENT_ICONS: Record<string, string> = {
  vitamin_c: "fruit-citrus",
  iron: "blood-bag",
  calcium: "bone",
  vitamin_d: "white-balance-sunny",
  vitamin_a: "eye",
  vitamin_b12: "brain",
  vitamin_b6: "cellphone-text",
  folate: "flower",
  magnesium: "zodiac-gemini",
  potassium: "turbine",
  zinc: "zodiac-aquarius",
  selenium: "atom",
  copper: "cog",
  manganese: "blender",
  iodine: "radio-tower",
};

// Micronutrient color mapping
const MICRONUTRIENT_COLORS: Record<string, { bg: string; color: string }> = {
  vitamin_c: { bg: "#FFF3E0", color: "#FF9800" },
  iron: { bg: "#EFEBE9", color: "#795548" },
  calcium: { bg: "#E3F2FD", color: "#2196F3" },
  vitamin_d: { bg: "#FFFDE7", color: "#FFC107" },
  vitamin_a: { bg: "#F3E5F5", color: "#9C27B0" },
  vitamin_b12: { bg: "#EDE7F6", color: "#673AB7" },
  vitamin_b6: { bg: "#E8EAF6", color: "#3F51B5" },
  folate: { bg: "#E0F2F1", color: "#009688" },
  magnesium: { bg: "#DCEDC8", color: "#8BC34A" },
  potassium: { bg: "#F0F4C3", color: "#CDDC39" },
  zinc: { bg: "#B2EBF2", color: "#00BCD4" },
  selenium: { bg: "#B3E5FC", color: "#03A9F4" },
  copper: { bg: "#B2EBF2", color: "#00BCD4" },
  manganese: { bg: "#B2EBF2", color: "#0097A7" },
  iodine: { bg: "#B2EBF2", color: "#26C6DA" },
};

export default function MealDetailsScreen() {
  const router = useRouter();
  const { mealId } = useLocalSearchParams();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllMicronutrients, setShowAllMicronutrients] = useState(false);
  const { refreshMeals } = useMeals();

  useEffect(() => {
    fetchMealDetails();
    // Reset showAllMicronutrients when meal changes
    setShowAllMicronutrients(false);
  }, [mealId]);

  // Refresh meal data when screen comes into focus (e.g., after returning from add-food)
  useFocusEffect(
    useCallback(() => {
      fetchMealDetails();
      return () => {
        // Cleanup if needed
      };
    }, [mealId])
  );

  const fetchMealDetails = async () => {
    if (!mealId || mealId === 'undefined') {
      setError('Invalid meal ID');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const mealData = await mealsService.getMealById(mealId as string);
      setMeal(mealData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch meal details");
    } finally {
      setLoading(false);
    }
  };

  const removeFoodItem = async (foodId: string) => {
    try {
      setLoading(true);
      await mealsService.removeFoodFromMeal(mealId as string, foodId);
      await fetchMealDetails();
      // Notify parent context to refresh meals data
      // This will trigger a refresh in the Home dashboard
      await refreshMeals();
    } catch (err: any) {
      setError(err.message || "Failed to remove food item");
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = () => {
    if (!meal) return "food-variant";
    switch (meal.name.toLowerCase()) {
      case "breakfast":
        return "egg-fried";
      case "lunch":
        return "food-apple";
      case "dinner":
        return "food-variant";
      case "snack":
        return "cookie";
      default:
        return "food-variant";
    }
  };

  const getMealColors = () => {
    if (!meal) return { iconColor: "#9C27B0", iconBg: "#F3E5F5" };
    switch (meal.name.toLowerCase()) {
      case "breakfast":
        return { iconColor: "#FF9800", iconBg: "#FFF3E0" };
      case "lunch":
        return { iconColor: "#4CAF50", iconBg: "#E8F5E9" };
      case "dinner":
        return { iconColor: "#9C27B0", iconBg: "#F3E5F5" };
      case "snack":
        return { iconColor: "#FFC107", iconBg: "#FFFDE7" };
      default:
        return { iconColor: "#9C27B0", iconBg: "#F3E5F5" };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading meal details...</Text>
      </View>
    );
  }

  if (error || !meal) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fallbackContainer}>
            <MaterialCommunityIcons 
              name="food-off-outline" 
              size={64} 
              color="#CCC" 
            />
            <Text style={styles.fallbackTitle}>No Meal Added Yet</Text>
            <Text style={styles.fallbackDescription}>
              {error 
                ? "If you've already added a meal but it's not showing, please check your internet connection and try again."
                : "You haven't added any meals yet. Start tracking your nutrition by adding a meal!"}
            </Text>
            {error && (
              <TouchableOpacity style={styles.retryButton} onPress={fetchMealDetails} activeOpacity={0.7}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meal Summary */}
        <View style={styles.summaryCard}>
          <View style={[styles.iconContainer, { backgroundColor: getMealColors().iconBg }]}>
            <MaterialCommunityIcons 
              name={getMealIcon()} 
              size={36} 
              color={getMealColors().iconColor} 
            />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.dateText}>
              {new Date(meal.date).toLocaleDateString("en-US", { 
                weekday: "long", 
                month: "short", 
                day: "numeric" 
              })}
            </Text>
          </View>
        </View>

        {/* Nutrition Summary */}
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Nutrition Summary</Text>
          
          {/* Macronutrients */}
          <View style={styles.macroContainer}>
            <View style={styles.macroItem}>
              <View style={[styles.macroIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="fire" size={20} color="#FF9800" />
              </View>
              <Text style={styles.macroValue}>{Math.round(meal.calories || 0)}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="food-steak" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.macroValue}>
                {Math.round(meal.items.reduce((sum, item) => sum + (item.protein || 0), 0))}
              </Text>
              <Text style={styles.macroLabel}>Protein (g)</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="bread-slice" size={20} color="#2196F3" />
              </View>
              <Text style={styles.macroValue}>
                {Math.round(meal.items.reduce((sum, item) => sum + (item.carbohydrates || 0), 0))}
              </Text>
              <Text style={styles.macroLabel}>Carbs (g)</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroIconContainer, { backgroundColor: '#F3E5F5' }]}>
                <MaterialCommunityIcons name="oil" size={20} color="#9C27B0" />
              </View>
              <Text style={styles.macroValue}>
                {Math.round(meal.items.reduce((sum, item) => sum + (item.fat || 0), 0))}
              </Text>
              <Text style={styles.macroLabel}>Fat (g)</Text>
            </View>
          </View>
          
          {/* Items count */}
          <View style={styles.itemsCountContainer}>
            <MaterialCommunityIcons name="food" size={18} color="#666" />
            <Text style={styles.itemsCountText}>{meal.items.length} {meal.items.length === 1 ? "Item" : "Items"}</Text>
          </View>
        </View>

        {/* Micronutrients Summary */}
        {meal.micronutrients && Object.keys(meal.micronutrients).length > 0 && (
          <View style={styles.microNutrientsCard}>
            <View style={styles.microNutrientsHeader}>
              <Text style={styles.sectionTitle}>Micronutrients</Text>
              {Object.keys(meal.micronutrients).filter(key => meal.micronutrients![key] > 0).length > 6 && (
                <TouchableOpacity onPress={() => setShowAllMicronutrients(!showAllMicronutrients)}>
                  <Text style={styles.viewAllText}>
                    {showAllMicronutrients ? "Show Less" : "View All"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.microNutrientsGrid}>
              {Object.entries(meal.micronutrients)
                .filter(([_, value]) => value > 0)
                .slice(0, showAllMicronutrients ? undefined : 6)
                .map(([key, value]) => {
                  const displayName = MICRONUTRIENT_NAMES[key] || key.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ');
                  const unit = MICRONUTRIENT_UNITS[key] || 'mg';
                  const iconName = MICRONUTRIENT_ICONS[key] || "atom";
                  const colors = MICRONUTRIENT_COLORS[key] || { bg: "#F5F5F5", color: "#666" };
                  
                  return (
                    <View key={key} style={styles.microNutrientItem}>
                      <View style={[styles.microNutrientIconContainer, { backgroundColor: colors.bg }]}>
                        <MaterialCommunityIcons name={iconName as any} size={16} color={colors.color} />
                      </View>
                      <View style={styles.microNutrientInfo}>
                        <Text style={styles.microNutrientName}>{displayName}</Text>
                        <Text style={styles.microNutrientValue}>{value.toFixed(1)} {unit}</Text>
                      </View>
                    </View>
                  );
                })}
            </View>
            {!showAllMicronutrients && Object.keys(meal.micronutrients).filter(key => meal.micronutrients![key] > 0).length > 6 && (
              <TouchableOpacity 
                style={styles.moreMicrosButton}
                onPress={() => setShowAllMicronutrients(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.moreMicrosText}>
                  +{Object.keys(meal.micronutrients).filter(key => meal.micronutrients![key] > 0).length - 6} more micronutrients
                </Text>
                <Ionicons name="chevron-down" size={16} color="#2E7D32" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Food Items */}
        <View style={styles.foodSection}>
          <Text style={styles.sectionTitle}>
            {meal.items.length} {meal.items.length === 1 ? "Item" : "Items"}
          </Text>
          {(meal.items ?? []).length === 0 ? (
  <View style={styles.emptyState}>
    <MaterialCommunityIcons
      name="food-off-outline"
      size={48}
      color="#CCC"
    />
    <Text style={styles.emptyStateText}>No items in this meal</Text>
  </View>
) : (
  (meal.items ?? []).map((item, index) => (
    <View key={item.id ?? `${index}`} style={styles.foodItemCard}>
      <View style={styles.foodItemInfo}>
        <Text style={styles.foodItemName}>{item.name}</Text>

        <Text style={styles.foodItemQuantity}>
          {item.quantity} {item.unit} • {Math.round(item.calories ?? 0)} cal
        </Text>

        {(item.protein != null ||
          item.carbohydrates != null ||
          item.fat != null) && (
          <View style={styles.foodItemMacros}>
            {item.protein != null && (
              <View style={styles.macroTag}>
                <Text style={styles.macroTagText}>
                  P: {Math.round(item.protein)}g
                </Text>
              </View>
            )}
            {item.carbohydrates != null && (
              <View style={styles.macroTag}>
                <Text style={styles.macroTagText}>
                  C: {Math.round(item.carbohydrates)}g
                </Text>
              </View>
            )}
            {item.fat != null && (
              <View style={styles.macroTag}>
                <Text style={styles.macroTagText}>
                  F: {Math.round(item.fat)}g
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => item.id && removeFoodItem(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color="#FF5252" />
      </TouchableOpacity>
    </View>
  ))
)}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  mealName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  nutritionCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 16,
  },
  nutritionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#4CAF50",
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  macroContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  macroItem: {
    alignItems: "center",
    flex: 1,
  },
  macroIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  itemsCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    gap: 6,
  },
  itemsCountText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  microNutrientsCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  microNutrientsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  microNutrientItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "48%",
  },
  microNutrientName: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  microNutrientValue: {
    fontSize: 13,
    color: "#1A1A1A",
    fontWeight: "700",
  },
  moreMicrosText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  microNutrientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  microNutrientIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  microNutrientInfo: {
    flexDirection: "column",
  },
  moreMicrosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    gap: 6,
  },
  foodSection: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  foodItemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  foodItemQuantity: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  foodItemMacros: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  macroTag: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  macroTagText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "700",
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    fontWeight: "500",
  },
  fallbackContainer: {
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 24,
    marginBottom: 12,
  },
  fallbackDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF5252",
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
