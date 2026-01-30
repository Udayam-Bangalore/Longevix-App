import { useAuth } from "@/src/contexts/auth.context";
import { aiService } from "@/src/services/ai.service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI Nutrition Assistant. How can I help you today?",
      sender: "ai",
      time: "10:00 AM",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      const animateDot = (dotAnim: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dotAnim, {
              toValue: 1,
              duration: 400,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      animateDot(dot1Anim, 0);
      animateDot(dot2Anim, 200);
      animateDot(dot3Anim, 400);
    }
  }, [isLoading]);

  const handleSend = async () => {
    if (inputText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputText,
        sender: "user",
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      };
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setInputText("");
      setIsLoading(true);

      try {
        
        if (user?.role === "admin" || user?.role === "prouser") {
          
          const aiResponseText = await aiService.chat(inputText);
          const aiResponse = {
            id: updatedMessages.length + 1,
            text: aiResponseText,
            sender: "ai",
            time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          };
          setMessages([...updatedMessages, aiResponse]);
        } else {
          
          setTimeout(() => {
            const aiResponse = {
              id: updatedMessages.length + 1,
              text: "This is a premium feature! Upgrade to Pro to access the full AI chat experience.",
              sender: "ai",
              time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            };
            setMessages([...updatedMessages, aiResponse]);
          }, 1000);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        const errorResponse = {
          id: updatedMessages.length + 1,
          text: "Sorry, there was an error processing your request. Please try again.",
          sender: "ai",
          time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        };
        setMessages([...updatedMessages, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <LinearGradient
        colors={["#4CAF50", "#1A1A1A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.aiAvatarContainer}>
              <LinearGradient
                colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                style={styles.aiAvatarBg}
              >
                <Ionicons name="sparkles" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>AI Nutrition Assistant</Text>
              <View style={styles.statusContainer}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.statusText}>Always here to help</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Chat Messages */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.sender === "user" ? styles.userMessageWrapper : styles.aiMessageWrapper,
            ]}
          >
            {message.sender === "ai" && (
              <View style={styles.aiMessageAvatarContainer}>
                <LinearGradient
                  colors={["#4CAF50", "#1A1A1A"]}
                  style={styles.aiMessageAvatar}
                >
                  <Ionicons name="sparkles" size={16} color="#fff" />
                </LinearGradient>
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                message.sender === "user" ? styles.userMessageBubble : styles.aiMessageBubble,
              ]}
            >
              <Text style={[styles.messageText, message.sender === "user" ? styles.userMessageText : styles.aiMessageText]}>
                {message.text}
              </Text>
              <Text style={styles.messageTime}>{message.time}</Text>
            </View>
            {message.sender === "user" && (
              <View style={styles.userMessageAvatarContainer}>
                <View style={styles.userMessageAvatar}>
                  <Ionicons name="person" size={16} color="#fff" />
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
            <View style={styles.aiMessageAvatarContainer}>
              <LinearGradient
                colors={["#4CAF50", "#1A1A1A"]}
                style={styles.aiMessageAvatar}
              >
                <Ionicons name="sparkles" size={16} color="#fff" />
              </LinearGradient>
            </View>
            <View style={[styles.messageBubble, styles.aiMessageBubble]}>
              <View style={styles.typingIndicator}>
                <Animated.View
                  style={[
                    styles.typingDot,
                    { opacity: dot1Anim },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.typingDot,
                    { opacity: dot2Anim },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.typingDot,
                    { opacity: dot3Anim },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Premium Upgrade Prompt - Hide for admin and pro users */}
        {user?.role !== "admin" && user?.role !== "prouser" && (
          <View style={styles.premiumPromptContainer}>
            <LinearGradient
              colors={["#4CAF50", "#1A1A1A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumPrompt}
            >
              <View style={styles.premiumPromptContent}>
                <View style={styles.premiumIconContainer}>
                  <Ionicons name="star" size={32} color="#FFD700" />
                </View>
                <Text style={styles.premiumTitle}>Unlock Full AI Power</Text>
                <Text style={styles.premiumDescription}>
                  Get personalized nutrition advice, meal recommendations, and answers to all your health questions.
                </Text>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  activeOpacity={0.8}
                  onPress={() => router.push("/pricing")}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type your question..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  aiAvatarBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  statusText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 80,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  aiMessageWrapper: {
    justifyContent: "flex-start",
    gap: 8,
  },
  userMessageWrapper: {
    justifyContent: "flex-end",
    gap: 8,
  },
  aiMessageAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  aiMessageAvatar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userMessageAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  userMessageAvatar: {
    flex: 1,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  aiMessageBubble: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userMessageBubble: {
    backgroundColor: "#4CAF50",
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  aiMessageText: {
    color: "#1A1A1A",
  },
  userMessageText: {
    color: "#FFF",
  },
  messageTime: {
    fontSize: 11,
    textAlign: "right",
  },
  premiumPromptContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  premiumPrompt: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  premiumPromptContent: {
    alignItems: "center",
    gap: 12,
  },
  premiumIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
  },
  premiumDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  inputContainer: {
    backgroundColor: "#FFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: "#F1F3F5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
    maxHeight: 100,
    paddingTop: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E9ECEF",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#999",
    marginRight: 4,
  },
});
