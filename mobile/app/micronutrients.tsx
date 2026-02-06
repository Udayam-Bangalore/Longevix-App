import { useAuth } from "@/src/contexts/auth.context";
import { useMeals } from "@/src/contexts/meals.context";
import { hp, responsiveWidth, wp } from "@/src/utils/responsive";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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

const NUTRIENT_INFO: Record<string, { description: string; benefits: string[] }> = {
  vitamin_c: {
    description: "A powerful antioxidant essential for immune function, collagen synthesis, and iron absorption.",
    benefits: ["Boosts immune system", "Supports skin health", "Enhances iron absorption", "Acts as antioxidant"],
  },
  iron: {
    description: "Critical mineral for oxygen transport in blood, energy production, and cognitive function.",
    benefits: ["Oxygen transport", "Energy metabolism", "Brain function", "Muscle health"],
  },
  calcium: {
    description: "Essential mineral for strong bones, teeth, muscle function, and nerve signaling.",
    benefits: ["Bone health", "Muscle contraction", "Nerve signaling", "Blood clotting"],
  },
  vitamin_d: {
    description: "Fat-soluble vitamin crucial for calcium absorption, bone health, and immune regulation.",
    benefits: ["Calcium absorption", "Bone health", "Immune function", "Mood regulation"],
  },
  vitamin_a: {
    description: "Important for vision, immune function, skin health, and reproductive health.",
    benefits: ["Vision health", "Immune support", "Skin health", "Cell growth"],
  },
  vitamin_b12: {
    description: "Essential B vitamin for nerve tissue health, brain function, and red blood cell formation.",
    benefits: ["Nerve health", "Energy production", "Red blood cell formation", "DNA synthesis"],
  },
  vitamin_b6: {
    description: "Crucial for protein metabolism, cognitive development, and neurotransmitter synthesis.",
    benefits: ["Protein metabolism", "Brain health", "Hormone regulation", "Red blood cell production"],
  },
  folate: {
    description: "B vitamin critical for DNA synthesis, cell division, and preventing neural tube defects.",
    benefits: ["DNA synthesis", "Cell division", "Pregnancy health", "Heart health"],
  },
  magnesium: {
    description: "Involved in 300+ biochemical reactions including energy production, muscle function, and nerve signaling.",
    benefits: ["Energy production", "Muscle relaxation", "Nerve function", "Bone health"],
  },
  potassium: {
    description: "Electrolyte essential for fluid balance, muscle contractions, and heart rhythm.",
    benefits: ["Fluid balance", "Muscle function", "Heart health", "Blood pressure regulation"],
  },
  zinc: {
    description: "Essential trace mineral for immune function, wound healing, and protein synthesis.",
    benefits: ["Immune support", "Wound healing", "Protein synthesis", "Taste and smell"],
  },
  selenium: {
    description: "Powerful antioxidant trace mineral that supports thyroid function and immune health.",
    benefits: ["Thyroid health", "Antioxidant protection", "Immune function", "Reproductive health"],
  },
  copper: {
    description: "Trace mineral essential for iron metabolism, connective tissue formation, and energy production.",
    benefits: ["Iron absorption", "Connective tissue", "Energy production", "Brain development"],
  },
  manganese: {
    description: "Trace mineral important for bone formation, metabolism, and antioxidant defense.",
    benefits: ["Bone health", "Metabolism", "Antioxidant defense", "Blood sugar regulation"],
  },
  iodine: {
    description: "Essential mineral for thyroid hormone production and proper metabolism regulation.",
    benefits: ["Thyroid health", "Metabolism", "Brain development", "Growth and development"],
  },
};

const NUTRIENTS: NutrientData[] = [
  {
    id: "vitamin_c",
    name: "Vitamin C",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 90mg",
    status: "low",
    icon: "dna",
    iconColor: "#FF9800",
    iconBg: "#FFF3E0",
    description: NUTRIENT_INFO.vitamin_c.description,
  },
  {
    id: "iron",
    name: "Iron",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 18mg",
    status: "low",
    icon: "blood-bag",
    iconColor: "#795548",
    iconBg: "#EFEBE9",
    description: NUTRIENT_INFO.iron.description,
  },
  {
    id: "calcium",
    name: "Calcium",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 1,000mg",
    status: "low",
    icon: "bone",
    iconColor: "#2196F3",
    iconBg: "#E3F2FD",
    description: NUTRIENT_INFO.calcium.description,
  },
  {
    id: "vitamin_d",
    name: "Vitamin D",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "RDA: 20mcg",
    status: "low",
    icon: "white-balance-sunny",
    iconColor: "#FFC107",
    iconBg: "#FFFDE7",
    description: NUTRIENT_INFO.vitamin_d.description,
  },
  {
    id: "vitamin_a",
    name: "Vitamin A",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "UL: 3,000mcg",
    status: "low",
    icon: "eye",
    iconColor: "#9C27B0",
    iconBg: "#F3E5F5",
    description: NUTRIENT_INFO.vitamin_a.description,
  },
  {
    id: "vitamin_b12",
    name: "Vitamin B12",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "RDA: 2.4mcg",
    status: "low",
    icon: "brain",
    iconColor: "#673AB7",
    iconBg: "#EDE7F6",
    description: NUTRIENT_INFO.vitamin_b12.description,
  },
  {
    id: "vitamin_b6",
    name: "Vitamin B6",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 1.3mg",
    status: "low",
    icon: "cellphone-text",
    iconColor: "#3F51B5",
    iconBg: "#E8EAF6",
    description: NUTRIENT_INFO.vitamin_b6.description,
  },
  {
    id: "folate",
    name: "Folate",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "RDA: 400mcg",
    status: "low",
    icon: "flower",
    iconColor: "#009688",
    iconBg: "#E0F2F1",
    description: NUTRIENT_INFO.folate.description,
  },
  {
    id: "magnesium",
    name: "Magnesium",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 400mg",
    status: "low",
    icon: "zodiac-gemini",
    iconColor: "#8BC34A",
    iconBg: "#DCEDC8",
    description: NUTRIENT_INFO.magnesium.description,
  },
  {
    id: "potassium",
    name: "Potassium",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 2,600mg",
    status: "low",
    icon: "turbine",
    iconColor: "#CDDC39",
    iconBg: "#F0F4C3",
    description: NUTRIENT_INFO.potassium.description,
  },
  {
    id: "zinc",
    name: "Zinc",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 11mg",
    status: "low",
    icon: "zodiac-aquarius",
    iconColor: "#00BCD4",
    iconBg: "#B2EBF2",
    description: NUTRIENT_INFO.zinc.description,
  },
  {
    id: "selenium",
    name: "Selenium",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "RDA: 55mcg",
    status: "low",
    icon: "atom",
    iconColor: "#03A9F4",
    iconBg: "#B3E5FC",
    description: NUTRIENT_INFO.selenium.description,
  },
  {
    id: "copper",
    name: "Copper",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 0.9mg",
    status: "low",
    icon: "circle-outline",
    iconColor: "#FF5722",
    iconBg: "#FBE9E7",
    description: NUTRIENT_INFO.copper.description,
  },
  {
    id: "manganese",
    name: "Manganese",
    value: 0,
    unit: "mg",
    percentage: 0,
    rda: "RDA: 2.3mg",
    status: "low",
    icon: "chart-line",
    iconColor: "#607D8B",
    iconBg: "#ECEFF1",
    description: NUTRIENT_INFO.manganese.description,
  },
  {
    id: "iodine",
    name: "Iodine",
    value: 0,
    unit: "mcg",
    percentage: 0,
    rda: "RDA: 150mcg",
    status: "low",
    icon: "water",
    iconColor: "#00BCD4",
    iconBg: "#E0F7FA",
    description: NUTRIENT_INFO.iodine.description,
  },
];

const RDA_VALUES: Record<string, number> = {
  vitamin_c: 90,
  iron: 18,
  calcium: 1000,
  vitamin_d: 20,
  vitamin_a: 900,
  vitamin_b12: 2.4,
  vitamin_b6: 1.3,
  folate: 400,
  magnesium: 400,
  potassium: 2600,
  zinc: 11,
  selenium: 55,
  copper: 0.9,
  manganese: 2.3,
  iodine: 150,
};

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
    if (percentage >= 100) return "#4CAF50";
    if (percentage >= 50) return "#8BC34A";
    if (percentage >= 30) return "#FF9800";
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

const ProgressBar: React.FC<{
  percentage: number;
  color: string;
  height?: number;
}> = ({ percentage, color, height = 8 }) => {
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

const NutrientCard: React.FC<{ nutrient: NutrientData; onPress: () => void }> = ({
  nutrient,
  onPress,
}) => {
  const getStatusColor = () => {
    switch (nutrient.status) {
      case "excellent":
        return "#2E7D32";
      case "good":
        return "#4CAF50";
      case "warning":
        return "#FF9800";
      case "low":
        return "#F44336";
      default:
        return "#4CAF50";
    }
  };

  const statusColor = getStatusColor();

  return (
    <TouchableOpacity style={styles.nutrientCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.nutrientCardContent}>
        <View
          style={[styles.nutrientIconContainer, { backgroundColor: nutrient.iconBg }]}
        >
          <MaterialCommunityIcons
            name={nutrient.icon as any}
            size={26}
            color={nutrient.iconColor}
          />
        </View>

        <View style={styles.nutrientInfo}>
          <Text style={styles.nutrientName}>{nutrient.name}</Text>
          <Text style={styles.nutrientValue}>
            {Number(nutrient.value).toLocaleString(undefined, { maximumFractionDigits: 1 })} {nutrient.unit}
          </Text>
          <ProgressBar percentage={nutrient.percentage} color={statusColor} />
        </View>

        <View style={styles.nutrientStatus}>
          <CircularProgress percentage={nutrient.percentage} size={50}>
            <Text style={[styles.nutrientPercentage, { color: statusColor }]}>
              {nutrient.percentage}%
            </Text>
          </CircularProgress>
        </View>
      </View>

      <View style={styles.nutrientFooter}>
        <Text style={styles.nutrientRda}>{nutrient.rda}</Text>
        <View style={styles.viewDetailButton}>
          <Text style={styles.viewDetailText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#2E7D32" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MicronutrientsScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { meals, loading, error, refreshMeals } = useMeals();

  useFocusEffect(
    useCallback(() => {
      refreshMeals();
    }, [refreshMeals])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshMeals();
    setRefreshing(false);
  }, [refreshMeals]);

  const totalMicronutrients: Record<string, number> = {};
  meals?.forEach((meal) => {
    if (meal?.micronutrients) {
      Object.entries(meal?.micronutrients).forEach(([key, value]) => {
        if (!totalMicronutrients[key]) {
          totalMicronutrients[key] = 0;
        }
        totalMicronutrients[key] += value;
      });
    }
  });

  const updatedNutrients = NUTRIENTS.map((nutrient) => {
    const value = totalMicronutrients[nutrient.id] || 0;
    const rda = RDA_VALUES[nutrient.id];
    const percentage = rda > 0 ? Math.min(Math.round((value / rda) * 100), 100) : 0;

    let status: "low" | "good" | "warning" | "excellent" = "low";
    if (percentage >= 100) status = "excellent";
    else if (percentage >= 75) status = "good";
    else if (percentage >= 50) status = "warning";

    return {
      ...nutrient,
      value,
      percentage,
      status,
    };
  });

  const handleNutrientPress = (nutrient: NutrientData) => {
    router.push({
      pathname: "/micronutrient-detail",
      params: {
        nutrientKey: nutrient.id,
        name: nutrient.name,
        value: nutrient.value.toString(),
        percentage: nutrient.percentage.toString(),
        unit: nutrient.unit,
        rda: nutrient.rda,
        description: nutrient.description,
      },
    });
  };

  const averageScore =
    updatedNutrients?.length > 0
      ? updatedNutrients.reduce((sum, n) => sum + n.percentage, 0) / updatedNutrients.length
      : 0;

  if (loading && meals?.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading micronutrients...</Text>
        </View>
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
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4CAF50"]} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Micronutrients</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Your Micronutrient Score</Text>
              <Text style={styles.summarySubtitle}>
                Based on your daily intake from logged meals
              </Text>
            </View>
          </View>

          <View style={styles.scoreSection}>
            <CircularProgress percentage={averageScore} size={100}>
              <View style={styles.scoreContent}>
                <Text style={styles.scoreValue}>{Math.round(averageScore)}%</Text>
                <Text style={styles.scoreLabel}>Overall</Text>
              </View>
            </CircularProgress>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {updatedNutrients?.filter((n) => n.status === "excellent").length || 0}
              </Text>
              <Text style={styles.statLabel}>Excellent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {updatedNutrients?.filter((n) => n.status === "good").length || 0}
              </Text>
              <Text style={styles.statLabel}>Good</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {updatedNutrients?.filter((n) => n.status === "warning").length || 0}
              </Text>
              <Text style={styles.statLabel}>Needs Work</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {updatedNutrients?.filter((n) => n.status === "low").length || 0}
              </Text>
              <Text style={styles.statLabel}>Low</Text>
            </View>
          </View>
        </View>

          <View style={styles.nutrientsSection}>
          <Text style={styles.sectionTitle}>Your Nutrients</Text>
          {updatedNutrients?.map((nutrient) => (
            <NutrientCard
              key={nutrient.id}
              nutrient={nutrient}
              onPress={() => handleNutrientPress(nutrient)}
            />
          ))}
        </View>
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
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
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
  summaryCard: {
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
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  summarySubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  scoreContent: {
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4CAF50",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#666",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  statItem: {
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#F0F0F0",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  nutrientsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
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
    width: responsiveWidth(52),
    height: responsiveWidth(52),
    borderRadius: responsiveWidth(14),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3),
  },
  nutrientInfo: {
    flex: 1,
  },
  nutrientName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
  },
  nutrientValue: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    marginBottom: 8,
    fontWeight: "500",
  },
  nutrientStatus: {
    alignItems: "flex-end",
  },
  nutrientPercentage: {
    fontSize: 12,
    fontWeight: "700",
  },
  nutrientFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  nutrientRda: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  viewDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "600",
  },
  progressBarContainer: {
    width: "100%",
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    borderRadius: 4,
  },
});
