import { useAppState } from '@/src/contexts/app-state.context';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

export function GlobalErrorBanner() {
  const { globalError, clearGlobalError } = useAppState();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (globalError) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [globalError]);

  if (!globalError) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Ionicons name="warning-outline" size={20} color="#FFF" />
        <Text style={styles.message} numberOfLines={2}>
          {globalError}
        </Text>
        <TouchableOpacity onPress={clearGlobalError} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#C62828',
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
  },
  message: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
});
