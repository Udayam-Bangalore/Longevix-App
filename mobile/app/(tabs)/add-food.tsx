import { aiService, GenerateNutrientsRequest, GenerateNutrientsResponse } from "@/services";
import { useMeals } from "@/src/contexts/meals.context";
import { hp, responsiveFontSize, responsiveHeight, responsiveWidth, wp } from "@/src/utils/responsive";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface FoodItem {
  id?: string;
  name: string;
  quantity: string;
  unit: string;
}

const UNIT_CATEGORIES = [
  { id: 'weight', label: 'Weight', units: ['g', 'mg'], icon: 'scale-outline' },
  { id: 'household', label: 'Household', units: ['cup', 'bowl', 'katori'], icon: 'home-outline' },
  { id: 'pieces', label: 'Pieces', units: ['pcs'], icon: 'apps-outline' },
  { id: 'volume', label: 'Volume', units: ['ml', 'glass'], icon: 'water-outline' },
  { id: 'spoon', label: 'Spoon', units: ['tsp', 'tbsp'], icon: 'restaurant-outline' },
];

export default function AddFoodScreen() {
  const router = useRouter();
  const { addFoodToMeal } = useMeals();
  const [foodInput, setFoodInput] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [selectedUnit, setSelectedUnit] = useState("g");
  const [meal, setMeal] = useState("Breakfast");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [showMicros, setShowMicros] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [nutritionData, setNutritionData] = useState<GenerateNutrientsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNutritionData = async () => {
    if (foods.length === 0) {
      setNutritionData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData: GenerateNutrientsRequest = {
        isAuthenticated: true,
        role: 'user',
        food: foods.map(item => ({
          name: item.name,
          quantity: parseFloat(item.quantity),
          unit: item.unit
        })),
        time: meal.toLowerCase() as any
      };

      const response = await aiService.generateNutrients(requestData);
      
      setNutritionData(response);
    } catch (err: any) {
      setError('Failed to calculate nutrition. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const meals = ["Breakfast", "Lunch", "Snack", "Dinner"];

  const macros = [
    { label: "Calories", value: "150", unit: "" },
    { label: "Protein", value: "5", unit: "g" },
    { label: "Carbs", value: "27", unit: "g" },
  ];

  const micros = [
    { name: "Iron", value: "1.7mg", percentage: "9%" },
    { name: "Magnesium", value: "63mg", percentage: "16%" },
    { name: "Vitamin B6", value: "0.1mg", percentage: "6%" },
    { name: "Zinc", value: "1.5mg", percentage: "14%" },
  ];

  const clearForm = () => {
    setFoods([]);
    setNutritionData(null);
    setFoodInput("");
    setQuantity("1");
    setSelectedUnit("g");
    setError(null);
  };

  const addFoodItem = () => {
    if (foodInput.trim() && quantity.trim()) {
      setFoods([...foods, { 
        name: foodInput.trim(), 
        quantity: quantity, 
        unit: selectedUnit 
      }]);
      setFoodInput("");
      setQuantity("1");
    }
  };

  const removeFoodItem = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  
  React.useEffect(() => {
    fetchNutritionData();
  }, [foods, meal]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={["#4CAF50", "#2E7D32"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Food Name Input */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>What did you eat?</Text>
          <View style={styles.foodInputWrapper}>
            <TextInput
              style={styles.foodInput}
              placeholder="Food name (e.g. Apple, Eggs...)"
              placeholderTextColor="#999"
              value={foodInput}
              onChangeText={setFoodInput}
            />
          </View>
        </View>

        {/* Quantity Controller */}
        <View style={styles.quantitySection}>
          <Text style={styles.sectionLabel}>How much?</Text>
          
          <View style={styles.quantityController}>
            <TouchableOpacity 
              style={styles.adjustBtn}
              onPress={() => setQuantity(prev => Math.max(0, parseFloat(prev || "0") - 1).toString())}
            >
              <Ionicons name="remove" size={28} color="#4CAF50" />
            </TouchableOpacity>
            
            <View style={styles.quantityValueContainer}>
              <TextInput
                style={styles.quantityValue}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                textAlign="center"
              />
              <Text style={styles.activeUnitLabel}>{selectedUnit}</Text>
            </View>

            <TouchableOpacity 
              style={styles.adjustBtn}
              onPress={() => setQuantity(prev => (parseFloat(prev || "0") + 1).toString())}
            >
              <Ionicons name="add" size={28} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          {/* Unit Selection Grid */}
          <View style={styles.unitGrid}>
            {UNIT_CATEGORIES.map((cat) => (
              <View key={cat.id} style={styles.unitCategory}>
                <View style={styles.unitCategoryHeader}>
                  <Ionicons name={cat.icon as any} size={16} color="#666" />
                  <Text style={styles.unitCategoryLabel}>{cat.label}</Text>
                </View>
                <View style={styles.unitChipsRow}>
                  {cat.units.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.modernUnitChip,
                        selectedUnit === u && styles.activeModernUnitChip
                      ]}
                      onPress={() => setSelectedUnit(u)}
                    >
                      <Text style={[
                        styles.modernUnitChipText,
                        selectedUnit === u && styles.activeModernUnitChipText
                      ]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.addItemBtn} 
            onPress={addFoodItem}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#4CAF50", "#2E7D32"]}
              style={styles.addItemGradient}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FFF" />
              <Text style={styles.addItemText}>Add to List</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Added Foods List */}
        {foods.length > 0 && (
          <View style={styles.addedFoodsList}>
            <Text style={styles.listTitle}>Items to log:</Text>
            {foods.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.foodItemRow}
                onPress={() => {
                  setSelectedItemIndex(index);
                  setShowItemDetails(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.foodItemInfo}>
                  <Text style={styles.foodItemName}>{item.name}</Text>
                  <Text style={styles.foodItemQty}>{item.quantity} {item.unit}</Text>
                  {nutritionData?.items[index] && (
                    <Text style={styles.foodItemCalories}>
                      {Math.round(nutritionData.items[index].calories)} cal
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => removeFoodItem(index)}
                  style={styles.removeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Meal Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: "#2E7D32", marginBottom: 16 }]}>Meal Time</Text>
          <View style={styles.mealGrid}>
            {meals.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.mealButton, meal === m && styles.activeMealButton]}
                onPress={() => setMeal(m)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons 
                  name={
                    m === "Breakfast" ? "coffee" : 
                    m === "Lunch" ? "food-apple" : 
                    m === "Dinner" ? "food-variant" : "cookie"
                  } 
                  size={20} 
                  color={meal === m ? "#FFF" : "#666"} 
                />
                <Text style={[styles.mealButtonText, meal === m && styles.activeMealButtonText]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nutrition Preview */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Calculating nutrition...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={32} color="#FF5252" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNutritionData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : nutritionData ? (
          <>
            <View style={styles.previewCard}>
              <Text style={[styles.previewTitle, { color: "#2E7D32" }]}>Nutrition Preview</Text>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Calories</Text>
                  <Text style={styles.macroValue}>
                    {Math.round(nutritionData.total.calories)}
                    <Text style={styles.macroUnit}></Text>
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>
                    {Math.round(nutritionData.total.protein)}
                    <Text style={styles.macroUnit}>g</Text>
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>
                    {Math.round(nutritionData.total.carbohydrates)}
                    <Text style={styles.macroUnit}>g</Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.viewMicrosButton}
                onPress={() => setShowMicros(!showMicros)}
              >
                <Text style={styles.viewMicrosText}>
                  {showMicros ? "Hide micronutrients" : "View all micronutrients"}
                </Text>
                <Ionicons 
                  name={showMicros ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {showMicros && (
              <View style={styles.previewCard}>
                <Text style={[styles.previewTitle, { color: "#2E7D32" }]}>Key Micronutrients</Text>
                <View style={styles.microList}>
                  {Object.entries(nutritionData.total.micronutrients).map(([name, value]) => {
                    
                    const readableName = name.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                    
                    
                    const unit = ['vitamin_d', 'vitamin_a', 'vitamin_b12', 'iodine'].includes(name) ? 'mcg' : 'mg';
                    
                    return (
                      <View key={name} style={styles.microItem}>
                        <Text style={styles.microName}>{readableName}</Text>
                        <Text style={styles.microValue}>
                          {value.toFixed(1)}{unit}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        ) : null}

        <TouchableOpacity 
          style={[styles.logButton, foods.length === 0 && styles.logButtonDisabled]} 
          activeOpacity={0.9}
          disabled={foods.length === 0 || loading}
          onPress={async () => {
            if (loading || !nutritionData) {
              setError('Please wait for nutrition data to load');
              return;
            }
            try {
              setLoading(true);
              setError(null);
              
              for (let i = 0; i < foods.length; i++) {
                const food = foods[i];
                
                const foodWithNutrients = {
                  ...food,
                  quantity: parseFloat(food.quantity) || 0,
                  calories: nutritionData?.items[i]?.calories || 0,
                  fat: nutritionData?.items[i]?.fat || 0,
                  protein: nutritionData?.items[i]?.protein || 0,
                  carbohydrates: nutritionData?.items[i]?.carbohydrates || 0,
                  micronutrients: nutritionData?.items[i]?.micronutrients,
                };
                
                try {
                  await addFoodToMeal(meal, foodWithNutrients);
                } catch (mealError: any) {
                  throw mealError;
                }
              }
              
              clearForm();
              
              // Navigate to home screen with refresh parameter
              router.push({ pathname: "/(tabs)", params: { t: Date.now().toString() } });
            } catch (error: any) {
              setError(error.message || 'Failed to add foods. Please try again.');
            } finally {
              setLoading(false);
            }
          }}
        >
        
          <LinearGradient
            colors={foods.length > 0 ? ["#4CAF50", "#2E7D32"] : ["#A5D6A7", "#A5D6A7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logButtonGradient}
          >
            <Text style={styles.logButtonText}>Add {foods.length} {foods.length === 1 ? 'Item' : 'Items'}</Text>
            <Ionicons name="checkmark-done" size={22} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: hp(2.5),
    paddingBottom: hp(2),
    paddingHorizontal: wp(5),
    borderBottomLeftRadius: responsiveWidth(24),
    borderBottomRightRadius: responsiveWidth(24),
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRight: {
    width: responsiveWidth(40),
  },
  headerTitle: {
    fontSize: responsiveFontSize(22),
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
    flex: 1,
    textAlign: "center",
    marginLeft: -40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(5),
    paddingTop: hp(2.5),
    paddingBottom: hp(5),
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 10,
    marginLeft: 4,
  },
  foodInputWrapper: {
    backgroundColor: "#F8F9FA",
    borderRadius: responsiveWidth(16),
    paddingHorizontal: wp(4),
    height: responsiveHeight(56),
    borderWidth: 1,
    borderColor: "#E9ECEF",
    justifyContent: "center",
  },
  foodInput: {
    fontSize: responsiveFontSize(16),
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  quantitySection: {
    marginBottom: 32,
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  quantityController: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 10,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  adjustBtn: {
    width: responsiveWidth(56),
    height: responsiveWidth(56),
    borderRadius: responsiveWidth(28),
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityValueContainer: {
    flex: 1,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    fontSize: 36,
    fontWeight: "900",
    color: "#1A1A1A",
    padding: 0,
    width: "100%",
    maxWidth: 120,
    textAlign: "center",
  },
  activeUnitLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4CAF50",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: -4,
  },
  unitGrid: {
    gap: 20,
    marginBottom: 8,
  },
  unitCategory: {
    gap: 10,
  },
  unitCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
  },
  unitCategoryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  unitChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modernUnitChip: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    minWidth: 70,
    alignItems: "center",
  },
  activeModernUnitChip: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modernUnitChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  activeModernUnitChipText: {
    color: "#FFF",
    fontWeight: "700",
  },
  addItemBtn: {
    marginTop: 16,
    height: 54,
    borderRadius: 16,
    overflow: "hidden",
  },
  addItemGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addItemText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  addedFoodsList: {
    marginBottom: 24,
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  foodItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  foodItemQty: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 2,
  },
  foodItemCalories: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "700",
    marginTop: 2,
  },
  removeBtn: {
    padding: 8,
  },
  section: {
    marginBottom: 32,
  },
  mealGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  mealButton: {
    width: "48%",
    height: responsiveHeight(68),
    borderRadius: responsiveWidth(22),
    borderWidth: 2,
    borderColor: "#F1F3F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFF",
  },
  activeMealButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  mealButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#495057",
  },
  activeMealButtonText: {
    color: "#FFF",
  },
  logButton: {
    marginTop: 10,
    borderRadius: 34,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  logButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  logButtonGradient: {
    height: responsiveHeight(68),
    borderRadius: responsiveWidth(34),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  logButtonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    alignItems: "center",
    justifyContent: "center",
    height: 160,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    alignItems: "center",
    justifyContent: "center",
    height: 160,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  previewCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 20,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  macroItem: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 13,
    color: "#1A1A1A",
    fontWeight: "700",
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4CAF50",
  },
  macroUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  viewMicrosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  viewMicrosText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  microList: {
    gap: 12,
  },
  microItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  microName: {
    fontSize: 15,
    color: "#495057",
    fontWeight: "600",
  },
  microValue: {
    fontSize: 15,
    color: "#212529",
    fontWeight: "700",
  },
  microPercentage: {
    color: "#868E96",
    fontWeight: "500",
  },
});
