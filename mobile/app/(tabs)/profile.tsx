import { useAuth } from "@/src/contexts/auth.context";
import { useNotifications } from "@/src/contexts/notifications.context";
import { useNavigationContainerRef } from "@/src/navigation";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { logout, user } = useAuth();
  const { hasPermission, isEnabled, enableNotifications, disableNotifications, requestPermission } = useNotifications();
  const navigationRef = useNavigationContainerRef();
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            if (navigationRef.current) {
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: "(auth)/login" }],
              });
            } else {
              router.replace("/(auth)/login");
            }
          },
        },
      ]
    );
  };

  const handleToggleReminders = async (value: boolean) => {
    if (value) {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive daily reminders."
          );
          return;
        }
      }
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  };

  const handleHelpSupport = async () => {
    const url = "https://udayam.co.in/#contact";
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open URL");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={["#4CAF50", "#2E7D32"]}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#4CAF50" />
          </View>
          <View>
            <Text style={styles.userName}>{user?.username || "User"}</Text>
            <Text style={styles.userEmail}>
              {user?.phone ? user.phone : user?.email || "your@email.com"}
            </Text>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView contentContainerStyle={styles.content}>
        {user?.role !== "admin" && user?.role !== "prouser" && (
          <TouchableOpacity 
            style={styles.upgradeCard}
            onPress={() => router.push("/pricing")}
          >
            <LinearGradient
              colors={["#4CAF50", "#1A1A1A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeGradient}
            >
              <View style={styles.upgradeInfo}>
                <View style={styles.sparkleIcon}>
                  <Ionicons name="sparkles" size={20} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                  <Text style={styles.upgradeSubtitle}>Unlock all AI features</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.menuItem}>
          <TouchableOpacity 
            style={styles.settingsHeader}
            onPress={() => setSettingsExpanded(!settingsExpanded)}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons 
              name={settingsExpanded ? "chevron-up" : "chevron-forward"} 
              size={20} 
              color="#CCC" 
            />
          </TouchableOpacity>
        </View>

        {settingsExpanded && (
          <View style={styles.subMenuContainer}>
            <TouchableOpacity 
              style={[styles.menuItem, styles.subMenuItem]}
              onPress={() => router.push("/(auth)/profile-setup?mode=edit")}
            >
              <Ionicons name="create-outline" size={22} color="#666" />
              <Text style={[styles.menuText, styles.subMenuText]}>Edit Profile Data</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Daily Reminders</Text>
          <Switch
            value={isEnabled}
            onValueChange={handleToggleReminders}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={handleHelpSupport}>
          <Ionicons name="help-circle-outline" size={24} color="#333" />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" style={styles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#F44336" />
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  content: {
    padding: 20,
    gap: 12,
  },
  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  chevron: {
    marginLeft: "auto",
  },
  logoutItem: {
    marginTop: 12,
  },
  logoutText: {
    color: "#F44336",
  },
  upgradeCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
  },
  upgradeGradient: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upgradeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sparkleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  upgradeTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  upgradeSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  subMenuContainer: {
    marginLeft: 36,
    gap: 8,
  },
  subMenuItem: {
    backgroundColor: "#F8F8F8",
  },
  subMenuText: {
    color: "#555",
  },
});
