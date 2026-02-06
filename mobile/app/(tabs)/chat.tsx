import { useAuth } from "@/src/contexts/auth.context";
import { aiService } from "@/src/services/ai.service";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  time: string;
  image?: string | null;
}

// Response parser utility
const parseAIResponse = (response: string): string => {
  let cleaned = response;

  // Remove common system prompt artifacts
  const systemPatterns = [
    /System prompt:.*$/gm,
    /You are a.*$/gm,
    /As an AI.*$/gm,
    /Your role is.*$/gm,
    /Context:.*$/gm,
    /User profile:.*$/gm,
    /Today's meals:.*$/gm,
    /Remember to.*$/gm,
    /Always.*$/gm,
    /Important:.*$/gm,
    /Note:.*$/gm,
    /---+\s*$/gm,
    /===+\s*$/gm,
    /\*\*+/g, // Remove excessive asterisks
    /_+/g,    // Remove excessive underscores
  ];

  for (const pattern of systemPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
};

// Bold text parser - converts **text** to proper bold formatting
const parseBoldText = (text: string): Array<{ content: string; isBold: boolean }> => {
  const parts: Array<{ content: string; isBold: boolean }> = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match (not bold)
    if (match.index > lastIndex) {
      parts.push({
        content: text.substring(lastIndex, match.index),
        isBold: false,
      });
    }

    // Add the bold text
    parts.push({
      content: match[1],
      isBold: true,
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      content: text.substring(lastIndex),
      isBold: false,
    });
  }

  return parts;
};

// Component to render text with bold sections
const BoldText = ({ text, style }: { text: string; style: any }) => {
  const parts = parseBoldText(text);
  
  if (parts.length === 1 || parts.every(part => !part.isBold)) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <Text style={style}>
      {parts.map((part, index) => (
        <Text
          key={index}
          style={part.isBold ? { ...style, fontWeight: '700' } : style}
        >
          {part.content}
        </Text>
      ))}
    </Text>
  );
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prefill?: string; nutrientName?: string; nutrientKey?: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI Nutrition Assistant. How can I help you today? You can also upload food images to get personalized feedback!",
      sender: "ai",
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      image: null,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [initialQueryProcessed, setInitialQueryProcessed] = useState(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  const handleSend = useCallback(async (messageText?: string) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim() && !selectedImage) return;

    const currentMessages = messagesRef.current;
    const newMessage: Message = {
      id: currentMessages.length + 1,
      text: textToSend.trim() || (selectedImage ? "Check out this food image!" : ""),
      sender: "user",
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      image: selectedImage,
    };
    const updatedMessages = [...currentMessages, newMessage];
    setMessages(updatedMessages);
    setInputText("");
    setSelectedImage(null);
    setIsLoading(true);

    // Scroll to bottom after sending
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      if (user?.role === "admin" || user?.role === "prouser") {
        let aiResponseText: string;
        
        if (selectedImage) {
          aiResponseText = await aiService.chatWithImage(textToSend, selectedImage);
        } else {
          aiResponseText = await aiService.chat(textToSend);
        }
        
        // Clean and parse the AI response
        const cleanedResponse = parseAIResponse(aiResponseText);
        
        const aiResponse: Message = {
          id: updatedMessages.length + 1,
          text: cleanedResponse,
          sender: "ai",
          time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          image: null,
        };
        setMessages([...updatedMessages, aiResponse]);
      } else {
        setTimeout(() => {
          const aiResponse: Message = {
            id: updatedMessages.length + 1,
            text: "This is a premium feature! Upgrade to Pro to access the full AI chat experience, including food image analysis.",
            sender: "ai",
            time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            image: null,
          };
          setMessages([...updatedMessages, aiResponse]);
          // Scroll to bottom after AI response
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }, 1000);
      }
    } catch (error) {
      const errorResponse: Message = {
        id: updatedMessages.length + 1,
        text: "Sorry, there was an error processing your request. Please try again.",
        sender: "ai",
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        image: null,
      };
      setMessages([...updatedMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, selectedImage, user?.role]);

  useEffect(() => {
    if (params.prefill && !initialQueryProcessed) {
      // Set flag first to prevent multiple triggers
      setInitialQueryProcessed(true);
      
      // Create the user message immediately with research indicator
      const userMessage: Message = {
        id: 1,
        text: params.prefill.trim(),
        sender: "user",
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        image: null,
      };
      
      // Create a research loading indicator message
      const isResearchQuery = params.prefill.includes("Research & Insights");
      const loadingMessage: Message | null = isResearchQuery ? {
        id: 2,
        text: "🔍 Searching peer-reviewed research and analyzing your data...",
        sender: "ai",
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        image: null,
      } : null;
      
      setMessages([userMessage, ...(loadingMessage ? [loadingMessage] : [])]);
      setInputText("");
      setIsLoading(true);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Call API directly
      const sendPrefillMessage = async () => {
        try {
          if ((user?.role === "admin" || user?.role === "prouser") && params.prefill) {
            const aiResponseText = await aiService.chat(params.prefill);
            const cleanedResponse = parseAIResponse(aiResponseText);
            
            const aiResponse: Message = {
              id: 3,
              text: cleanedResponse,
              sender: "ai",
              time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
              image: null,
            };
            // Replace loading message with AI response
            setMessages(prev => prev.filter(m => m.id !== 2).concat(aiResponse));
          } else {
            setTimeout(() => {
              const aiResponse: Message = {
                id: 3,
                text: "This is a premium feature! Upgrade to Pro to access the full AI chat experience, including food image analysis.",
                sender: "ai",
                time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
                image: null,
              };
              // Replace loading message with premium message
              setMessages(prev => prev.filter(m => m.id !== 2).concat(aiResponse));
              // Scroll to bottom after AI response
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }, 1000);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: 3,
            text: "Sorry, there was an error processing your request. Please try again.",
            sender: "ai",
            time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            image: null,
          };
          // Replace loading message with error message
          setMessages(prev => prev.filter(m => m.id !== 2).concat(errorResponse));
        } finally {
          setIsLoading(false);
          // Scroll to bottom after AI response
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      };

      // Small delay to ensure UI is ready (reduced for faster response)
      const timer = setTimeout(() => {
        sendPrefillMessage();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [params.prefill, initialQueryProcessed, user?.role]);

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

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        // Scroll to bottom when keyboard shows
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload food images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        if (selected.base64) {
          const base64Image = `data:image/jpeg;base64,${selected.base64}`;
          setSelectedImage(base64Image);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow camera access to take photos of your food."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        if (selected.base64) {
          const base64Image = `data:image/jpeg;base64,${selected.base64}`;
          setSelectedImage(base64Image);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Upload Food Image",
      "How would you like to add a food image?",
      [
        {
          text: "Take Photo",
          onPress: takePhoto,
        },
        {
          text: "Choose from Library",
          onPress: pickImage,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <LinearGradient
        colors={["#4CAF50", "#1A1A1A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={22} color="#FFF" style={styles.headerIcon} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>AI Nutrition Assistant</Text>
            <View style={styles.headerSubtitleContainer}>
              <View style={styles.greenDot} />
              <Text style={styles.headerSubtitle}>Always here to help</Text>
            </View>
          </View>
        </View>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <View style={styles.logoInner}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
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
                {message.image && (
                  <Image source={{ uri: message.image }} style={styles.messageImage} resizeMode="cover" />
                )}
                {message.text ? (
                  message.sender === "user" ? (
                    <Text style={[styles.messageText, styles.userMessageText]}>
                      {message.text}
                    </Text>
                  ) : (
                    <BoldText
                      text={message.text}
                      style={[styles.messageText, styles.aiMessageText]}
                    />
                  )
                ) : null}
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
        <View style={[
          styles.inputContainer, 
          { 
            paddingBottom: Platform.OS === "ios" ? insets.bottom + keyboardHeight + 8 : 16 + keyboardHeight / 2 
          }
        ]}>
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeSelectedImage}>
                <Ionicons name="close-circle" size={24} color="#FF5252" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={styles.attachButton}
              activeOpacity={0.8}
              onPress={showImageOptions}
            >
              <Ionicons name="camera" size={22} color="#4CAF50" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={selectedImage ? "Add a comment about this food..." : "Type your question..."}
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              numberOfLines={4}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() && !selectedImage || isLoading) && styles.sendButtonDisabled]}
              activeOpacity={0.8}
              onPress={() => handleSend()}
              disabled={(!inputText.trim() && !selectedImage) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTextContainer: {
    flexDirection: "column",
  },
  headerSubtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  headerIcon: {
    marginTop: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  logoInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoImage: {
    width: 32,
    height: 32,
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
    paddingBottom: 100,
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
    backgroundColor: "#E0E0E0",
    borderTopRightRadius: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
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
    color: "#1A1A1A",
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
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#999",
  },
  attachButton: {
    padding: 4,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 8,
  },
  imagePreview: {
    width: 100,
    height: 80,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
});
