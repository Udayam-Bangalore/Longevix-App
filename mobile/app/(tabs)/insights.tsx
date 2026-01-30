import { useAuth } from "@/src/contexts/auth.context";
import { useMeals } from "@/src/contexts/meals.context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgGradient } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TIME_RANGES = ["Week", "Month", "3 Months"];

export default function InsightsScreen() {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState("Week");
  const { meals, loading, error } = useMeals();
  const { user } = useAuth();

  
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalItems = meals.reduce((sum, meal) => sum + meal.items.length, 0);

  
  const chartData = [
    totalCalories,
    totalCalories * 0.9,
    totalCalories * 1.1,
    totalCalories * 0.8, 
    totalCalories * 1.2,
    totalCalories * 0.95,
    totalCalories * 1.05
  ].map(cal => Math.max(0, Math.round(cal)));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  
  const generatePath = () => {
    const height = 120;
    const width = SCREEN_WIDTH - 80;
    const stepX = width / (chartData.length - 1);
    const maxVal = 100;
    
    return chartData.reduce((acc, val, i) => {
      const x = i * stepX;
      const y = height - (val / maxVal) * height;
      return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, "");
  };

  return (
    <View style={styles.container}>
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

        {/* Weekly Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Weekly Overview</Text>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color="#1A1A1A" />
              <Text style={styles.badgeText}>Evidence-backed</Text>
            </View>
          </View>

          {/* Chart Area */}
          <View style={styles.chartContainer}>
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
              {chartData.map((val, i) => {
                const x = i * ((SCREEN_WIDTH - 80) / (chartData.length - 1));
                const y = 120 - (val / 100) * 120;
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
            
            {/* Days Labels */}
            <View style={styles.daysContainer}>
              {days.map((day) => (
                <Text key={day} style={styles.dayText}>{day}</Text>
              ))}
            </View>
          </View>

          {/* Score Section */}
          <View style={styles.scoreSection}>
            <Text style={styles.scoreValue}>{totalCalories > 0 ? Math.min(Math.round((totalCalories / 2200) * 100), 100) : 0}%</Text>
            <Text style={styles.scoreLabel}>Average nutrient score</Text>
          </View>
        </View>

        {/* RDA Achievement Rate Section */}
        <View style={styles.achievementCard}>
          <Text style={styles.cardTitle}>RDA Achievement Rate</Text>
          <View style={styles.achievementList}>
            {[
              { name: "Vitamin C", achieved: Math.min(Math.floor(totalCalories / 100), 7), total: 7, color: "#FF9800" },
              { name: "Iron", achieved: Math.min(Math.floor(totalCalories / 150), 7), total: 7, color: "#795548" },
              { name: "Calcium", achieved: Math.min(Math.floor(totalCalories / 200), 7), total: 7, color: "#2196F3" },
              { name: "Vitamin D", achieved: Math.min(Math.floor(totalCalories / 250), 7), total: 7, color: "#FFC107" },
            ].map((item) => (
              <View key={item.name} style={styles.achievementItem}>
                <View style={styles.achievementHeader}>
                  <Text style={styles.achievementName}>{item.name}</Text>
                  <Text style={styles.achievementValue}>
                    {item.achieved}/{item.total} days
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${(item.achieved / item.total) * 100}%`,
                        backgroundColor: item.color 
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
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
                  Your Vitamin A intake has been near the upper limit (UL) on 3 out of 7 days. Consistently exceeding the UL may increase risk of adverse effects.
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    fontWeight: "700",
    color: "#1A1A1A",
  },
  chartContainer: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 10,
  },
  dayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ADB5BD",
  },
  scoreSection: {
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: "900",
    color: "#4CAF50",
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginTop: -4,
  },
  achievementList: {
    gap: 20,
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
    fontSize: 15,
    fontWeight: "700",
    color: "#495057",
  },
  achievementValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
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
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  insightCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    gap: 16,
  },
  insightHeader: {
    flexDirection: "row",
    gap: 16,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  insightHeaderText: {
    flex: 1,
    gap: 4,
  },
  insightQuestion: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  insightDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    fontWeight: "500",
  },
  insightFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confidenceBadge: {
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  researchLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  researchText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    textDecorationLine: "underline",
  },
  premiumButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,
  },
  premiumButtonGradient: {
    height: 54,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    position: "relative",
    overflow: "hidden",
  },
  buttonPattern: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  patternCircle1: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  patternCircle2: {
    position: "absolute",
    bottom: -15,
    left: -15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
    top: 8,
    right: 40,
  },
  star2: {
    position: "absolute",
    bottom: 10,
    right: 60,
  },
  premiumButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    zIndex: 1,
  },
  evidenceBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ADB5BD",
  },
  bulletText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  disclaimerCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginTop: 8,
  },
  disclaimerIcon: {
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
});
