import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";

const TestScreen = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testBasicConnection = async () => {
    addResult("Testing basic connection to localhost:3000...");
    try {
      const response = await fetch("http://localhost:3000");
      addResult(`✅ Connection successful! Status: ${response.status}`);
    } catch (error) {
      addResult(
        `❌ Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const testRegisterEndpoint = async () => {
    addResult("Testing register endpoint...");
    try {
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fname: "Test",
          lname: "User",
          email: `test${Date.now()}@example.com`,
          password: "password123",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        addResult(
          `✅ Register successful! Token: ${data.accessToken?.substring(0, 20)}...`,
        );
      } else {
        addResult(`❌ Register failed: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      addResult(
        `❌ Register error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const testAuthService = async () => {
    addResult("Testing authService...");
    try {
      // Test if authService can be imported and used
      const { authService } = require("@/src/services");

      const result = await authService.register({
        fname: "Service",
        lname: "Test",
        email: `servicetest${Date.now()}@example.com`,
        password: "password123",
      });

      addResult(
        `✅ AuthService successful! Token: ${result.accessToken?.substring(0, 20)}...`,
      );
    } catch (error) {
      addResult(
        `❌ AuthService error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>

      <View style={styles.buttonContainer}>
        <Button title="Test Basic Connection" onPress={testBasicConnection} />
        <Button title="Test Register Endpoint" onPress={testRegisterEndpoint} />
        <Button title="Test AuthService" onPress={testAuthService} />
        <Button title="Clear Results" onPress={clearResults} color="#ff6b6b" />
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 10,
  },
  resultsContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: "monospace",
    color: "#333",
  },
});

export default TestScreen;
