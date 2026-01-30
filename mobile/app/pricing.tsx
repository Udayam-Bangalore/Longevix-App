import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "₹199",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "AI-Powered Personal Insights",
      "Advanced Nutrient Tracking",
      "Evidence-Backed Recommendations",
      "Unlimited Food Scanning",
    ],
    color: ["#4CAF50", "#2E7D32"],
    popular: false,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "₹999",
    period: "/year",
    description: "Best value for long-term health",
    features: [
      "Everything in Monthly",
      "Priority AI Support",
      "Early Access to New Features",
      "Save 33% compared to monthly",
    ],
    color: ["#4CAF50", "#1A1A1A"],
    popular: true,
  },
];

export default function PricingScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={["#1A1A2E", "#16213E"]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.iconGradient}
            >
              <Ionicons name="sparkles" size={32} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock the full potential of your health journey with AI-driven insights and advanced tracking.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              activeOpacity={0.9}
              onPress={() => setSelectedPlan(plan.id)}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlanCard,
                { borderColor: selectedPlan === plan.id ? plan.color[0] : "#E9ECEF" }
              ]}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color[0] }]}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>{plan.price}</Text>
                  <Text style={styles.periodText}>{plan.period}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={20} 
                      color={selectedPlan === plan.id ? plan.color[0] : "#4CAF50"} 
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trust Section */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>Trusted by health enthusiasts</Text>
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
              <Text style={styles.trustBadgeText}>Secure Payment</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="refresh" size={24} color="#4CAF50" />
              <Text style={styles.trustBadgeText}>Cancel Anytime</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.trustBadgeText}>4.9/5 Rating</Text>
            </View>
          </View>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity style={styles.subscribeButton} activeOpacity={0.8}>
          <LinearGradient
            colors={selectedPlan === "yearly" ? ["#4CAF50", "#1A1A1A"] : ["#4CAF50", "#2E7D32"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subscribeGradient}
          >
            <Text style={styles.subscribeButtonText}>
              Start My Premium Journey
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Recurring billing. Cancel anytime in Play Store settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  plansContainer: {
    gap: 20,
  },
  planCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  selectedPlanCard: {
    backgroundColor: "#FFF",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1A2E",
  },
  periodText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F3F5",
    marginVertical: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#495057",
    fontWeight: "500",
  },
  trustSection: {
    marginTop: 32,
    alignItems: "center",
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 20,
  },
  trustBadges: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  trustBadge: {
    alignItems: "center",
    gap: 8,
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  subscribeButton: {
    marginTop: 32,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  subscribeGradient: {
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  subscribeButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  footerNote: {
    marginTop: 16,
    fontSize: 12,
    color: "#ADB5BD",
    textAlign: "center",
    fontWeight: "500",
  },
});
