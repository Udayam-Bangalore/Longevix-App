import { FoodItem } from "@/src/contexts/meals.context";
import { Meal, mealsService } from "@/src/services/meals.service";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MealDetailsScreen() {
  const router = useRouter();
  const { mealId } = useLocalSearchParams();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMealDetails();
  }, [mealId]);

  const fetchMealDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const mealData = await mealsService.getMealById(mealId as string);
      setMeal(mealData);
    } catch (err: any) {
      console.error("Error fetching meal details:", err);
      setError(err.message || "Failed to fetch meal details");
    } finally {
      setLoading(false);
    }
  };

  const removeFoodItem = async (foodId: string) => {
    try {
      await mealsService.removeFoodFromMeal(mealId as string, foodId);
      fetchMealDetails();
    } catch (err: any) {
      console.error("Error removing food item:", err);
      setError(err.message || "Failed to remove food item");
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
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={32} color="#FF5252" />
        <Text style={styles.errorText}>{error || "Meal not found"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMealDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{meal.name}</Text>
        <View style={styles.headerRight} />
      </View>

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
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{meal.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{meal.items.length}</Text>
              <Text style={styles.nutritionLabel}>Items</Text>
            </View>
          </View>
        </View>

        {/* Food Items */}
        <View style={styles.foodSection}>
          <Text style={styles.sectionTitle}>
            {meal.items.length} {meal.items.length === 1 ? "Item" : "Items"}
          </Text>
          {meal.items.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons 
                name="food-off-outline" 
                size={48} 
                color="#CCC" 
              />
              <Text style={styles.emptyStateText}>No items in this meal</Text>
            </View>
          ) : (
            meal.items.map((item: FoodItem, index: number) => (
              <View key={item.id || `item-${index}-${item.name}-${item.quantity}`} style={styles.foodItemCard}>
                <View style={styles.foodItemInfo}>
                  <Text style={styles.foodItemName}>{item.name}</Text>
                  <Text style={styles.foodItemQuantity}>
                    {item.quantity} {item.unit}
                  </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#4CAF50",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginLeft: -40,
  },
  headerRight: {
    width: 40,
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
