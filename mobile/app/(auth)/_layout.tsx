import { LinearGradient } from "expo-linear-gradient";
import { Stack, usePathname } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function AuthLayout() {
  const pathname = usePathname();
  const isOnboarding = pathname.includes("onboarding");

  return (
    <View style={styles.container}>
      {!isOnboarding && (
        <LinearGradient
          colors={["#1B5E20", "#2E7D32", "#43A047", "#66BB6A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen
              name="welcome"
              options={{
                title: "Welcome",
              }}
            />
            <Stack.Screen
              name="login"
              options={{
                title: "Login",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="signup"
              options={{
                title: "Sign Up",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="profile-setup"
              options={{
                title: "Profile Setup",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="email-verification"
              options={{
                title: "Email Verification",
                animation: "slide_from_right",
              }}
            />
          </Stack>
        </LinearGradient>
      )}
      {isOnboarding && (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="onboarding"
            options={{
              title: "Onboarding",
              animation: "slide_from_right",
            }}
          />
        </Stack>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
});
